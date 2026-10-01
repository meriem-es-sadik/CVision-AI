import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  CheckCircle2,
  CircleAlert,
  FileText,
  FileUp,
  LayoutDashboard,
  LoaderCircle,
  Sparkles,
  Type,
  XCircle,
} from 'lucide-react'

import { LoadingAnalysis } from '@/components/LoadingAnalysis'
import { ResumeList } from '@/components/ResumeList'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { ScoreCard } from '@/components/ScoreCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatAnalysisDate } from '@/lib/analysisUtils'
import {
  formatBytes,
  formatUploadDate,
  getExtractionStatusMeta,
  getMimeTypeLabel,
} from '@/lib/resumeUtils'
import { cn } from '@/lib/utils'
import { analyzeResumeRequest, getAnalysisError } from '@/services/analysisService'
import { getResumeByIdRequest, getResumesRequest } from '@/services/resumeService'

const SECTION_KEYWORDS = [
  { label: 'Summary', pattern: /summary|profile|objective/i },
  { label: 'Experience', pattern: /experience|employment|work history|career/i },
  { label: 'Education', pattern: /education|academic|qualifications/i },
  { label: 'Skills', pattern: /skills|technologies|competencies|expertise/i },
  { label: 'Projects', pattern: /projects|portfolio/i },
  { label: 'Certifications', pattern: /certif|licenses|accreditation/i },
  { label: 'Languages', pattern: /languages/i },
]

function detectSections(text) {
  const matched = {}
  const haystack = String(text ?? '').toLowerCase()

  for (const { label, pattern } of SECTION_KEYWORDS) {
    const lineIndex = haystack.split('\n').findIndex((line) => pattern.test(line))
    if (lineIndex >= 0) matched[label] = lineIndex
  }

  return Object.entries(matched)
    .sort((a, b) => a[1] - b[1])
    .map(([label]) => label)
}

const LOAD_ERROR_MESSAGE =
  'We could not reach the CVision AI API. This resume could not be loaded right now.'

export function ResumeDetail() {
  const { id } = useParams()

  if (!id) {
    return <PickResume />
  }

  return <ResumeDetailView id={id} key={id} />
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
      eyebrow="Resume"
      title="Choose a resume to view"
      description="Select one of your uploaded CVs to see its stored details and run an AI analysis."
    >
      <ResumeList
        resumes={resumes}
        loading={loading}
        error={error}
        emptyTitle="No CVs yet"
        emptyBody="Upload your first resume and its extracted content will be available here."
        emptyCta="Upload your first CV"
      />
    </PageShell>
  )
}

function ResumeDetailView({ id }) {
  const navigate = useNavigate()

  const [resume, setResume] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState('')
  const [analysis, setAnalysis] = useState(null)

  // Guards against a second call slipping through from a fast double click.
  const requestInFlight = useRef(false)

  useEffect(() => {
    let cancelled = false

    getResumeByIdRequest(id)
      .then((result) => {
        if (cancelled) return
        if (!result) {
          setError('This resume could not be found or you no longer have access to it.')
          return
        }
        setResume(result)
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
  }, [id])

  const handleAnalyze = useCallback(async () => {
    if (requestInFlight.current) return

    requestInFlight.current = true
    setAnalyzing(true)
    setAnalysisError('')

    try {
      const result = await analyzeResumeRequest(id)
      setAnalysis(result)
      navigate(`/analysis/${id}`, { replace: true })
    } catch (err) {
      // A failed analysis is never replaced with invented results.
      const { message } = getAnalysisError(err)
      setAnalysisError(message)
    } finally {
      requestInFlight.current = false
      setAnalyzing(false)
    }
  }, [id, navigate])

  if (loading) {
    return (
      <PageShell
        eyebrow="Resume"
        title="Loading your resume"
        description="Fetching the stored CV details and extracted content."
      >
        <div className="space-y-3" role="status" aria-label="Loading resume">
          {[0, 1, 2].map((row) => (
            <div key={row} className="bg-muted/60 h-24 animate-pulse rounded-xl" />
          ))}
        </div>
      </PageShell>
    )
  }

  if (error || !resume) {
    return (
      <PageShell
        eyebrow="Resume"
        title="Resume unavailable"
        description={error || 'This resume could not be found.'}
      >
        <div className="flex justify-center">
          <Button asChild variant="brand">
            <Link to="/dashboard">
              <LayoutDashboard className="size-4" />
              Back to dashboard
            </Link>
          </Button>
        </div>
      </PageShell>
    )
  }

  const status = getExtractionStatusMeta(resume.extractionStatus)
  const StatusIcon = status.icon
  const completed = resume.extractionStatus === 'completed'
  const sections = detectSections(resume.textPreview)

  if (analyzing) {
    return (
      <PageShell
        eyebrow="AI analysis"
        title={resume.originalName || 'Your resume'}
        description="Your CV is being reviewed right now."
      >
        <LoadingAnalysis />
      </PageShell>
    )
  }

  return (
    <PageShell
      eyebrow="Resume"
      title={resume.originalName || 'Your resume'}
      description={`Uploaded ${formatUploadDate(resume.uploadedAt ?? resume.createdAt)}`}
    >
      {completed && (
        <Card className="border-brand-200/80 dark:border-brand-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="text-brand-600 dark:text-brand-300 size-4" aria-hidden="true" />
              AI CV analysis
            </CardTitle>
            <CardDescription>
              {resume.overallScore !== null && resume.overallScore !== undefined
                ? `Last analysed ${formatAnalysisDate(resume.analyzedAt)} with a score of ${resume.overallScore}/100.`
                : 'Get a full CV score, section-by-section feedback, detected skills and ATS recommendations.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {typeof resume.overallScore === 'number' && (
              <ScoreCard
                label="Latest CV score"
                score={resume.overallScore}
                className="sm:max-w-xs"
              />
            )}

            <div className="flex flex-col gap-2.5 sm:flex-row">
              <Button
                type="button"
                variant="brand"
                size="lg"
                className="flex-1"
                onClick={handleAnalyze}
                disabled={analyzing}
              >
                <Sparkles className="size-4" />
                {typeof resume.overallScore === 'number' ? 'Re-analyse CV with AI' : 'Analyze CV with AI'}
              </Button>

              {typeof resume.overallScore === 'number' && (
                <Button asChild variant="outline" size="lg" className="flex-1">
                  <Link to={`/analysis/${resume.id}`}>
                    View analysis
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              )}
            </div>

            {analysisError && (
              <div
                role="alert"
                className="border-destructive/30 bg-destructive/8 text-destructive flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm leading-relaxed"
              >
                <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-medium">Analysis could not be completed</p>
                  <p className="mt-0.5">{analysisError}</p>
                </div>
              </div>
            )}

            {analysis && (
              <p className="text-muted-foreground text-xs">
                Saved as analysis {analysis.id}. Opening your results…
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="text-brand-600 dark:text-brand-300 size-4" aria-hidden="true" />
            File details
          </CardTitle>
          <CardDescription>Metadata stored for this resume.</CardDescription>
        </CardHeader>

        <CardContent>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground text-xs font-medium">Type</dt>
              <dd className="mt-1 text-sm font-semibold">{getMimeTypeLabel(resume.mimeType)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs font-medium">File size</dt>
              <dd className="mt-1 text-sm font-semibold">{formatBytes(resume.sizeBytes)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs font-medium">Extraction</dt>
              <dd className="mt-1">
                <Badge
                  variant={status.tone === 'destructive' ? 'outline' : status.tone}
                  className={cn(status.tone === 'destructive' && 'border-destructive/30 text-destructive')}
                >
                  {status.spinner ? (
                    <StatusIcon className="animate-spin" aria-hidden="true" />
                  ) : (
                    <StatusIcon aria-hidden="true" />
                  )}
                  {status.label}
                </Badge>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {completed && sections.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calculator className="text-brand-600 dark:text-brand-300 size-4" aria-hidden="true" />
              Detected sections
            </CardTitle>
            <CardDescription>
              Basic section headings recognised in the extracted text. Run the AI analysis for scored,
              in-depth feedback.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {sections.map((label) => (
                <Badge key={label} variant="secondary">
                  {label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Type className="text-brand-600 dark:text-brand-300 size-4" aria-hidden="true" />
            Extracted content
          </CardTitle>
          <CardDescription>
            {resume.textLength > 0
              ? `${resume.textLength.toLocaleString()} characters of text were extracted.`
              : 'No extractable text was found for this document.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {completed ? (
            <pre className="text-muted-foreground bg-muted/30 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border px-4 py-4 font-sans text-sm leading-relaxed">
              {resume.textPreview || 'No text available yet.'}
            </pre>
          ) : resume.extractionStatus === 'failed' ? (
            <div className="border-destructive/30 bg-destructive/8 text-destructive flex items-start gap-3 rounded-xl border px-4 py-4 text-sm">
              <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-medium">Text extraction failed</p>
                <p className="mt-1 leading-relaxed">
                  {resume.extractionError || 'This document could not be parsed. Try a text-based PDF or DOCX.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="border-brand-200/70 bg-brand-50/70 text-brand-800 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-200 flex items-start gap-3 rounded-xl border px-4 py-4 text-sm">
              <LoaderCircle className="mt-0.5 size-4 animate-spin shrink-0" aria-hidden="true" />
              <p className="leading-relaxed">Extraction is still queued. Refresh in a moment.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="outline" size="lg" className="flex-1">
          <Link to="/dashboard">
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
        </Button>
        <Button asChild variant="brand" size="lg" className="flex-1">
          <Link to="/upload">
            Upload another CV
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      <div className="mt-8">
        <div className="border-border/70 bg-muted/35 flex items-start gap-2.5 rounded-xl border border-dashed px-3.5 py-3 text-xs leading-relaxed">
          <CheckCircle2 className="text-brand-600 dark:text-brand-300 mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <p className="text-muted-foreground">
            <span className="text-foreground font-medium">How scoring works.</span> Each section is scored
            from 0-100 by the AI reviewer, then the overall score is calculated on the server using fixed
            weights: experience 25%, skills 20%, contact, summary, education, projects and structure 10%
            each, certifications 5%.
          </p>
        </div>
      </div>
    </PageShell>
  )
}

function PageShell({ eyebrow, title, description, children }) {
  return (
    <div className="bg-background flex min-h-dvh flex-col">
      <Navbar />
      <main className="container-page flex flex-1 flex-col py-10 sm:py-14">
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
          <header className="mb-8">
            <Badge variant="brand">
              <FileUp className="size-3" aria-hidden="true" />
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

export default ResumeDetail
