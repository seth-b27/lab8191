'use client'

import { useEffect, useRef } from 'react'

const CONFIG = {
    spawnPerFrame: 3,
    maxParticles: 150,
    baseRadius: 5,
    riseSpeed: 1.8,
    spread: 10,
    flicker: 0.28,
    gravity: -0.04,
}

const COLOR_STEPS = [ 'rgba(220,180,255,1)',  'rgba(200,120,255,0.9)', 'rgba(150,80,200,0.75)', 'rgba(100,40,150,0.45)']

function getColor(progress: number): string {
    if (progress >= 0.75) return COLOR_STEPS[0]
    if (progress >= 0.50) return COLOR_STEPS[1]
    if (progress >= 0.25) return COLOR_STEPS[2]
    return COLOR_STEPS[3]
}

type Particle = {
    x: number; y: number
    vx: number; vy: number
    life: number; maxLife: number
    radius: number
    active: boolean
}

export default function CursorTrailFire() {
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

        const pool: Particle[] = []
        let poolHead = 0

        for (let i = 0; i < CONFIG.maxParticles; i++) {
            pool.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, radius: 0, active: false })
        }

        function spawnParticle(x: number, y: number) {
            const p = pool[poolHead]
            poolHead = (poolHead + 1) % CONFIG.maxParticles

            p.x = x + (Math.random() - 0.5) * CONFIG.spread
            p.y = y
            p.vx = (Math.random() - 0.5) * 1.0
            p.vy = -(Math.random() * CONFIG.riseSpeed + 1.0)
            p.maxLife = Math.random() * 25 + 35 // 35–60 frames
            p.life = p.maxLife
            p.radius = Math.random() * 3 + CONFIG.baseRadius
            p.active = true
        }

        const cursor = { x: 0, y: 0 }
        let moved = false
        let rafId = 0

        function onMouseMove(e: MouseEvent) {
            const rect = container.getBoundingClientRect()
            cursor.x = e.clientX - rect.left
            cursor.y = e.clientY - rect.top
            if (!moved) moved = true
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
            moved = true
        }

        container.addEventListener('mousemove', onMouseMove)
        container.addEventListener('touchmove', onTouchMove, { passive: true })
        container.addEventListener('touchstart', onTouchStart, { passive: true })

        //  animation loop 
        function loop() {

            ctx.fillStyle = '#1c1b1b'
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            if (!moved) {
                ctx.fillStyle = '#888'
                ctx.font = '13px Arial, sans-serif'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText('Move your cursor here', canvas.width / 2, canvas.height / 2)
                rafId = requestAnimationFrame(loop)
                return
            }

            for (let i = 0; i < CONFIG.spawnPerFrame; i++) {
                spawnParticle(cursor.x, cursor.y)
            }

            for (let i = 0; i < pool.length; i++) {
                const p = pool[i]
                if (!p.active) continue

                // Physics
                p.x += p.vx
                p.y += p.vy
                p.vy += CONFIG.gravity // rise faster over time
                p.vx += (Math.random() - 0.5) * CONFIG.flicker 

                p.life--
                if (p.life <= 0) { p.active = false; continue }

                const progress = p.life / p.maxLife // 1=fresh, 0=dying
                const r = p.radius * progress  // shrink as it ages

                ctx.beginPath()
                ctx.arc(p.x, p.y, Math.max(r, 0.5), 0, Math.PI * 2)
                ctx.fillStyle = getColor(progress)
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
            aria-label="Cursor trail fire interactive preview — move your cursor to see the particle trail"
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                minHeight: '320px',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                cursor: 'default',
            }}
        >
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                style={{
                    position:'absolute',
                    top: 0,
                    left: 0,
                    pointerEvents: 'none',
                }}
            />
        </div>
    )
}