import type { Metadata } from 'next'
import { redirect }      from 'next/navigation'
import { simulationExperiments } from '@/experiments/simulation'

export const metadata: Metadata = {
    title: 'simulation',
}

export default function SimulationPage() {
    redirect(`/simulation/${simulationExperiments[0].slug}`)
}