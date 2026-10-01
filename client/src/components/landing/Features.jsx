import { motion } from 'framer-motion'
import {
  BrainCircuit,
  Gauge,
  History,
  Lightbulb,
  Tags,
  Target,
} from 'lucide-react'

import { FeatureCard } from '@/components/landing/FeatureCard'
import { SectionHeading } from '@/components/magicui/Reveal'
import { staggerItem } from '@/constants/motion'

const FEATURES = [
  {
    icon: BrainCircuit,
    title: 'AI CV Analysis',
    description: 'Analyze your CV and identify strengths and improvement areas.',
  },
  {
    icon: Gauge,
    title: 'CV Score',
    description: 'Get a transparent score based on important CV sections.',
  },
  {
    icon: Tags,
    title: 'Skill Detection',
    description: 'Extract and organize technical and professional skills.',
  },
  {
    icon: Target,
    title: 'Job Matching',
    description: 'Compare your CV with job descriptions.',
  },
  {
    icon: Lightbulb,
    title: 'Smart Recommendations',
    description: 'Get actionable suggestions to improve your CV.',
  },
  {
    icon: History,
    title: 'Resume History',
    description: 'Keep track of previous CV versions and analyses.',
  },
]

export function Features() {
  return (
    <section id="features" className="relative scroll-mt-24 py-20 sm:py-24 lg:py-28">
      <div
        aria-hidden="true"
        className="bg-dot-pattern pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 opacity-30 [mask-image:linear-gradient(to_bottom,#000,transparent)]"
      />

      <div className="container-page">
        <SectionHeading
          eyebrow="Features"
          title="Everything you need to improve your CV"
          description="From a transparent score to keyword-level job matching, CVision AI turns a wall of text into a clear, prioritised plan of action."
        />

        <motion.div
          className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px 0px -80px 0px' }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
        >
          {FEATURES.map((feature) => (
            <motion.div key={feature.title} variants={staggerItem} className="h-full">
              <FeatureCard {...feature} className="h-full" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default Features
