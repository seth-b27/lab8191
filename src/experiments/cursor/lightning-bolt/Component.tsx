'use client'

import { useEffect, useRef } from 'react'

const CONFIG = {
    anchorCount: 6,
    boltColor: '180,210,255',
    coreColor: '240,250,255',
    glowColor: '100,160,255',
    autoInterval: 35,
    boltLife: 10,
    subdivDepth: 4,
    branchChance: 0.45,
    branchDepth: 2,
    jaggedness: 0.42,
    boltMax: 12,
    strikeParticles: 14,
    particleMax: 80,
}

type BoltPoint = { x: number; y: number; _branch?: BoltPoint[] }

type Bolt = {
    pts: BoltPoint[]
    life: number
    maxLife: number
    isClik: boolean
    active: boolean
}

type Particle = {
    x: number; y: number
    vx: number; vy: number
    life: number; maxLife: number
    r: number
    active: boolean
}

export default function CursorLightningBolt() {
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

        const resizeObserver = new ResizeObserver(() => {
            resize()
            rebuildAnchors()
        })
        resizeObserver.observe(container)

        const anchors: { x: number; y: number }[] = []

        function rebuildAnchors() {
            anchors.length = 0
            const W = canvas.width, H = canvas.height
            for (let i = 0; i < CONFIG.anchorCount; i++) {
                anchors.push({
                    x: 40 + Math.random() * (W - 80),
                    y: 40 + Math.random() * (H - 80),
                })
            }
        }
        rebuildAnchors()

        const boltPool: Bolt[] = []
        for (let i = 0; i < CONFIG.boltMax; i++) {
            boltPool.push({ pts: [], life: 0, maxLife: 0, isClik: false, active: false })
        }
        let boltPoolHead = 0

        const particles: Particle[] = []
        for (let i = 0; i < CONFIG.particleMax; i++) {
            particles.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, r: 0, active: false })
        }
        let partHead = 0

        function spawnParticles(x: number, y: number) {
            for (let i = 0; i < CONFIG.strikeParticles; i++) {
                const p = particles[partHead]
                partHead = (partHead + 1) % CONFIG.particleMax
                const a = Math.random() * Math.PI * 2
                const spd = Math.random() * 3 + 1
                p.x = x; p.y = y
                p.vx = Math.cos(a) * spd
                p.vy = Math.sin(a) * spd
                p.maxLife = Math.random() * 16 + 8
                p.life = p.maxLife
                p.r = Math.random() * 2 + 0.8
                p.active = true
            }
        }

        function midpointDisplace(
            x1: number, y1: number,
            x2: number, y2: number,
            depth: number,
            pts: BoltPoint[],
            allowBranch: boolean,
        ) {
            if (depth === 0) {
                pts.push({ x: x2, y: y2 })
                return
            }

            const mx = (x1 + x2) * 0.5
            const my = (y1 + y2) * 0.5
            const dx = x2 - x1, dy = y2 - y1
            const len = Math.sqrt(dx * dx + dy * dy) || 1

            const perpX = -dy / len
            const perpY = dx / len

            const offset = (Math.random() - 0.5) * len * CONFIG.jaggedness
            const jx = mx + perpX * offset
            const jy = my + perpY * offset

            midpointDisplace(x1, y1, jx, jy, depth - 1, pts, allowBranch)

            if (allowBranch && depth === CONFIG.branchDepth && Math.random() < CONFIG.branchChance) {
                const branchLen = len * 0.45
                const segAngle = Math.atan2(dy, dx)
                const branchAngle = segAngle + (Math.random() - 0.5) * 1.2
                const bx2 = jx + Math.cos(branchAngle) * branchLen
                const by2 = jy + Math.sin(branchAngle) * branchLen

                const bPts: BoltPoint[] = [{ x: jx, y: jy }]
                midpointDisplace(jx, jy, bx2, by2, depth - 2, bPts, false)

                if (pts.length > 0) {
                    pts[pts.length - 1]._branch = bPts
                }
            }

            midpointDisplace(jx, jy, x2, y2, depth - 1, pts, allowBranch)
        }

        function spawnBolt(x1: number, y1: number, x2: number, y2: number, isClick: boolean) {
            const b = boltPool[boltPoolHead]
            boltPoolHead = (boltPoolHead + 1) % CONFIG.boltMax

            b.pts = [{ x: x1, y: y1 }]
            midpointDisplace(x1, y1, x2, y2, CONFIG.subdivDepth, b.pts, true)
            b.maxLife = CONFIG.boltLife + (isClick ? 6 : 0)
            b.life = b.maxLife
            b.isClik = isClick
            b.active = true

            if (isClick) spawnParticles(x2, y2)
        }

        function drawBoltPath(pts: BoltPoint[], alpha: number, width: number) {
            if (pts.length < 2) return

            ctx.beginPath()
            ctx.moveTo(pts[0].x, pts[0].y)
            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)

            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'

            ctx.strokeStyle = `rgba(${CONFIG.glowColor},${(alpha * 0.18).toFixed(2)})`
            ctx.lineWidth = width * 7
            ctx.stroke()

            ctx.strokeStyle = `rgba(${CONFIG.boltColor},${(alpha * 0.55).toFixed(2)})`
            ctx.lineWidth = width * 2
            ctx.stroke()

            ctx.strokeStyle = `rgba(${CONFIG.coreColor},${(alpha * 0.95).toFixed(2)})`
            ctx.lineWidth = width * 0.8
            ctx.stroke()

            for (let i = 0; i < pts.length; i++) {
                if (pts[i]._branch) {
                    drawBoltPath(pts[i]._branch!, alpha * 0.5, width * 0.5)
                }
            }
        }

        const cursor = { x: -999, y: -999 }
        let moved = false
        let frameN = 0
        let rafId = 0

        function onMouseMove(e: MouseEvent) {
            const rect = container.getBoundingClientRect()
            cursor.x = e.clientX - rect.left
            cursor.y = e.clientY - rect.top
            if (!moved) moved = true
        }

        function onClick(e: MouseEvent) {
            if (!moved) return
            const rect = container.getBoundingClientRect()
            const cx = e.clientX - rect.left
            const cy = e.clientY - rect.top
            anchors.forEach(a => spawnBolt(cx, cy, a.x, a.y, true))
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
            } else {
                anchors.forEach(a => spawnBolt(cursor.x, cursor.y, a.x, a.y, true))
            }
        }

        container.addEventListener('mousemove', onMouseMove)
        container.addEventListener('click', onClick)
        container.addEventListener('touchmove', onTouchMove, { passive: true })
        container.addEventListener('touchstart', onTouchStart, { passive: true })

        function loop() {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            if (!moved) {
                ctx.fillStyle = '#1a2030'
                ctx.font = '13px Arial, sans-serif'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText('Move cursor — click to strike all anchors', canvas.width / 2, canvas.height / 2)
                rafId = requestAnimationFrame(loop)
                return
            }

            frameN++

            // 1. Auto-bolt to nearest anchor
            if (cursor.x > -900 && frameN % CONFIG.autoInterval === 0) {
                let best: { x: number; y: number } | null = null
                let bestD = Infinity
                anchors.forEach(a => {
                    const d = Math.hypot(cursor.x - a.x, cursor.y - a.y)
                    if (d < bestD) { bestD = d; best = a }
                })
                if (best) spawnBolt(cursor.x, cursor.y, (best as { x: number; y: number }).x, (best as { x: number; y: number }).y, false)
            }

            // 2. Draw anchor dots
            ctx.fillStyle = `rgba(${CONFIG.boltColor},0.22)`
            for (let i = 0; i < anchors.length; i++) {
                ctx.beginPath()
                ctx.arc(anchors[i].x, anchors[i].y, 3, 0, Math.PI * 2)
                ctx.fill()
            }

            // 3. Update and draw bolts
            for (let i = 0; i < boltPool.length; i++) {
                const b = boltPool[i]
                if (!b.active) continue
                b.life--
                if (b.life <= 0) { b.active = false; continue }
                const alpha = b.life / b.maxLife
                drawBoltPath(b.pts, alpha, 1)
            }

            // 4. Update and draw strike particles
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i]
                if (!p.active) continue
                p.x += p.vx
                p.y += p.vy
                p.vy += 0.10
                p.vx *= 0.95
                p.life--
                if (p.life <= 0) { p.active = false; continue }
                const prog = p.life / p.maxLife
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.r * prog, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(${CONFIG.coreColor},${prog.toFixed(2)})`
                ctx.fill()
            }

            // 5. Cursor corona
            if (cursor.x > -900) {
                const g = ctx.createRadialGradient(cursor.x, cursor.y, 0, cursor.x, cursor.y, 20)
                g.addColorStop(0, `rgba(${CONFIG.glowColor},0.50)`)
                g.addColorStop(1, `rgba(${CONFIG.glowColor},0.00)`)
                ctx.beginPath()
                ctx.arc(cursor.x, cursor.y, 20, 0, Math.PI * 2)
                ctx.fillStyle = g
                ctx.fill()

                ctx.beginPath()
                ctx.arc(cursor.x, cursor.y, 3.5, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(${CONFIG.coreColor},0.95)`
                ctx.fill()
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
            aria-label="Cursor lightning bolt interactive preview, move your cursor, click to strike all anchors"
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