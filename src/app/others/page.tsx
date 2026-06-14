import type { Metadata } from 'next'
import { redirect }      from 'next/navigation'
import { othersExperiments } from '@/experiments/others'

export const metadata: Metadata = {
    title: 'others',
}

export default function OthersPage() {
    redirect(`/others/${othersExperiments[0].slug}`)
}