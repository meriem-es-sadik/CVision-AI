import { Lock } from 'lucide-react'

import { PlaceholderPage } from '@/components/layout/PlaceholderPage'

export function Privacy() {
  return (
    <PlaceholderPage
      icon={Lock}
      eyebrow="Legal"
      title="Privacy policy"
      description="A plain-language explanation of what we store, how your CV is processed, and how to delete your data will be published here."
    />
  )
}

export default Privacy
