import dynamic from 'next/dynamic'
import type { Experiment } from '@/lib/experiments'

const TypoAnnote = dynamic(() => import('./annotation-engine/Component'))

export const typographyExperiments: Experiment[] = [
    {
        slug: 'typographic-annotation',
        title: 'Typographic Annotation',
        category: 'typography',
        date: 'April 2026',
        dateSort: '2026-04',
        description: 'Typographic annotation',
        component: TypoAnnote,
        contentPath: 'typography/annotation-engine/content.mdx'
    },
]