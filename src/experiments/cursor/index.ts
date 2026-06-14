import type { Experiment } from '@/lib/experiments'

import PixelComponent from './pixel/Component'
import CursorComet from './comet/Component'
import CursorTrailFire from './trail-fire/Component'
import CursorPetal from './trail-petal/Component'
import CursorBubble from './buble/Component'
import CursorFluidBlob from './fluid-blob/Component'
import CursorLightningBolt from './lightning-bolt/Component'
import CursorImgTrail from './img-trail/Component'

export const cursorExperiments: Experiment[] = [
    {
        slug: 'pixel',
        title: 'Cursor Pixel',
        category: 'cursor',
        date: 'June 2026',
        dateSort: '2026-06',
        description: 'PICO-8 inspired pixel trail with click-to-scatter physics.',
        component: PixelComponent,
        contentPath: 'cursor/pixel/content.mdx',
    },
    {
        slug: 'cursor-comet',
        title: 'Cursor Comet',
        category: 'cursor',
        date: 'June 2026',
        dateSort: '2026-06',
        description: 'Comet trail cursor',
        component: CursorComet,
        contentPath: 'cursor/comet/content.mdx',
    },
    {
        slug: 'trail-fire',
        title: 'Trail Fire',
        category: 'cursor',
        date: 'June 2026',
        dateSort: '2026-06',
        description: 'Trail fire cursor',
        component: CursorTrailFire,
        contentPath: 'cursor/trail-fire/content.mdx',
    },
    {
        slug: 'trail-petal',
        title: 'Trail Petal',
        category: 'cursor',
        date: 'June 2026',
        dateSort: '2026-06',
        description: 'Trail petal cursor',
        component: CursorPetal,
        contentPath: 'cursor/trail-petal/content.mdx',
    },
    {
        slug: 'cursor-buble',
        title: 'Cursor Buble',
        category: 'cursor',
        date: 'June 2026',
        dateSort: '2026-06',
        description: 'Soap buble cursor',
        component: CursorBubble,
        contentPath: 'cursor/buble/content.mdx',
    },
    {
        slug: 'fluid-blob',
        title: 'Fluid Blob',
        category: 'cursor',
        date: 'June 2026',
        dateSort: '2026-06',
        description: 'Fluid blob cursor',
        component: CursorFluidBlob,
        contentPath: 'cursor/fluid-blob/content.mdx',
    },
    {
        slug: 'lightning-bolt',
        title: 'Lightning Bolt',
        category: 'cursor',
        date: 'June 2026',
        dateSort: '2026-06',
        description: 'Lightning bolt cursor',
        component: CursorLightningBolt,
        contentPath: 'cursor/lightning-bolt/content.mdx',
    },
    {
        slug: 'image-trail',
        title: 'Image Trail',
        category: 'cursor',
        date: 'June 2026',
        dateSort: '2026-06',
        description: 'Image trail cursor',
        component: CursorImgTrail,
        contentPath: 'cursor/img-trail/content.mdx',
    },
    
]