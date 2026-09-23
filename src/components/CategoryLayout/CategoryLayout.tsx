'use client'

import React from 'react'

// import { useCallback } from 'react'
import { useRouter } from 'next/navigation'

import type { Experiment, Category } from '@/lib/experiments'
import { CATEGORY_META } from '@/lib/experiments'
import { useState, useEffect, useCallback, useRef } from 'react'
import Header from '@/components/Header'
import styles from './CategoryLayout.module.css'

type NavItem = Pick<Experiment, 'slug' | 'title'>

type CategoryLayoutProps = {
    category: Category
    experiments: NavItem[]
    activeSlug: string
    activeTitle?: string
    demoElement: React.ReactNode
    mdxContent: React.ReactNode
}

export default function CategoryLayout({
    category,
    experiments,
    activeSlug,
    activeTitle,
    demoElement,
    mdxContent
}: CategoryLayoutProps) {
    const meta = CATEGORY_META[category]
    const router = useRouter()
    const [drawerOpen, setDrawerOpen] = useState(false)

    const handleSelect = useCallback((slug: string) => {
        setDrawerOpen(false)
        router.push(`/${category}/${slug}`)
    }, [category, router])


    useEffect(() => {
        experiments.forEach(exp => {
            if (exp.slug !== activeSlug) {
                router.prefetch(`/${category}/${exp.slug}`)
            }
        })
    }, [experiments, category, activeSlug, router])

    useEffect(() => {

        // responsive
        function handleResize() {
            if (window.innerWidth >= 768) setDrawerOpen(false)
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        document.body.style.overflow = drawerOpen ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [drawerOpen])

    const drawerRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)

    // Focus: tab through only the elements inside the panel
    useEffect(() => {
        if (!drawerOpen) return

        const panel = drawerRef.current
        if (!panel) return

        const focusableSelector =
            'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        const getFocusable = () => Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector))

        getFocusable()[0]?.focus()

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                setDrawerOpen(false)
                return
            }
            if (e.key !== 'Tab') return

            const focusable = getFocusable()
            if (focusable.length === 0) return
            const first = focusable[0]
            const last = focusable[focusable.length - 1]

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault()
                last.focus()
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault()
                first.focus()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [drawerOpen])

    const wasOpenRef = useRef(false)
    useEffect(() => {
        if (wasOpenRef.current && !drawerOpen) {
            triggerRef.current?.focus()
        }
        wasOpenRef.current = drawerOpen
    }, [drawerOpen])


    // ----- 
    const buildNav = (prefix: string) => (
        <nav aria-label={`${meta.label} experiments`}>

            {/* label on left side */}
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sub)', fontWeight: 400, color: 'var(--color-muted)', marginBottom: 'var(--space-sm)'}}>
                {meta.label}
            </p>

            {/* radio */}
            <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                <legend className="sr-only">Select an experiment</legend>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                    {experiments.map((exp) => (
                        <label
                            key={exp.slug}
                            htmlFor={`${prefix}-exp-${exp.slug}`}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.6rem',
                                cursor: 'pointer', fontFamily: 'var(--font-sans)',
                                fontSize: 'var(--text-body)', color: 'var(--color-ink)',
                                transition: `color var(--duration-base) ease`,
                            }}
                        >
                            <input
                                id={`${prefix}-exp-${exp.slug}`}
                                type="radio"
                                name={`${prefix}-experiment`}
                                value={exp.slug}
                                checked={activeSlug === exp.slug}
                                onChange={() => handleSelect(exp.slug)}
                                className={styles.radio}
                                style={{ cursor: 'pointer',flexShrink: 0}}
                            />
                            {exp.title}
                        </label>
                    ))}
                </div>
            </fieldset>

        </nav>
    )



    // -------
    const PanelContent = (
        <div className={`${styles.panel} ${styles.visible}`}>
            {demoElement && (
                <div
                    aria-label={`Live preview of ${activeTitle}`}
                    className={styles.demoBox}
                    style={{ width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 'var(--space-md)' }}
                >
                    {demoElement}
                </div>
            )}
            {mdxContent && (
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-body)', lineHeight: 1.7, color: 'var(--color-ink)'}}>
                    {mdxContent}
                </div>
            )}
        </div>
    )

    const hamburgerButton = (
        <button
            ref={triggerRef}
            type="button"
            aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={drawerOpen}
            aria-controls="mobile-drawer"
            onClick={() => setDrawerOpen(prev => !prev)}
            className="md:hidden flex flex-col"
            style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '0.25rem', color: 'var(--color-ink)', gap: '4px',
            }}
        >
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    aria-hidden="true"
                    style={{
                        display: 'block', width: '22px', height: '2px',
                        backgroundColor: 'var(--color-ink)', borderRadius: '4px',
                        transformOrigin: 'center',
                        transition: `transform var(--duration-base) var(--ease-reveal), opacity var(--duration-base) ease`,
                        transform: drawerOpen
                            ? i === 0 ? 'translateY(6px) rotate(45deg)'
                                : i === 2 ? 'translateY(-6px) rotate(-45deg)'
                                    : 'scaleX(0)'
                            : 'none',
                        opacity: drawerOpen && i === 1 ? 0 : 1,
                    }}
                />
            ))}
        </button>
    )


    return (
        <div style={{ minHeight: '100vh' }}>
            <Header mobileAction={hamburgerButton}/>
            <div
                ref={drawerRef}
                id="mobile-drawer"
                role="dialog"
                aria-modal="true"
                aria-label="Experiment navigation"
                className={`${styles.mobileMenu}${drawerOpen ? ` ${styles.mobileMenuOpen}` : ''}`}
            >
                {buildNav('drawer')}
            </div>

            {/* layout on full screen*/}
            <div
                className="hidden md:grid page-container"
                style={{
                    gridTemplateColumns: '1fr 4fr',
                    gap: 'var(--space-xl)', alignItems: 'start',
                    paddingTop: 'var(--space-lg)', paddingBottom: 'var(--space-2xl)',
                }}
            >

                <aside aria-label="Experiment navigation" style={{ position: 'sticky', top: 'var(--space-lg)' }}>
                    {buildNav('sidebar')}
                </aside>

                <main style={{ minWidth: 0, overflow: 'hidden' }}>
                    {/* right side */}
                    <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-lg)', fontWeight: 500, color: 'var(--color-ink)', marginBottom: 'var(--space-md)' }}>
                        {activeTitle}
                    </h1>
                    {PanelContent}
                </main>
                
            </div>
            
            <div className="md:hidden" style={{ padding: 'var(--space-md) var(--gutter-sm) var(--space-2xl)' }}>
                <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-md)', fontWeight: 500, color: 'var(--color-ink)', marginBottom: 'var(--space-md)' }}>
                    {activeTitle}
                </h1>
                {PanelContent}
            </div>
        </div>
    )
}