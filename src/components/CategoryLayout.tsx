'use client'

import React from 'react'

// import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import CodeBlock from '@/components/CodeBlock'
import type { Experiment, Category } from '@/lib/experiments'
import { CATEGORY_META } from '@/lib/experiments'
import { useState, useEffect, useCallback } from 'react'

const MDX_COMPONENTS = {
    pre: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    code: ({ className, children }: { className?: string; children?: React.ReactNode }) => {
        if (!className) {
            return (
                <code style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-caption)',
                    color: 'var(--code-ink)',
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.1em 0.35em',
                }}>
                    {children}
                </code>
            )
        }
        const language = className.replace('language-', '')
        return <CodeBlock code={String(children ?? '').trim()} language={language} className="my-4" />
    },
    strong: ({ children }: { children?: React.ReactNode }) => (
        <strong style={{ fontWeight: 600, color: 'var(--color-ink)' }}>{children}</strong>
    ),
    hr: () => (
        <hr style={{ border: 'none', 
            borderTop: '1px solid rgba(0,0,0,0.1)', 
            margin: 'var(--space-md) 0' }} />
    ),
    p: ({ children }: { children?: React.ReactNode }) => (
        <p style={{ marginBottom: 'var(--space-sm)', lineHeight: 1.7 }}>{children}</p>
    ),
}

type CategoryLayoutProps = {
    category: Category
    experiments: Experiment[]
    activeSlug: string
    mdxContent: React.ReactNode
}

export default function CategoryLayout({
    category,
    experiments,
    activeSlug,
    mdxContent,
}: CategoryLayoutProps) {
    const meta = CATEGORY_META[category]
    const router = useRouter()
    const [drawerOpen, setDrawerOpen] = useState(false)

    const activeExperiment = experiments.find(e => e.slug === activeSlug)
    const ActiveComponent = activeExperiment?.component

    const handleSelect = useCallback((slug: string) => {
        setDrawerOpen(false)
        router.push(`/${category}/${slug}`)
    }, [category, router])

    useEffect(() => {
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

    const buildNav = (prefix: string) => (
        <nav aria-label={`${meta.label} experiments`}>
            {/* label on left side */}
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-md)', fontWeight: 400, color: 'var(--color-ink)', marginBottom: 'var(--space-md)' }}>
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
                                style={{ cursor: 'pointer', flexShrink: 0 }}
                            />
                            {exp.title}
                        </label>
                    ))}
                </div>
            </fieldset>
        </nav>
    )

    const PanelContent = (
        <div className="experiment-panel experiment-visible">
            {ActiveComponent && (
                <div
                    aria-label={`Live preview of ${activeExperiment?.title}`}
                    style={{ width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 'var(--space-md)', minHeight: '320px' }}
                >
                    <ActiveComponent />
                </div>
            )}
            {mdxContent && (
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-body)', lineHeight: 1.7, color: 'var(--color-ink)' }}>
                    {mdxContent}
                </div>
            )}
        </div>
    )

    return (
        // ------
        <div style={{ minHeight: '100vh' }}>
            
            {/* the head: label + burger */}
            <header
                className="flex items-center justify-between md:hidden"
                style={{
                    padding: 'var(--space-sm) var(--gutter-sm)',
                    borderBottom: '1px solid rgba(0,0,0,0.08)',
                    backgroundColor: 'var(--color-bg)',
                    position: 'sticky', top: 0, zIndex: 40,
                }}
            >
                <Link
                    href="/"
                    style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-lg)', color: 'var(--color-ink)' }}
                >
                    Lab 8191
                </Link>
                <button
                    type="button"
                    aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={drawerOpen}
                    aria-controls="mobile-drawer"
                    onClick={() => setDrawerOpen(prev => !prev)}
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '0.25rem', color: 'var(--color-ink)',
                        display: 'flex', flexDirection: 'column', gap: '5px',
                    }}
                >
                    {[0, 1, 2].map((i) => (
                        <span
                            key={i}
                            aria-hidden="true"
                            style={{
                                display: 'block', width: '22px', height: '1.5px',
                                backgroundColor: 'var(--color-ink)', borderRadius: '2px',
                                transformOrigin: 'center',
                                transition: `transform var(--duration-base) var(--ease-reveal), opacity var(--duration-base) ease`,
                                transform: drawerOpen
                                    ? i === 0 ? 'translateY(6.5px) rotate(45deg)'
                                        : i === 2 ? 'translateY(-6.5px) rotate(-45deg)'
                                            : 'scaleX(0)'
                                    : 'none',
                                opacity: drawerOpen && i === 1 ? 0 : 1,
                            }}
                        />
                    ))}
                </button>
            </header>

            {drawerOpen && (
                <div
                    aria-hidden="true"
                    onClick={() => setDrawerOpen(false)}
                    style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 50 }}
                />
            )}
            {/* side bar */}
            <div
                id="mobile-drawer"
                role="dialog"
                aria-modal="true"
                aria-label="Experiment navigation"
                style={{
                    position: 'fixed', top: 0, right: 0, bottom: 0,
                    width: '75vw', maxWidth: '20rem',
                    backgroundColor: 'var(--color-bg)', zIndex: 60,
                    padding: 'var(--space-xl) var(--space-lg)', overflowY: 'auto',
                    transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
                    transition: `transform var(--duration-slow) var(--ease-reveal)`,
                    boxShadow: drawerOpen ? '-4px 0 24px rgba(0,0,0,0.1)' : 'none',
                }}
            >
                {buildNav('drawer')}
            </div>

            {/* layout on full screen*/}
            <div
                className="hidden md:grid page-container"
                style={{
                    gridTemplateColumns: '1.5fr 3.5fr',
                    gap: 'var(--space-xl)', alignItems: 'start',
                    paddingTop: 'var(--space-lg)', paddingBottom: 'var(--space-2xl)',
                }}
            >
                <aside aria-label="Experiment navigation" style={{ position: 'sticky', top: 'var(--space-lg)' }}>
                    <Link
                        href="/"
                        style={{
                            display: 'block', fontFamily: 'var(--font-serif)',
                            fontSize: 'var(--text-2xl)', color: 'var(--color-ink)',
                            marginBottom: 'var(--space-xl)',
                            transition: `opacity var(--duration-base) ease`,
                        }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.6')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                        Lab 8191
                    </Link>
                    {buildNav('sidebar')}
                </aside>

                <main style={{ minWidth: 0, overflow: 'hidden' }}>
                    {/* right side */}
                    <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-lg)', fontWeight: 500, color: 'var(--color-ink)', marginBottom: 'var(--space-md)', paddingTop: 'var(--space-lg)' }}>
                        {activeExperiment?.title}
                    </h1>
                    {PanelContent}
                </main>
            </div>

            <div className="md:hidden" style={{ padding: 'var(--space-md) var(--gutter-sm) var(--space-2xl)' }}>
                <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-md)', fontWeight: 500, color: 'var(--color-ink)', marginBottom: 'var(--space-md)' }}>
                    {activeExperiment?.title}
                </h1>
                {PanelContent}
            </div>

        </div>
    )
}