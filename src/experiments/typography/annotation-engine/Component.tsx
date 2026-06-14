'use client'

import { useEffect, useRef } from 'react'

//Fixed constants 
const FONT_SIZE = 42
const FONT_FAMILY = "'Instrument Serif', Georgia, serif"
const BG = '#ECEBE7'
const PRIMARY = '#1a1a1a'

const PAD_LEFT = 54
const PAD_RIGHT = 40
const PAD_TOP = 70
const BOTTOM_PAD = 36

const NODE_R_RATIO = 0.055
const SPACE_BAR_ABOVE_RATIO = 0.22
const BOTTOM_LINE_BELOW_RATIO = 0.32
const LINE_SPACING = 2.2
const TAB_SPACES = 4
const MAX_LINE_WIDTH = 800
const MAX_CHARS = 54

//Component 
export default function TypographicAnnotationEngine() {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!containerRef.current) return
        const container = containerRef.current as HTMLDivElement

        const stage = document.createElement('div')
        stage.style.cssText = 'position:relative; display:inline-block;'

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        svg.style.cssText = 'display:block; overflow:visible; position:relative; z-index:1; pointer-events:none;'
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

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
            l.setAttribute('stroke', PRIMARY)
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
            c.setAttribute('fill', PRIMARY)
            return c
        }

        function measureLine(lineText: string) {
            const text = lineText || ' '
            const words = text.split(' ')
            const wordWidths = words.map(w => ctx.measureText(w).width)
            const spaceWidth = ctx.measureText(' ').width
            const totalWidth = wordWidths.reduce((a, b) => a + b, 0)
                + spaceWidth * (words.length - 1)
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
                        if (projected <= MAX_LINE_WIDTH) {
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

            const baselineY = PAD_TOP + capHeight + li * lineStep
            const capY = PAD_TOP + li * lineStep
            const spaceBarY = capY - spaceBarAbove
            const bottomLineY = baselineY + bottomLineBelow

            const leftX = PAD_LEFT
            const rightX = PAD_LEFT + totalWidth

            const textEl = ns('text') as SVGTextElement
            textEl.setAttribute('x', String(leftX))
            textEl.setAttribute('y', String(baselineY))
            textEl.setAttribute('font-family', FONT_FAMILY)
            textEl.setAttribute('font-size', String(FONT_SIZE))
            textEl.setAttribute('fill', PRIMARY)
            textEl.setAttribute('dominant-baseline', 'auto')
            textEl.textContent = lineText
            svg.appendChild(textEl)

            svg.appendChild(makeLine(leftX, bottomLineY, rightX, bottomLineY, false, dash))
            svg.appendChild(makeCircle(leftX, bottomLineY, nodeR))
            svg.appendChild(makeCircle(rightX, bottomLineY, nodeR))

            const armX = leftX - Math.max(10, FONT_SIZE * 0.38)
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
            ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`

            const capHeight = FONT_SIZE * 0.72
            const lineStep = FONT_SIZE * LINE_SPACING

            const nodeR = Math.min(3.2, Math.max(1.2, FONT_SIZE * NODE_R_RATIO))
            const spaceBarAbove = Math.min(13, Math.max(6, FONT_SIZE * SPACE_BAR_ABOVE_RATIO))
            const bottomLineBelow = Math.min(18, Math.max(7, FONT_SIZE * BOTTOM_LINE_BELOW_RATIO))
            const dashLen = Math.min(5, Math.max(2, FONT_SIZE * 0.08)).toFixed(1)
            const gapLen = Math.min(7, Math.max(3, FONT_SIZE * 0.10)).toFixed(1)
            const dash = `${dashLen} ${gapLen}`

            const displayLines = wordWrap(ghost.value).split('\n')
            const n = displayLines.length
            const metrics = displayLines.map(l => measureLine(l))
            const maxWidth = Math.max(...metrics.map(m => m.totalWidth))

            const lastBaseline = PAD_TOP + capHeight + (n - 1) * lineStep
            const lastBotLine = lastBaseline + bottomLineBelow
            const svgW = PAD_LEFT + maxWidth + PAD_RIGHT
            const svgH = lastBotLine + BOTTOM_PAD

            svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`)
            svg.setAttribute('width', String(svgW))
            svg.setAttribute('height', String(svgH))
            svg.innerHTML = ''

            const bg = ns('rect') as SVGRectElement
            bg.setAttribute('x', '0')
            bg.setAttribute('y', '0')
            bg.setAttribute('width', String(svgW))
            bg.setAttribute('height', String(svgH))
            bg.setAttribute('fill', BG)
            svg.appendChild(bg)

            displayLines.forEach((line, li) => {
                drawRow(line, li, capHeight, lineStep, nodeR, spaceBarAbove, bottomLineBelow, dash)
            })

            // Sync ghost textarea geometry with the SVG so cursor
            // sits at the same logical position as the annotation rows
            ghost.style.width = svgW + 'px'
            ghost.style.height = svgH + 'px'
            ghost.style.fontSize = FONT_SIZE + 'px'
            ghost.style.fontFamily = FONT_FAMILY
            ghost.style.lineHeight = lineStep + 'px'
            ghost.style.paddingTop = Math.max(0, PAD_TOP + capHeight - FONT_SIZE * 0.8) + 'px'
            ghost.style.paddingLeft = PAD_LEFT + 'px'

            stage.style.width = svgW + 'px'
            stage.style.height = svgH + 'px'
        }

        ghost.addEventListener('keydown', function (e) {
            if (e.key === 'Tab') {
                e.preventDefault()
                const start = this.selectionStart
                const end = this.selectionEnd
                const spaces = ' '.repeat(TAB_SPACES)
                this.value = this.value.slice(0, start) + spaces + this.value.slice(end)
                this.selectionStart = this.selectionEnd = start + TAB_SPACES
                render()
            }
        })

        ghost.addEventListener('input', function () {
            if (ghost.value.length > MAX_CHARS) {
                const pos = ghost.selectionStart
                ghost.value = ghost.value.slice(0, MAX_CHARS)
                ghost.selectionStart = ghost.selectionEnd = Math.min(pos, MAX_CHARS)
            }
            render()
        })

        ghost.value = ''
        document.fonts.ready.then(render)
        setTimeout(render, 80)

        //Cleanup on unmount 
        return () => {
            ghost.removeEventListener('input', render)
            ghost.removeEventListener('keydown', render)
            container.removeChild(stage)
            container.removeChild(measureCanvas)
        }
    }, [])

    return (
        <div
            ref={containerRef}
            aria-label="Typographic annotation engine — type to see annotations"
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                minHeight: '320px',
                backgroundColor: BG,
                borderRadius: 'var(--radius-lg)',
                overflow: 'auto',
                padding: '4rem',
                border: '1px solid var(--color-border)',
            }}
        />
    )
}