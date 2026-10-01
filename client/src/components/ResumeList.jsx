import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  CircleAlert,
  Eye,
  FileText,
  LoaderCircle,
  Sparkles,
  Trash2,
  UploadCloud,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  formatBytes,
  formatUploadDate,
  getExtractionStatusMeta,
  getMimeTypeLabel,
} from '@/lib/resumeUtils'
import { cn } from '@/lib/utils'

const CONFIRM_TIMEOUT_MS = 4000

/**
 * Card/list of the current user's resumes: filename, type, size, upload date,
 * extraction status, a view link and an optional delete flow.
 *
 * `analysesByResumeId` maps resumeId -> latest analysis. When an entry exists the
 * row offers "View Analysis" and shows the stored score; otherwise an extracted
 * resume offers an "Analyze CV" action through `onAnalyze`. Nothing is rendered
 * unless it is real, stored data.
 *
 * Deletion uses a two-step inline confirm so no extra dialog dependency is needed.
 */
export function ResumeList({
  resumes = [],
  loading = false,
  error = '',
  onDelete,
  onAnalyze,
  analysesByResumeId = null,
  analyzingId = null,
  viewPath = '/resumes',
  emptyTitle = 'No CVs yet',
  emptyBody = 'Upload your first CV to start building your profile.',
  emptyCta = 'Upload your first CV',
  className,
}) {
  const [confirmingId, setConfirmingId] = useState(null)

  function startConfirm(id) {
    setConfirmingId(id)
    window.setTimeout(() => {
      setConfirmingId((current) => (current === id ? null : current))
    }, CONFIRM_TIMEOUT_MS)
  }

  if (loading) {
    return (
      <div className={cn('space-y-3', className)} role="status" aria-label="Loading resumes">
        {[0, 1, 2].map((row) => (
          <div key={row} className="bg-muted/60 h-[4.5rem] animate-pulse rounded-xl" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div
        role="alert"
        className={cn(
          'border-destructive/30 bg-destructive/8 text-destructive flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm',
          className,
        )}
      >
        <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p className="leading-relaxed">{error}</p>
      </div>
    )
  }

  if (resumes.length === 0) {
    return (
      <div
        className={cn(
          'border-border/70 bg-muted/25 flex flex-col items-center rounded-xl border border-dashed px-5 py-10 text-center',
          className,
        )}
      >
        <span className="bg-brand-500/12 text-brand-700 dark:text-brand-300 flex size-11 items-center justify-center rounded-xl">
          <FileText className="size-5" aria-hidden="true" />
        </span>
        <p className="mt-4 text-sm font-medium">{emptyTitle}</p>
        <p className="text-muted-foreground mt-1.5 max-w-xs text-xs leading-relaxed">{emptyBody}</p>
        {emptyCta && (
          <Button asChild variant="outline" size="sm" className="mt-5">
            <Link to="/upload">
              <UploadCloud className="size-4" />
              {emptyCta}
            </Link>
          </Button>
        )}
      </div>
    )
  }

  return (
    <ul className={cn('space-y-3', className)}>
      {resumes.map((resume) => {
        const status = getExtractionStatusMeta(resume.extractionStatus)
        const StatusIcon = status.icon
        const confirming = confirmingId === resume.id

        const analysis = analysesByResumeId?.[resume.id] ?? null
        const isAnalyzed = Boolean(analysis)
        const canAnalyze = Boolean(onAnalyze) && resume.extractionStatus === 'completed' && !isAnalyzed
        const analyzing = analyzingId === resume.id
        const detailHref = `${viewPath}/${resume.id}`
        const targetHref = isAnalyzed ? `/analysis/${resume.id}` : detailHref

        return (
          <li
            key={resume.id}
            className="border-border/80 bg-card hover:border-brand-300 dark:hover:border-brand-700 rounded-xl border p-4 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="bg-brand-500/12 text-brand-700 dark:text-brand-300 flex size-10 shrink-0 items-center justify-center rounded-lg">
                <FileText className="size-5" aria-hidden="true" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold" title={resume.originalName}>
                  {resume.originalName}
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {getMimeTypeLabel(resume.mimeType)} · {formatBytes(resume.sizeBytes)} ·{' '}
                  {formatUploadDate(resume.uploadedAt ?? resume.createdAt)}
                </p>
              </div>

              {isAnalyzed && (
                <Badge variant="brand" className="hidden sm:inline-flex">
                  <BarChart3 aria-hidden="true" />
                  {analysis.overallScore}/100
                </Badge>
              )}

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

              {canAnalyze ? (
                <Button
                  type="button"
                  variant="brand"
                  size="sm"
                  onClick={() => onAnalyze(resume)}
                  disabled={analyzing}
                >
                  {analyzing ? (
                    <LoaderCircle className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Sparkles aria-hidden="true" />
                  )}
                  {analyzing ? 'Analyzing…' : 'Analyze CV'}
                </Button>
              ) : isAnalyzed ? (
                <Button asChild variant="brand" size="sm">
                  <Link to={targetHref}>
                    <BarChart3 aria-hidden="true" />
                    View Analysis
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="ghost" size="icon-sm" aria-label={`View ${resume.originalName}`}>
                  <Link to={detailHref}>
                    <Eye className="size-4" />
                  </Link>
                </Button>
              )}

              {onDelete && (
                <Button
                  type="button"
                  variant={confirming ? 'destructive' : 'ghost'}
                  size={confirming ? 'sm' : 'icon-sm'}
                  aria-label={`Delete ${resume.originalName}`}
                  onClick={() => {
                    if (!confirming) {
                      startConfirm(resume.id)
                      return
                    }
                    setConfirmingId(null)
                    onDelete(resume.id)
                  }}
                >
                  {confirming ? (
                    <>
                      <Trash2 className="size-4" />
                      Confirm delete
                    </>
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </Button>
              )}
            </div>

            {resume.extractionError && (
              <p className="text-muted-foreground mt-2.5 border-t pt-2.5 text-xs leading-relaxed">
                {resume.extractionError}
              </p>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export default ResumeList