'use client'

import { useEffect, useRef } from 'react'

const CONFIG = {
    pixelSize: 8,        // size of each pixel block in px
    trailLen: 22,       // trail ring buffer length
    lerpSpeed: 0.18,     // cursor lerp speed (0–1)
    fadeFrames: 35,       // frames a trail pixel lives
    palette: [              // PICO-8 inspired color palette
        '#ff004d', '#ff77a8',
        '#ffec27', '#00e436',
        '#29adff', '#83769c',
        '#ff6c24', '#00b543',
        '#ff0040', '#e8f1ff',
        '#ff3c96', '#7e2553',
    ],
    scatterCount: 18,       // pixels spawned per click
    pixelMax: 200,      // pre-allocated pixel pool size
}

//Types 
type Pixel = {
    gx: number// grid-snapped x position
    gy: number// grid-snapped y position
    vx: number// velocity x (scatter only)
    vy: number// velocity y (scatter only)
    life: number
    maxLife: number
    color: string
    isScatter: boolean
    active: boolean
}

//Helpers 
function snap(v: number, size: number): number {
    return Math.floor(v / size) * size
}

//Component 
export default function CursorPixel() {
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        if (!containerRef.current || !canvasRef.current) return

        // Capture as stable non-null consts so TypeScript doesn't
        // complain inside nested callbacks and the RAF loop.
        const container = containerRef.current as HTMLDivElement
        const canvas = canvasRef.current as HTMLCanvasElement

        const ctxRaw = canvas.getContext('2d')
        if (!ctxRaw) return

        // Capture as stable non-null const
        const ctx = ctxRaw

        // Disable sub-pixel antialiasing — keeps pixel blocks crisp
        ctx.imageSmoothingEnabled = false

        //Resize canvas to container 
        function resize() {
            canvas.width = container.clientWidth
            canvas.height = container.clientHeight
            // Must re-disable after resize — canvas reset clears context state
            ctx.imageSmoothingEnabled = false
        }
        resize()

        const resizeObserver = new ResizeObserver(resize)
        resizeObserver.observe(container)

        const pixels: Pixel[] = []
        for (let i = 0; i < CONFIG.pixelMax; i++) {
            pixels.push({
                gx: 0, gy: 0,
                vx: 0, vy: 0,
                life: 0, maxLife: 0,
                color: '',
                isScatter: false,
                active: false,
            })
        }
        let pixHead = 0

        function spawnPixel(gx: number, gy: number, isScatter: boolean) {
            const p = pixels[pixHead]
            pixHead = (pixHead + 1) % CONFIG.pixelMax

            p.gx = gx
            p.gy = gy
            p.color = CONFIG.palette[Math.floor(Math.random() * CONFIG.palette.length)]
            p.isScatter = isScatter

            if (isScatter) {
                // Random radial launch — speed 2–7 px/frame
                const angle = Math.random() * Math.PI * 2
                const spd = Math.random() * 5 + 2
                p.vx = Math.cos(angle) * spd
                p.vy = Math.sin(angle) * spd
                p.maxLife = Math.random() * 20 + 15// 15–35 frames
            } else {
                p.vx = 0; p.vy = 0
                // Slight random variation — staggered fade-out across trail
                p.maxLife = CONFIG.fadeFrames + Math.floor(Math.random() * 10)
            }

            p.life = p.maxLife
            p.active = true
        }

        const trailGX = new Int16Array(CONFIG.trailLen)
        const trailGY = new Int16Array(CONFIG.trailLen)
        let tHead = 0
        let lastSnapX = -9999
        let lastSnapY = -9999

        let cx = -9999, cy = -9999
        let lx = -9999, ly = -9999
        let moved = false
        let rafId = 0

        //Event handlers 
        // All scoped to the container, not document.

        function onMouseMove(e: MouseEvent) {
            const rect = container.getBoundingClientRect()
            const mx = e.clientX - rect.left
            const my = e.clientY - rect.top
            if (!moved) { moved = true; lx = mx; ly = my }
            cx = mx; cy = my
        }

        function onMouseLeave() {
            cx = -9999; cy = -9999
        }

        function onMouseClick(e: MouseEvent) {
            if (!moved) return
            const rect = container.getBoundingClientRect()
            const bx = snap(e.clientX - rect.left, CONFIG.pixelSize)
            const by = snap(e.clientY - rect.top, CONFIG.pixelSize)

            for (let i = 0; i < CONFIG.scatterCount; i++) {
                // Random offset within ±2 cells for a burst cluster effect
                const ox = (Math.floor(Math.random() * 5) - 2) * CONFIG.pixelSize
                const oy = (Math.floor(Math.random() * 5) - 2) * CONFIG.pixelSize
                spawnPixel(bx + ox, by + oy, true)
            }
        }

        function onTouchMove(e: TouchEvent) {
            const rect = container.getBoundingClientRect()
            cx = e.touches[0].clientX - rect.left
            cy = e.touches[0].clientY - rect.top
        }

        function onTouchStart(e: TouchEvent) {
            const rect = container.getBoundingClientRect()
            cx = e.touches[0].clientX - rect.left
            cy = e.touches[0].clientY - rect.top

            if (!moved) {
                moved = true
                lx = cx; ly = cy
            } else {
                const bx = snap(cx, CONFIG.pixelSize)
                const by = snap(cy, CONFIG.pixelSize)
                for (let i = 0; i < CONFIG.scatterCount; i++) {
                    const ox = (Math.floor(Math.random() * 5) - 2) * CONFIG.pixelSize
                    const oy = (Math.floor(Math.random() * 5) - 2) * CONFIG.pixelSize
                    spawnPixel(bx + ox, by + oy, true)
                }
            }
        }

        container.addEventListener('mousemove', onMouseMove)
        container.addEventListener('mouseleave', onMouseLeave)
        container.addEventListener('click', onMouseClick)
        container.addEventListener('touchmove', onTouchMove, { passive: true })
        container.addEventListener('touchstart', onTouchStart, { passive: true })

        //Animation loop 
        function loop() {
            if (!canvas || !ctx) return
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

            if (cx > -9000) {
                lx += (cx - lx) * CONFIG.lerpSpeed
                ly += (cy - ly) * CONFIG.lerpSpeed
            }
            const sgx = snap(lx, CONFIG.pixelSize)
            const sgy = snap(ly, CONFIG.pixelSize)



            if (sgx !== lastSnapX || sgy !== lastSnapY) {
                lastSnapX = sgx
                lastSnapY = sgy

                trailGX[tHead] = sgx
                trailGY[tHead] = sgy
                tHead = (tHead + 1) % CONFIG.trailLen

                spawnPixel(sgx, sgy, false)
            }

            for (let i = 0; i < pixels.length; i++) {
                const p = pixels[i]
                if (!p.active) continue

                if (p.isScatter) {
                    p.gx += p.vx
                    p.gy += p.vy
                    p.vy += 0.35 // gravity, pixels fall downward
                    p.vx *= 0.94 // horizontal air drag
                }

                p.life--
                if (p.life <= 0) { p.active = false; continue }

                const prog = p.life / p.maxLife // 1=fresh, 0=dead

                const alpha = p.isScatter ? prog : prog * prog

                ctx.globalAlpha = alpha
                ctx.fillStyle = p.color

                const drawX = p.isScatter
                    ? Math.round(p.gx / CONFIG.pixelSize) * CONFIG.pixelSize
                    : p.gx
                const drawY = p.isScatter
                    ? Math.round(p.gy / CONFIG.pixelSize) * CONFIG.pixelSize
                    : p.gy

                // pixelSize-1: leave a 1px gap between blocks (visible grid)
                ctx.fillRect(drawX, drawY, CONFIG.pixelSize - 1, CONFIG.pixelSize - 1)
            }

            ctx.globalAlpha = 1


            if (lx > -9000) {
                const ps = CONFIG.pixelSize

                ctx.fillStyle = '#ffffff'
                ctx.globalAlpha = 0.85

                // Horizontal arm - 2 cells each side, skip center
                for (let d = -2; d <= 2; d++) {
                    if (d === 0) continue
                    ctx.fillRect(sgx + d * ps, sgy, ps - 1, ps - 1)
                }

                // Vertical arm
                for (let d = -2; d <= 2; d++) {
                    if (d === 0) continue
                    ctx.fillRect(sgx, sgy + d * ps, ps - 1, ps - 1)
                }

                // center bright yellow focal point
                ctx.fillStyle = '#ffec27'
                ctx.globalAlpha = 0.95
                ctx.fillRect(sgx, sgy, ps - 1, ps - 1)

                ctx.globalAlpha = 1
            }

            rafId = requestAnimationFrame(loop)
        }

        loop()

        //Cleanup on unmount 
        return () => {
            cancelAnimationFrame(rafId)
            resizeObserver.disconnect()
            container.removeEventListener('mousemove', onMouseMove)
            container.removeEventListener('mouseleave', onMouseLeave)
            container.removeEventListener('click', onMouseClick)
            container.removeEventListener('touchmove', onTouchMove)
            container.removeEventListener('touchstart', onTouchStart)
        }
    }, [])

    return (
        <div
            ref={containerRef}
            aria-label="Cursor pixel interactive preview, move to draw, click to scatter"
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                minHeight: '320px',
                backgroundColor: '#1c1b1b',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                cursor: 'none',
                imageRendering: 'pixelated',
                fontFamily: 'var(--font-sans)',
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
                    imageRendering: 'pixelated',
                    // crisp-edges fallback for Firefox
                    // @ts-expect-error — vendor prefix
                    imageRenderingCrispEdges: 'crisp-edges',
                }}
            />
        </div>
    )
}