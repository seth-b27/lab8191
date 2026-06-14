'use client'
import { useEffect, useRef } from 'react'

const CONFIG = {
    spawnPerFrame: 2,  
    maxParticles: 30,
    colors: [  // pink / rose palette
        '#ff85a1',
        '#ffb3c6',
        '#ff6b9d',
        '#c9184a',
        '#ff99cc',
        '#ffccd5',
        '#f9a8d4',
        '#e879a0']
}

type Petal = {
    x: number; y: number
    vx: number; vy: number
    angle: number  
    spin: number 
    life: number
    maxLife: number
    size: number 
    colorIdx: number  // index into CONFIG.colors
    active: boolean
}

export default function CursorPetal() {
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        if (!containerRef.current || !canvasRef.current) return

        // Stable non-null refs for use inside all callbacks
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

        const pool: Petal[] = []
        let poolHead = 0

        for (let i = 0; i < CONFIG.maxParticles; i++) {
            pool.push({
                x: 0, y: 0, vx: 0, vy: 0,
                angle: 0, spin: 0,
                life: 0, maxLife: 0,
                size: 0, colorIdx: 0,
                active: false,
            })
        }

        function spawn(x: number, y: number) {
            const p = pool[poolHead]
            poolHead = (poolHead + 1) % CONFIG.maxParticles

            p.x = x + (Math.random() - 0.5) * 8 
            p.y = y + (Math.random() - 0.5) * 8
            p.vx = (Math.random() - 0.5) * 1.4  
            p.vy = -(Math.random() * 1.5 + 0.5) 
            p.angle = Math.random() * Math.PI * 2 
            p.spin = (Math.random() - 0.5) * 0.12 
            p.maxLife = Math.random() * 30 + 50 
            p.life = p.maxLife
            p.size = Math.random() * 5 + 5 
            p.colorIdx = Math.floor(Math.random() * CONFIG.colors.length)
            p.active = true
        }

        function drawPetal(
            x: number, y: number,
            size: number, angle: number,
            alpha: number, colorIdx: number,
        ) {
            ctx.save()
            ctx.translate(x, y)
            ctx.rotate(angle)
            ctx.globalAlpha = alpha

            ctx.beginPath()
            ctx.moveTo(0, 0)
            // right lobe
            ctx.bezierCurveTo(
                size, -size,
                size * 2, size * 0.5,
                0, size * 2,
            )
            // left lobe (mirror)
            ctx.bezierCurveTo(
                -size * 2, size * 0.5,
                -size, -size,
                0, 0,
            )
            ctx.closePath()
            ctx.fillStyle = CONFIG.colors[colorIdx]
            ctx.fill()

            ctx.restore()
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

        function loop() {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            if (!moved) {
                ctx.globalAlpha = 1
                ctx.fillStyle = '#888'
                ctx.font = '13px Arial, sans-serif'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText('Move your cursor here', canvas.width / 2, canvas.height / 2)
                rafId = requestAnimationFrame(loop)
                return
            }

            for (let i = 0; i < CONFIG.spawnPerFrame; i++) {
                spawn(cursor.x, cursor.y)
            }

            ctx.globalAlpha = 1

            for (let i = 0; i < pool.length; i++) {
                const p = pool[i]
                if (!p.active) continue

                p.x += p.vx
                p.y += p.vy
                p.vy += 0.03  // gentle gravity
                p.vx += (Math.random() - 0.5) * 0.05 // subtle side sway
                p.angle += p.spin // rotate each frame
                p.life--

                if (p.life <= 0) { p.active = false; continue }

                const progress = p.life / p.maxLife  // 1=fresh, 0=dying

                const size = p.size * (0.4 + progress * 0.6)

                drawPetal(p.x, p.y, size, p.angle, progress, p.colorIdx)
            }

            ctx.globalAlpha = 1

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
            aria-label="Cursor petal interactive preview, move your cursor to scatter rose petals"
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                minHeight: '320px',
                backgroundColor: '#1c1b1b',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                cursor: 'default',
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