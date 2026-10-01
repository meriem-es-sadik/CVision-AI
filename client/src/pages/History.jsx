import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  Briefcase,
  CircleAlert,
  FileText,
  RefreshCw,
  Sparkles,
  Upload,
} from 'lucide-react'

import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatAnalysisDateTime, getScoreBandMeta } from '@/lib/analysisUtils'
import { cn } from '@/lib/utils'
import { getAnalysisError, getAnalysisHistoryRequest } from '@/services/analysisService'

const LOAD_ERROR_MESSAGE =
  'We could not reach the CVision AI API. Your analysis history is unavailable right now.'

function bandClass(tone) {
  return cn(
    tone === 'success' && 'text-emerald-600 dark:text-emerald-300',
    tone === 'brand' && 'text-brand-700 dark:text-brand-300',
    tone === 'warning' && 'text-amber-600 dark:text-amber-300',
    tone === 'destructive' && 'text-destructive',
  )
}

export function History() {
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    setError('')

    getAnalysisHistoryRequest()
      .then(setAnalyses)
      .catch((err) => {
        setError(getAnalysisError(err).message || LOAD_ERROR_MESSAGE)
        setAnalyses([])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let cancelled = false

    getAnalysisHistoryRequest()
      .then((result) => {
        if (!cancelled) setAnalyses(result)
      })
      .catch((err) => {
        if (cancelled) return
        setError(getAnalysisError(err).message || LOAD_ERROR_MESSAGE)
        setAnalyses([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="bg-background flex min-h-dvh flex-col">
      <Navbar />

      <main className="container-page flex-1 py-10 sm:py-14">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Badge variant="brand">
              <Sparkles className="size-3" aria-hidden="true" />
              History
            </Badge>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              Your analysis history
            </h1>

            <p className="text-muted-foreground mt-2 max-w-xl text-sm leading-relaxed">
              Every AI analysis you have run, newest first. Scores are stored results - nothing here is
              estimated.
            </p>
          </div>

          <div className="flex shrink-0 gap-2">
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className={cn(loading && 'animate-spin')} aria-hidden="true" />
              Refresh
            </Button>
            <Button asChild variant="brand">
              <Link to="/upload">
                <Upload className="size-4" />
                New analysis
              </Link>
            </Button>
          </div>
        </header>

        <div className="mt-8">
          {loading ? (
            <div className="space-y-3" role="status" aria-label="Loading analysis history">
              {[0, 1, 2].map((row) => (
                <div key={row} className="bg-muted/60 h-20 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : error ? (
            <div
              role="alert"
              className="border-destructive/30 bg-destructive/8 text-destructive flex items-start gap-2.5 rounded-xl border px-4 py-4 text-sm leading-relaxed"
            >
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-medium">Could not load your history</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          ) : analyses.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">No analyses yet</CardTitle>
                <CardDescription>
                  Upload a CV and run an AI analysis to start building your history.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-border/70 bg-muted/25 flex flex-col items-center rounded-xl border border-dashed px-5 py-12 text-center">
                  <span className="bg-brand-500/12 text-brand-700 dark:text-brand-300 flex size-11 items-center justify-center rounded-xl">
                    <BarChart3 className="size-5" aria-hidden="true" />
                  </span>
                  <p className="mt-4 text-sm font-medium">Your history is empty</p>
                  <p className="text-muted-foreground mt-1.5 max-w-xs text-xs leading-relaxed">
                    Scores, section breakdowns and recommendations will appear here after your first
                    analysis.
                  </p>
                  <Button asChild variant="outline" size="sm" className="mt-5">
                    <Link to="/resumes">
                      <FileText className="size-4" />
                      Choose a CV to analyse
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">All analyses</CardTitle>
                <CardDescription>
                  {analyses.length} analys{analyses.length === 1 ? 'is' : 'es'} stored in your account.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <ul className="divide-border/70 divide-y">
                  {analyses.map((analysis) => {
                    const band = getScoreBandMeta(analysis.overallScore)

                    return (
                      <li
                        key={analysis.id}
                        className="hover:bg-muted/25 -mx-2 flex flex-col gap-3 rounded-xl px-2 py-4 transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold" title={analysis.resumeName ?? ''}>
                            {analysis.resumeName ?? 'Untitled CV'}
                          </p>
                          <p className="text-muted-foreground mt-0.5 text-xs">
                            Analysed {formatAnalysisDateTime(analysis.createdAt)}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-semibold tabular-nums">
                              {analysis.overallScore}
                            </span>
                            <span className="text-muted-foreground text-xs">/100</span>
                            <span className={cn('text-xs font-medium', bandClass(band.tone))}>
                              {band.label}
                            </span>
                          </div>

                          <Button asChild variant="outline" size="sm">
                            <Link to={`/analysis/${analysis.resumeId}`}>
                              <BarChart3 className="size-4" />
                              View Analysis
                            </Link>
                          </Button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="border-border/70 bg-muted/35 mt-8 flex items-start gap-2.5 rounded-xl border border-dashed px-3.5 py-3 text-xs leading-relaxed">
          <Briefcase className="text-brand-600 dark:text-brand-300 mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <p className="text-muted-foreground">
            <span className="text-foreground font-medium">Coming next.</span> Job match results will be
            listed here too once the job matcher ships.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default History
