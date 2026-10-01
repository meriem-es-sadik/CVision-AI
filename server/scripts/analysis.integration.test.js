// End-to-end runtime test for the AI CV analysis API.
//
// Runs entirely self-contained on high, non-conflicting ports and always exits:
//
//   * a local fake OpenRouter provider (stands in for https://openrouter.ai/api/v1)
//   * the real Express app on APP_PORT
//
// The real MongoDB from server/.env is used. Dev servers on 5000/5173 are never
// started, touched or stopped.
//
//   node scripts/analysis.integration.test.js
import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsDir = path.resolve(__dirname, '../uploads')

const PROVIDER_PORT = 5098
const APP_PORT = 5099
const API = `http://127.0.0.1:${APP_PORT}/api`

// Configure the process before the app modules read them.
process.env.PORT = String(APP_PORT)
process.env.OPENROUTER_API_KEY = 'test-key-not-a-placeholder'
process.env.OPENROUTER_BASE_URL = `http://127.0.0.1:${PROVIDER_PORT}/v1`
process.env.OPENROUTER_MODEL = 'openrouter/free'
process.env.OPENROUTER_TIMEOUT_MS = '1500'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'integration-test-secret'
process.env.API_RATE_LIMIT_MAX = '1000'
process.env.AUTH_RATE_LIMIT_MAX = '100'
process.env.NODE_ENV = 'test'

let passed = 0
const failures = []

function check(name, condition, detail = '') {
  if (condition) {
    passed += 1
    console.log(`  ok  ${name}`)
    return true
  }

  failures.push({ name, detail })
  console.error(`  FAIL ${name}${detail ? ` -> ${detail}` : ''}`)
  return false
}

async function section(name, fn) {
  console.log(`\n${name}`)
  await fn()
}

/* ------------------------------------------------------------------ *
 * Fake OpenRouter provider
 * ------------------------------------------------------------------ */

const provider = {
  mode: 'ok',
  // Only shape-level facts are recorded so no secret is ever captured here.
  calls: { total: 0, sawBearerAuth: false, sawJsonContentType: false, models: [], optionalParams: [] },
}

const VALID_ANALYSIS = {
  sectionScores: {
    contact: 90,
    summary: 70,
    skills: 80,
    experience: 100,
    education: 60,
    projects: 50,
    certifications: 20,
    structure: 75,
  },
  skills: {
    technical: ['React', 'Node.js'],
    soft: ['Communication', 'Leadership'],
    languages: ['English'],
    tools: ['Git', 'Docker'],
  },
  strengths: [{ title: 'Quantified impact', description: 'Bullets include measurable outcomes.' }],
  weaknesses: [{ title: 'No certifications', description: 'Section is absent.', priority: 'low' }],
  recommendations: [
    { title: 'Add metrics', description: 'Quantify the last three bullets.', priority: 'high' },
  ],
  summaryFeedback: {
    currentAssessment: 'The summary is generic.',
    suggestedImprovement: 'Name the role, years of experience and core stack.',
  },
  atsFeedback: {
    readability: 'Easy to scan.',
    keywordUsage: 'Sparse in the experience section.',
    formatting: 'Clean single-column layout.',
    issues: ['Contact details are in the header'],
  },
}

const INFLATED_ANALYSIS = {
  sectionScores: {
    contact: 150,
    summary: -40,
    skills: 999,
    experience: 100,
    education: 100,
    projects: 100,
    certifications: 100,
    structure: 100,
  },
  skills: { technical: ['Go'] },
  strengths: [{ title: 's', description: 'd' }],
}

function providerBody(content) {
  return JSON.stringify({
    id: 'chatcmpl-test',
    object: 'chat.completion',
    created: 0,
    model: 'openrouter/free',
    choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }],
    usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
  })
}

const providerServer = http.createServer((req, res) => {
  if (req.method !== 'POST' || !req.url.startsWith('/v1/chat/completions')) {
    res.writeHead(404).end('{}')
    return
  }

  const send = (status, payload) => {
    res.writeHead(status, { 'Content-Type': 'application/json' }).end(payload)
  }

  const chunks = []
  req.on('data', (chunk) => chunks.push(chunk))
  req.on('end', () => {
    // Record the request shape without ever retaining the Authorization value.
    provider.calls.total += 1
    if (/^Bearer .+/.test(req.headers.authorization ?? '')) provider.calls.sawBearerAuth = true
    if ((req.headers['content-type'] ?? '').includes('application/json')) {
      provider.calls.sawJsonContentType = true
    }

    let body = {}
    try {
      body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
    } catch {
      body = {}
    }

    if (typeof body.model === 'string') provider.calls.models.push(body.model)
    provider.calls.optionalParams.push(Object.keys(body).sort())

    switch (provider.mode) {
      case 'unauthorized':
        return send(401, JSON.stringify({ error: { message: 'Incorrect API key provided' } }))
      case 'forbidden':
        return send(403, JSON.stringify({ error: { message: 'This model is not available to your account' } }))
      case 'rate':
        return send(429, JSON.stringify({ error: { message: 'Rate limit reached' } }))
      case 'server':
        return send(500, JSON.stringify({ error: { message: 'upstream exploded' } }))
      case 'unreachable':
        return req.socket.destroy()
      case 'garbage':
        return send(200, providerBody('I am sorry, I cannot help with that request.'))
      case 'empty':
        return send(200, providerBody('   '))
      case 'unusable':
        return send(200, providerBody('{"sectionScores":{}}'))
      // Stands in for a routed/free model that rejects optional parameters:
      // JSON mode first, then max_tokens, then temperature.
      case 'no-json-mode':
        if (body.response_format) {
          return send(400, JSON.stringify({ error: { message: "Unsupported parameter: 'response_format' is not supported with this model." } }))
        }
        if (body.max_tokens !== undefined) {
          return send(400, JSON.stringify({ error: { message: "Unsupported parameter: 'max_tokens' is too large for this model." } }))
        }
        if (body.temperature !== undefined) {
          return send(400, JSON.stringify({ error: { message: "Unsupported parameter: 'temperature' does not support 0.2." } }))
        }
        return send(200, providerBody('```json\n' + JSON.stringify(VALID_ANALYSIS) + '\n```'))
      case 'slow':
        return setTimeout(() => send(200, providerBody('{"a":1}')), 4000)
      case 'concurrent':
        return setTimeout(() => send(200, providerBody('```json\n' + JSON.stringify(VALID_ANALYSIS) + '\n```')), 700)
      default: {
        const payload = provider.payload ?? VALID_ANALYSIS
        // Fenced JSON on purpose: exercises the code-fence stripping path.
        return send(200, providerBody('```json\n' + JSON.stringify(payload) + '\n```'))
      }
    }
  })
})

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

async function apiCall(method, endpoint, { token, body, form } = {}) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`

  let payload
  if (form) {
    payload = form
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  const response = await fetch(`${API}${endpoint}`, { method, headers, body: payload })
  const text = await response.text()

  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text }
  }

  return { status: response.status, body: json }
}

async function register(email) {
  const result = await apiCall('POST', '/auth/register', {
    body: { name: 'Test User', email, password: 'Password123' },
  })

  if (result.status !== 201) throw new Error(`register failed: ${JSON.stringify(result.body)}`)
  return result.body.data.token
}

async function uploadResume(token, filePath, fileName) {
  const bytes = await fs.readFile(filePath)
  const form = new FormData()
  form.append('resume', new Blob([bytes], { type: 'application/pdf' }), fileName)

  const result = await apiCall('POST', '/resumes/upload', { token, form })
  if (result.status !== 201) throw new Error(`upload failed: ${JSON.stringify(result.body)}`)

  return result.body.data.resume
}

function findPdf() {
  return fs.readdir(uploadsDir).then((files) => {
    const pdf = files.find((name) => name.toLowerCase().endsWith('.pdf'))
    if (!pdf) throw new Error('no sample PDF found in server/uploads')
    return path.join(uploadsDir, pdf)
  })
}

/* ------------------------------------------------------------------ *
 * Test run
 * ------------------------------------------------------------------ */

async function run() {
  const { env } = await import('../config/env.js')
  const { Analysis } = await import('../models/Analysis.js')
  const { Resume } = await import('../models/Resume.js')
  const { User } = await import('../models/User.js')

  const suffix = Date.now()
  const ownerToken = await register(`owner.${suffix}@example.com`)
  const otherToken = await register(`other.${suffix}@example.com`)

  const pdfPath = await findPdf()
  const resume = await uploadResume(ownerToken, pdfPath, 'integration-resume.pdf')

  // A resume that never finished extraction.
  const pendingResume = await Resume.create({
    user: (await User.findOne({ email: `owner.${suffix}@example.com` }))._id,
    originalName: 'pending.pdf',
    fileName: 'pending.pdf',
    filePath: path.join(uploadsDir, 'pending.pdf'),
    mimeType: 'application/pdf',
    sizeBytes: 1024,
    extractedText: '',
    extractionStatus: 'pending',
  })

  await section('authentication and ownership', async () => {
    const unauth = await apiCall('POST', `/analysis/${resume.id}`)
    check('unauthenticated analysis -> 401', unauth.status === 401, `got ${unauth.status}`)
    check('401 carries a code', Boolean(unauth.body?.code), JSON.stringify(unauth.body))

    const badToken = await apiCall('POST', `/analysis/${resume.id}`, { token: 'not-a-real-token' })
    check('invalid token -> 401', badToken.status === 401, `got ${badToken.status}`)

    const crossUser = await apiCall('POST', `/analysis/${resume.id}`, { token: otherToken })
    check("another user's resume -> 404", crossUser.status === 404, `got ${crossUser.status}`)

    const crossUserGet = await apiCall('GET', `/analysis/${resume.id}`, { token: otherToken })
    check("another user's analysis -> 404", crossUserGet.status === 404, `got ${crossUserGet.status}`)

    const missing = await apiCall('POST', '/analysis/64b7f9c2e1a2b3c4d5e6f7a8', { token: ownerToken })
    check('missing resume -> 404', missing.status === 404, `got ${missing.status}`)

    const malformedId = await apiCall('POST', '/analysis/not-an-object-id', { token: ownerToken })
    check('malformed resume id -> 404', malformedId.status === 404, `got ${malformedId.status}`)

    const unauthHistory = await apiCall('GET', '/analysis/history')
    check('unauthenticated history -> 401', unauthHistory.status === 401, `got ${unauthHistory.status}`)
  })

  await section('resume readiness', async () => {
    const pending = await apiCall('POST', `/analysis/${pendingResume._id}`, { token: ownerToken })
    check('unextracted resume -> 409', pending.status === 409, `got ${pending.status}`)
    check(
      'unextracted resume -> RESUME_NOT_READY',
      pending.body?.code === 'RESUME_NOT_READY',
      JSON.stringify(pending.body),
    )

    const noAnalysis = await apiCall('GET', `/analysis/${resume.id}`, { token: ownerToken })
    check('analysis before any run -> 404', noAnalysis.status === 404, `got ${noAnalysis.status}`)
  })

  await section('missing OpenRouter configuration', async () => {
    const original = env.openrouter.apiKey
    env.openrouter.apiKey = 'your_openrouter_api_key_here'

    try {
      const result = await apiCall('POST', `/analysis/${resume.id}`, { token: ownerToken })
      check('placeholder key -> 503', result.status === 503, `got ${result.status}`)
      check(
        'placeholder key -> AI_NOT_CONFIGURED',
        result.body?.code === 'AI_NOT_CONFIGURED',
        JSON.stringify(result.body),
      )
      check(
        'error message names OPENROUTER_API_KEY',
        String(result.body?.message ?? '').includes('OPENROUTER_API_KEY'),
        result.body?.message,
      )
      check(
        'error message does not leak the key',
        !String(result.body?.message ?? '').toLowerCase().includes('openrouter_api_key='),
        result.body?.message,
      )

      const unset = env.openrouter.apiKey
      env.openrouter.apiKey = undefined
      const missing = await apiCall('POST', `/analysis/${resume.id}`, { token: ownerToken })
      check('absent key -> 503', missing.status === 503, `got ${missing.status}`)
      check(
        'absent key -> AI_NOT_CONFIGURED',
        missing.body?.code === 'AI_NOT_CONFIGURED',
        JSON.stringify(missing.body),
      )
      env.openrouter.apiKey = unset
    } finally {
      env.openrouter.apiKey = original
    }

    const stored = await Analysis.countDocuments({ resume: resume.id })
    check('no analysis saved for a failed run', stored === 0, `found ${stored}`)
  })

  await section('provider failure handling', async () => {
    const cases = [
      ['unauthorized', 502, 'AI_PROVIDER_ERROR'],
      ['forbidden', 502, 'AI_PROVIDER_ERROR'],
      ['rate', 429, 'AI_RATE_LIMITED'],
      ['server', 502, 'AI_PROVIDER_ERROR'],
      ['unreachable', 502, 'AI_UNAVAILABLE'],
      ['garbage', 502, 'AI_MALFORMED_RESPONSE'],
      ['empty', 502, 'AI_EMPTY_RESPONSE'],
      ['unusable', 502, 'AI_INVALID_RESPONSE'],
      ['slow', 504, 'AI_TIMEOUT'],
    ]

    for (const [mode, expectedStatus, expectedCode] of cases) {
      provider.mode = mode
      const result = await apiCall('POST', `/analysis/${resume.id}`, { token: ownerToken })

      check(
        `provider "${mode}" -> ${expectedStatus} ${expectedCode}`,
        result.status === expectedStatus && result.body?.code === expectedCode,
        `got ${result.status} ${result.body?.code}`,
      )
      check(
        `provider "${mode}" leaks no provider body`,
        !JSON.stringify(result.body ?? {}).toLowerCase().includes('api key')
          && !JSON.stringify(result.body ?? {}).includes('Incorrect API key'),
        JSON.stringify(result.body),
      )
    }

    provider.mode = 'ok'

    const stored = await Analysis.countDocuments({ resume: resume.id })
    check('no partial analyses were saved', stored === 0, `found ${stored}`)
  })

  await section('OpenRouter request shape', async () => {
    const before = provider.calls.total
    provider.mode = 'ok'

    const result = await apiCall('POST', `/analysis/${resume.id}`, { token: ownerToken })
    check('analysis -> 201', result.status === 201, `got ${result.status}`)

    check('provider was called', provider.calls.total > before)
    check('Authorization header uses the Bearer scheme', provider.calls.sawBearerAuth)
    check('Content-Type is application/json', provider.calls.sawJsonContentType)
    check(
      'configured model is sent',
      provider.calls.models.every((model) => model === 'openrouter/free'),
      JSON.stringify([...new Set(provider.calls.models)]),
    )
    check(
      'payload is conservative: model + messages + max_tokens + temperature + response_format',
      provider.calls.optionalParams.every(
        (keys) =>
          keys.includes('model') &&
          keys.includes('messages') &&
          keys.includes('max_tokens') &&
          keys.includes('temperature') &&
          keys.includes('response_format') &&
          keys.length === 5,
      ),
      JSON.stringify(provider.calls.optionalParams),
    )

    // Clean up so later sections start from the same state.
    await Analysis.deleteMany({ resume: resume.id })
    await Resume.updateOne({ _id: resume.id }, { $unset: { analysis: 1 } })
  })

  await section('optional-parameter fallback for routed models', async () => {
    provider.mode = 'no-json-mode'
    const before = provider.calls.total

    const result = await apiCall('POST', `/analysis/${resume.id}`, { token: ownerToken })
    check('model without JSON mode -> 201', result.status === 201, `got ${result.status} ${JSON.stringify(result.body)}`)
    check('fallback retried the provider', provider.calls.total === before + 2, `made ${provider.calls.total - before} calls`)

    const minimal = provider.calls.optionalParams.at(-1)
    check('fallback payload drops every optional parameter', JSON.stringify(minimal) === '["messages","model"]', JSON.stringify(minimal))
    check('fallback still produces a valid analysis', result.body?.data?.analysis?.overallScore === 77, `got ${result.body?.data?.analysis?.overallScore}`)

    const stored = await Analysis.countDocuments({ resume: resume.id })
    check('exactly one analysis saved after the fallback', stored === 1, `found ${stored}`)

    await Analysis.deleteMany({ resume: resume.id })
    await Resume.updateOne({ _id: resume.id }, { $unset: { analysis: 1 } })
    provider.mode = 'ok'
  })

  await section('successful analysis', async () => {
    provider.mode = 'ok'
    const result = await apiCall('POST', `/analysis/${resume.id}`, { token: ownerToken })

    if (!check('analysis -> 201', result.status === 201, `got ${result.status} ${JSON.stringify(result.body)}`)) {
      return
    }

    const analysis = result.body?.data?.analysis

    // 90(.1) + 70(.1) + 80(.2) + 100(.25) + 60(.1) + 50(.1) + 20(.05) + 75(.1)
    // = 9 + 7 + 16 + 25 + 6 + 5 + 1 + 7.5 = 76.5 -> 77
    check('weighted overall score is backend-calculated', analysis?.overallScore === 77, `got ${analysis?.overallScore}`)

    const scores = analysis?.sectionScores ?? {}
    check('all eight sections stored', Object.keys(scores).length === 8, JSON.stringify(scores))
    check('section scores preserved', scores.experience === 100, JSON.stringify(scores))
    check('skills grouped', Array.isArray(analysis?.skills?.technical) && analysis.skills.technical.length === 2)
    check('soft skills grouped', analysis?.skills?.soft?.length === 2)
    check('strengths stored', analysis?.strengths?.[0]?.title === 'Quantified impact')
    check('weakness priority normalised', analysis?.weaknesses?.[0]?.priority === 'low')
    check('recommendation priority kept', analysis?.recommendations?.[0]?.priority === 'high')
    check('summary feedback stored', Boolean(analysis?.summaryFeedback?.suggestedImprovement))
    check('ATS issues stored', analysis?.atsFeedback?.issues?.length === 1)
    check('resume name populated', analysis?.resumeName === 'integration-resume.pdf', analysis?.resumeName)
    check('model recorded', analysis?.model === 'openrouter/free', `got ${analysis?.model}`)
    check('no provider echo of the CV text', !JSON.stringify(analysis).includes('BEGIN RESUME TEXT'))

    const stored = await Analysis.findOne({ _id: analysis.id })
    check('analysis persisted to MongoDB', Boolean(stored))
    check('persisted overallScore matches', stored?.overallScore === 77)

    const pointer = await Resume.findById(resume.id)
    check('resume points at the latest analysis', pointer?.analysis?.analysisId === analysis.id)
    check('resume summary exposes the score', pointer?.analysis?.overallScore === 77)

    const fetched = await apiCall('GET', `/analysis/${resume.id}`, { token: ownerToken })
    check('GET analysis -> 200', fetched.status === 200, `got ${fetched.status}`)
    check('GET returns the same score', fetched.body?.data?.analysis?.overallScore === 77)

    const history = await apiCall('GET', '/analysis/history', { token: ownerToken })
    check('history -> 200', history.status === 200, `got ${history.status}`)
    check('history contains the analysis', history.body?.data?.some((a) => a.id === analysis.id))
    check('history has no foreign analyses', history.body?.data?.every((a) => a.resumeId === resume.id))

    const otherHistory = await apiCall('GET', '/analysis/history', { token: otherToken })
    check('other user history is empty', otherHistory.body?.data?.length === 0, JSON.stringify(otherHistory.body))
  })

  await section('score clamping on stored data', async () => {
    provider.mode = 'ok'
    provider.payload = INFLATED_ANALYSIS

    const result = await apiCall('POST', `/analysis/${resume.id}`, { token: ownerToken })
    const scores = result.body?.data?.analysis?.sectionScores ?? {}

    // 100(.1) + 0(.1) + 100(.2) + 100(.25) + 100(.1) + 100(.1) + 100(.05) + 100(.1) = 90
    check('out-of-range section scores clamped', scores.contact === 100 && scores.summary === 0, JSON.stringify(scores))
    check('clamped scores recalculate overall', result.body?.data?.analysis?.overallScore === 90, `got ${result.body?.data?.analysis?.overallScore}`)

    const history = await apiCall('GET', '/analysis/history', { token: ownerToken })
    check('history keeps both analyses', history.body?.data?.length === 2, `got ${history.body?.data?.length}`)

    const latest = await apiCall('GET', `/analysis/${resume.id}`, { token: ownerToken })
    check('GET returns the newest analysis', latest.body?.data?.analysis?.overallScore === 90)

    provider.payload = null
  })

  await section('duplicate request handling', async () => {
    const before = await Analysis.countDocuments({ resume: resume.id })
    provider.mode = 'concurrent'

    const [first, second] = await Promise.all([
      apiCall('POST', `/analysis/${resume.id}`, { token: ownerToken }),
      apiCall('POST', `/analysis/${resume.id}`, { token: ownerToken }),
    ])

    const statuses = [first.status, second.status].sort()
    check('parallel runs -> one 201 and one 409', JSON.stringify(statuses) === '[201,409]', JSON.stringify(statuses))

    const conflict = first.status === 409 ? first : second
    check(
      'duplicate rejected with ANALYSIS_IN_PROGRESS',
      conflict.body?.code === 'ANALYSIS_IN_PROGRESS',
      JSON.stringify(conflict.body),
    )

    const after = await Analysis.countDocuments({ resume: resume.id })
    check('exactly one analysis saved for the pair', after === before + 1, `${before} -> ${after}`)

    provider.mode = 'ok'
  })

  await section('cascade delete', async () => {
    const owner = await User.findOne({ email: `owner.${suffix}@example.com` })
    await Analysis.create({
      user: owner._id,
      resume: resume.id,
      overallScore: 42,
      sectionScores: { contact: 40, summary: 40, skills: 40, experience: 40, education: 40, projects: 40, certifications: 40, structure: 40 },
    })

    const before = await Analysis.countDocuments({ resume: resume.id })
    check('extra analysis stored for the delete test', before >= 2, `got ${before}`)

    const deleted = await apiCall('DELETE', `/resumes/${resume.id}`, { token: ownerToken })
    check('resume delete -> 200', deleted.status === 200, `got ${deleted.status}`)

    const after = await Analysis.countDocuments({ resume: resume.id })
    check('analyses removed with the resume', after === 0, `got ${after}`)

    const gone = await apiCall('GET', `/analysis/${resume.id}`, { token: ownerToken })
    check('analysis for a deleted resume -> 404', gone.status === 404, `got ${gone.status}`)
  })

  await section('legacy routes', async () => {
    const removed = await apiCall('POST', `/resumes/${pendingResume._id}/analyze`, { token: ownerToken })
    check('stub /resumes/:id/analyze removed', removed.status === 404, `got ${removed.status}`)

    const history = await apiCall('GET', '/resumes/history', { token: ownerToken })
    check('stub /resumes/history removed', history.status === 404, `got ${history.status}`)
  })

  // Clean up the fixtures this run created.
  const owner = await User.findOne({ email: `owner.${suffix}@example.com` })
  if (owner) {
    await Analysis.deleteMany({ user: owner._id })
    await Resume.deleteMany({ user: owner._id })
    await User.deleteOne({ _id: owner._id })
  }

  const other = await User.findOne({ email: `other.${suffix}@example.com` })
  if (other) {
    await Analysis.deleteMany({ user: other._id })
    await Resume.deleteMany({ user: other._id })
    await User.deleteOne({ _id: other._id })
  }
}

async function shutdown(code) {
  await new Promise((resolve) => providerServer.close(resolve))
  process.exit(code)
}

await new Promise((resolve) => providerServer.listen(PROVIDER_PORT, '127.0.0.1', resolve))
console.log(`\nfake OpenRouter provider on ${PROVIDER_PORT}, app on ${APP_PORT}`)

// server.js connects to MongoDB and starts listening on import.
await import('../server.js')
await new Promise((resolve) => setTimeout(resolve, 800))

try {
  await run()
} catch (err) {
  console.error('\ntest run crashed:', err?.stack ?? err)
  failures.push({ name: 'test run', detail: String(err?.message ?? err) })
}

console.log(`\n${passed} passed, ${failures.length} failed\n`)

if (failures.length > 0) {
  for (const { name, detail } of failures) console.error(`FAILED: ${name} ${detail}`)
}

await shutdown(failures.length > 0 ? 1 : 0)
