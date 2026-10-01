// Normalisation and validation of the analysis payload returned by the AI provider.
//
// A language model is never trusted with the shape of what we persist: JSON is
// extracted defensively, every field is coerced to the type the Analysis model
// expects, obviously unusable responses are rejected, and the final overall
// score is never taken from the provider. No `eval`, no `Function` constructor.
import { ApiError } from './ApiError.js'
import { clampScore, SECTION_KEYS, normalizeSectionScores } from '../services/scoreService.js'

export const PRIORITIES = Object.freeze(['high', 'medium', 'low'])

const SKILL_CATEGORIES = Object.freeze(['technical', 'soft', 'languages', 'tools'])

const MAX_TEXT_LENGTH = 600
const MAX_SKILLS_PER_CATEGORY = 40
const MAX_LIST_ITEMS = 12

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toText(value) {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function toBoundedText(value, fallback = '') {
  const text = toText(value)
  if (!text) return fallback
  return text.length > MAX_TEXT_LENGTH ? `${text.slice(0, MAX_TEXT_LENGTH - 1).trimEnd()}…` : text
}

/** Accepts an array, a single value, or a delimited string and returns a clean list. */
function toStringList(value, { max = MAX_LIST_ITEMS, limit = MAX_TEXT_LENGTH } = {}) {
  let candidates = []

  if (Array.isArray(value)) {
    candidates = value
  } else if (typeof value === 'string') {
    candidates = value.split(/\s*[,;\n]\s*/)
  } else if (value !== null && value !== undefined) {
    candidates = [value]
  }

  const seen = new Set()
  const result = []

  for (const candidate of candidates) {
    const text = toBoundedText(candidate)

    if (!text) continue

    // Models sometimes return "React.js, Node" style groups split across entries.
    const parts = text.split(/\s*[;|]\s*/)

    for (const part of parts) {
      const clean = part.trim()
      if (!clean || clean.length > limit) continue

      const key = clean.toLowerCase()
      if (seen.has(key)) continue

      seen.add(key)
      result.push(clean)

      if (result.length >= max) return result
    }
  }

  return result
}

function normalizePriority(value) {
  const text = toText(value).toLowerCase()
  if (PRIORITIES.includes(text)) return text
  return 'medium'
}

/**
 * Normalises `{ title, description }` items. Plain strings are accepted and
 * promoted so a list of sentences still renders correctly.
 */
function normalizeItems(value, { withPriority = false, max = MAX_LIST_ITEMS } = {}) {
  const list = Array.isArray(value) ? value : value ? [value] : []

  const items = []

  for (const entry of list) {
    if (items.length >= max) break

    if (typeof entry === 'string') {
      const description = toBoundedText(entry)
      if (!description) continue
      items.push(
        withPriority
          ? { title: 'Feedback', description, priority: 'medium' }
          : { title: 'Highlight', description },
      )
      continue
    }

    if (!isPlainObject(entry)) continue

    const description = toBoundedText(entry.description ?? entry.detail ?? entry.text)
    const title = toBoundedText(entry.title ?? entry.name ?? entry.label, 'Feedback')

    if (!description && title === 'Feedback') continue

    const item = { title, description: description || title }
    if (withPriority) item.priority = normalizePriority(entry.priority ?? entry.severity)

    items.push(item)
  }

  return items
}

function normalizeSkills(rawSkills) {
  const source = isPlainObject(rawSkills) ? rawSkills : {}

  return SKILL_CATEGORIES.reduce((skills, category) => {
    skills[category] = toStringList(source[category], { max: MAX_SKILLS_PER_CATEGORY, limit: 80 })
    return skills
  }, {})
}

function normalizeSummaryFeedback(raw) {
  const source = isPlainObject(raw) ? raw : {}

  return {
    currentAssessment: toBoundedText(
      source.currentAssessment ?? source.assessment ?? source.current,
      'No professional summary was found in this resume.',
    ),
    suggestedImprovement: toBoundedText(
      source.suggestedImprovement ?? source.suggestion ?? source.improvement,
      'No specific rewrite was suggested by the reviewer.',
    ),
  }
}

function normalizeAtsFeedback(raw) {
  const source = isPlainObject(raw) ? raw : {}

  return {
    readability: toBoundedText(
      source.readability ?? source.readabilityFeedback,
      'No readability assessment was returned.',
    ),
    keywordUsage: toBoundedText(
      source.keywordUsage ?? source.keywords ?? source.keywordFeedback,
      'No keyword assessment was returned.',
    ),
    formatting: toBoundedText(
      source.formatting ?? source.format,
      'No formatting assessment was returned.',
    ),
    issues: toStringList(source.issues, { max: MAX_LIST_ITEMS }),
  }
}

/**
 * Pulls a JSON object out of a raw model message.
 *
 * Handles the common failure modes: a bare object, ```json fenced output,
 * leading/trailing prose, and trailing commas.
 *
 * @returns {object|null} the parsed object, or null when nothing usable exists
 */
export function parseJsonPayload(rawText) {
  if (rawText && typeof rawText === 'object') {
    return isPlainObject(rawText) ? rawText : null
  }

  if (typeof rawText !== 'string') return null

  let text = rawText.trim()
  if (!text) return null

  // Strip markdown code fences (```json ... ``` or ``` ... ```).
  const fenceMatch = text.match(/```(?:json|JSON)?\s*([\s\S]*?)```/)
  if (fenceMatch) text = fenceMatch[1].trim()

  if (!text) return null

  const candidates = [text]

  // Fall back to the outermost {...} block when the model wrapped the JSON in prose.
  const first = text.indexOf('{')
  const last = text.lastIndexOf('}')
  if (first !== -1 && last > first) {
    const slice = text.slice(first, last + 1)
    if (slice !== text) candidates.push(slice)
  }

  for (const candidate of candidates) {
    for (const attempt of [candidate, candidate.replace(/,\s*([}\]])/g, '$1')]) {
      try {
        const parsed = JSON.parse(attempt)
        if (isPlainObject(parsed)) return parsed
      } catch {
        // Try the next candidate.
      }
    }
  }

  return null
}

/**
 * True when a parsed payload carries at least one piece of real analysis.
 * A response made only of empty containers is treated as unusable.
 */
function hasUsableContent(payload) {
  const skills = Object.values(normalizeSkills(payload.skills)).flat()
  const lists = [
    normalizeItems(payload.strengths),
    normalizeItems(payload.weaknesses, { withPriority: true }),
    normalizeItems(payload.recommendations, { withPriority: true }),
  ]

  if (skills.length > 0) return true
  if (lists.some((list) => list.length > 0)) return true

  return SECTION_KEYS.some((key) => Number.isFinite(Number(payload?.sectionScores?.[key])))
}

/**
 * Validates and normalises a parsed analysis payload into the exact shape the
 * Analysis model persists.
 *
 * @param {unknown} parsed Raw (already JSON-parsed) provider payload.
 * @returns {{ sectionScores: Record<string, number>, skills: object, strengths: Array, weaknesses: Array, recommendations: Array, summaryFeedback: object, atsFeedback: object }}
 * @throws {ApiError} 502 when the payload cannot be used at all.
 */
export function normalizeAnalysisPayload(parsed) {
  if (!isPlainObject(parsed)) {
    throw ApiError.external('The AI reviewer returned an unusable response. Please try again.', {
      code: 'AI_INVALID_RESPONSE',
    })
  }

  if (!hasUsableContent(parsed)) {
    throw ApiError.external(
      'The AI reviewer did not return any usable analysis for this CV. Please try again.',
      { code: 'AI_INVALID_RESPONSE' },
    )
  }

  return {
    // Never taken from the provider: recomputed downstream from these weights.
    sectionScores: normalizeSectionScores(parsed.sectionScores ?? parsed.scores),
    skills: normalizeSkills(parsed.skills),
    strengths: normalizeItems(parsed.strengths),
    weaknesses: normalizeItems(parsed.weaknesses, { withPriority: true }),
    recommendations: normalizeItems(
      parsed.recommendations ?? parsed.suggestions,
      { withPriority: true },
    ),
    summaryFeedback: normalizeSummaryFeedback(parsed.summaryFeedback),
    atsFeedback: normalizeAtsFeedback(parsed.atsFeedback),
  }
}

export { clampScore, toStringList, normalizePriority }
