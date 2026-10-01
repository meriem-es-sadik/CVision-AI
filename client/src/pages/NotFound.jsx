import { Compass } from 'lucide-react'

import { PlaceholderPage } from '@/components/layout/PlaceholderPage'

export function NotFound() {
  return (
    <PlaceholderPage
      icon={Compass}
      eyebrow="404"
      title="We could not find that page"
      description="The page you are looking for does not exist or has been moved."
    />
  )
}

export default NotFound
