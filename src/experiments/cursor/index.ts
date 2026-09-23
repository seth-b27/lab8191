import dynamic from 'next/dynamic'
import type { Experiment } from '@/lib/experiments'

// so here, next/dynamic gives each experiment its own js chunk, loaded only when it's actually the active one. 
const Pixel = dynamic(() => import('./pixel/Component'))
const CursorTrailFire = dynamic(() => import('./trail-fire/Component'))
const CursorFluidBlob = dynamic(() => import('./fluid-blob/Component'))
const CursorImgTrail = dynamic(() => import('./img-trail/Component'))
const CrosshairRuler = dynamic(()=> import('./crosshair-ruler/Component'))

export const cursorExperiments: Experiment[] = [
    {
        slug: 'trail-fire',
        title: 'Trail Fire',
        category: 'cursor',
        date: 'December 2025',
        dateSort: '2025-05',
        description: 'Trail fire cursor',
        component: CursorTrailFire,
        contentPath: 'cursor/trail-fire/content.mdx'
    },
    {
        slug: 'fluid-blob',
        title: 'Fluid Blob',
        category: 'cursor',
        date: 'December 2025',
        dateSort: '2025-05',
        description: 'Fluid blob cursor',
        component: CursorFluidBlob,
        contentPath: 'cursor/fluid-blob/content.mdx'
    },
    {
        slug: 'pixel',
        title: 'Cursor Pixel',
        category: 'cursor',
        date: 'December 2025',
        dateSort: '2025-05',
        description: 'PICO-8 inspired pixel trail with click-to-scatter physics.',
        component: Pixel,
        contentPath: 'cursor/pixel/content.mdx'
    },
    {
        slug: 'crosshair',
        title: 'Cross Hair',
        category: 'cursor',
        date: 'December 2025',
        dateSort: '2025-05',
        description: 'Cross hair ruler',
        component: CrosshairRuler,
        contentPath: 'cursor/crosshair-ruler/content.mdx'
    },
    {
        slug: 'image-trail',
        title: 'Image Trail',
        category: 'cursor',
        date: 'December 2025',
        dateSort: '2025-05',
        description: 'Image trail cursor',
        component: CursorImgTrail,
        contentPath: 'cursor/img-trail/content.mdx'
    }
]
