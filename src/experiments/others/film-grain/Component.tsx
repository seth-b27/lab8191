'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'

export interface FilmGrainProps {
    image?: string
}

const DEFAULTS = {
    image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1600&q=80',
}

export default function FilmGrain({
    image = DEFAULTS.image,
}: FilmGrainProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return
        const canvas = canvasRef.current as HTMLCanvasElement
        const container = containerRef.current as HTMLDivElement
        const ctx = canvas.getContext('2d')!

        let rafId = 0

        function resize() {
            canvas.width = container.clientWidth || container.offsetWidth
            canvas.height = container.clientHeight || container.offsetHeight
        }
        resize()

        const ro = new ResizeObserver(resize)
        ro.observe(container)

        function generateGrain() {
            const w = canvas.width
            const h = canvas.height
            if (!w || !h) { rafId = requestAnimationFrame(generateGrain); return }
            const imageData = ctx.createImageData(w, h)
            const data = imageData.data

            for (let i = 0; i < data.length; i += 4) {
                const v = Math.random() * 255
                data[i] = v
                data[i+1] = v
                data[i+2] = v
                data[i+3] = 255
            }

            ctx.putImageData(imageData, 0, 0)
            rafId = requestAnimationFrame(generateGrain)
        }

        generateGrain()

        return () => {
            cancelAnimationFrame(rafId)
            ro.disconnect()
        }
    }, [])

    return (
        <div
            ref={containerRef}
            aria-label="Film grain effect over a canvas"
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                minHeight: '380px',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
            }}
        >
            <Image
                src={image}
                alt=""
                aria-hidden="true"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{
                    objectFit: 'cover',
                    filter: 'grayscale(100%) brightness(0.55)'
                }}
            />

            <canvas
                ref={canvasRef}
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0.18,
                    mixBlendMode: 'overlay',
                    pointerEvents: 'none'
                }}
            />
        </div>
    )
}