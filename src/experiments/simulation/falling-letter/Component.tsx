'use client'

import { useEffect, useRef } from 'react'

const WORD = 'welcome to lab 8191 '
const FONT_SIZE = 64
const FONT_FAMILY = "'Geist', system-ui, sans-serif"
const LETTER_GAP = 2
const PAD_X = 24
const PAD_Y = 24
const BG = '#ECEBE7'
const LETTER_COLOR = '#0000ee'

export default function FallingLetter() {
    const containerRef = useRef<HTMLDivElement>(null)
    const cleanupRef = useRef<(() => void) | null>(null)

    useEffect(() => {
        if (!containerRef.current) return
        const container = containerRef.current as HTMLDivElement

        const scriptId = 'matter-js-cdn'
        const existingScript = document.getElementById(scriptId)

        function init() {
            const M = (window as any).Matter
            if (!M) return

            const {
                Engine, World, Bodies, Body,
                Runner, Mouse, MouseConstraint, Events,
            } = M

            const W = container.clientWidth
            const H = container.clientHeight
            const LINE_H = FONT_SIZE * 1.2
            const MAX_W = W - PAD_X

            const ruler = document.createElement('span')
            ruler.style.cssText = [
                'position:absolute',
                'visibility:hidden',
                `font-size:${FONT_SIZE}px`,
                `font-family:${FONT_FAMILY}`,
                'white-space:nowrap',
                'line-height:1',
            ].join(';')
            container.appendChild(ruler)

            const textLayer = document.createElement('div')
            textLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;'
            container.appendChild(textLayer)

            type LetterData = {
                el: HTMLSpanElement
                bx: number; by: number
                bw: number; bh: number
                body: any
                fallen: boolean
                isSpace: boolean
            }

            const letters: LetterData[] = []
            let cx = PAD_X, cy = PAD_Y

            WORD.split('').forEach(char => {
                ruler.textContent = char === ' ' ? '\u00A0' : char
                const lw = ruler.offsetWidth
                const lh = ruler.offsetHeight || FONT_SIZE

                if (cx + lw > MAX_W && cx > PAD_X) {
                    cx = PAD_X
                    cy += LINE_H
                }

                const el = document.createElement('span')
                el.style.cssText = [
                    'display:inline-block', 'position:absolute', `font-size:${FONT_SIZE}px`,
                    `color:${LETTER_COLOR}`,
                    'white-space:nowrap',
                    'cursor:grab',
                    'transform-origin:center center',
                    'pointer-events:auto',
                    'line-height:1',
                    'user-select:none',
                ].join(';')

                if (char === ' ') {
                    el.style.pointerEvents = 'none'
                    el.style.opacity = '0'
                }

                el.textContent = char === ' ' ? '\u00A0' : char
                el.style.left = cx + 'px'
                el.style.top = cy + 'px'
                textLayer.appendChild(el)

                letters.push({
                    el,
                    bx: cx + lw / 2,
                    by: cy + lh / 2,
                    bw: lw, bh: lh,
                    body: null,
                    fallen: false,
                    isSpace: char === ' ',
                })

                cx += lw + LETTER_GAP
            })

            container.removeChild(ruler)

            const engine = Engine.create({ enableSleeping: true })
            engine.world.gravity.y = 1.2

            const wallOpts = {
                isStatic: true,
                render: { fillStyle: 'transparent' },
                friction: 0.3,
            }

            World.add(engine.world, [
                Bodies.rectangle(W / 2, H + 25, W, 50, wallOpts),// floor
                Bodies.rectangle(-25, H / 2, 50, H, wallOpts),// left
                Bodies.rectangle(W + 25, H / 2, 50, H, wallOpts), // right
                Bodies.rectangle(W / 2, -25, W, 50, wallOpts), // ceiling
            ])

            // ── Mouse constraint ───────────────────────────
            const mouse = Mouse.create(container)
            mouse.element.removeEventListener('mousewheel', mouse.mousewheel)
            mouse.element.removeEventListener('DOMMouseScroll', mouse.mousewheel)

            const mc = MouseConstraint.create(engine, {
                mouse,
                constraint: { stiffness: 0.2, render: { visible: false } },
            })
            World.add(engine.world, mc)

            // push nearby letters when dragging fast
            let lastMouseX = 0, lastMouseY = 0

            Events.on(mc, 'mousemove', () => {
                const dragged = mc.body
                if (!dragged) return

                const mvx = mouse.position.x - lastMouseX
                const mvy = mouse.position.y - lastMouseY
                const speed = Math.sqrt(mvx * mvx + mvy * mvy)
                if (speed < 2) return

                const pushRadius = Math.max(120, FONT_SIZE * 1.5)

                letters.forEach(l => {
                    if (!l.body || l.body === dragged || !l.fallen) return
                    const dx = l.body.position.x - dragged.position.x
                    const dy = l.body.position.y - dragged.position.y
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    if (dist > pushRadius || dist === 0) return

                    const falloff = 1 - dist / pushRadius
                    const force = speed * 0.0014 * falloff * falloff
                    const nx = dx / dist, ny = dy / dist
                    const dot = (mvx / speed) * nx + (mvy / speed) * ny
                    if (dot > -0.2) {
                        Body.applyForce(l.body, l.body.position, {
                            x: nx * force * 1.6 + (mvx / speed) * force,
                            y: ny * force * 1.6 + (mvy / speed) * force,
                        })
                    }
                })
            })

            Events.on(engine, 'beforeUpdate', () => {
                lastMouseX = mouse.position.x
                lastMouseY = mouse.position.y
            })

            function dropLetter(l: LetterData) {
                if (l.fallen || l.isSpace) return
                l.fallen = true

                const body = Bodies.rectangle(l.bx, l.by, l.bw * 0.8, l.bh, {
                    restitution: 0.35,
                    frictionAir: 0.018,
                    friction: 0.3,
                    density: 0.003,
                    render: { fillStyle: 'transparent', strokeStyle: 'transparent' },
                })

                Body.setVelocity(body, { x: (Math.random() - 0.5) * 2, y: 0 })
                Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.05)

                l.body = body
                World.add(engine.world, body)
                l.el.style.pointerEvents = 'none'
            }

            function dropAll() {
                letters.forEach(l => dropLetter(l))
            }

            // Hover to drop (desktop)
            letters.forEach(l => {
                l.el.addEventListener('mouseenter', () => dropLetter(l))
            })

            // click anywhere to drop all
            container.addEventListener('click', dropAll)

            // Touch - tap letter or container 
            letters.forEach(l => {
                l.el.addEventListener('touchstart', e => {
                    e.stopPropagation()
                    dropLetter(l)
                }, { passive: true })
            })

            container.addEventListener('touchstart', e => {
                const target = e.target as HTMLElement
                if (target === container || target === textLayer) dropAll()
            }, { passive: true })

            // sync dom <- physics─
            let rafId = 0
            function syncLoop() {
                letters.forEach(l => {
                    if (!l.body) return
                    const { x, y } = l.body.position
                    l.el.style.left = `${x}px`
                    l.el.style.top = `${y}px`
                    l.el.style.transform = `translate(-50%,-50%) rotate(${l.body.angle}rad)`
                })
                rafId = requestAnimationFrame(syncLoop)
            }

            // start
            const runner = Runner.create()
            Runner.run(runner, engine)
            syncLoop()

            
            // Store cleanup fn in ref for unmount
            cleanupRef.current = () => {
                cancelAnimationFrame(rafId)
                Runner.stop(runner)
                World.clear(engine.world, false)
                Engine.clear(engine)
                container.removeEventListener('click', dropAll)
                if (container.contains(textLayer)) container.removeChild(textLayer)
            }
        }

        if (existingScript) {
            // script already loaded run init immediately
            if ((window as any).Matter) init()
            else existingScript.addEventListener('load', init)
        } else {
            const script = document.createElement('script')
            script.id = scriptId
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js'
            script.addEventListener('load', init)
            document.head.appendChild(script)
        }

        return () => {
            cleanupRef.current?.()
        }
    }, [])

    return (
        <div
            ref={containerRef}
            aria-label="Falling letters — hover a letter to drop it, click to drop all"
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                minHeight: '320px',
                backgroundColor: BG,
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                cursor: 'default',
                touchAction: 'none',
                border: `1px solid #2a2a2a`,
            }}
        />
    )
}