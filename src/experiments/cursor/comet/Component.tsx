'use client'

import { useEffect, useRef } from 'react'

const CONFIG = {
    tailLength: 32,
    headRadius: 6,
    lerpSpeed: 0.18,
    glowColor: '180,220,255',
    sparkCount: 3,
    maxSparks: 60,
    sparkThreshold: 0.8,
}

type Spark = {
    x: number; y: number
    vx: number; vy: number
    life: number; maxLife: number
    r: number
    active: boolean
}

export default function CursorComet() {
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        if (!containerRef.current || !canvasRef.current) return

        const container = containerRef.current as HTMLDivElement
        const canvas = canvasRef.current as HTMLCanvasElement
        const ctxRaw = canvas.getContext('2d')
        if (!ctxRaw) return

        const ctx = ctxRaw as CanvasRenderingContext2D

        function resize() {
            canvas.width = container.clientWidth
            canvas.height = container.clientHeight
        }
        resize()

        const resizeObserver = new ResizeObserver(resize)
        resizeObserver.observe(container)

        const tailX = new Float32Array(CONFIG.tailLength).fill(-999)
        const tailY = new Float32Array(CONFIG.tailLength).fill(-999)
        let tailHead = 0

        let hx = -999, hy = -999
        let prevHx = -999, prevHy = -999

        const sparks: Spark[] = []
        for (let i = 0; i < CONFIG.maxSparks; i++) {
            sparks.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, r: 0, active: false })
        }

        let sparkHead = 0
        function spawnSpark(x: number, y: number, velX: number, velY: number) {
            const s = sparks[sparkHead]
            sparkHead = (sparkHead + 1) % CONFIG.maxSparks

            s.x = x + (Math.random() - 0.5) * 4
            s.y = y + (Math.random() - 0.5) * 4


            const moveAngle = Math.atan2(velY, velX)
            const perp = moveAngle + Math.PI / 2
            const spread = (Math.random() - 0.5) * Math.PI * 0.8
            const spd = Math.random() * 1.8 + 0.4

            s.vx = Math.cos(perp + spread) * spd - velX * 0.15
            s.vy = Math.sin(perp + spread) * spd - velY * 0.15
            s.maxLife = Math.random() * 18 + 12   // 12–30 frames
            s.life = s.maxLife
            s.r = Math.random() * 1.8 + 0.6
            s.active = true
        }

        const cursor = { x: -999, y: -999 }
        let moved = false
        let rafId = 0

        function onMouseMove(e: MouseEvent) {
            const rect = container.getBoundingClientRect()
            cursor.x = e.clientX - rect.left
            cursor.y = e.clientY - rect.top

            if (!moved) {
                moved = true
                hx = cursor.x
                hy = cursor.y
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
            if (!moved) {
                moved = true
                hx = cursor.x
                hy = cursor.y
            }
        }

        container.addEventListener('mousemove', onMouseMove)
        container.addEventListener('touchmove', onTouchMove, { passive: true })
        container.addEventListener('touchstart', onTouchStart, { passive: true })

        function loop() {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            if (!moved) {
                ctx.fillStyle = '#888'
                ctx.font = '13px Arial, sans-serif'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText('Move your cursor here', canvas.width / 2, canvas.height / 2)
                rafId = requestAnimationFrame(loop)
                return
            }

            prevHx = hx; prevHy = hy
            hx += (cursor.x - hx) * CONFIG.lerpSpeed
            hy += (cursor.y - hy) * CONFIG.lerpSpeed

            const velX = hx - prevHx
            const velY = hy - prevHy
            const speed = Math.sqrt(velX * velX + velY * velY)

            tailX[tailHead] = hx
            tailY[tailHead] = hy
            tailHead = (tailHead + 1) % CONFIG.tailLength

            if (speed > CONFIG.sparkThreshold) {
                for (let i = 0; i < CONFIG.sparkCount; i++) {
                    spawnSpark(hx, hy, velX, velY)
                }
            }

            ctx.lineJoin = 'round'
            ctx.lineCap = 'round'

            for (let i = 0; i < CONFIG.tailLength - 1; i++) {
                const ai = (tailHead + i) % CONFIG.tailLength
                const bi = (tailHead + i + 1) % CONFIG.tailLength

                // Skip slots not yet written at startup
                if (tailX[ai] < -900 || tailX[bi] < -900) continue

                const frac = i / CONFIG.tailLength
                const alpha = frac * frac * 0.85  // quadratic fade
                const width = 1 + frac * (CONFIG.headRadius * 0.9)

                ctx.beginPath()
                ctx.moveTo(tailX[ai], tailY[ai])
                ctx.lineTo(tailX[bi], tailY[bi])
                ctx.strokeStyle = `rgba(${CONFIG.glowColor},${alpha.toFixed(2)})`
                ctx.lineWidth = width
                ctx.stroke()
            }


            for (let i = 0; i < sparks.length; i++) {
                const s = sparks[i]
                if (!s.active) continue

                s.x += s.vx
                s.y += s.vy
                s.vy += 0.04
                s.life--

                if (s.life <= 0) { s.active = false; continue }

                const progress = s.life / s.maxLife

                ctx.beginPath()
                ctx.arc(s.x, s.y, s.r * progress, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(${CONFIG.glowColor},${(progress * 0.9).toFixed(2)})`
                ctx.fill()
            }

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
    }, [])

    return (
        <div
            ref={containerRef}
            aria-label="Cursor comet interactive preview — move your cursor to see the comet trail"
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                minHeight: '320px',
                backgroundColor: '#1c1b1b',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                cursor: 'none',
            }}
        >
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    pointerEvents: 'none',
                }}
            />
        </div>
    )
}