import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  CircleAlert,
  FileText,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Target,
  TriangleAlert,
  Wrench,
} from 'lucide-react'

import { LoadingAnalysis } from '@/components/LoadingAnalysis'
import { ResumeList } from '@/components/ResumeList'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { ScoreCard } from '@/components/ScoreCard'
import { ScoreRing } from '@/components/common/ScoreRing'
import { SkillBadge } from '@/components/SkillBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  EMPTY_SKILLS,
  SKILL_CATEGORIES,
  countSkills,
  formatAnalysisDateTime,
  getPriorityMeta,
  getScoreBandMeta,
  sortByPriority,
  toScoreList,
} from '@/lib/analysisUtils'
import { cn } from '@/lib/utils'
import { analyzeResumeRequest, getAnalysisError, getResumeAnalysisRequest } from '@/services/analysisService'
import { getResumesRequest } from '@/services/resumeService'

const LOAD_ERROR_MESSAGE =
  'We could not reach the CVision AI API. This analysis could not be loaded right now.'

export function ResumeAnalysis() {
  const { id } = useParams()

  if (!id) {
    return <PickResume />
  }

  return <AnalysisView key={id} resumeId={id} />
}

function PickResume() {
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    getResumesRequest()
      .then((list) => {
        if (!cancelled) setResumes(list)
      })
      .catch(() => {
        if (!cancelled) setError(LOAD_ERROR_MESSAGE)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <PageShell
      eyebrow="Analysis"
      title="Choose a CV to analyse"
      description="Select an uploaded CV to view its stored AI analysis."
    >
      <ResumeList
        resumes={resumes}
        loading={loading}
        error={error}
        viewPath="/analysis"
        emptyTitle="No CVs yet"
        emptyBody="Upload your first resume and its extracted content will be available here."
        emptyCta="Upload your first CV"
      />
    </PageShell>
  )
}

function AnalysisView({ resumeId }) {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState('')
  const [loadError, setLoadError] = useState('')
  const [runError, setRunError] = useState('')
  const [analyzing, setAnalyzing] = useState(false)

  const requestInFlight = useRef(false)

  useEffect(() => {
    let cancelled = false

    getResumeAnalysisRequest(resumeId)
      .then((result) => {
        if (cancelled) return
        // A 404 is the normal "not analysed yet" state, not an error.
        if (!result) {
          setNotFound('This CV has not been analysed yet.')
          return
        }
        setAnalysis(result)
      })
      .catch((err) => {
        if (cancelled) return

        const { code, message } = getAnalysisError(err)
        if (code === 'ANALYSIS_NOT_FOUND' || code === 'RESUME_NOT_FOUND') {
          setNotFound(message)
          return
        }
        setLoadError(message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [resumeId])

  const handleRun = useCallback(async () => {
    if (requestInFlight.current) return

    requestInFlight.current = true
    setAnalyzing(true)
    setRunError('')

    try {
      const result = await analyzeResumeRequest(resumeId)
      setAnalysis(result)
      setNotFound('')
    } catch (err) {
      setRunError(getAnalysisError(err).message)
    } finally {
      requestInFlight.current = false
      setAnalyzing(false)
    }
  }, [resumeId])

  if (analyzing) {
    return (
      <PageShell
        eyebrow="AI analysis"
        title="Analysing your CV"
        description="This can take up to a minute. Results appear as soon as the review completes."
      >
        <LoadingAnalysis />
      </PageShell>
    )
  }

  if (loading) {
    return (
      <PageShell
        eyebrow="AI analysis"
        title="Loading your analysis"
        description="Fetching the stored CV analysis."
      >
        <div className="space-y-3" role="status" aria-label="Loading analysis">
          <div className="bg-muted/60 h-56 animate-pulse rounded-2xl" />
          <div className="bg-muted/60 h-40 animate-pulse rounded-2xl" />
        </div>
      </PageShell>
    )
  }

  if (!analysis) {
    return (
      <PageShell
        eyebrow="AI analysis"
        title="No analysis yet"
        description={loadError || notFound || 'Run an AI analysis to see your CV score and recommendations.'}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="text-brand-600 dark:text-brand-300 size-4" aria-hidden="true" />
              Analyse this CV with AI
            </CardTitle>
            <CardDescription>
              You will get an overall score, section-by-section scores, detected skills, strengths,
              weaknesses and ATS feedback.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {runError && (
              <div
                role="alert"
                className="border-destructive/30 bg-destructive/8 text-destructive flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm leading-relaxed"
              >
                <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-medium">Analysis could not be completed</p>
                  <p className="mt-0.5">{runError}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2.5 sm:flex-row">
              <Button type="button" variant="brand" size="lg" className="flex-1" onClick={handleRun}>
                <Sparkles className="size-4" />
                Analyze CV with AI
              </Button>
              <Button asChild variant="outline" size="lg" className="flex-1">
                <Link to={`/resumes/${resumeId}`}>
                  <FileText className="size-4" />
                  View extracted CV
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageShell>
    )
  }

  return (
    <PageShell
      eyebrow="AI analysis"
      title={analysis.resumeName || 'CV analysis'}
      description={`Analysed ${formatAnalysisDateTime(analysis.createdAt)}`}
      wide
    >
      <div className="space-y-4">
        <OverallScoreCard analysis={analysis} onReanalyse={handleRun} reanalyzing={analyzing} />

        <SectionScoresCard analysis={analysis} />

        <div className="grid gap-4 lg:grid-cols-2">
          <SkillsCard skills={analysis.skills ?? EMPTY_SKILLS} />
          <SummaryFeedbackCard summaryFeedback={analysis.summaryFeedback} />
        </div>

        <StrengthsCard strengths={analysis.strengths} />
        <WeaknessesCard weaknesses={analysis.weaknesses} />
        <RecommendationsCard recommendations={analysis.recommendations} />
        <AtsFeedbackCard atsFeedback={analysis.atsFeedback} />

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="outline" size="lg" className="flex-1">
            <Link to={`/resumes/${resumeId}`}>
              <ArrowLeft className="size-4" />
              Back to extracted CV
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="flex-1">
            <Link to="/history">
              <RefreshCw className="size-4" />
              Analysis history
            </Link>
          </Button>
          <Button asChild variant="brand" size="lg" className="flex-1">
            <Link to="/upload">Upload a new CV</Link>
          </Button>
        </div>
      </div>
    </PageShell>
  )
}

function OverallScoreCard({ analysis, onReanalyse, reanalyzing }) {
  const band = getScoreBandMeta(analysis.overallScore)
  const scores = toScoreList(analysis.sectionScores)
  const ranked = [...scores].sort((a, b) => b.score - a.score)
  const best = ranked[0]
  const worst = ranked.at(-1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Target className="text-brand-600 dark:text-brand-300 size-4" aria-hidden="true" />
          Overall CV score
        </CardTitle>
        <CardDescription>
          Calculated on the server from the eight section scores using fixed weights.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col items-center gap-7 sm:flex-row sm:items-center">
          <div className="flex shrink-0 flex-col items-center">
            <ScoreRing value={analysis.overallScore} label="out of 100" suffix="" />
            <p
              className={cn(
                'mt-3 text-sm font-semibold',
                band.tone === 'success' && 'text-emerald-600 dark:text-emerald-300',
                band.tone === 'brand' && 'text-brand-700 dark:text-brand-300',
                band.tone === 'warning' && 'text-amber-600 dark:text-amber-300',
                band.tone === 'destructive' && 'text-destructive',
              )}
            >
              {band.label}
            </p>
          </div>

          <div className="w-full min-w-0 flex-1 space-y-3">
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your strongest section is{' '}
              <span className="text-foreground font-medium">{best?.label}</span> ({best?.score}/100)
              {worst && best?.key !== worst.key && (
                <>
                  {' '}
                  and the section with the most room to grow is{' '}
                  <span className="text-foreground font-medium">{worst.label}</span> ({worst.score}/100).
                </>
              )}
            </p>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <ScoreCard label="Sections" score={scores.length} suffix="" showBand={false} showBar={false} />
              <ScoreCard
                label="Skills found"
                score={countSkills(analysis.skills)}
                suffix=""
                showBand={false}
                showBar={false}
              />
              <ScoreCard
                label="Recommendations"
                score={analysis.recommendations?.length ?? 0}
                suffix=""
                showBand={false}
                showBar={false}
                className="col-span-2 sm:col-span-1"
              />
            </div>

            <Button type="button" variant="outline" onClick={onReanalyse} disabled={reanalyzing}>
              <RefreshCw className={cn(reanalyzing && 'animate-spin')} aria-hidden="true" />
              {reanalyzing ? 'Analysing…' : 'Re-analyse this CV'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SectionScoresCard({ analysis }) {
  const scores = toScoreList(analysis.sectionScores)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Wrench className="text-brand-600 dark:text-brand-300 size-4" aria-hidden="true" />
          Section scores
        </CardTitle>
        <CardDescription>
          Each section is scored 0-100 by the AI reviewer. Experience counts for 25% of the overall
          score, skills 20%, certifications 5%, and the remaining sections 10% each.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {scores.map((section) => (
            <ScoreCard
              key={section.key}
              label={section.label}
              score={section.score}
              hint={section.hint}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function SkillsCard({ skills }) {
  const categories = SKILL_CATEGORIES.map((category) => ({
    ...category,
    items: skills?.[category.key] ?? [],
  }))

  const total = countSkills(skills)
  const hasSkills = total > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Lightbulb className="text-brand-600 dark:text-brand-300 size-4" aria-hidden="true" />
          Detected skills
        </CardTitle>
        <CardDescription>
          {hasSkills
            ? `${total} skill${total === 1 ? '' : 's'} found in the CV text, grouped by category.`
            : 'No skills could be identified in this CV.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {hasSkills ? (
          categories.map(({ key, label, icon: Icon, items }) =>
            items.length > 0 ? (
              <div key={key}>
                <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
                  <Icon className="size-3.5" aria-hidden="true" />
                  {label}
                  <span className="text-muted-foreground/70">({items.length})</span>
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {items.map((skill) => (
                    <SkillBadge key={`${key}-${skill}`} skill={skill} category={key} interactive />
                  ))}
                </div>
              </div>
            ) : null,
          )
        ) : (
          <p className="text-muted-foreground text-sm leading-relaxed">
            The reviewer did not find any skills section. Add a dedicated skills section listing your
            technical skills, tools and languages.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function StrengthsCard({ strengths }) {
  const items = Array.isArray(strengths) ? strengths : []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="text-emerald-600 dark:text-emerald-300 size-4" aria-hidden="true" />
          Strengths
        </CardTitle>
        <CardDescription>What already works well in this CV.</CardDescription>
      </CardHeader>

      <CardContent>
        {items.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((item, index) => (
              <div
                key={`${item?.title}-${index}`}
                className="border-border/80 hover:border-emerald-300 dark:hover:border-emerald-700 rounded-xl border p-4 transition-colors"
              >
                <p className="text-sm font-semibold">{item?.title || 'Strength'}</p>
                <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{item?.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm leading-relaxed">
            The reviewer did not identify any clear strengths in this CV.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function WeaknessesCard({ weaknesses }) {
  const items = sortByPriority(Array.isArray(weaknesses) ? weaknesses : [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <TriangleAlert className="text-amber-600 dark:text-amber-300 size-4" aria-hidden="true" />
          Weaknesses
        </CardTitle>
        <CardDescription>Ordered by the priority the reviewer assigned.</CardDescription>
      </CardHeader>

      <CardContent>
        {items.length > 0 ? (
          <ul className="space-y-3">
            {items.map((item, index) => {
              const priority = getPriorityMeta(item?.priority)
              const PriorityIcon = priority.icon

              return (
                <li
                  key={`${item?.title}-${index}`}
                  className="border-border/80 rounded-xl border p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="text-sm font-semibold">{item?.title || 'Weakness'}</p>
                    <Badge variant={priority.tone === 'destructive' ? 'outline' : priority.tone}>
                      <PriorityIcon aria-hidden="true" />
                      {priority.label}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{item?.description}</p>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm leading-relaxed">
            The reviewer did not flag any weaknesses in this CV.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function RecommendationsCard({ recommendations }) {
  const items = sortByPriority(Array.isArray(recommendations) ? recommendations : [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Bot className="text-brand-600 dark:text-brand-300 size-4" aria-hidden="true" />
          Recommendations
        </CardTitle>
        <CardDescription>Concrete next steps, most important first.</CardDescription>
      </CardHeader>

      <CardContent>
        {items.length > 0 ? (
          <ol className="space-y-3">
            {items.map((item, index) => {
              const priority = getPriorityMeta(item?.priority)
              const PriorityIcon = priority.icon

              return (
                <li
                  key={`${item?.title}-${index}`}
                  className="border-border/80 hover:border-brand-300 dark:hover:border-brand-700 flex gap-3.5 rounded-xl border p-4 transition-colors"
                >
                  <span className="bg-brand-500/12 text-brand-700 dark:text-brand-300 flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold tabular-nums">
                    {index + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-sm font-semibold">{item?.title || 'Recommendation'}</p>
                      <Badge variant={priority.tone === 'destructive' ? 'outline' : priority.tone}>
                        <PriorityIcon aria-hidden="true" />
                        {priority.label}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                      {item?.description}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        ) : (
          <p className="text-muted-foreground text-sm leading-relaxed">
            The reviewer did not return any recommendations for this CV.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function SummaryFeedbackCard({ summaryFeedback }) {
  const current = summaryFeedback?.currentAssessment
  const suggested = summaryFeedback?.suggestedImprovement

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <FileText className="text-brand-600 dark:text-brand-300 size-4" aria-hidden="true" />
          Professional summary feedback
        </CardTitle>
        <CardDescription>How the summary reads, and how to sharpen it.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <FeedbackBlock title="Current assessment" body={current} />
        <FeedbackBlock title="Suggested improvement" body={suggested} tone="brand" />
      </CardContent>
    </Card>
  )
}

function AtsFeedbackCard({ atsFeedback }) {
  const issues = Array.isArray(atsFeedback?.issues) ? atsFeedback.issues : []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Target className="text-brand-600 dark:text-brand-300 size-4" aria-hidden="true" />
          ATS &amp; readability feedback
        </CardTitle>
        <CardDescription>
          How this CV is likely to perform when screened by an applicant tracking system.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <FeedbackBlock title="Readability" body={atsFeedback?.readability} />
        <FeedbackBlock title="Keyword usage" body={atsFeedback?.keywordUsage} />
        <FeedbackBlock title="Formatting" body={atsFeedback?.formatting} />

        <div>
          <p className="text-sm font-semibold">
            Detected issues
            {issues.length > 0 && (
              <span className="text-muted-foreground ml-1.5 text-xs font-medium">({issues.length})</span>
            )}
          </p>

          {issues.length > 0 ? (
            <ul className="mt-2.5 space-y-2">
              {issues.map((issue, index) => (
                <li
                  key={`${issue}-${index}`}
                  className="border-border/80 bg-muted/25 flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm leading-relaxed"
                >
                  <CircleAlert className="text-amber-600 dark:text-amber-300 mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
              No ATS or readability issues were detected in this CV.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function FeedbackBlock({ title, body, tone = 'muted' }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{title}</p>
      <p
        className={cn(
          'mt-1.5 rounded-xl border px-3.5 py-3 text-sm leading-relaxed',
          tone === 'brand'
            ? 'border-brand-200/80 bg-brand-50/60 text-brand-900 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-100'
            : 'border-border/80 bg-muted/25',
        )}
      >
        {body || 'The reviewer did not provide feedback for this area.'}
      </p>
    </div>
  )
}

function PageShell({ eyebrow, title, description, children, wide = false }) {
  return (
    <div className="bg-background flex min-h-dvh flex-col">
      <Navbar />
      <main className="container-page flex flex-1 flex-col py-10 sm:py-14">
        <div className={cn('mx-auto flex w-full flex-1 flex-col', wide ? 'max-w-5xl' : 'max-w-3xl')}>
          <header className="mb-8">
            <Badge variant="brand">
              <Sparkles className="size-3" aria-hidden="true" />
              {eyebrow}
            </Badge>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              {title}
            </h1>
            {description && (
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{description}</p>
            )}
          </header>

          {children}
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default ResumeAnalysis
