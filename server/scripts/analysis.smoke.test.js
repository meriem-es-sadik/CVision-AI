// Offline smoke tests for the analysis pipeline.
//
// These cover the pure, deterministic parts only - scoring, weighting, clamping
// and AI-payload normalisation - so they run without MongoDB, without the
// OpenRouter key and without starting the dev server.
//
//   node server/scripts/analysis.smoke.test.js
import assert from 'node:assert/strict'

import {
  SECTION_KEYS,
  SECTION_WEIGHTS,
  buildScoreResult,
  calculateOverallScore,
  clampScore,
  getScoreBand,
  normalizeSectionScores,
} from '../services/scoreService.js'
import { isOpenRouterConfigured } from '../config/openrouter.js'
import { normalizeAnalysisPayload, parseJsonPayload } from '../utils/analysisNormalizer.js'
import { ApiError } from '../utils/ApiError.js'

let passed = 0
const failures = []

function test(name, fn) {
  try {
    fn()
    passed += 1
    console.log(`  ok  ${name}`)
  } catch (err) {
    failures.push({ name, err })
    console.error(`  FAIL ${name}`)
    console.error(`       ${err?.message ?? err}`)
  }
}

function section(key, value) {
  return { [key]: value }
}

console.log('\nscore weights')

test('weights cover every section and total exactly 100%', () => {
  const total = Object.values(SECTION_WEIGHTS).reduce((sum, weight) => sum + weight, 0)
  assert.equal(SECTION_KEYS.length, 8)
  assert.ok(Math.abs(total - 1) < 1e-9, `weights total ${total}`)
})

test('weights match the agreed distribution', () => {
  assert.deepEqual(SECTION_WEIGHTS, {
    contact: 0.1,
    summary: 0.1,
    skills: 0.2,
    experience: 0.25,
    education: 0.1,
    projects: 0.1,
    certifications: 0.05,
    structure: 0.1,
  })
})

console.log('\nclamping')

test('clamps above 100 down to 100', () => {
  assert.equal(clampScore(180), 100)
  assert.equal(clampScore('150'), 100)
})

test('clamps below 0 up to 0', () => {
  assert.equal(clampScore(-40), 0)
  assert.equal(clampScore('-1'), 0)
})

test('non-numeric input falls back instead of producing NaN', () => {
  assert.equal(clampScore('abc'), 0)
  assert.equal(clampScore(undefined, 42), 42)
  assert.equal(clampScore(null, 42), 42)
  assert.equal(clampScore(Number.NaN, 7), 7)
  assert.equal(clampScore(Infinity), 0)
})

console.log('\noverall score calculation')

test('all sections at 100 gives 100', () => {
  assert.equal(calculateOverallScore(normalizeSectionScores({})), 0)
  assert.equal(
    calculateOverallScore(Object.fromEntries(SECTION_KEYS.map((key) => [key, 100]))),
    100,
  )
})

test('weighted score matches the formula', () => {
  // contact 80, summary 60, skills 90, experience 100, education 50,
  // projects 40, certifications 60, structure 70
  // = 8 + 6 + 18 + 25 + 5 + 4 + 3 + 7 = 76
  const scores = {
    contact: 80,
    summary: 60,
    skills: 90,
    experience: 100,
    education: 50,
    projects: 40,
    certifications: 60,
    structure: 70,
  }

  assert.equal(calculateOverallScore(scores), 76)
})

test('experience carries the most weight', () => {
  const base = Object.fromEntries(SECTION_KEYS.map((key) => [key, 50]))
  const withExperience = { ...base, experience: 100 }
  const withContact = { ...base, contact: 100 }

  assert.ok(
    calculateOverallScore(withExperience) > calculateOverallScore(withContact),
    'a +50 experience bump should outrank a +50 contact bump',
  )
})

test('certifications alone move the score by at most 5 points', () => {
  const zero = Object.fromEntries(SECTION_KEYS.map((key) => [key, 0]))
  assert.equal(calculateOverallScore({ ...zero, certifications: 100 }), 5)
})

test('out-of-range section values are clamped before weighting', () => {
  const inflated = {
    contact: 1000,
    summary: -100,
    skills: 100,
    experience: 100,
    education: 100,
    projects: 100,
    certifications: 100,
    structure: 100,
  }
  // 10 + 0 + 20 + 25 + 10 + 10 + 5 + 10 = 90
  assert.equal(calculateOverallScore(inflated), 90)
})

test('the provider overall score is never trusted', () => {
  // A model claiming a perfect 100 with terrible sections must not win.
  // 1 + 1 + 4 + 5 + 1 + 1 + 0 + 2 = 15
  const result = buildScoreResult({
    contact: 10,
    summary: 10,
    skills: 20,
    experience: 20,
    education: 10,
    projects: 10,
    certifications: 0,
    structure: 20,
  })

  assert.equal(result.overallScore, 15)
})

test('normalised section scores always expose all eight keys', () => {
  const scores = normalizeSectionScores({ contact: '80', experience: 100 })
  assert.deepEqual(Object.keys(scores).sort(), [...SECTION_KEYS].sort())
  assert.equal(scores.contact, 80)
  assert.equal(scores.summary, 0)
  assert.equal(scores.experience, 100)
})

test('garbage section score input yields zeros rather than NaN', () => {
  const scores = normalizeSectionScores('nope')
  assert.equal(Object.values(scores).every((value) => value === 0), true)
})

console.log('\nscore bands (presentation only)')

test('bands map the documented ranges', () => {
  assert.equal(getScoreBand(95).label, 'Excellent')
  assert.equal(getScoreBand(80).label, 'Strong')
  assert.equal(getScoreBand(65).label, 'Good foundation')
  assert.equal(getScoreBand(45).label, 'Needs improvement')
  assert.equal(getScoreBand(10).label, 'Significant improvement needed')
  assert.equal(getScoreBand(0).label, 'Significant improvement needed')
  assert.equal(getScoreBand(100).label, 'Excellent')
})

console.log('\nJSON parsing')

test('parses plain JSON', () => {
  assert.deepEqual(parseJsonPayload('{"a":1}'), { a: 1 })
})

test('parses markdown fenced JSON', () => {
  const fenced = '```json\n{"sectionScores":{"contact":75}}\n```'
  assert.deepEqual(parseJsonPayload(fenced), { sectionScores: { contact: 75 } })
})

test('parses JSON wrapped in prose', () => {
  const chatty = 'Here is my review:\n{"skills":{"technical":["React"]}}\nHope this helps!'
  assert.deepEqual(parseJsonPayload(chatty), { skills: { technical: ['React'] } })
})

test('tolerates trailing commas', () => {
  assert.deepEqual(parseJsonPayload('{"a":1,}'), { a: 1 })
})

test('returns null for unusable payloads', () => {
  assert.equal(parseJsonPayload('not json at all'), null)
  assert.equal(parseJsonPayload(''), null)
  assert.equal(parseJsonPayload(undefined), null)
  assert.equal(parseJsonPayload('[1,2,3]'), null)
})

console.log('\nanalysis normalisation')

const VALID_PAYLOAD = {
  sectionScores: {
    contact: 80,
    summary: 70,
    skills: 85,
    experience: 90,
    education: 60,
    projects: 50,
    certifications: 40,
    structure: 75,
  },
  skills: { technical: ['React', 'Node.js'], soft: ['Communication'], languages: ['English'], tools: ['Git'] },
  strengths: [{ title: 'Clear impact', description: 'Quantifies delivery.' }],
  weaknesses: [{ title: 'No projects', description: 'Missing section.', priority: 'HIGH' }],
  recommendations: [{ title: 'Add metrics', description: 'Quantify bullets.', priority: 'urgent' }],
  summaryFeedback: { currentAssessment: 'Generic.', suggestedImprovement: 'Add years and stack.' },
  atsFeedback: { readability: 'Good.', keywordUsage: 'Sparse.', formatting: 'Clean.', issues: ['No links'] },
}

test('normalises a well-formed payload', () => {
  const result = normalizeAnalysisPayload(VALID_PAYLOAD)
  assert.equal(result.sectionScores.experience, 90)
  assert.equal(result.skills.technical.length, 2)
  assert.equal(result.strengths[0].title, 'Clear impact')
  assert.equal(result.atsFeedback.issues[0], 'No links')
})

test('accepts a differently-cased priority and defaults an unknown one to medium', () => {
  const result = normalizeAnalysisPayload(VALID_PAYLOAD)
  // "HIGH" is a valid priority written in the wrong case.
  assert.equal(result.weaknesses[0].priority, 'high')
  // "urgent" is not one of high|medium|low.
  assert.equal(result.recommendations[0].priority, 'medium')
})

test('keeps a valid priority', () => {
  const result = normalizeAnalysisPayload({
    ...VALID_PAYLOAD,
    weaknesses: [{ title: 'a', description: 'b', priority: 'high' }],
  })
  assert.equal(result.weaknesses[0].priority, 'high')
})

test('promotes plain strings into titled items', () => {
  const result = normalizeAnalysisPayload({
    strengths: ['Well structured'],
    weaknesses: ['No metrics'],
    recommendations: ['Add metrics'],
  })
  assert.equal(result.strengths[0].description, 'Well structured')
  assert.equal(result.weaknesses[0].priority, 'medium')
  assert.equal(result.recommendations[0].description, 'Add metrics')
})

test('missing optional blocks get safe defaults', () => {
  const result = normalizeAnalysisPayload({
    skills: { technical: ['React'] },
  })

  assert.deepEqual(result.skills.soft, [])
  assert.deepEqual(result.skills.tools, [])
  assert.deepEqual(result.weaknesses, [])
  assert.deepEqual(result.atsFeedback.issues, [])
  assert.ok(result.summaryFeedback.currentAssessment.length > 0)
})

test('coerces non-array skills into arrays', () => {
  const result = normalizeAnalysisPayload({ skills: { technical: 'React, Node, React' } })
  assert.deepEqual(result.skills.technical, ['React', 'Node'])
})

test('clamps out-of-range section scores from the model', () => {
  const result = normalizeAnalysisPayload({
    sectionScores: { contact: 500, summary: -20, skills: '80' },
    strengths: [{ title: 'x', description: 'y' }],
  })

  assert.equal(result.sectionScores.contact, 100)
  assert.equal(result.sectionScores.summary, 0)
  assert.equal(result.sectionScores.skills, 80)
})

test('fills every section key even when the model omits them', () => {
  const result = normalizeAnalysisPayload({ skills: { technical: ['React'] } })
  assert.deepEqual(Object.keys(result.sectionScores).sort(), [...SECTION_KEYS].sort())
})

test('drops array entries that are not usable objects or strings', () => {
  const result = normalizeAnalysisPayload({
    skills: { technical: ['React', null, 42, '', '   ', 'Node'] },
  })
  assert.deepEqual(result.skills.technical, ['React', '42', 'Node'])
})

test('rejects a fundamentally unusable response', () => {
  assert.throws(
    () => normalizeAnalysisPayload({}),
    (err) => err instanceof ApiError && err.code === 'AI_INVALID_RESPONSE',
  )
})

test('rejects a non-object response', () => {
  assert.throws(() => normalizeAnalysisPayload('sure!'), ApiError)
  assert.throws(() => normalizeAnalysisPayload(null), ApiError)
  assert.throws(() => normalizeAnalysisPayload([1, 2]), ApiError)
})

console.log('\nOpenRouter configuration guard')

test('a placeholder key is not treated as configured', () => {
  // The repository ships OPENROUTER_API_KEY=your_openrouter_api_key_here in server/.env.
  if (process.env.OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
    assert.equal(isOpenRouterConfigured(), false)
  } else {
    assert.equal(typeof isOpenRouterConfigured(), 'boolean')
  }
})

console.log(`\n${passed} passed, ${failures.length} failed\n`)

if (failures.length > 0) {
  for (const { name, err } of failures) {
    console.error(`FAILED: ${name}`)
    console.error(err?.stack ?? err)
  }
  process.exit(1)
}
