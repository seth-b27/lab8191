'use client'

import { useEffect, useRef } from 'react'
const CONFIG = {
    images: [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80',
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&q=80',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80',
        'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=400&q=80',
        'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=400&q=80',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80',
        'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=80',
        'https://images.unsplash.com/photo-1494783367193-149034c05e8f?w=400&q=80',
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80',
    ],
    maxImages: 10,
    distance: 25,
    fadeInDuration: 120,
    fadeOutDelay: 600,
    fadeOutDuration: 400,
    scaleIn: 0.85,
    scaleOut: 0.72,
    maxRotate: 12,
    imgW: 112,
    imgH: 144,
}

interface TrailImg extends HTMLImageElement {
    _fadeTimer?: ReturnType<typeof setTimeout>
}

export default function CursorImgTrail() {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!containerRef.current) return
        const container = containerRef.current as HTMLDivElement

        let poolIndex = 0
        let imgIndex = 0
        let lastX = -999
        let lastY = -999
        const pool: TrailImg[] = []


        for (let i = 0; i < CONFIG.maxImages; i++) {
            const img = document.createElement('img') as TrailImg
            img.draggable = false
            img.alt = ''
            img.src = CONFIG.images[i % CONFIG.images.length]

            Object.assign(img.style, {
                position: 'absolute',
                pointerEvents: 'none',
                willChange: 'transform, opacity',
                transformOrigin: 'center center',
                userSelect: 'none',
                opacity: '0',
                borderRadius: '4px',
                objectFit: 'cover',
                width: `${CONFIG.imgW}px`,
                height: `${CONFIG.imgH}px`,
            })

            container.appendChild(img)
            pool.push(img)
        }


        CONFIG.images.forEach(src => {
            const preload = new Image()
            preload.src = src
        })
        function spawnImage(x: number, y: number) {
            const img = pool[poolIndex]
            poolIndex = (poolIndex + 1) % CONFIG.maxImages

            const src = CONFIG.images[imgIndex % CONFIG.images.length]
            imgIndex = (imgIndex + 1) % CONFIG.images.length

            const rotate = (Math.random() - 0.5) * 2 * CONFIG.maxRotate

            const w = img.offsetWidth || CONFIG.imgW
            const h = img.offsetHeight || CONFIG.imgH

            const left = x - w / 2
            const top = y - h / 2

            if (img.src !== src) img.src = src


            clearTimeout(img._fadeTimer)

            img.style.transition = 'none'
            img.style.left = `${left}px`
            img.style.top = `${top}px`
            img.style.opacity = '0'
            img.style.transform = `rotate(${rotate}deg) scale(${CONFIG.scaleIn})`


            img.getBoundingClientRect()

            img.style.transition = [
                `opacity${CONFIG.fadeInDuration}ms ease-out`,
                `transform ${CONFIG.fadeInDuration}ms ease-out`,
            ].join(', ')
            img.style.opacity = '1'
            img.style.transform = `rotate(${rotate}deg) scale(1)`

            img._fadeTimer = setTimeout(() => {
                img.style.transition = [
                    `opacity${CONFIG.fadeOutDuration}ms ease-in`,
                    `transform ${CONFIG.fadeOutDuration}ms ease-in`,
                ].join(', ')
                img.style.opacity = '0'
                img.style.transform = `rotate(${rotate}deg) scale(${CONFIG.scaleOut})`
            }, CONFIG.fadeOutDelay)
        }


        function onMove(x: number, y: number) {
            const dx = x - lastX
            const dy = y - lastY
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist >= CONFIG.distance) {
                spawnImage(x, y)
                lastX = x
                lastY = y
            }
        }

        function onMouseMove(e: MouseEvent) {
            const rect = container.getBoundingClientRect()
            onMove(e.clientX - rect.left, e.clientY - rect.top)
        }

        function onTouchMove(e: TouchEvent) {
            const rect = container.getBoundingClientRect()
            onMove(
                e.touches[0].clientX - rect.left,
                e.touches[0].clientY - rect.top,
            )
        }

        container.addEventListener('mousemove', onMouseMove)
        container.addEventListener('touchmove', onTouchMove, { passive: true })

        return () => {
            container.removeEventListener('mousemove', onMouseMove)
            container.removeEventListener('touchmove', onTouchMove)
            pool.forEach(img => {
                clearTimeout(img._fadeTimer)
                container.removeChild(img)
            })
        }
    }, [])

    return (
        <div
            ref={containerRef}
            aria-label="Cursor image trail interactive preview — move your cursor to scatter photos"
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                minHeight: '320px',
                backgroundColor: '#1c1b1b',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                cursor: 'none',
            }}
        />
    )
}