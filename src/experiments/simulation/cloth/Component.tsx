'use client'

import { useEffect, useRef } from 'react'

const REST = 22

const CONFIG = {
    restDist: REST,
    gravity: 1200,
    damping: 0.982,
    iterations: 3,
    stiffness: 0.1,
    snapRadius: 36,
    maxCols: 22,  
    maxRows: 10,  
}

class Point {
    x: number; y: number
    px: number; py: number
    pinned: boolean
    pinX: number; pinY: number

    constructor(x: number, y: number) {
        this.x = x; this.y = y
        this.px = x; this.py = y
        this.pinned = false
        this.pinX = x; this.pinY = y
    }

    update(dt: number, w: number, h: number) {
        if (this.pinned) { this.x = this.pinX; this.y = this.pinY; return }
        const vx = (this.x - this.px) * CONFIG.damping
        const vy = (this.y - this.py) * CONFIG.damping
        this.px = this.x; this.py = this.y
        this.x += vx
        this.y += vy + CONFIG.gravity * dt * dt
        if (this.x < 1) { this.x = 1; this.px = this.x + vx * 0.3 }
        if (this.x > w - 1) { this.x = w - 1; this.px = this.x + vx * 0.3 }
        if (this.y > h - 1) { this.y = h - 1; this.py = this.y - Math.abs(vy) * 0.4 }
    }
}

class Constraint {
    a: Point; b: Point
    rest: number

    constructor(a: Point, b: Point) {
        this.a = a; this.b = b
        this.rest = Math.hypot(b.x - a.x, b.y - a.y)
    }

    resolve(grabbed: Point | null) {
        const dx = this.b.x - this.a.x
        const dy = this.b.y - this.a.y
        const d = Math.hypot(dx, dy) || 0.0001
        const diff = ((d - this.rest) / d) * CONFIG.stiffness * 0.5
        const ox = dx * diff, oy = dy * diff
        const aF = this.a.pinned || this.a === grabbed
        const bF = this.b.pinned || this.b === grabbed
        if (!aF && !bF) { this.a.x += ox; this.a.y += oy; this.b.x -= ox; this.b.y -= oy }
        else if (!aF) { this.a.x += ox * 2; this.a.y += oy * 2 }
        else if (!bF) { this.b.x -= ox * 2; this.b.y -= oy * 2 }
    }
}

export default function ClothSimulation() {
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        if (!containerRef.current || !canvasRef.current) return

        const container = containerRef.current as HTMLDivElement
        const canvas = canvasRef.current as HTMLCanvasElement
        const ctx = canvas.getContext('2d')!

        // Cloth state
        let points: Point[] = []
        let structural: Constraint[] = []
        let constraints: Constraint[] = []
        let grabbed: Point | null = null
        let mouseX = 0, mouseY = 0
        let prevX = 0, prevY = 0

        function resize() {
            canvas.width = container.clientWidth
            canvas.height = container.clientHeight
        }
        resize()

        function build() {
            grabbed = null; points = []; structural = []; constraints = []

            const W = canvas.width, H = canvas.height
            const cols = Math.min(Math.floor((W - 40) / REST), CONFIG.maxCols)
            const rows = Math.min(Math.floor((H - 80) / REST), CONFIG.maxRows)
            const d = CONFIG.restDist
            const sx = (W - (cols - 1) * d) / 2
            const sy = 50

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const p = new Point(sx + c * d, sy + r * d)
                    if (r === 0) { p.pinned = true; p.pinX = p.x; p.pinY = p.y }
                    points.push(p)
                }
            }

            const P = (r: number, c: number) => points[r * cols + c]

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (c < cols - 1) {
                        const k = new Constraint(P(r, c), P(r, c + 1))
                        constraints.push(k); structural.push(k)
                    }
                    if (r < rows - 1) {
                        const k = new Constraint(P(r, c), P(r + 1, c))
                        constraints.push(k); structural.push(k)
                    }
                }
            }
        }

        build()

        // Event helpers 
        function getPos(e: MouseEvent | Touch): [number, number] {
            const r = canvas.getBoundingClientRect()
            return [e.clientX - r.left, e.clientY - r.top]
        }

        function onMouseDown(e: MouseEvent) {
            ;[mouseX, mouseY] = getPos(e)
            let best: Point | null = null, bestD = CONFIG.snapRadius
            for (const p of points) {
                if (p.pinned) continue
                const d = Math.hypot(p.x - mouseX, p.y - mouseY)
                if (d < bestD) { bestD = d; best = p }
            }
            if (best) { grabbed = best; grabbed.px = grabbed.x; grabbed.py = grabbed.y }
            e.preventDefault()
        }

        function onMouseMove(e: MouseEvent) {
            prevX = mouseX; prevY = mouseY
                ;[mouseX, mouseY] = getPos(e)
        }

        function onMouseUp() {
            if (grabbed) {
                grabbed.px = grabbed.x - (mouseX - prevX) * 1.5
                grabbed.py = grabbed.y - (mouseY - prevY) * 1.5
                grabbed = null
            }
        }

        function onMouseLeave() { grabbed = null }

        //  Touch events 
        function onTouchStart(e: TouchEvent) {
            const t = e.touches[0]
                ;[mouseX, mouseY] = getPos(t)
            let best: Point | null = null, bestD = CONFIG.snapRadius
            for (const p of points) {
                if (p.pinned) continue
                const d = Math.hypot(p.x - mouseX, p.y - mouseY)
                if (d < bestD) { bestD = d; best = p }
            }
            if (best) { grabbed = best; grabbed.px = grabbed.x; grabbed.py = grabbed.y }
        }

        function onTouchMove(e: TouchEvent) {
            prevX = mouseX; prevY = mouseY
                ;[mouseX, mouseY] = getPos(e.touches[0])
            e.preventDefault()
        }

        function onTouchEnd() {
            if (grabbed) {
                grabbed.px = grabbed.x - (mouseX - prevX) * 1.5
                grabbed.py = grabbed.y - (mouseY - prevY) * 1.5
                grabbed = null
            }
        }

        //  Keyboard — R to reset ─
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'r' || e.key === 'R') build()
        }

        canvas.addEventListener('mousedown', onMouseDown)
        canvas.addEventListener('mousemove', onMouseMove)
        canvas.addEventListener('mouseup', onMouseUp)
        canvas.addEventListener('mouseleave', onMouseLeave)
        canvas.addEventListener('touchstart', onTouchStart, { passive: true })
        canvas.addEventListener('touchmove', onTouchMove, { passive: false })
        canvas.addEventListener('touchend', onTouchEnd)
        canvas.addEventListener('contextmenu', e => e.preventDefault())
        container.addEventListener('keydown', onKeyDown)

        const resizeObserver = new ResizeObserver(() => {
            resize()
            build()
        })
        resizeObserver.observe(container)

        //  animation loop 
        let last = performance.now()
        let rafId = 0

        function loop(now: number) {
            rafId = requestAnimationFrame(loop)

            const dt = Math.min((now - last) / 1000, 0.032)
            last = now

            const W = canvas.width, H = canvas.height

            for (const p of points) {
                if (p === grabbed) continue
                p.update(dt, W, H)
            }

            for (let i = 0; i < CONFIG.iterations; i++) {
                if (grabbed) { grabbed.x = mouseX; grabbed.y = mouseY }
                for (const k of constraints) k.resolve(grabbed)
            }
            if (grabbed) { grabbed.x = mouseX; grabbed.y = mouseY }

            ctx.fillStyle = '#ECEBE7'
            ctx.fillRect(0, 0, W, H)

            ctx.strokeStyle = '#2a2a2a'
            ctx.lineWidth = 0.8
            ctx.beginPath()
            for (const k of structural) {
                ctx.moveTo(k.a.x, k.a.y)
                ctx.lineTo(k.b.x, k.b.y)
            }
            ctx.stroke()

            for (const p of points) {
                if (!p.pinned) continue
                ctx.beginPath()
                ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2)
                ctx.fillStyle = '#2a2a2a'
                ctx.fill()
            }

            if (grabbed) {
                ctx.beginPath()
                ctx.arc(grabbed.x, grabbed.y, 4, 0, Math.PI * 2)
                ctx.fillStyle = '#2a2a2a'
                ctx.fill()
            }
        }

        rafId = requestAnimationFrame(loop)

        return () => {
            cancelAnimationFrame(rafId)
            resizeObserver.disconnect()
            canvas.removeEventListener('mousedown', onMouseDown)
            canvas.removeEventListener('mousemove', onMouseMove)
            canvas.removeEventListener('mouseup', onMouseUp)
            canvas.removeEventListener('mouseleave', onMouseLeave)
            canvas.removeEventListener('touchstart', onTouchStart)
            canvas.removeEventListener('touchmove', onTouchMove)
            canvas.removeEventListener('touchend', onTouchEnd)
            container.removeEventListener('keydown', onKeyDown)
        }
    }, [])

    return (
        <div
            ref={containerRef}
            tabIndex={0}
            aria-label="Cloth simulation, drag to pull the cloth, press R to reset"
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                minHeight: '320px',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                outline: 'none',
            }}
        >
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                style={{ display: 'block' }}
            />
        </div>
    )
}