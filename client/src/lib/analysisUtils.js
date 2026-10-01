// Presentation helpers for the analysis dashboard.
//
// Nothing here changes a score. Bands are labels only, and every value rendered
// comes straight from the stored Analysis document.
import { AlertTriangle, Info, ShieldCheck, Sparkles, Target, Wrench } from 'lucide-react'

export const SCORE_BANDS = [
  { min: 90, max: 100, label: 'Excellent', tone: 'success' },
  { min: 75, max: 89, label: 'Strong', tone: 'brand' },
  { min: 60, max: 74, label: 'Good foundation', tone: 'warning' },
  { min: 40, max: 59, label: 'Needs improvement', tone: 'warning' },
  { min: 0, max: 39, label: 'Significant improvement needed', tone: 'destructive' },
]

/** All eight scored sections, in the order they should be displayed. */
export const SECTION_ORDER = [
  { key: 'contact', label: 'Contact', hint: 'Name, email, phone, location and links' },
  { key: 'summary', label: 'Professional Summary', hint: 'Objective, focus and impact statement' },
  { key: 'skills', label: 'Skills', hint: 'Technical and soft skills, tools and languages' },
  { key: 'experience', label: 'Experience', hint: 'Roles, dates and measurable achievements' },
  { key: 'education', label: 'Education', hint: 'Degrees, institutions and dates' },
  { key: 'projects', label: 'Projects', hint: 'Personal, academic or open-source work' },
  { key: 'certifications', label: 'Certifications', hint: 'Professional credentials and licences' },
  { key: 'structure', label: 'Structure / Readability', hint: 'Layout, ordering and ATS parseability' },
]

export const SKILL_CATEGORIES = [
  { key: 'technical', label: 'Technical', icon: Wrench, tone: 'brand' },
  { key: 'soft', label: 'Soft skills', icon: Sparkles, tone: 'secondary' },
  { key: 'languages', label: 'Languages', icon: Target, tone: 'success' },
  { key: 'tools', label: 'Tools', icon: ShieldCheck, tone: 'secondary' },
]

export const PRIORITY_META = {
  high: { label: 'High priority', tone: 'destructive', icon: AlertTriangle, order: 0 },
  medium: { label: 'Medium priority', tone: 'warning', icon: Info, order: 1 },
  low: { label: 'Low priority', tone: 'muted', icon: Info, order: 2 },
}

export function clampScore(value) {
  const numeric = typeof value === 'number' ? value : Number.parseFloat(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.min(100, Math.max(0, Math.round(numeric)))
}

/** Presentation label for a 0-100 score. Does not modify the score itself. */
export function getScoreBandMeta(score) {
  const value = clampScore(score)
  return SCORE_BANDS.find((band) => value >= band.min && value <= band.max) ?? SCORE_BANDS.at(-1)
}

export function getPriorityMeta(priority) {
  return PRIORITY_META[priority] ?? PRIORITY_META.medium
}

/** Sorts recommendations so the most actionable ones come first. */
export function sortByPriority(items = []) {
  return [...items].sort(
    (a, b) => getPriorityMeta(a?.priority).order - getPriorityMeta(b?.priority).order,
  )
}

export function toScoreList(sectionScores) {
  const source = sectionScores && typeof sectionScores === 'object' ? sectionScores : {}

  return SECTION_ORDER.map(({ key, label, hint }) => ({
    key,
    label,
    hint,
    score: clampScore(source[key]),
  }))
}

export function countSkills(skills) {
  return SKILL_CATEGORIES.reduce((total, { key }) => total + (skills?.[key]?.length ?? 0), 0)
}

export function formatAnalysisDate(value) {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatAnalysisDateTime(value) {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Builds `resumeId -> latest analysis` so list views can offer "View Analysis"
 * and show a real score without an extra request per row.
 */
export function indexAnalysesByResume(analyses = []) {
  return analyses.reduce((index, analysis) => {
    const resumeId = analysis?.resumeId ?? analysis?.resume?.id
    if (!resumeId) return index
    if (index[resumeId]) return index

    index[resumeId] = analysis
    return index
  }, {})
}

export const EMPTY_SKILLS = Object.freeze({
  technical: [],
  soft: [],
  languages: [],
  tools: [],
})
