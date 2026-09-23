'use client'
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'

export interface CrosshairRulerProps {
    accentColor?: string
    showCoordinates?: boolean
    lerpSpeed?: number
    fontFamily?: string
    fontSize?: number
    className?: string
    style?: CSSProperties
    children?: ReactNode
}

type Vec2 = {
    x: number
    y: number
}

const DEFAULTS = {
    accentColor: '#000000',
    showCoordinates: true,
    lerpSpeed: 0.22,
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
    fontSize: 11,
    labelOffsetX: 14,
    labelOffsetY: -14,
    settleThreshold: 0.15
} as const

const NS = 'http://www.w3.org/2000/svg'

function svgEl(tag: string, attrs: Record<string, string | number>): SVGElement {
    const el = document.createElementNS(NS, tag)
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, String(value))
    return el
}

export default function CrosshairRuler({
    accentColor = DEFAULTS.accentColor,
    showCoordinates = DEFAULTS.showCoordinates,
    lerpSpeed = DEFAULTS.lerpSpeed,
    fontFamily = DEFAULTS.fontFamily,
    fontSize = DEFAULTS.fontSize,
    className = '',
    style,
    children
}: CrosshairRulerProps) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const svgRef = useRef<SVGSVGElement | null>(null)
    const hasChildren = Boolean(children)

    useEffect(() => {
        if (typeof window === 'undefined') return undefined

        const container = containerRef.current
        const svg = svgRef.current
        if (!container || !svg) return undefined

        const containerElement = container
        const svgElement = svg

        const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
        let reducedMotion = reducedMotionQuery.matches

        let width = 0
        let height = 0
        let active = false
        let rafId: number | null = null

        const target: Vec2 = { x: -1, y: -1 }
        const current: Vec2 = { x: -1, y: -1 }

        // SVG nodes: created once & mutated per frame via
        // setAttribute rather than rebuilt (no innerHTML reset per move)
        const hLine = svgEl('line', { stroke: accentColor, 'stroke-width': 1 })
        const vLine = svgEl('line', { stroke: accentColor, 'stroke-width': 1 })
        const label = document.createElementNS(NS, 'text')
        label.setAttribute('font-family', fontFamily)
        label.setAttribute('font-size', String(fontSize))
        label.setAttribute('fill', accentColor)

        // Hint text only makes sense when this is a standalone demo box,
        // not when it's wrapping real content the hint would sit on top of
        const hint = !hasChildren ? document.createElementNS(NS, 'text') : null
        if (hint) {
            hint.setAttribute('fill', '#888')
            hint.setAttribute('font-family', 'Geist, sans-serif')
            hint.setAttribute('font-size', '13')
            hint.setAttribute('text-anchor', 'middle')
            hint.setAttribute('dominant-baseline', 'middle')
            hint.textContent = 'Move your cursor here'
            svgElement.appendChild(hint)
        }

        svgElement.appendChild(hLine)
        svgElement.appendChild(vLine)
        if (showCoordinates) svgElement.appendChild(label)

        function resize() {
            const rect = containerElement.getBoundingClientRect()
            width = rect.width
            height = rect.height
            svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`)
            svgElement.setAttribute('width', String(width))
            svgElement.setAttribute('height', String(height))
            if (hint) {
                hint.setAttribute('x', String(width / 2))
                hint.setAttribute('y', String(height / 2))
            }
        }

        function setVisible(visible: boolean) {
            const value = visible ? '1' : '0'
            hLine.setAttribute('opacity', value)
            vLine.setAttribute('opacity', value)
            if (showCoordinates) label.setAttribute('opacity', value)
        }

        function render() {
            if (reducedMotion) {
                current.x = target.x
                current.y = target.y
            } else {
                current.x += (target.x - current.x) * lerpSpeed
                current.y += (target.y - current.y) * lerpSpeed
            }

            hLine.setAttribute('x1', '0')
            hLine.setAttribute('x2', String(width))
            hLine.setAttribute('y1', String(current.y))
            hLine.setAttribute('y2', String(current.y))

            vLine.setAttribute('y1', '0')
            vLine.setAttribute('y2', String(height))
            vLine.setAttribute('x1', String(current.x))
            vLine.setAttribute('x2', String(current.x))

            if (showCoordinates) {
                const labelX = Math.min(current.x + DEFAULTS.labelOffsetX, Math.max(0, width - 70))
                const labelY = Math.max(current.y + DEFAULTS.labelOffsetY, fontSize + 4)
                label.setAttribute('x', String(labelX))
                label.setAttribute('y', String(labelY))
                label.textContent = `${Math.round(current.x)}, ${Math.round(current.y)}`
            }

            const settled =
                Math.abs(target.x - current.x) < DEFAULTS.settleThreshold &&
                Math.abs(target.y - current.y) < DEFAULTS.settleThreshold

            if (!active && settled) {
                rafId = null
                return
            }
            rafId = requestAnimationFrame(render)
        }

        function ensureLoop() {
            if (rafId === null) rafId = requestAnimationFrame(render)
        }

        function pointFromEvent(clientX: number, clientY: number): Vec2 {
            const rect = containerElement.getBoundingClientRect()
            return { x: clientX - rect.left, y: clientY - rect.top }
        }

        // Pointer Events unify mouse, touch, and pen — one code path,
        // no separate mouse/touch listener branching
        function onPointerEnter(e: PointerEvent) {
            const p = pointFromEvent(e.clientX, e.clientY)
            target.x = p.x
            target.y = p.y
            if (reducedMotion) {
                current.x = p.x
                current.y = p.y
            }
            active = true
            setVisible(true)
            if (hint) hint.setAttribute('opacity', '0')
            ensureLoop()
        }

        function onPointerMove(e: PointerEvent) {
            if (!active) return
            const p = pointFromEvent(e.clientX, e.clientY)
            target.x = p.x
            target.y = p.y
            ensureLoop()
        }

        function onPointerLeave() {
            active = false
            setVisible(false)
        }

        function onReducedMotionChange(e: MediaQueryListEvent) {
            reducedMotion = e.matches
        }

        const resizeObserver = new ResizeObserver(resize)
        resizeObserver.observe(containerElement)
        resize()
        setVisible(false)

        containerElement.addEventListener('pointerenter', onPointerEnter)
        containerElement.addEventListener('pointermove', onPointerMove)
        containerElement.addEventListener('pointerleave', onPointerLeave)
        containerElement.addEventListener('pointercancel', onPointerLeave)
        reducedMotionQuery.addEventListener('change', onReducedMotionChange)

        return () => {
            if (rafId !== null) cancelAnimationFrame(rafId)
            resizeObserver.disconnect()
            containerElement.removeEventListener('pointerenter', onPointerEnter)
            containerElement.removeEventListener('pointermove', onPointerMove)
            containerElement.removeEventListener('pointerleave', onPointerLeave)
            containerElement.removeEventListener('pointercancel', onPointerLeave)
            reducedMotionQuery.removeEventListener('change', onReducedMotionChange)
        }
    }, [accentColor, showCoordinates, lerpSpeed, fontFamily, fontSize, hasChildren])

    return (
        <div
            ref={containerRef}
            aria-label="Crosshair ruler"
            className={className}
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                minHeight: '380px',
                backgroundColor: '#ECEBE7',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                cursor: 'default',
                touchAction: 'none',
                ...style,
            }}
        >
            {children}

            {/* btw, this is a decorative pointer-tracking overlay. Never add focusable/interactive elements here.*/}
            <svg
                ref={svgRef}
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                }}
            />
        </div>
    )
}