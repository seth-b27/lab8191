import type {ReactNode} from 'react'
import CodeBlock from '@/components/CodeBlock/CodeBlock'
import CodeFrom from '@/components/CodeBlock/CodeFrom'

export const mdxComponents = {
    pre: ({children}: { children?: ReactNode }) => <>{children}</>,
    
    code: ({className, children}: {className?: string; children?: ReactNode }) => {
        if (!className) {
            return (
                // `code`
                <code style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-caption)',
                    color: 'var(--code-muted)',
                    backgroundColor: 'rgba(0,0,0,0.04)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.1em 0.35em'
                }}>
                    {children}
                </code>
            )
        }
        const language = className.replace('language-', '')
        return <CodeBlock code={String(children ?? '').trim()} language={language} className="my-4"/>
    },

    strong: ({ children }: { children?: ReactNode }) => (
        <strong style={{ fontWeight: 600, color: 'var(--color-ink)' }}>{children}</strong>
    ),

    hr: () => (
        <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.1)', margin: 'var(--space-md) 0'}}/>
    ),

    p: ({ children}: {children?: ReactNode}) => (
        <p style={{ marginBottom: 'var(--space-sm)', lineHeight: 1.7}}>{children}</p>
    ),

    // literally forgot this tag exists 🫩
    table: ({ children}: {children?: ReactNode}) => (
        <div style={{ overflowX: 'auto', marginBottom: 'var(--space-md)' }}>
            <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 'var(--text-caption)',
                background: 'var(--code-bg)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--code-muted)'
            }}>
                {children}
            </table>
        </div>
    ),

    thead: ({children}:{children?: ReactNode}) => <thead>{children}</thead>,
    tbody: ({children}:{children?: ReactNode}) => <tbody>{children}</tbody>,
    tr: ({children}: {children?: ReactNode}) => <tr>{children}</tr>,
    th: ({children}:{children?: ReactNode}) => (
        <th style={{
            textAlign: 'left',
            padding: '0.5rem 0.75rem',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            color: 'var(--color-muted)'
        }}>
            {children}
        </th>
    ),
    td: ({ children }: { children?: ReactNode }) => (
        <td style={{
            padding: '0.5rem 0.75rem',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            verticalAlign: 'top',
        }}>
            {children}
        </td>
    ),

    CodeFrom,
}