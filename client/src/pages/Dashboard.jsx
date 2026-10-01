import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  CircleAlert,
  FileText,
  Gauge,
  History,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  Target,
  Upload,
} from 'lucide-react'

import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { ResumeList } from '@/components/ResumeList'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScoreRing } from '@/components/common/ScoreRing'
import { useAuth } from '@/hooks/useAuth'
import { formatAnalysisDate, getScoreBandMeta, indexAnalysesByResume } from '@/lib/analysisUtils'
import { cn } from '@/lib/utils'
import {
  getAnalysisHistoryRequest,
  getMatchedJobsRequest,
  getResumesRequest,
} from '@/services/dashboardService'
import { analyzeResumeRequest, getAnalysisError } from '@/services/analysisService'
import { deleteResumeRequest } from '@/services/resumeService'

const QUICK_ACTIONS = [
  {
    to: '/upload',
    icon: Upload,
    title: 'Upload a new CV',
    body: 'Analyse a fresh PDF or DOCX and get a score in minutes.',
  },
  {
    to: '/jobs',
    icon: Target,
    title: 'Match a job description',
    body: 'Paste a role and see how your skills stack up.',
  },
  {
    to: '/history',
    icon: History,
    title: 'Review your history',
    body: 'Compare scores across every version you have uploaded.',
  },
]

function formatMemberSince(value) {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

function NotImplementedNotice({ children }) {
  return (
    <div className="border-border/70 bg-muted/35 flex items-start gap-2.5 rounded-xl border border-dashed px-3.5 py-3 text-xs leading-relaxed">
      <Sparkles className="text-brand-600 dark:text-brand-300 mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <p className="text-muted-foreground">
        <span className="text-foreground font-medium">Coming next.</span> {children}
      </p>
    </div>
  )
}

function EmptyState({ icon: Icon, title, body }) {
  return (
    <div className="border-border/70 bg-muted/25 flex flex-col items-center rounded-xl border border-dashed px-5 py-10 text-center">
      <span className="bg-brand-500/12 text-brand-700 dark:text-brand-300 flex size-11 items-center justify-center rounded-xl">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-4 text-sm font-medium">{title}</p>
      <p className="text-muted-foreground mt-1.5 max-w-xs text-xs leading-relaxed">{body}</p>
    </div>
  )
}

const LOAD_ERROR_MESSAGE =
  'We could not reach the CVision AI API. Your account is signed in, but dashboard data is unavailable right now.'

const EMPTY_DATA = { resumes: [], history: [], matchedJobs: [], error: '' }

async function loadDashboardData() {
  const [resumes, history, matchedJobs] = await Promise.all([
    getResumesRequest(),
    getAnalysisHistoryRequest(),
    getMatchedJobsRequest(),
  ])

  return { resumes, history, matchedJobs, error: '' }
}

export function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [data, setData] = useState(EMPTY_DATA)
  const [loading, setLoading] = useState(true)
  const [analyzingId, setAnalyzingId] = useState(null)
  const [actionError, setActionError] = useState('')

  const { resumes, history, matchedJobs, error } = data

  const loadData = useCallback(() => {
    setLoading(true)
    setData(EMPTY_DATA)

    loadDashboardData()
      .then(setData)
      .catch(() => setData({ ...EMPTY_DATA, error: LOAD_ERROR_MESSAGE }))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let cancelled = false

    loadDashboardData()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch(() => {
        if (!cancelled) setData({ ...EMPTY_DATA, error: LOAD_ERROR_MESSAGE })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const firstName = user?.name?.trim().split(/\s+/)[0] ?? 'there'
  const memberSince = formatMemberSince(user?.createdAt)
  const analysesCount = history.length

  // Only real stored scores are ever shown - history is the source of truth.
  const latestAnalysis = history[0] ?? null
  const analysesByResumeId = useMemo(() => indexAnalysesByResume(history), [history])
  const nextUp = resumes.find(
    (resume) => resume.extractionStatus === 'completed' && !analysesByResumeId[resume.id],
  )

  const handleAnalyze = useCallback(
    async (resume) => {
      if (analyzingId) return

      setAnalyzingId(resume.id)
      setActionError('')

      try {
        await analyzeResumeRequest(resume.id)
        navigate(`/analysis/${resume.id}`)
      } catch (err) {
        // No placeholder score is invented when a run fails.
        setActionError(getAnalysisError(err).message)
      } finally {
        setAnalyzingId(null)
      }
    },
    [analyzingId, navigate],
  )

  const handleDeleteResume = useCallback(
    async (id) => {
      try {
        await deleteResumeRequest(id)
        setData((current) => ({
          ...current,
          resumes: current.resumes.filter((resume) => resume.id !== id),
        }))
      } catch {
        setData((current) => ({
          ...current,
          error: 'Could not delete the resume. Please try again.',
        }))
      }
    },
    [],
  )

  return (
    <div className="bg-background flex min-h-dvh flex-col">
      <Navbar />

      <main className="container-page flex-1 py-10 sm:py-14">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Badge variant="brand">
              <Sparkles className="size-3" aria-hidden="true" />
              Signed in
            </Badge>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Welcome back, <span className="text-gradient-brand">{firstName}</span>
            </h1>

            <p className="text-muted-foreground mt-3 text-sm leading-relaxed sm:text-base">
              {user?.email}
              {memberSince && <span> · Member since {memberSince}</span>}
            </p>
          </div>

          <div className="flex shrink-0 gap-2">
            <Button asChild variant="brand" size="lg">
              <Link to="/upload">
                <Upload className="size-4" />
                Upload your CV
              </Link>
            </Button>
          </div>
        </header>

        {actionError && (
          <div
            role="alert"
            className="border-destructive/30 bg-destructive/8 text-destructive mt-8 flex items-start gap-2.5 rounded-xl border px-4 py-3.5 text-sm leading-relaxed"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium">Analysis could not be completed</p>
              <p className="mt-0.5">{actionError}</p>
            </div>
          </div>
        )}

        <section aria-labelledby="summary-heading" className="mt-10">
          <h2 id="summary-heading" className="sr-only">
            CV analysis summary
          </h2>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Gauge className="text-brand-600 dark:text-brand-300 size-4" aria-hidden="true" />
                  Latest CV score
                </CardTitle>
                <CardDescription>Overall score from your most recent analysis.</CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col items-center">
                {loading ? (
                  <div
                    className="flex h-[132px] w-[132px] items-center justify-center"
                    role="status"
                    aria-label="Loading CV score"
                  >
                    <LoaderCircle className="text-muted-foreground size-6 animate-spin" aria-hidden="true" />
                  </div>
                ) : latestAnalysis ? (
                  <>
                    <ScoreRing value={latestAnalysis.overallScore} label={getScoreBandMeta(latestAnalysis.overallScore).label} />
                    <p className="text-muted-foreground mt-3 text-center text-xs leading-relaxed">
                      {latestAnalysis.resumeName ?? 'Your CV'} · analysed{' '}
                      {formatAnalysisDate(latestAnalysis.createdAt)}
                    </p>
                    <Button asChild variant="outline" size="sm" className="mt-4">
                      <Link to={`/analysis/${latestAnalysis.resumeId}`}>
                        <BarChart3 className="size-4" />
                        View analysis
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <ScoreRing value={0} label="No score yet" showGlow={false} />
                    <p className="text-muted-foreground mt-3 text-center text-xs leading-relaxed">
                      You have not run an analysis yet, so there is no score to show.
                    </p>
                    {nextUp && (
                      <Button asChild variant="brand" size="sm" className="mt-4">
                        <Link to={`/resumes/${nextUp.id}`}>
                          <Sparkles className="size-4" />
                          Analyze your latest CV
                        </Link>
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FileText className="text-brand-600 dark:text-brand-300 size-4" aria-hidden="true" />
                  Analysis activity
                </CardTitle>
                <CardDescription>
                  Uploads and AI analyses are live from the API. Job matching totals follow once that
                  pipeline ships.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border px-4 py-3.5">
                    <dt className="text-muted-foreground text-xs font-medium">CVs uploaded</dt>
                    <dd className="mt-1.5 text-2xl font-semibold tabular-nums">
                      {loading ? <SkeletonValue /> : resumes.length}
                    </dd>
                  </div>

                  <div className="rounded-xl border px-4 py-3.5">
                    <dt className="text-muted-foreground text-xs font-medium">Analyses run</dt>
                    <dd className="mt-1.5 text-2xl font-semibold tabular-nums">
                      {loading ? <SkeletonValue /> : analysesCount}
                    </dd>
                  </div>

                  <div className="col-span-2 rounded-xl border px-4 py-3.5 sm:col-span-1">
                    <dt className="text-muted-foreground text-xs font-medium">Job matches</dt>
                    <dd className="mt-1.5 text-2xl font-semibold tabular-nums">
                      {loading ? <SkeletonValue /> : matchedJobs.length}
                    </dd>
                  </div>
                </dl>

                <NotImplementedNotice>
                  Job matching is not implemented on the backend yet, so match totals stay at zero.
                </NotImplementedNotice>
              </CardContent>
            </Card>
          </div>
        </section>

        <section aria-labelledby="activity-heading" className="mt-8 grid gap-4 lg:grid-cols-2">
          <h2 id="activity-heading" className="sr-only">
            Recent activity
          </h2>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent CV uploads</CardTitle>
              <CardDescription>
                Resume files in your account, newest first. Extracted CVs can be analysed with one click.
              </CardDescription>
              <CardAction>
                <Button asChild variant="outline" size="sm">
                  <Link to="/upload">
                    <Upload className="size-4" />
                    Upload CV
                  </Link>
                </Button>
              </CardAction>
            </CardHeader>

            <CardContent>
              <ResumeList
                resumes={resumes.slice(0, 5)}
                loading={loading}
                error={error}
                onDelete={handleDeleteResume}
                onAnalyze={handleAnalyze}
                analysesByResumeId={analysesByResumeId}
                analyzingId={analyzingId}
                emptyTitle="No CVs uploaded yet"
                emptyBody="Upload your first PDF or DOCX resume and it will show up here, ready for analysis."
                emptyCta="Upload your first CV"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Job matching</CardTitle>
              <CardDescription>Roles matched against your CV and target positions.</CardDescription>
            </CardHeader>

            <CardContent>
              {error ? (
                <div className="border-border/70 bg-muted/35 flex items-start gap-2.5 rounded-xl border border-dashed px-3.5 py-6 text-sm">
                  <CircleAlert className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <p className="text-muted-foreground leading-relaxed">
                    Matching data is unavailable because the API could not be reached.
                  </p>
                </div>
              ) : loading ? (
                <LoadingRows />
              ) : matchedJobs.length > 0 ? (
                <ul className="divide-border/70 divide-y">
                  {matchedJobs.map((job, index) => (
                    <li key={job?.id ?? index} className="flex items-center justify-between gap-4 py-3 text-sm">
                      <span className="truncate">{job?.title ?? 'Untitled role'}</span>
                      <span className="text-muted-foreground shrink-0 text-xs">
                        {job?.matchScore ?? '—'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={Briefcase}
                  title="No matches yet"
                  body="Analyse a CV and match it against a job description to see your best-fit roles here."
                />
              )}

              <div className="mt-5">
                <NotImplementedNotice>The job matcher is not implemented on the backend yet.</NotImplementedNotice>
              </div>
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="actions-heading" className="mt-10">
          <h2 id="actions-heading" className="text-lg font-semibold tracking-tight">
            Quick actions
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {QUICK_ACTIONS.map(({ to, icon: Icon, title, body }) => (
              <Card key={to} className="group transition-colors hover:border-brand-300 dark:hover:border-brand-700">
                <CardContent className="flex h-full flex-col pt-6">
                  <span className="bg-brand-500/12 text-brand-700 dark:text-brand-300 flex size-10 items-center justify-center rounded-xl">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <p className="mt-4 text-sm font-semibold">{title}</p>
                  <p className="text-muted-foreground mt-1.5 flex-1 text-xs leading-relaxed">{body}</p>
                  <Button asChild variant="link" className="mt-4 h-auto justify-start p-0">
                    <Link to={to}>
                      Open
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {error && (
          <div className="mt-8 flex justify-center">
            <Button variant="outline" onClick={loadData} disabled={loading}>
              <RefreshCw className={cn(loading ? 'size-4 animate-spin' : 'size-4')} aria-hidden="true" />
              Retry
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

function SkeletonValue() {
  return <span className="bg-muted inline-block h-7 w-10 animate-pulse rounded-md" aria-hidden="true" />
}

function LoadingRows() {
  return (
    <div className="space-y-3" role="status" aria-label="Loading">
      {[0, 1, 2].map((row) => (
        <div key={row} className="bg-muted/60 h-12 animate-pulse rounded-xl" />
      ))}
    </div>
  )
}

export default Dashboard
