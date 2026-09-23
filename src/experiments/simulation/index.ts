import dynamic from 'next/dynamic'
import type { Experiment } from '@/lib/experiments'

const FallingLetter = dynamic(() => import('./falling-letter/Component'))
const Cloth = dynamic(() => import('./cloth/Component'))
const DoublePendulum = dynamic(() => import('./double-pendulum/Component'))

export const simulationExperiments: Experiment[] = [
    {
        slug: 'falling-letter',
        title: 'Falling Letter',
        category: 'simulation',
        date: 'September 2025',
        dateSort: '2025-09',
        description: 'Falling Letter',
        component: FallingLetter,
        contentPath: 'simulation/falling-letter/content.mdx'
    },
    {
        slug: 'cloth-simulation',
        title: 'Cloth Simulation',
        category: 'simulation',
        date: 'September 2025',
        dateSort: '2025-09',
        description: 'Verlet cloth mesh',
        component: Cloth,
        contentPath: 'simulation/cloth/content.mdx'
    },
    {
        slug: 'double-pendulum',
        title: 'Double Pendulum',
        category: 'simulation',
        date: 'January 2026',
        dateSort: '2026-01',
        description: 'RK4-integrated double pendulum rendered as SVG with zero re-renders.',
        component: DoublePendulum,
        contentPath: 'simulation/double-pendulum/content.mdx'
    }
]