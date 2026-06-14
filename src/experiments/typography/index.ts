import type { Experiment } from '@/lib/experiments'
import TypographicAnnotationEngine from './annotation-engine/Component'

export const typographyExperiments: Experiment[] = [
    {
        slug: 'typographic-annotation',
        title: 'Typographic Annotation',
        category: 'typography',
        date: 'April 2026',
        dateSort: '2026-04',
        description: 'Type to see live cap-height, baseline, and space annotations in SVG.',
        component: TypographicAnnotationEngine,
        contentPath: 'typography/annotation-engine/content.mdx',
    },
]