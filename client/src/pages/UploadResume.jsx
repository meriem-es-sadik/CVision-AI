import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, FileCheck2, LayoutDashboard, Upload } from 'lucide-react'

import { ResumeUploader } from '@/components/ResumeUploader'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function UploadResume() {
  const [uploaded, setUploaded] = useState(null)

  return (
    <div className="bg-background flex min-h-dvh flex-col">
      <Navbar />

      <main className="container-page flex flex-1 flex-col py-10 sm:py-14">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
          <header className="text-center">
            <Badge variant="brand">
              <Upload className="size-3" aria-hidden="true" />
              Upload
            </Badge>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {uploaded ? 'Resume uploaded' : 'Upload your CV'}
            </h1>
            <p className="text-muted-foreground mx-auto mt-3 max-w-lg text-sm leading-relaxed text-pretty sm:text-base">
              {uploaded
                ? 'Your resume was received and its text was extracted. View it now or keep refining your profile.'
                : 'Drop a PDF or DOCX and CVision AI will store it securely and extract its content for future analysis.'}
            </p>
          </header>

          <div className="mt-10">
            {uploaded ? (
              <UploadSuccess
                originalName={uploaded.originalName ?? 'your resume'}
                extractionStatus={uploaded.extractionStatus}
                id={uploaded.id}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Upload className="text-brand-600 dark:text-brand-300 size-4" aria-hidden="true" />
                    Choose a file
                  </CardTitle>
                  <CardDescription>PDF or DOCX, up to 5 MB.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResumeUploader onUploadSuccess={setUploaded} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

function UploadSuccess({ originalName, extractionStatus, id }) {
  const parsed = extractionStatus === 'completed'

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-br from-brand-600 to-brand-500 flex flex-col items-center px-6 py-10 text-center text-white">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
          {parsed ? (
            <CheckCircle2 className="size-7" aria-hidden="true" />
          ) : (
            <FileCheck2 className="size-7" aria-hidden="true" />
          )}
        </span>
        <p className="mt-4 text-lg font-semibold">{parsed ? 'CV stored and parsed' : 'CV stored'}</p>
        <p className="mt-1 text-sm text-white/80" title={originalName}>
          <span className="inline-block max-w-xs truncate align-bottom">{originalName}</span>
        </p>
        {!parsed && (
          <p className="mt-3 max-w-sm text-xs leading-relaxed text-white/75">
            Text extraction could not be completed for this file. You can still view and manage it,
            and re-upload a text-based version when ready.
          </p>
        )}
      </div>

      <CardContent className="flex flex-col gap-3 px-6 py-7 sm:flex-row">
        <Button asChild variant="brand" size="lg" className="flex-1">
          <Link to={id ? `/resumes/${id}` : '/dashboard'}>
            <FileCheck2 className="size-4" />
            {parsed ? 'View extracted resume' : 'View resume'}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="flex-1">
          <Link to="/dashboard">
            <LayoutDashboard className="size-4" />
            Back to dashboard
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export default UploadResume