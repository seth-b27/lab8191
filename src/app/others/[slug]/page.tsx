import type { Metadata } from 'next'
import path from 'path'
import fs from 'fs/promises'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'

import CategoryLayout from '@/components/CategoryLayout'
import NewsletterForm from '@/components/NewsletterForm'
import Footer from '@/components/Footer'
import CodeBlock from '@/components/CodeBlock'
import { othersExperiments } from '@/experiments/others'

type Props = { params: Promise<{ slug: string }> }

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
        <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.1)', margin: 'var(--space-md) 0' }} />
    ),
    p: ({ children }: { children?: React.ReactNode }) => (
        <p style={{ marginBottom: 'var(--space-sm)', lineHeight: 1.7 }}>{children}</p>
    ),
}

export async function generateStaticParams() {
    return othersExperiments.map(e => ({ slug: e.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    const exp = othersExperiments.find(e => e.slug === slug)
    if (!exp) return {}
    return { title: exp.title }
}

export default async function OthersSlugPage({ params }: Props) {
    const { slug } = await params
    const exp = othersExperiments.find(e => e.slug === slug)
    if (!exp) notFound()

    const source = await fs.readFile(
        path.join(process.cwd(), 'src', 'experiments', exp.contentPath), 'utf8'
    )

    const mdxContent = <MDXRemote source={source} components={MDX_COMPONENTS} />

    return (
        <>
            <CategoryLayout
                category="others"
                experiments={othersExperiments}
                activeSlug={slug}
                mdxContent={mdxContent}
            />
            <NewsletterForm />
            <Footer />
        </>
    )
}