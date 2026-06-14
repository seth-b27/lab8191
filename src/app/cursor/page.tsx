import type { Metadata } from 'next'
import { redirect }      from 'next/navigation'
import { cursorExperiments } from '@/experiments/cursor'

export const metadata: Metadata = {
    title: 'cursor',
}

export default function CursorPage() {
    redirect(`/cursor/${cursorExperiments[0].slug}`)
}