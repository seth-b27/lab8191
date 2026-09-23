import Link from 'next/link'
import type { ReactNode } from 'react'

type HeaderProps = {mobileAction?: ReactNode}

export default function Header({mobileAction}: HeaderProps) {
    return (
        <header
            style={{
                backgroundColor: 'var(--color-bg)',
                borderBottom: '1px solid rgba(0,0,0,0.12)',
                position: 'sticky', top: 0, zIndex: 50
            }}
        >
            <div className="page-container flex items-center justify-between" style={{ paddingTop: 'var(--space-sm)', paddingBottom: 'var(--space-sm)'}}>
                <Link
                    href="/"
                    style={{fontSize: 'var(--text-sub)'}}
                    className="select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-purple)] rounded-sm"
                >
                    Lab 8191
                </Link>
                {mobileAction}
            </div>
        </header>
    )
}