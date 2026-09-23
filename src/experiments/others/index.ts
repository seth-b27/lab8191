import dynamic from 'next/dynamic'
import type { Experiment } from '@/lib/experiments'

const FilmGrain = dynamic(() => import('./film-grain/Component'))

export const othersExperiments: Experiment[] = [
    {
        slug: 'film-grain',
        title: 'Film Grain',
        category: 'others',
        date: 'June 2026',
        dateSort: '2026-06',
        description: 'Animated film grain canvas overlay over a grayscale photo.',
        component: FilmGrain,
        contentPath: 'others/film-grain/content.mdx'
    },
]