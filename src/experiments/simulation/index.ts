import type { Experiment } from '@/lib/experiments'
import FallingLetter from './falling-letter/Component'
import ClothSimulation from './cloth/Component'
import DoublePendulumComponent from './double-pendulum/Component'


export const simulationExperiments: Experiment[] = [

    {
        slug: 'falling-letter',
        title: 'Falling Letter',
        category: 'simulation',
        date: 'April 2026',
        dateSort: '2026-04',
        description: 'Falling Letter',
        component: FallingLetter,
        contentPath: 'simulation/falling-letter/content.mdx',
    },
    {
        slug: 'cloth-simulation',
        title: 'Cloth Simulation',
        category: 'simulation',
        date: 'April 2026',
        dateSort: '2026-04',
        description: 'Verlet cloth mesh, drag to pull, press R to reset.',
        component: ClothSimulation,
        contentPath: 'simulation/cloth/content.mdx',
    },
    {
        slug: 'double-pendulum',
        title: 'Double Pendulum',
        category: 'simulation',
        date: 'March 2026',
        dateSort: '2026-03',
        description: 'RK4-integrated double pendulum rendered as SVG with zero re-renders.',
        component: DoublePendulumComponent,
        contentPath: 'simulation/double-pendulum/content.mdx',
    },
]