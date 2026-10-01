import { useCallback, useRef, useState } from 'react'
import {
  CheckCircle2,
  FileText,
  LoaderCircle,
  Trash2,
  UploadCloud,
} from 'lucide-react'

import { FormAlert } from '@/components/auth/FormAlert'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ACCEPT_MIME_HINTS, validateResumeFile } from '@/lib/resumeUtils'
import { cn } from '@/lib/utils'
import { uploadResumeRequest } from '@/services/resumeService'

const TYPE_LABELS = {
  pdf: 'PDF',
  docx: 'DOCX',
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function getFileType(file) {
  const name = (file?.name ?? '').toLowerCase()
  const ext = name.slice(name.lastIndexOf('.'))
  if (ext === '.pdf' || file?.type === 'application/pdf') return 'pdf'
  if (ext === '.docx' || file?.type.includes('word')) return 'docx'
  return null
}

function getUploadError(error) {
  const response = error?.response
  const data = response?.data
  const status = response?.status

  if (!response) {
    return 'Cannot reach the CVision AI API. Check that the server is running and try again.'
  }

  if (status === 413) return 'File is too large. The maximum allowed size is 5 MB.'
  if (status === 401) return 'Your session has expired. Please sign in again and retry the upload.'
  return data?.message ?? 'The upload failed. Please try again.'
}

/**
 * Reusable drag & drop / click-to-browse resume uploader.
 * Calls `onUploadSuccess(uploadedResume)` after a successful upload and
 * `onUploadError(message)` on failure.
 */
export function ResumeUploader({ onUploadSuccess, onUploadError }) {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  const clear = useCallback(() => {
    setFile(null)
    setProgress(0)
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  const selectFile = useCallback((nextFile) => {
    setError('')

    const message = validateResumeFile(nextFile)
    if (message) {
      setFile(null)
      setError(message)
      return
    }

    setFile(nextFile)
    setProgress(0)
  }, [])

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault()
      setDragActive(false)
      const dropped = event.dataTransfer?.files?.[0]
      if (dropped) selectFile(dropped)
    },
    [selectFile],
  )

  const handleUpload = useCallback(async () => {
    if (!file || uploading) return

    setUploading(true)
    setProgress(0)
    setError('')

    try {
      const uploaded = await uploadResumeRequest(file, { onProgress: setProgress })
      onUploadSuccess?.(uploaded)
      clear()
    } catch (err) {
      const message = getUploadError(err)
      setError(message)
      onUploadError?.(message)
    } finally {
      setUploading(false)
    }
  }, [file, uploading, clear, onUploadSuccess, onUploadError])

  const uploadDisabled = uploading || !file

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload a PDF or DOCX resume"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDrop={handleDrop}
        onDragOver={(event) => {
          event.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        className={cn(
          'cursor-pointer rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors focus-visible:ring-ring/60 focus-visible:ring-[3px] focus-visible:outline-none',
          dragActive
            ? 'border-brand-500 bg-brand-500/8'
            : 'border-border bg-card/50 hover:border-brand-400 hover:bg-accent/40',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_MIME_HINTS}
          onChange={(event) => selectFile(event.target.files?.[0])}
          className="sr-only"
        />

        <span
          className={cn(
            'bg-brand-500/12 text-brand-700 dark:text-brand-300 mx-auto flex size-14 items-center justify-center rounded-2xl transition-transform',
            dragActive && 'scale-110',
          )}
        >
          <UploadCloud className="size-7" aria-hidden="true" />
        </span>

        <p className="mt-5 text-sm font-semibold">
          {dragActive ? 'Drop your resume here' : 'Drag & drop your CV here'}
        </p>
        <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
          or <span className="text-brand-700 dark:text-brand-300 font-medium">browse your files</span>
        </p>
        <p className="text-muted-foreground mt-4 text-[11px] uppercase tracking-wider">
          PDF or DOCX · up to 5 MB
        </p>
      </div>

      {error && <FormAlert tone="error" title="Upload error" message={error} />}

      {file && !uploading && (
        <div className="border-border bg-muted/30 flex items-center gap-3 rounded-xl border px-4 py-3">
          <span className="bg-brand-500/12 text-brand-700 dark:text-brand-300 flex size-10 shrink-0 items-center justify-center rounded-lg">
            <FileText className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium" title={file.name}>
              {file.name}
            </p>
            <p className="text-muted-foreground text-xs">
              {TYPE_LABELS[getFileType(file)] ?? 'Document'} · {formatBytes(file.size)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Remove selected file"
            onClick={clear}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      )}

      {uploading && (
        <div className="border-border bg-muted/30 space-y-2.5 rounded-xl border px-4 py-4">
          <div className="flex items-center gap-2.5">
            <LoaderCircle className="text-brand-700 dark:text-brand-300 size-4 animate-spin" aria-hidden="true" />
            <p className="text-sm font-medium">Uploading and parsing your CV…</p>
          </div>
          <Progress value={progress} aria-label={`Upload progress ${progress}%`} />
          <p className="text-muted-foreground text-right text-xs tabular-nums">{progress}%</p>
        </div>
      )}

      {file && !uploading && (
        <Button
          type="button"
          variant="brand"
          size="lg"
          className="w-full"
          onClick={handleUpload}
          disabled={uploadDisabled}
        >
          <UploadCloud className="size-4" />
          Upload resume
        </Button>
      )}

      {file && uploading && (
        <Button type="button" variant="brand" size="lg" className="w-full" disabled>
          <LoaderCircle className="size-4 animate-spin" />
          Uploading…
        </Button>
      )}

      {!file && !error && (
        <p className="text-muted-foreground text-center text-xs">
          Your CV is stored securely and only you can access it.
        </p>
      )}

      {file && !uploading && (
        <p className="text-muted-foreground flex items-center justify-center gap-1.5 text-center text-xs">
          <CheckCircle2 className="text-brand-700 dark:text-brand-300 size-3.5" aria-hidden="true" />
          Ready to upload
        </p>
      )}
    </div>
  )
}

export default ResumeUploader