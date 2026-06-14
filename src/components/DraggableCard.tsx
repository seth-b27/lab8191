'use client'
import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'

const thumbnailMap: Record<string, string> = {
    cursor: '/icons/cursor.jpg',
    typography: '/icons/typo.jpg',
    simulation: '/icons/simulations.jpg',
    others: '/icons/others.jpg',
}

type DraggableCardProps = {
    slug: string
    label: string
    thumbnail: string
    style?: React.CSSProperties
}

export default function DraggableCard({
    slug,
    label,
    thumbnail,
    style,
}: DraggableCardProps) {
    const dragged = useRef(false)

    return (
        <motion.div
            className="lab-card absolute"
            style={{ width: '260px', ...style }}
            drag
            dragMomentum={false}
            dragElastic={0.08}
            whileDrag={{ scale: 1.04, zIndex: 50 }}
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            onDragStart={()=>{ dragged.current = true }}
            onDragEnd={()=>{
                setTimeout(()=>{ dragged.current = false }, 100)
            }}
        >
            {/* CARD BODY W. IMAGE INSIDE */}
            <div
                style={{
                    padding: '0.85rem 0.85rem 0',
                    backgroundColor: '#ffffff',
                    borderRadius: 'var(--radius-card) var(--radius-card) 0 0',
                }}
            >
                {/* thumbnail */}
                <div
                    style={{
                        position: 'relative',
                        height: '150px',
                        width: '100%',
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                    }}
                    aria-hidden="true"
                >
                    <Image
                        src={thumbnailMap[thumbnail]}
                        alt=""
                        fill
                        draggable={false}
                        style={{ objectFit: 'contain' }}
                    />
                </div>
            </div>

            {/*  the white area below thumbnail  */}
            <div
                className="flex items-center justify-center"
                style={{
                    padding: '0.75rem 0.6rem 0.9rem',
                    backgroundColor: '#ffffff',
                    borderRadius: '0 0 var(--radius-card) var(--radius-card)',
                }}
            >
                <p
                    style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: 'var(--text-md)',
                        color: 'var(--color-ink)',
                        lineHeight: 1,
                    }}
                >
                    {label}
                </p>
            </div>

            {/* Full-card link overlay  */}
            <Link
                href={`/${slug}`}
                className="absolute inset-0 rounded-[var(--radius-card)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-purple)]"
                aria-label={`Go to ${label} experiments`}
                draggable={false}
                onClick={(e)=>{if (dragged.current) e.preventDefault()}}
            />
        </motion.div>
    )
}