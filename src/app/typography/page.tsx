import type { Metadata } from 'next'
import { redirect }      from 'next/navigation'
import { typographyExperiments } from '@/experiments/typography'

export const metadata: Metadata = {
    title: 'typography',
}

export default function TypographyPage() {
    redirect(`/typography/${typographyExperiments[0].slug}`)
}