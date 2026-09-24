import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";

export const metadata: Metadata = {
    title: '404'
}

export default function NotFound() {
    return (
        <>
            <Header/>
            <main
                className="flex flex-col items-center justify-center text-center"
                style={{ minHeight: 'calc(100vh - 125px)' }} 
            >
                <div
                    className="flex items-center font-bold"
                    style={{
                        fontSize: 'clamp(1.75rem, 3.5vw, 2.25rem)',
                        lineHeight: 1.2,
                        letterSpacing: '-0.02em',
                        color: 'var(--color-accent-purple)'
                    }}
                >
                    Experiment Not Found
                </div>

                <p
                    className="text-center"
                    style={{
                        fontSize: 'var(--text-sub)',
                        lineHeight: 1.7,
                        color: 'var(--color-muted)',
                        marginTop: 'var(--space-md)',
                        padding: '0 0.5rem',
                        width: '100%',
                        maxWidth: '64ch',
                    }}
                >
                    Either it never made it past the prototype stage, or you followed a broken link. How about we go back to our{' '}
                    <span aria-hidden="true">[</span>
                    <Link
                        href='/'
                        className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-purple)]"
                        style={{ color: 'var(--color-accent-purple)' }}
                    >
                        home page
                    </Link>
                    <span aria-hidden="true">]?</span>
                </p>
            </main>
        </>
    )
}