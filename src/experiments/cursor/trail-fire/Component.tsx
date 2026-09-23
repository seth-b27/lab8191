'use client'
import { useEffect, useRef } from 'react'

type Particle = {
    x: number; y: number
    vx: number; vy: number
    life: number; maxLife: number
    radius: number
    active: boolean
}

export interface CursorTrailFireProps {
    spawnPerFrame?: number
    maxParticles?: number
    baseRadius?: number
    riseSpeed?: number
    spread?: number
    flicker?: number
    gravity?: number
    colorSteps?: string[]
}

const DEFAULTS = {
    spawnPerFrame: 3,
    maxParticles: 150,
    baseRadius: 5,
    riseSpeed: 1.8,
    spread: 10,
    flicker: 0.28,
    gravity: -0.04,
    // newest particles stay clearly visible (~7:1), oldest still
    // fade toward the background (~2.75:1)
    colorSteps: ['rgba(120,30,160,1)', 'rgba(95,25,135,0.9)', 'rgba(70,20,105,0.75)', 'rgba(50,15,80,0.45)'],
}

export default function CursorTrailFire({
    spawnPerFrame = DEFAULTS.spawnPerFrame,
    maxParticles = DEFAULTS.maxParticles,
    baseRadius = DEFAULTS.baseRadius,
    riseSpeed = DEFAULTS.riseSpeed,
    spread = DEFAULTS.spread,
    flicker = DEFAULTS.flicker,
    gravity = DEFAULTS.gravity,
    colorSteps = DEFAULTS.colorSteps
}: CursorTrailFireProps) {
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

        for (let i = 0; i < maxParticles; i++) {
            pool.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, radius: 0, active: false })
        }

        function spawnParticle(x: number, y: number) {
            const p = pool[poolHead]
            poolHead = (poolHead + 1) % maxParticles

            p.x = x + (Math.random() - 0.5) * spread
            p.y = y
            p.vx = (Math.random() - 0.5) * 1.0
            p.vy = -(Math.random() * riseSpeed + 1.0)
            p.maxLife = Math.random() * 25 + 35 // 35–60 frames
            p.life = p.maxLife
            p.radius = Math.random() * 3 + baseRadius
            p.active = true
        }

        function getColor(progress: number): string {
            if (progress >= 0.75) return colorSteps[0]
            if (progress >= 0.50) return colorSteps[1]
            if (progress >= 0.25) return colorSteps[2]
            return colorSteps[3]
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

            ctx.fillStyle = '#ECEBE7'
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            // Optional placeholder shown before the first interaction.  
            // u may remove this block if u don't want a hint on an empty canvas
            if (!moved) {
                ctx.fillStyle = '#888'
                ctx.font = '13px Geist, sans-serif'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText('Move your cursor here', canvas.width / 2, canvas.height / 2)
                rafId = requestAnimationFrame(loop)
                return
            }

            for (let i = 0; i < spawnPerFrame; i++) {
                spawnParticle(cursor.x, cursor.y)
            }

            for (let i = 0; i < pool.length; i++) {
                const p = pool[i]
                if (!p.active) continue

                // Physics
                p.x += p.vx
                p.y += p.vy
                p.vy += gravity // rise faster over time
                p.vx += (Math.random() - 0.5) * flicker

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
    }, [spawnPerFrame, maxParticles, baseRadius, riseSpeed, spread, flicker, gravity, colorSteps])

    return (
        <div
            ref={containerRef}
            aria-label="Cursor trail fire"
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                minHeight: '380px',
                backgroundColor: '#ECEBE7',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                cursor: 'default',
                touchAction: 'none'
            }}
        >
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                style={{
                    position:'absolute',
                    top: 0,
                    left: 0,
                    pointerEvents: 'none'
                }}
            />
        </div>
    )
}