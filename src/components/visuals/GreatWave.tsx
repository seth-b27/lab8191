'use client'

import { useEffect, useRef } from 'react'

type Props = {
    height?: number // in px
    cellSize?: number
    speed?: number
    crestHeight?: number // how tall the crest bump rises above the calm baseline
    peakXFrac?: number // 0 = crest at the left of the vp, 1 on the right
    color?: string
    className?: string
}

// 8x8 Bayer matrix, normalized to 0..1 threshold
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

// five claw strands fanning from the crest apex, radii spaced outward
const CLAWS = [18, 30, 42, 54, 66]
const CLAW_THICK = 6.5
const CLAW_RADIUS = 78
const APEX_OFFSET = 16
const A_START = -2.95
const A_END = -0.35

// on narrower vp, we scale the band height, crest height, and every claw dimension tgt
const REFERENCE_WIDTH = 1200
const MIN_SCALE = 0.55
const getScale = (w: number) => Math.min(1, Math.max(MIN_SCALE, w / REFERENCE_WIDTH))

type Cell = {
    rect: SVGRectElement
    i: number
    j: number
    x: number
    y: number
}

export default function GreatWave({
    height = 260,
    cellSize = 5,
    speed = 0.6,
    crestHeight = 45,
    peakXFrac = 0.85,
    color = 'rgb(0,0,238)',
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
        let W = 0
        let peakX = 0
        let rafId = 0
        let t = 0
        let last = performance.now()
        let resizeTimer: ReturnType<typeof setTimeout>

        // recomputed per build() from the current viewport width
        let effectiveHeight = height
        let effectiveCrestHeight = crestHeight
        let effectiveClaws = CLAWS
        let effectiveClawThick = CLAW_THICK
        let effectiveClawRadius = CLAW_RADIUS
        let effectiveApexOffset = APEX_OFFSET
        let baseline = height * 0.8

        function build() {
            W = window.innerWidth
            const scale = getScale(W)

            effectiveHeight = height * scale
            effectiveCrestHeight = crestHeight * scale
            effectiveClaws = CLAWS.map((r) => r * scale)
            effectiveClawThick = CLAW_THICK * scale
            effectiveClawRadius = CLAW_RADIUS * scale
            effectiveApexOffset = APEX_OFFSET * scale
            baseline = effectiveHeight * 0.8 // calm sea sits low, leaves the top mostly open

            svg!.setAttribute('viewBox', `0 0 ${W} ${effectiveHeight}`)
            svg!.style.height = `${effectiveHeight}px`
            peakX = W * peakXFrac

            while (gGrid!.firstChild) gGrid!.removeChild(gGrid!.firstChild)
            cells = []

            const cols = Math.ceil(W / cellSize)
            const rows = Math.ceil(effectiveHeight / cellSize)
            for (let j = 0; j < rows; j++) {
                for (let i = 0; i < cols; i++){
                    const rect = document.createElementNS(NS, 'rect')
                    const s = cellSize * 0.66
                    const o = (cellSize - s) / 2
                    rect.setAttribute('x', (i * cellSize + o).toFixed(2))
                    rect.setAttribute('y', (j* cellSize + o).toFixed(2))
                    rect.setAttribute('width', s.toFixed(2))
                    rect.setAttribute('height',s.toFixed(2))
                    rect.setAttribute('fill', color)
                    rect.setAttribute('opacity', '0')
                    gGrid!.appendChild(rect)
                    cells.push({ rect, i, j, x: i * cellSize + cellSize / 2, y: j * cellSize + cellSize / 2})
                }
            }
        }

        function surfaceY(x: number, crestAmt: number, tt: number) {
            const peakXt = peakX + Math.sin(tt * 0.25) * 8
            const bumpWidth = W * 0.085
            const bump = crestAmt * Math.exp(-Math.pow((x - peakXt) / bumpWidth, 2))
            const calm = Math.sin(x * 0.011 + tt) * 7 + Math.sin(x * 0.024 - tt * 1.3) * 3
            return { y: baseline + calm - bump, peakXt }
        }

        function frame(now: number) {
            const dt = Math.min(3, (now - last) / 16.67)
            last = now
            t += dt * speed * 0.02

            const { peakXt } = surfaceY(peakX, effectiveCrestHeight, t)
            const apexInfo = surfaceY(peakXt, effectiveCrestHeight, t)
            const apexX = peakXt
            const apexY = apexInfo.y - effectiveApexOffset // arcs originate just above the crest tip

            for (const c of cells) {
                const { y: wy } = surfaceY(c.x, effectiveCrestHeight, t)
                const depth = c.y - wy

                if (depth >= -18) {
                    // ---- sea body: binary dither w a soft feathered edge at the surface ----
                    const featherT = (depth + 18) / 36
                    const feather = smoothstep(featherT)
                    const th = THRESHOLDS[c.j & 7][c.i & 7]
                    let on = feather > th

                    // speckle knockout across the whole body: heavy near the surface (reads as foam), then fading to a light steady grain deep down
                    if (on) {
                        const knockoutProb = 0.1 + 0.3 * Math.exp(-Math.max(0, depth) / 45)
                        const th2 = THRESHOLDS[(c.j + 3) & 7][(c.i + 5) & 7]
                        if (th2 < knockoutProb) on = false
                    }

                    c.rect.setAttribute('opacity', on ? '0.92' : '0')
                    continue
                }

                // ---- above the local sea surface: only the curling claw exists here ----
                const dx = apexX - c.x
                const dy = c.y - apexY
                const rC = Math.hypot(dx, dy)
                if (rC > effectiveClawRadius) {
                    c.rect.setAttribute('opacity', '0')
                    continue
                }
                const angle = Math.atan2(dy, dx)
                if (angle < A_START || angle > A_END) {
                    c.rect.setAttribute('opacity', '0')
                    continue
                }

                let ring = 0
                for (const r of effectiveClaws) {
                    const d = Math.abs(rC - r)
                    ring = Math.max(ring, Math.exp(-Math.pow(d / effectiveClawThick, 2)))
                }
                const tt = (angle - A_START) / (A_END - A_START)
                const fray = 1 - smoothstep((tt - 0.68) / 0.32) // fingers fragment near the tip
                const intensity = ring * fray

                const th3 = THRESHOLDS[(c.j + 2) & 7][(c.i + 6) & 7]
                const on = intensity > th3 * 0.9
                c.rect.setAttribute('opacity', on ? '0.92' : '0')
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
    }, [height, cellSize, speed, crestHeight, peakXFrac, color])

    return (
        <svg
            ref={svgRef}
            aria-hidden="true"
            className={className}
            style={{
                position: 'fixed',
                left: 0,
                right: 0,
                bottom: 0,
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