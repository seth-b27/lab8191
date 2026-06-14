'use client'

import { useEffect, useRef } from 'react'

const CONFIG = {
    radius: 26,
    lerpSpeed: 0.09,
    wobblePoints: 8,
    wobbleAmt: 2.8,
    wobbleSpeed: 0.048,
    stretchAmt: 0.45,
    popParticles: 22,
    popRingCount: 2,
}

const COLOR: [number, number, number] = [120, 200, 255]

const N = CONFIG.wobblePoints
type PopParticle = {
    x: number; y: number
    vx: number; vy: number
    life: number; maxLife: number
    r: number
    active: boolean
}

type PopRing = {
    x: number; y: number
    r: number
    life: number
    active: boolean
}


function buildBlobPath(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radii: Float32Array,
    scaleX: number,
    scaleY: number,
    angle: number,
) {
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(angle)
    ctx.scale(scaleX, scaleY)
    ctx.rotate(-angle)

    const pts: { x: number; y: number }[] = []
    for (let i = 0; i < N; i++) {
        const a = (Math.PI * 2 / N) * i - Math.PI / 2
        pts.push({
            x: Math.cos(a) * radii[i],
            y: Math.sin(a) * radii[i],
        })
    }

    const TENSION = 0.18
    ctx.beginPath()
    for (let i = 0; i < N; i++) {
        const pr = pts[(i - 1 + N) % N]
        const cu = pts[i]
        const nx = pts[(i + 1) % N]
        const n2 = pts[(i + 2) % N]

        const c1x = cu.x + (nx.x - pr.x) * TENSION
        const c1y = cu.y + (nx.y - pr.y) * TENSION
        const c2x = nx.x - (n2.x - cu.x) * TENSION
        const c2y = nx.y - (n2.y - cu.y) * TENSION

        if (i === 0) ctx.moveTo(cu.x, cu.y)
        ctx.bezierCurveTo(c1x, c1y, c2x, c2y, nx.x, nx.y)
    }
    ctx.closePath()
    // ctx.restore() called by caller after fill/stroke
}

export default function CursorBubble() {
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        if (!containerRef.current || !canvasRef.current) return

        const container = containerRef.current as HTMLDivElement
        const canvas = canvasRef.current as HTMLCanvasElement
        const ctxRaw = canvas.getContext('2d')
        if (!ctxRaw) return
        const ctx = ctxRaw

        function resize() {
            canvas.width = container.clientWidth
            canvas.height = container.clientHeight
        }
        resize()

        const resizeObserver = new ResizeObserver(resize)
        resizeObserver.observe(container)

        //  Bubble state 
        let bx = -999, by = -999
        let prevBx = -999, prevBy = -999

        const phases = new Float32Array(N)
        for (let i = 0; i < N; i++) {
            phases[i] = (Math.PI * 2 / N) * i * 2.3
        }

        const pointR = new Float32Array(N).fill(CONFIG.radius)

        let time = 0
        let popped = false
        let popTimer = 0

        const particles: PopParticle[] = []
        for (let i = 0; i < CONFIG.popParticles; i++) {
            particles.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, r: 0, active: false })
        }
        let popHead = 0

        //  Pop ring pool ─
        const rings: PopRing[] = []
        for (let i = 0; i < 4; i++) {
            rings.push({ x: 0, y: 0, r: 0, life: 0, active: false })
        }
        let popRingHead = 0

        function triggerPop(x: number, y: number) {
            if (popped) return
            popped = true
            popTimer = 42

            for (let i = 0; i < CONFIG.popParticles; i++) {
                const p = particles[popHead]
                popHead = (popHead + 1) % CONFIG.popParticles

                const angle = (Math.PI * 2 / CONFIG.popParticles) * i
                    + Math.random() * 0.4
                const spd = Math.random() * 3.5 + 1.5

                p.x = x; p.y = y
                p.vx = Math.cos(angle) * spd
                p.vy = Math.sin(angle) * spd
                p.maxLife = Math.random() * 20 + 15
                p.life = p.maxLife
                p.r = Math.random() * 3 + 1
                p.active = true
            }

            for (let i = 0; i < CONFIG.popRingCount; i++) {
                const r = rings[popRingHead]
                popRingHead = (popRingHead + 1) % rings.length
                r.x = x; r.y = y
                r.r = i * 8 + 2
                r.life = 1.0
                r.active = true
            }
        }

        const cursor = { x: -999, y: -999 }
        let moved = false
        let rafId = 0

        //  event handlers 
        function onMouseMove(e: MouseEvent) {
            const rect = container.getBoundingClientRect()
            if (!moved) {
                moved = true
                bx = e.clientX - rect.left
                by = e.clientY - rect.top
                pointR.fill(CONFIG.radius)
            }
            cursor.x = e.clientX - rect.left
            cursor.y = e.clientY - rect.top
        }

        function onClick(e: MouseEvent) {
            const rect = container.getBoundingClientRect()
            triggerPop(e.clientX - rect.left, e.clientY - rect.top)
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
                bx = cursor.x; by = cursor.y
                pointR.fill(CONFIG.radius)
            } else {
                triggerPop(cursor.x, cursor.y)
            }
        }

        container.addEventListener('mousemove', onMouseMove)
        container.addEventListener('click', onClick)
        container.addEventListener('touchmove', onTouchMove, { passive: true })
        container.addEventListener('touchstart', onTouchStart, { passive: true })

        function loop() {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            if (!moved) {
                ctx.fillStyle = '#888'
                ctx.font = '13px Arial, sans-serif'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText('Move cursor — click to pop the bubble', canvas.width / 2, canvas.height / 2)
                rafId = requestAnimationFrame(loop)
                return
            }

            time += CONFIG.wobbleSpeed

            // 1. Move bubble centre toward cursor
            prevBx = bx; prevBy = by
            bx += (cursor.x - bx) * CONFIG.lerpSpeed
            by += (cursor.y - by) * CONFIG.lerpSpeed

            // 2. Squash / stretch from velocity
            const velX = bx - prevBx
            const velY = by - prevBy
            const mAngle = Math.atan2(velY, velX)
            const str = Math.min(Math.sqrt(velX * velX + velY * velY) * CONFIG.stretchAmt, 14)
            const scaleX = 1 + str / CONFIG.radius
            const scaleY = 1 - (str / CONFIG.radius) * 0.5

            // 3. Update perimeter wobble radii
            for (let i = 0; i < N; i++) {
                phases[i] += 0.038 + i * 0.004
                const wobbled = CONFIG.radius + Math.sin(phases[i] + time) * CONFIG.wobbleAmt
                pointR[i] += (wobbled - pointR[i]) * 0.16
            }

            // 4. Pop timer
            if (popped) {
                popTimer--
                if (popTimer <= 0) {
                    popped = false
                    pointR.fill(CONFIG.radius * 0.1)
                }
            }

            // 5. Draw pop particles
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i]
                if (!p.active) continue
                p.x += p.vx
                p.y += p.vy
                p.vy += 0.08
                p.vx *= 0.97
                p.life--
                if (p.life <= 0) { p.active = false; continue }
                const prog = p.life / p.maxLife
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.r * prog, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(${COLOR[0]},${COLOR[1]},${COLOR[2]},${prog.toFixed(2)})`
                ctx.fill()
            }

            // 6. Draw pop rings
            for (let i = 0; i < rings.length; i++) {
                const r = rings[i]
                if (!r.active) continue
                r.r += 5
                r.life -= 0.06
                if (r.life <= 0) { r.active = false; continue }
                ctx.beginPath()
                ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2)
                ctx.strokeStyle = `rgba(${COLOR[0]},${COLOR[1]},${COLOR[2]},${(r.life * 0.5).toFixed(2)})`
                ctx.lineWidth = 1.2
                ctx.stroke()
            }

            // 7. Draw the bubble
            if (!popped) {
                const colorAngle = time * 1.2
                const R = CONFIG.radius
                const gx1 = bx + Math.cos(colorAngle) * R
                const gy1 = by + Math.sin(colorAngle) * R
                const gx2 = bx + Math.cos(colorAngle + Math.PI) * R
                const gy2 = by + Math.sin(colorAngle + Math.PI) * R

                const [r, g, b] = COLOR

                // Layer 1 — base membrane
                buildBlobPath(ctx, bx, by, pointR, scaleX, scaleY, mAngle)
                ctx.fillStyle = `rgba(${r},${g},${b},0.06)`
                ctx.fill()
                ctx.restore()

                // Layer 2 — iridescent fill
                buildBlobPath(ctx, bx, by, pointR, scaleX, scaleY, mAngle)
                const fillGrad = ctx.createLinearGradient(gx1, gy1, gx2, gy2)
                fillGrad.addColorStop(0, `rgba(${r},${g},${b},0.18)`)
                fillGrad.addColorStop(0.5, `rgba(${r},${g},${b},0.12)`)
                fillGrad.addColorStop(1, `rgba(${r},${g},${b},0.18)`)
                ctx.fillStyle = fillGrad
                ctx.fill()
                ctx.restore()

                // Layer 3 — iridescent wall stroke
                buildBlobPath(ctx, bx, by, pointR, scaleX, scaleY, mAngle)
                const edgeGrad = ctx.createLinearGradient(gx1, gy1, gx2, gy2)
                edgeGrad.addColorStop(0, `rgba(${r},${g},${b},0.55)`)
                edgeGrad.addColorStop(0.5, `rgba(${r},${g},${b},0.40)`)
                edgeGrad.addColorStop(1, `rgba(${r},${g},${b},0.55)`)
                ctx.strokeStyle = edgeGrad
                ctx.lineWidth = 1.2
                ctx.stroke()
                ctx.restore()

                // Layer 4 — specular highlights
                ctx.save()
                ctx.translate(bx, by)

                ctx.beginPath()
                ctx.ellipse(
                    -R * 0.30, -R * 0.32,
                    R * 0.22, R * 0.13,
                    -Math.PI * 0.3,
                    0, Math.PI * 2,
                )
                ctx.fillStyle = 'rgba(255,255,255,0.55)'
                ctx.fill()

                ctx.beginPath()
                ctx.arc(-R * 0.12, -R * 0.42, R * 0.07, 0, Math.PI * 2)
                ctx.fillStyle = 'rgba(255,255,255,0.40)'
                ctx.fill()

                ctx.restore()
            }

            rafId = requestAnimationFrame(loop)
        }

        loop()

        return () => {
            cancelAnimationFrame(rafId)
            resizeObserver.disconnect()
            container.removeEventListener('mousemove', onMouseMove)
            container.removeEventListener('click', onClick)
            container.removeEventListener('touchmove', onTouchMove)
            container.removeEventListener('touchstart', onTouchStart)
        }
    }, [])

    return (
        <div
            ref={containerRef}
            aria-label="Cursor soap bubble interactive preview — move your cursor, click to pop"
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