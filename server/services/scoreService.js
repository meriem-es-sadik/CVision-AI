// CV scoring - the single source of truth for how a CV score is produced.
//
// The AI model is asked to score individual sections only. The overall score is
// always recomputed here from the normalised section scores using fixed weights,
// so the number shown to a user is deterministic and can never be inflated (or
// deflated) by a hallucinated `overall` value coming back from the provider.

export const MIN_SCORE = 0
export const MAX_SCORE = 100

/**
 * Deterministic section weighting. The values are fractions of the final score
 * and must add up to exactly 1 (100%).
 */
export const SECTION_WEIGHTS = Object.freeze({
  contact: 0.1,
  summary: 0.1,
  skills: 0.2,
  experience: 0.25,
  education: 0.1,
  projects: 0.1,
  certifications: 0.05,
  structure: 0.1,
})

export const SECTION_KEYS = Object.freeze(Object.keys(SECTION_WEIGHTS))

/** Human labels for each scored section, used by logs and API metadata. */
export const SECTION_LABELS = Object.freeze({
  contact: 'Contact information',
  summary: 'Professional summary',
  skills: 'Skills',
  experience: 'Experience',
  education: 'Education',
  projects: 'Projects',
  certifications: 'Certifications',
  structure: 'Structure / readability',
})

/**
 * Presentation-only bands. They never change the mathematical score: they only
 * pick a neutral word for the UI to print next to the number.
 */
export const SCORE_BANDS = Object.freeze([
  { min: 90, max: 100, label: 'Excellent', tone: 'success' },
  { min: 75, max: 89, label: 'Strong', tone: 'brand' },
  { min: 60, max: 74, label: 'Good foundation', tone: 'warning' },
  { min: 40, max: 59, label: 'Needs improvement', tone: 'warning' },
  { min: 0, max: 39, label: 'Significant improvement needed', tone: 'destructive' },
])

/** Keeps a value inside the 0-100 range and rounds it to a whole number. */
export function clampScore(value, fallback = 0) {
  const numeric = typeof value === 'number' ? value : Number.parseFloat(value)

  if (!Number.isFinite(numeric)) return clampScore(fallback, 0)

  return Math.min(MAX_SCORE, Math.max(MIN_SCORE, Math.round(numeric)))
}

/**
 * Coerces an arbitrary (possibly AI-produced) object into a complete section
 * score map: always all eight keys, always finite integers within 0-100.
 * Missing or malformed sections score 0 rather than being silently dropped.
 */
export function normalizeSectionScores(input) {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {}

  return SECTION_KEYS.reduce((scores, key) => {
    scores[key] = clampScore(source[key], 0)
    return scores
  }, {})
}

/**
 * Weighted overall score for a set of section scores.
 *
 *   contact 10% + summary 10% + skills 20% + experience 25% +
 *   education 10% + projects 10% + certifications 5% + structure 10%
 *
 * @param {Record<string, number>} sectionScores
 * @returns {number} integer between 0 and 100
 */
export function calculateOverallScore(sectionScores) {
  const normalized = normalizeSectionScores(sectionScores)

  const total = SECTION_KEYS.reduce(
    (sum, key) => sum + normalized[key] * SECTION_WEIGHTS[key],
    0,
  )

  return clampScore(total, 0)
}

/**
 * Normalises section scores and derives the overall score in one step.
 * @returns {{ sectionScores: Record<string, number>, overallScore: number }}
 */
export function buildScoreResult(sectionScores) {
  const normalized = normalizeSectionScores(sectionScores)

  return {
    sectionScores: normalized,
    overallScore: calculateOverallScore(normalized),
  }
}

/**
 * Presentation band for a score. Purely cosmetic - callers must keep using the
 * numeric score for anything that is stored or compared.
 */
export function getScoreBand(score) {
  const value = clampScore(score, 0)

  return (
    SCORE_BANDS.find((band) => value >= band.min && value <= band.max) ?? SCORE_BANDS.at(-1)
  )
}
