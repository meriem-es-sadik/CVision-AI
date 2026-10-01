import { Target } from 'lucide-react'

import { PlaceholderPage } from '@/components/layout/PlaceholderPage'

export function JobMatcher() {
  return (
    <PlaceholderPage
      icon={Target}
      eyebrow="Job Matcher"
      title="Match your CV against any job description"
      description="Paste a posting to get a transparent match score with skills, experience, and education breakdowns plus the keywords you are missing."
    />
  )
}

export default JobMatcher
