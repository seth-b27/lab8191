import DraggableCard from '@/components/DraggableCard'
import NewsletterForm from '@/components/NewsletterForm'
import Footer from '@/components/Footer'

const cards = [
    { slug: 'cursor', label: '# cursor', thumbnail: 'cursor' },
    { slug: 'typography', label: '# typography', thumbnail: 'typography' },
    { slug: 'simulation', label: '# simulation', thumbnail: 'simulation' },
    { slug: 'others', label: '# others', thumbnail: 'others' },
]

export default function HomePage() {
    return (
        <>
            <main>

                <section
                    aria-label="Hero"
                    className="flex flex-col items-center justify-center text-center"
                    style={{
                        minHeight: '100vh',
                        paddingLeft: 'var(--gutter)',
                        paddingRight: 'var(--gutter)',
                    }}
                >
                    <div className="relative inline-block">
                        <h1
                            style={{
                                fontFamily: 'var(--font-serif)',
                                fontSize: 'clamp(5rem, 16vw, 14rem)',
                                fontWeight: 700,
                                lineHeight: 1,
                                letterSpacing: '-0.01em',
                                color: 'var(--color-ink)' }}
                        >
                            LAB 8191
                        </h1>

                        {/*  sticky card */}
                        <div
                            aria-hidden="true"
                            className="absolute rotate-[-15deg]"
                            style={{
                                bottom: '0.5rem',
                                right: '-3rem',
                                backgroundColor: 'var(--color-blue)',
                                borderRadius: '3px',
                                padding: '0.25rem 0.75rem',
                                boxShadow: '1px 2px 8px rgba(0,0,0,0.13)',
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: 'var(--font-belle)',
                                    fontSize: 'clamp(0.9rem, 2vw, 1.4rem)',
                                    color: 'var(--color-ink)',
                                }}
                            >
                                under development
                            </span>
                        </div>
                    </div>

                    <p
                        style={{
                            fontFamily: 'var(--font-serif)',
                            fontSize: 'clamp(1.1rem, 2.2vw, 1.75rem)',
                            lineHeight: 1.55,
                            color: 'var(--color-ink)',
                            maxWidth: '38rem',
                            marginTop: 'var(--space-xl)',
                        }}
                    >
                        {/* Lab 8191 is a collection of some interactively cliché UI
                        components, the kind you’ve seen everywhere, and now yours to
                        interact with. */}
                        Lab 8191 is an archive of familiar, ubiquitous interactive UI components. You have probably seen them all before, but now they are yours to explore.
                    </p>
                </section>

                <section
                    aria-label="Experiment categories"
                    className="dot-grid relative w-full overflow-hidden"
                    style={{ height: '680px' }}
                >
                    <DraggableCard {...cards[0]} style={{ top: '12%', left: '10%' }} />
                    <DraggableCard {...cards[1]} style={{ top: '20%', right: '10%' }} />
                    <DraggableCard {...cards[2]} style={{ top: '54%', left: '16%' }} />
                    <DraggableCard {...cards[3]} style={{ top: '58%', right: '14%' }} />
                </section>

                <NewsletterForm />

            </main>
            <Footer />
        </>
    )
}