'use client'

import { useEffect, useRef } from 'react'

import type Matter from 'matter-js'

interface LetterData {
    el: HTMLSpanElement
    bx: number; by: number
    bw: number; bh: number
    body: Matter.Body | null
    fallen: boolean
    isSpace: boolean
}

const CONFIG = {
    word: 'loves gonna get you killed. But prides gonna be the death of you, and you and me.',
    fontSize: 44,
    fontFamily: "'Geist', system-ui, sans-serif",
    letterGap: 2,
    padX: 24,
    padY: 24,
    bg: '#ECEBE7',
    letterColor: '#7C3AED',
}

export default function FallingLetter() {
    const containerRef = useRef<HTMLDivElement>(null)
    const cleanupRef = useRef<(() => void) | null>(null)

    useEffect(() => {
        if (!containerRef.current) return
        const container = containerRef.current as HTMLDivElement
        let cancelled = false

        async function init() {
            const { default: Matter } = await import('matter-js')
            if (cancelled) return
            const { Engine, World, Bodies, Body, Runner, Mouse, MouseConstraint, Events } = Matter

            const W = container.clientWidth
            const H = container.clientHeight
            const LINE_H = CONFIG.fontSize * 1.2
            const MAX_W = W - CONFIG.padX

            const ruler = document.createElement('span')
            ruler.style.cssText = [
                'position:absolute',
                'visibility:hidden',
                `font-size:${CONFIG.fontSize}px`,
                `font-family:${CONFIG.fontFamily}`,
                'white-space:nowrap',
                'line-height:1'
            ].join(';')
            container.appendChild(ruler)

            const textLayer = document.createElement('div')
            textLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;'
            container.appendChild(textLayer)

            const letters: LetterData[] = []
            let cx = CONFIG.padX, cy = CONFIG.padY

            CONFIG.word.split('').forEach(char => {
                ruler.textContent = char === ' ' ? '\u00A0' : char
                const lw = ruler.offsetWidth
                const lh = ruler.offsetHeight || CONFIG.fontSize

                if (cx + lw > MAX_W && cx > CONFIG.padX) {
                    cx = CONFIG.padX
                    cy += LINE_H
                }

                const el = document.createElement('span')
                el.style.cssText = [
                    'display:inline-block', 'position:absolute', `font-size:${CONFIG.fontSize}px`,
                    `color:${CONFIG.letterColor}`,
                    'white-space:nowrap',
                    'cursor:grab',
                    'transform-origin:center center',
                    'pointer-events:auto',
                    'line-height:1',
                    'user-select:none'
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
                    bx:cx + lw / 2,
                    by:cy+lh / 2,
                    bw:lw, bh: lh,
                    body: null,
                    fallen: false,
                    isSpace: char === ' ',
                })

                cx += lw + CONFIG.letterGap
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
                Bodies.rectangle(W / 2, H + 25, W, 50, wallOpts), // floor
                Bodies.rectangle(-25, H / 2, 50, H, wallOpts), // left
                Bodies.rectangle(W + 25, H / 2, 50, H, wallOpts), // right
                Bodies.rectangle(W / 2, -25, W, 50, wallOpts) // ceiling
            ])

            const mouse = Mouse.create(container) as Matter.Mouse & { mousewheel: EventListener }
            mouse.element.removeEventListener('mousewheel', mouse.mousewheel)
            mouse.element.removeEventListener('DOMMouseScroll', mouse.mousewheel)

            const mc = MouseConstraint.create(engine, {
                mouse,
                constraint: { stiffness: 0.2, render: { visible: false } }
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

                const pushRadius = Math.max(120, CONFIG.fontSize * 1.5)

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

            // sync dom <- physics
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

            cleanupRef.current = () => {
                cancelAnimationFrame(rafId)
                Runner.stop(runner)
                World.clear(engine.world, false)
                Engine.clear(engine)
                container.removeEventListener('click', dropAll)
                if (container.contains(textLayer)) container.removeChild(textLayer)
            }
        }

        init()

        return () => {
            cancelled = true
            cleanupRef.current?.()
        }
    }, [])

    return (
        <div
            ref={containerRef}
            aria-label="Falling letters (hover a letter to drop it, click to drop all)"
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                minHeight: '380px',
                backgroundColor: CONFIG.bg,
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                cursor: 'default',
                touchAction: 'none',
            }}
        />
    )
}