'use client'

import { useEffect, useMemo, useRef } from 'react'

export interface AnnotationConfig {
    fontSize: number
    fontFamily: string
    bg: string
    primary: string
    padLeft: number
    padRight: number
    padTop: number
    bottomPad: number
    nodeRRatio: number
    spaceBarAboveRatio: number
    bottomLineBelowRatio: number
    lineSpacing: number
    tabSpaces: number
    maxLineWidth: number
    maxChars: number
}

interface LineMetrics {
    words: string[]
    wordWidths: number[]
    spaceWidth: number
    totalWidth: number
}

interface TypographicAnnotationEngineProps {
    config?: Partial<AnnotationConfig>
}

const DEFAULT_CONFIG: AnnotationConfig = {
    fontSize: 42,
    fontFamily: "'Geist', system-ui, sans-serif",
    bg: '#ECEBE7',
    primary: '#1a1a1a',
    padLeft: 54,
    padRight: 40,
    padTop: 70,
    bottomPad: 36,
    nodeRRatio: 0.055,
    spaceBarAboveRatio: 0.22,
    bottomLineBelowRatio: 0.32,
    lineSpacing: 2.5,
    tabSpaces: 4,
    maxLineWidth: 800,
    maxChars: 80
}

export default function TypographicAnnotationEngine({ config: configOverride }: TypographicAnnotationEngineProps) {
    const cfg: AnnotationConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...configOverride }), [configOverride])
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!containerRef.current) return
        const container = containerRef.current as HTMLDivElement

        const stage = document.createElement('div')
        stage.style.cssText = 'position:relative; display:inline-block;'

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        svg.style.cssText = 'display:block; overflow:visible; position:relative; z-index:1; pointer-events:none;'
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
        svg.setAttribute('aria-hidden', 'true')

        const ghost = document.createElement('textarea')
        ghost.setAttribute('spellcheck', 'false')
        ghost.setAttribute('autocomplete', 'off')
        ghost.setAttribute('autocorrect', 'off')
        ghost.setAttribute('autocapitalize', 'off')
        ghost.setAttribute('aria-label', 'Type here to see typographic annotations')
        ghost.style.cssText = [
            'position:absolute',
            'top:0', 'left:0',
            'z-index:2',
            'outline:none',
            'resize:none',
            'overflow:hidden',
            'background:transparent',
            'color:transparent',
            '-webkit-text-fill-color:transparent',
            'caret-color:transparent',
            'padding:0',
            'margin:0',
            'cursor:text',
            'white-space:pre',
        ].join(';')

        const measureCanvas = document.createElement('canvas')
        measureCanvas.style.display = 'none'
        const ctx = measureCanvas.getContext('2d')!

        stage.appendChild(svg)
        stage.appendChild(ghost)
        container.appendChild(stage)
        container.appendChild(measureCanvas)

        function ns(tag: string) {
            return document.createElementNS('http://www.w3.org/2000/svg', tag)
        }

        function makeLine(
            x1: number, y1: number,
            x2: number, y2: number,
            dashed: boolean,
            dash: string,
        ): SVGLineElement {
            const l = ns('line') as SVGLineElement
            l.setAttribute('x1', String(x1)); l.setAttribute('y1', String(y1))
            l.setAttribute('x2', String(x2)); l.setAttribute('y2', String(y2))
            l.setAttribute('stroke', cfg.primary)
            l.setAttribute('stroke-width', dashed ? '0.85' : '1')
            if (dashed) {
                l.setAttribute('stroke-dasharray', dash)
                l.setAttribute('opacity', '0.45')
            }
            return l
        }

        function makeCircle(cx: number, cy: number, r: number): SVGCircleElement {
            const c = ns('circle') as SVGCircleElement
            c.setAttribute('cx', String(cx)); c.setAttribute('cy', String(cy))
            c.setAttribute('r', String(r))
            c.setAttribute('fill', cfg.primary)
            return c
        }

        function measureLine(lineText: string): LineMetrics {
            const text = lineText || ' '
            const words = text.split(' ')
            const wordWidths = words.map(w => ctx.measureText(w).width)
            const spaceWidth = ctx.measureText(' ').width
            const totalWidth = wordWidths.reduce((a, b) => a + b, 0) + spaceWidth * (words.length - 1)
            return { words, wordWidths, spaceWidth, totalWidth }
        }

        function wordWrap(rawText: string): string {
            const spaceWidth = ctx.measureText(' ').width
            const outputLines: string[] = []

            rawText.split('\n').forEach(paragraph => {
                if (paragraph === '') { outputLines.push(''); return }

                const words = paragraph.split(' ')
                let currentLine = ''
                let currentWidth = 0

                words.forEach(word => {
                    const wordW = ctx.measureText(word).width
                    if (currentLine === '') {
                        currentLine = word
                        currentWidth = wordW
                    } else {
                        const projected = currentWidth + spaceWidth + wordW
                        if (projected <= cfg.maxLineWidth) {
                            currentLine += ' ' + word
                            currentWidth = projected
                        } else {
                            outputLines.push(currentLine)
                            currentLine = word
                            currentWidth = wordW
                        }
                    }
                })
                if (currentLine !== '') outputLines.push(currentLine)
            })

            return outputLines.join('\n')
        }

        function rewrapGhost() {
            ctx.font = `${cfg.fontSize}px ${cfg.fontFamily}`
            const start = ghost.selectionStart
            const end = ghost.selectionEnd
            const wrapped = wordWrap(ghost.value)
            if (wrapped !== ghost.value) {
                ghost.value = wrapped
                ghost.selectionStart = start
                ghost.selectionEnd = end
            }
        }

        function drawRow(
            lineText: string,
            li: number,
            capHeight: number,
            lineStep: number,
            nodeR: number,
            spaceBarAbove: number,
            bottomLineBelow: number,
            dash: string,
        ) {
            const { words, wordWidths, spaceWidth, totalWidth } = measureLine(lineText)

            const baselineY = cfg.padTop + capHeight + li * lineStep
            const capY = cfg.padTop + li * lineStep
            const spaceBarY = capY - spaceBarAbove
            const bottomLineY = baselineY + bottomLineBelow

            const leftX = cfg.padLeft
            const rightX = cfg.padLeft + totalWidth

            const textEl = ns('text') as SVGTextElement
            textEl.setAttribute('x', String(leftX))
            textEl.setAttribute('y', String(baselineY))
            textEl.setAttribute('font-family', cfg.fontFamily)
            textEl.setAttribute('font-size', String(cfg.fontSize))
            textEl.setAttribute('fill', cfg.primary)
            textEl.setAttribute('dominant-baseline', 'auto')
            textEl.textContent = lineText
            svg.appendChild(textEl)
            svg.appendChild(makeLine(leftX, bottomLineY, rightX, bottomLineY, false, dash))
            svg.appendChild(makeCircle(leftX, bottomLineY, nodeR))
            svg.appendChild(makeCircle(rightX, bottomLineY, nodeR))

            const armX = leftX - Math.max(10, cfg.fontSize * 0.38)
            svg.appendChild(makeLine(armX, capY, armX, baselineY, false, dash))
            svg.appendChild(makeCircle(armX, capY, nodeR))
            svg.appendChild(makeCircle(armX, baselineY, nodeR))
            svg.appendChild(makeLine(armX, capY, rightX, capY, true, dash))
            svg.appendChild(makeLine(armX, baselineY, rightX, baselineY, true, dash))
            svg.appendChild(makeLine(rightX, capY, rightX, bottomLineY, true, dash))
            svg.appendChild(makeCircle(rightX, capY, nodeR))

            let curX = leftX
            for (let i = 0; i < words.length - 1; i++) {
                curX += wordWidths[i]
                const spL = curX
                const spR = curX + spaceWidth

                svg.appendChild(makeLine(spL, spaceBarY, spR, spaceBarY, false, dash))
                svg.appendChild(makeCircle(spL, spaceBarY, Math.max(0.5, nodeR - 0.5)))
                svg.appendChild(makeCircle(spR, spaceBarY, Math.max(0.5, nodeR - 0.5)))
                svg.appendChild(makeLine(spL, spaceBarY, spL, baselineY, true, dash))
                svg.appendChild(makeLine(spR, spaceBarY, spR, baselineY, true, dash))

                curX += spaceWidth
            }
        }

        function render() {
            ctx.font = `${cfg.fontSize}px ${cfg.fontFamily}`

            const capHeight = cfg.fontSize * 0.72
            const lineStep = cfg.fontSize * cfg.lineSpacing
            const nodeR = Math.min(3.2, Math.max(1.2, cfg.fontSize * cfg.nodeRRatio))
            const spaceBarAbove = Math.min(13, Math.max(6, cfg.fontSize * cfg.spaceBarAboveRatio))
            const bottomLineBelow = Math.min(18, Math.max(7, cfg.fontSize * cfg.bottomLineBelowRatio))
            const dashLen = Math.min(5, Math.max(2, cfg.fontSize * 0.08)).toFixed(1)
            const gapLen = Math.min(7, Math.max(3, cfg.fontSize * 0.10)).toFixed(1)
            const dash = `${dashLen} ${gapLen}`

            const displayLines = ghost.value.split('\n')
            const n = displayLines.length
            const metrics = displayLines.map(l => measureLine(l))
            const maxWidth = Math.max(...metrics.map(m => m.totalWidth))

            const lastBaseline = cfg.padTop + capHeight + (n - 1) * lineStep
            const lastBotLine = lastBaseline + bottomLineBelow
            const svgW = cfg.padLeft + maxWidth + cfg.padRight
            const svgH = lastBotLine + cfg.bottomPad

            svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`)
            svg.setAttribute('width', String(svgW))
            svg.setAttribute('height', String(svgH))
            svg.innerHTML = ''

            const bgRect = ns('rect') as SVGRectElement
            bgRect.setAttribute('x', '0')
            bgRect.setAttribute('y', '0')
            bgRect.setAttribute('width', String(svgW))
            bgRect.setAttribute('height', String(svgH))
            bgRect.setAttribute('fill', cfg.bg)
            svg.appendChild(bgRect)

            displayLines.forEach((line, li) => {
                drawRow(line, li, capHeight, lineStep, nodeR, spaceBarAbove, bottomLineBelow, dash)
            })

            // Sync ghost textarea geometry with the SVG so cursor
            // sits at the same logical position as the annotation rows
            ghost.style.width = svgW + 'px'
            ghost.style.height = svgH + 'px'
            ghost.style.fontSize = cfg.fontSize + 'px'
            ghost.style.fontFamily = cfg.fontFamily
            ghost.style.lineHeight = lineStep + 'px'
            ghost.style.paddingTop = Math.max(0, cfg.padTop + capHeight - cfg.fontSize * 1.65) + 'px'
            // TUNABLE: this config was calibrated for Geist, so please re-check if font changes
            ghost.style.paddingLeft = cfg.padLeft + 'px'

            stage.style.width = svgW + 'px'
            stage.style.height = svgH + 'px'
        }

        function handleKeyDown(this: HTMLTextAreaElement, e: KeyboardEvent) {
            if (e.key === 'Tab') {
                e.preventDefault()
                const start = this.selectionStart
                const end = this.selectionEnd
                const spaces = ' '.repeat(cfg.tabSpaces)
                this.value = this.value.slice(0, start) + spaces + this.value.slice(end)
                this.selectionStart = this.selectionEnd = start + cfg.tabSpaces
                rewrapGhost()
                render()
            }
        }

        function handleInput() {
            if (ghost.value.length > cfg.maxChars) {
                const pos = ghost.selectionStart
                ghost.value = ghost.value.slice(0, cfg.maxChars)
                ghost.selectionStart = ghost.selectionEnd = Math.min(pos, cfg.maxChars)
            }
            rewrapGhost()
            render()
        }

        ghost.addEventListener('keydown', handleKeyDown)
        ghost.addEventListener('input', handleInput)

        ghost.value = ''
        document.fonts.ready.then(render)
        setTimeout(render, 80)

        //Cleanup on unmount 
        return () => {
            ghost.removeEventListener('keydown', handleKeyDown)
            ghost.removeEventListener('input', handleInput)
            container.removeChild(stage)
            container.removeChild(measureCanvas)
        }
    }, [cfg])

    return (
        <div
            ref={containerRef}
            aria-label="Typographic Annotation"
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                minHeight: '380px',
                backgroundColor: cfg.bg,
                borderRadius: 'var(--radius-lg)',
                overflow: 'auto',
                padding: '4rem'
            }}
        />
    )
}