import GithubIcon from '@/components/visuals/GithubIcon'
// import NewsletterForm from '@/components/Newsletter/NewsletterForm'
import Link from 'next/link'
import type { Category } from '@/lib/experiments'
// import Aurora from '@/components/visuals/Aurora'
import GreatWave from '@/components/visuals/GreatWave'

const categories: { slug: Category; label: string }[] = [
    {slug: 'cursor', label: 'Cursor'},
    {slug: 'simulation', label: 'Simulation'},
    {slug: 'typography', label: 'Typography'},
    {slug: 'others', label: 'Others'}
]

export default function HomePage() {
    return (
        <>
            {/* <Aurora/> */}
            <a
                href="https://github.com/seth-b27/lab-8191"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View source on GitHub"
                className="opacity-100 hover:opacity-70 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-purple)] rounded-sm"
                style={{ position: 'fixed', top: 'var(--space-md)', right: 'var(--gutter)', zIndex: 50 }}
            >
                <GithubIcon />
            </a>

            <main className="page-container" style={{paddingTop: 'var(--space-2xl)'}}>
                <section aria-label="Intro" style={{maxWidth: '80ch'}}>
                    <h1
                        style={{
                            fontSize: 'clamp(1.75rem, 3.5vw, 2.25rem)',
                            fontWeight: 700,
                            lineHeight: 1.2,
                            color: 'var(--color-ink)',
                        }}
                    >
                        Lab 8191
                    </h1>

                    <p
                        style={{
                            fontSize: 'var(--text-sub)',
                            lineHeight: 1.7,
                            color: 'var(--color-muted)',
                            marginTop: 'var(--space-md)',
                        }}
                    >
                        Lab 8191 is an archive of some ubiquitous, interactive UI components. You have probably seen them all before, and now
                        they are yours to explore.
                    </p>
                </section>

                <nav
                    aria-label="Experiment categories"
                    style={{ marginTop: 'var(--space-xl)', borderTop: '1px solid rgba(0,0,0,0.15)'}}
                >
                    <ul>
                        {categories.map(({slug, label }) => (
                            <li key={slug} style={{ borderBottom: '1px solid rgba(0,0,0,0.15)' }}>
                                <Link
                                    href={`/${slug}`}
                                    className="block transition-colors hover:bg-[var(--color-panel-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-purple)]"
                                    style={{
                                        padding: 'var(--space-xs) var(--space-xs)',
                                        fontSize: 'var(--text-sub)',
                                        color: 'var(--color-ink)',
                                        transitionDuration: 'var(--duration-base)',
                                    }}
                                >
                                    {label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* <NewsletterForm /> */}
                <GreatWave/>
            </main>
        </>
    )
}