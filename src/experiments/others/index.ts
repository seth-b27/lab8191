import type { Experiment } from '@/lib/experiments'
import FilmGrainComponent from './film-grain/Component'

export const othersExperiments: Experiment[] = [
    {
        slug: 'film-grain',
        title: 'Film Grain',
        category: 'others',
        date: 'March 2026',
        dateSort: '2026-03',
        description: 'Animated film grain canvas overlay over a grayscale architecture photo.',
        component: FilmGrainComponent,
        contentPath: 'others/film-grain/content.mdx',
    },
]