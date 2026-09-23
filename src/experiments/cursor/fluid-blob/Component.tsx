'use client'
import { useEffect, useRef } from 'react'

export interface CursorFluidBlobProps {
    points?: number
    baseRadius?: number
    lerpPos?: number
    lerpRadius?: number
    stretchAmt?: number
    wobbleAmt?: number
    wobbleSpeed?: number
    color?: string
    trailCount?: number
}

type Point = { x: number; y: number }

const DEFAULTS = {
    points: 8,
    baseRadius: 28,
    lerpPos: 0.10,
    lerpRadius: 0.18,
    stretchAmt: 0.55,
    wobbleAmt: 2.2,
    wobbleSpeed: 0.055,
    color: '90,50,210',
    trailCount: 6
}

export default function CursorFluidBlob({
    points = DEFAULTS.points,
    baseRadius = DEFAULTS.baseRadius,
    lerpPos = DEFAULTS.lerpPos,
    lerpRadius = DEFAULTS.lerpRadius,
    stretchAmt = DEFAULTS.stretchAmt,
    wobbleAmt = DEFAULTS.wobbleAmt,
    wobbleSpeed = DEFAULTS.wobbleSpeed,
    color = DEFAULTS.color,
    trailCount = DEFAULTS.trailCount,
}: CursorFluidBlobProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        if (!containerRef.current || !canvasRef.current) return;

        const container = containerRef.current as HTMLDivElement
        const canvas = canvasRef.current as HTMLCanvasElement
        const ctxRaw = canvas.getContext('2d')
        if (!ctxRaw) return
        const ctx = ctxRaw

        //  Resize canvas to container 
        function resize() {
            canvas.width = container.clientWidth
            canvas.height = container.clientHeight
        }
        resize()

        const resizeObserver = new ResizeObserver(resize)
        resizeObserver.observe(container)

        let bx = -999, by = -999
        let prevBx = -999, prevBy = -999

        const pointR = new Float32Array(points).fill(baseRadius)
        const pointPhase = new Float32Array(points)
        for (let i = 0; i < points; i++) {
            pointPhase[i] = (Math.PI * 2 / points) * i * 3.1  // prime multiplier spreads phases
        }

        const trailX = new Float32Array(trailCount).fill(-999)
        const trailY = new Float32Array(trailCount).fill(-999)

        let trailHead = 0
        let time = 0
        let rafId = 0
        const cursor = {x: -999, y: -999}
        let moved = false

        function onMouseMove(e: MouseEvent) {
            const rect = container.getBoundingClientRect()
            cursor.x = e.clientX - rect.left
            cursor.y = e.clientY - rect.top

            if (!moved) {
                moved = true
                // snap blob to cursor on first move
                bx = cursor.x
                by = cursor.y
            }
        }

        function onTouchMove(e: TouchEvent) {
            const rect = container.getBoundingClientRect()
            cursor.x = e.touches[0].clientX - rect.left
            cursor.y = e.touches[0].clientY - rect.top
        }

        function onTouchStart(e: TouchEvent) {
            const rect = container.getBoundingClientRect()
            cursor.x = e.touches[0].clientX - rect.left
            cursor.y = e.touches[0].clientY - rect.top
            bx = cursor.x
            by = cursor.y
            moved = true
        }

        container.addEventListener('mousemove', onMouseMove)
        container.addEventListener('touchmove', onTouchMove, { passive: true })
        container.addEventListener('touchstart', onTouchStart, { passive: true })

        function loop() {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Optional placeholder shown before the first interaction.  
            // u may remove this block if u don't want a hint on an empty canvas
            if (!moved) {
                ctx.fillStyle = '#888'
                ctx.font  = '13px Geist, sans-serif'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText('Move your cursor here', canvas.width / 2, canvas.height / 2)
                rafId = requestAnimationFrame(loop)
                return
            }

            time += wobbleSpeed
            prevBx = bx; prevBy = by
            bx += (cursor.x - bx) * lerpPos
            by += (cursor.y - by) * lerpPos

            const velX = bx - prevBx
            const velY = by - prevBy
            const speed= Math.sqrt(velX * velX + velY * velY)
            const moveAngle = Math.atan2(velY, velX)

            const stretch = Math.min(speed * stretchAmt, 16)
            const stretchX = 1 + stretch / baseRadius
            const stretchY = 1 - (stretch / baseRadius) * 0.5

            trailX[trailHead] = bx
            trailY[trailHead] = by
            trailHead = (trailHead + 1) % trailCount

            for (let i = 0; i < points; i++) {
                pointPhase[i] += 0.04 + i * 0.003  // each point at slightly different rate
                const wobbled = baseRadius + Math.sin(pointPhase[i] + time) * wobbleAmt
                pointR[i] += (wobbled - pointR[i]) * lerpRadius
            }

            for (let t = 0; t < trailCount; t++) {
                const idx = (trailHead + t) % trailCount
                const tx = trailX[idx]
                const ty = trailY[idx]

                if (tx < -900) continue 

                const frac = t / trailCount  // 0 = oldest, 1 = newest
                const alpha = frac * 0.15 // oldest ~0, newest ~0.15
                const scale = 0.55 + frac * 0.45 // oldest 55% size, newest 100%

                // Build perimeter points
                const pts: Point[] = []
                for (let i = 0; i < points; i++) {
                    const a = (Math.PI * 2 / points) * i - Math.PI / 2
                    pts.push({ x: Math.cos(a) * pointR[i], y: Math.sin(a) * pointR[i] })
                }

                ctx.save()
                ctx.translate(tx, ty)
                ctx.scale(scale, scale)
                ctx.globalAlpha = alpha

                ctx.beginPath()
                for (let i = 0; i < points; i++) {
                    const prev = pts[(i - 1 + points) % points]
                    const cur = pts[i]
                    const next = pts[(i + 1) % points]
                    const next2 = pts[(i + 2) % points]
                    const cp1x = cur.x + (next.x - prev.x) * 0.18
                    const cp1y = cur.y + (next.y - prev.y) * 0.18
                    const cp2x = next.x - (next2.x - cur.x) * 0.18
                    const cp2y = next.y - (next2.y - cur.y) * 0.18
                    if (i === 0) ctx.moveTo(cur.x, cur.y)
                    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, next.x, next.y)
                }
                ctx.closePath()
                ctx.fillStyle = `rgb(${color})`
                ctx.fill()
                ctx.restore()
            }

            ctx.save()
            ctx.translate(bx, by)
            ctx.rotate(moveAngle)
            ctx.scale(stretchX, stretchY)
            ctx.rotate(-moveAngle)

            // Build perimeter points
            const pts: Point[] = []
            for (let i = 0; i < points; i++) {
                const a = (Math.PI * 2 / points) * i - Math.PI / 2
                pts.push({ x: Math.cos(a) * pointR[i], y: Math.sin(a) * pointR[i] })
            }

            // Build smooth bezier path
            ctx.beginPath()
            for (let i = 0; i < points; i++) {
                const prev = pts[(i - 1 + points) % points]
                const cur = pts[i]
                const next = pts[(i + 1) % points]
                const next2 = pts[(i + 2) % points]
                const cp1x = cur.x  + (next.x  - prev.x) * 0.18
                const cp1y = cur.y  + (next.y  - prev.y) * 0.18
                const cp2x = next.x - (next2.x - cur.x) * 0.18
                const cp2y = next.y - (next2.y - cur.y) * 0.18
                if (i === 0) ctx.moveTo(cur.x, cur.y)
                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, next.x, next.y)
            }
            ctx.closePath()

            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, baseRadius * 1.5)
            grad.addColorStop(0, `rgba(${color},0.95)`)
            grad.addColorStop(0.55,`rgba(${color},0.78)`)
            grad.addColorStop(1, `rgba(${color},0.0)`)
            ctx.fillStyle = grad
            ctx.fill()

            ctx.beginPath()
            ctx.arc(-baseRadius * 0.22, -baseRadius * 0.22, baseRadius * 0.28, 0, Math.PI * 2)
            ctx.fillStyle = 'rgba(255,255,255,0.20)'
            ctx.fill()

            ctx.restore()

            rafId = requestAnimationFrame(loop)
        }

        loop()

        return () => {
            cancelAnimationFrame(rafId)
            resizeObserver.disconnect()
            container.removeEventListener('mousemove', onMouseMove)
            container.removeEventListener('touchmove', onTouchMove)
            container.removeEventListener('touchstart', onTouchStart)
        }
    }, [points, baseRadius, lerpPos, lerpRadius, stretchAmt, wobbleAmt, wobbleSpeed, color, trailCount])

    return (
        <div
            ref={containerRef}
            aria-label="Cursor fluid blob"
            style={{
                position:'relative',
                width: '100%',
                height: '100%',
                minHeight: '380px',
                backgroundColor: '#ECEBE7',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                cursor: 'none',
                touchAction: 'none'
            }}
        >
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    pointerEvents: 'none'
                }}
            />
        </div>
    )
}
