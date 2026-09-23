'use client'

import { useEffect, useRef } from 'react'

type Band = {
    color: [number, number, number]
    baseline: number
    amp: number
    thick: number
    freqX: number
    speed: number
    phase: number
}

type Props = {
    height?: number //in px
    cellSize?: number
    speed?: number
    intensity?: number
    cornerClearRadius?: number
    className?: string
}

const BANDS: Band[] = [
    {color: [0, 0, 238], baseline: 0.2, amp: 0.16, thick: 0.16, freqX: 0.006, speed: 0.55, phase: 0.0 },
    { color: [124, 92, 255], baseline: 0.42, amp: 0.2, thick: 0.2, freqX: 0.004, speed: 0.35, phase: 2.4 },
    { color: [58, 46, 246], baseline: 0.62, amp: 0.13, thick: 0.14, freqX: 0.008, speed: 0.7, phase: 4.6 },
]

// 8x8 Bayer matrix, normalized to 0..1 thresholds -- drives the ordered
// dithering that decides which pixels are on vs. fully absent. 😭
const RAW = [
    [0, 32, 8, 40, 2, 34, 10, 42],
    [48, 16, 56, 24, 50, 18, 58, 26],
    [12, 44, 4, 36, 14, 46, 6, 38],
    [60, 28, 52, 20, 62, 30, 54, 22],
    [3, 35, 11, 43, 1, 33, 9, 41],
    [51, 19, 59, 27, 49, 17, 57, 25],
    [15, 47, 7, 39, 13, 45, 5, 37],
    [63, 31, 55, 23, 61, 29, 53, 21],
]
const THRESHOLDS = RAW.map((row) => row.map((v) => (v + 0.5) / 64))

const smoothstep = (x: number) => {
    x = Math.max(0, Math.min(1, x))
    return x * x * (3 - 2 * x)
}

// on narrower vp, we scale the band height and corner clearance down together
const REFERENCE_WIDTH = 1200
const MIN_SCALE = 0.55
const getScale = (w: number) => Math.min(1, Math.max(MIN_SCALE, w / REFERENCE_WIDTH))

type Cell = {
    rect: SVGRectElement
    i: number
    j: number
    x: number
    y: number
    phase: number
    freq: number
}

export default function Aurora({
    height = 120,
    cellSize = 5,
    speed = 0.6,
    intensity = 0.85,
    cornerClearRadius = 450,
    className
}: Props) {
    const svgRef = useRef<SVGSVGElement>(null)
    const gridRef = useRef<SVGGElement>(null)

    useEffect(() => {
        const svg = svgRef.current
        const gGrid = gridRef.current
        if (!svg || !gGrid) return

        const NS = 'http://www.w3.org/2000/svg'
        let cells: Cell[] = []
        let rafId = 0
        let t = 0
        let last = performance.now()
        let resizeTimer: ReturnType<typeof setTimeout>
        let effectiveHeight = height
        let effectiveCornerRadius = cornerClearRadius

        function build() {
            const W = window.innerWidth
            const scale = getScale(W)
            effectiveHeight = height * scale
            effectiveCornerRadius = cornerClearRadius * scale

            svg!.setAttribute('viewBox', `0 0 ${W} ${effectiveHeight}`)
            svg!.style.height = `${effectiveHeight}px`

            while (gGrid!.firstChild) gGrid!.removeChild(gGrid!.firstChild)
            cells = []

            const cols = Math.ceil(W / cellSize)
            const rows = Math.ceil(effectiveHeight / cellSize)
            for (let j = 0; j < rows; j++) {
                for (let i = 0; i < cols; i++) {
                    const rect = document.createElementNS(NS, 'rect')
                    const s = cellSize * 0.68
                    const o = (cellSize - s) / 2
                    rect.setAttribute('x', (i * cellSize + o).toFixed(2))
                    rect.setAttribute('y', (j * cellSize + o).toFixed(2))
                    rect.setAttribute('width', s.toFixed(2))
                    rect.setAttribute('height', s.toFixed(2))
                    rect.setAttribute('opacity', '0')
                    gGrid!.appendChild(rect)
                    cells.push({ rect,
                        i,
                        j,
                        x: i * cellSize + cellSize / 2,
                        y: j * cellSize + cellSize / 2,
                        phase: Math.random() * Math.PI * 2,
                        freq: 0.6 + Math.random() * 1.2,
                    })
                }
            }
        }

        function frame(now: number) {
            const dt = Math.min(3, (now - last) / 16.67)
            last = now
            t += dt * speed * 0.02

            const W = Number(svg!.getAttribute('viewBox')!.split(' ')[2])

            for (const c of cells) {
                const xN = c.x / W
                const yN = c.y / effectiveHeight

                let best: Band | null = null
                let bestW = 0
                for (const band of BANDS) {
                    const center =
                        band.baseline +
                        Math.sin(c.x * band.freqX + t * band.speed + band.phase) * band.amp +
                        Math.sin(c.x * band.freqX * 2.3 - t * band.speed * 1.6 + band.phase) * band.amp * 0.35
                    const dist = (yN - center) / band.thick
                    const w = Math.exp(-(dist * dist))
                    if (w > bestW) {
                        bestW = w
                        best = band
                    }
                }

                if (!best || bestW < 0.02) {
                    c.rect.setAttribute('opacity', '0')
                    continue
                }

                const edgeFade = smoothstep(xN * 6) * smoothstep((1 - xN) * 6)
                const topFade = smoothstep(yN / 0.12)
                const bottomFade = 1 - smoothstep((yN - 0.55) / 0.35)

                // keep a clear radius around the top-right corner 4 the github icon 
                let cornerClear = 1
                if (effectiveCornerRadius > 0) {
                    const distToCorner = Math.hypot(W - c.x, c.y)
                    cornerClear = smoothstep(distToCorner / effectiveCornerRadius)
                }

                let v = Math.min(1, bestW * intensity) * edgeFade * topFade * bottomFade * cornerClear
                v += Math.sin(t * c.freq * 3 + c.phase) * 0.035

                const th = THRESHOLDS[c.j & 7][c.i & 7]
                if (v <= th) {
                    c.rect.setAttribute('opacity', '0')
                    continue
                }

                c.rect.setAttribute('fill', `rgb(${best.color.join(',')})`)
                c.rect.setAttribute('opacity', '0.92')
            }

            rafId = requestAnimationFrame(frame)
        }

        const onResize = () => {
            clearTimeout(resizeTimer)
            resizeTimer = setTimeout(build, 150)
        }

        build()
        rafId = requestAnimationFrame(frame)
        window.addEventListener('resize', onResize)

        return () => {
            cancelAnimationFrame(rafId)
            clearTimeout(resizeTimer)
            window.removeEventListener('resize', onResize)
        }
    }, [height, cellSize, speed, intensity, cornerClearRadius])

    return (
        <svg
            ref={svgRef}
            aria-hidden="true"
            className={className}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                width: '100vw',
                height,
                pointerEvents: 'none',
                zIndex: 0,
                display: 'block',
            }}
        >
            <g ref={gridRef} />
        </svg>
    )
}