import { ScrollText } from 'lucide-react'

import { PlaceholderPage } from '@/components/layout/PlaceholderPage'

export function Terms() {
  return (
    <PlaceholderPage
      icon={ScrollText}
      eyebrow="Legal"
      title="Terms of service"
      description="The terms covering acceptable use, data processing, and service availability will be published here."
    />
  )
}

export default Terms
