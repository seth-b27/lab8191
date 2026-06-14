'use client'

import { useState } from 'react'

type Status = 'idle' |'loading' | 'success'| 'error'

export default function NewsletterForm() {
    const [status, setStatus] = useState<Status>('idle')
    const [email, setEmail] = useState('')

    const EMAIL_RE = /^.+@.+\..+$/

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!email) return
        if (!EMAIL_RE.test(email.trim())) {
            setStatus('error')
            return
        }
        setStatus('success')
        setEmail('')
    }

    return (
        <section
            aria-label="Newsletter"
            className="page-container"
            style={{
                paddingTop: 'var(--space-2xl)',
                paddingBottom: 'var(--space-2xl)',
            }}
        >
            <p
                style={{
                    fontFamily:'var(--font-serif)',
                    fontSize:'clamp(2rem, 4vw, 3rem)',
                    lineHeight: 1.2,
                    color: 'var(--color-ink)',
                    marginBottom: 'var(--space-lg)',
                }}
            >
                Yep, there are more to come.
            </p>

            <form
                onSubmit={handleSubmit}
                aria-label="Subscribe for updates"
                noValidate
            >
                <label htmlFor="email-subscribe" className="sr-only">
                    Email address
                </label>
                <input
                    id="email-subscribe"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    disabled={status === 'loading' || status === 'success'}
                    placeholder="ramen@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="email-input"
                    style={{
                        fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
                        width: '28rem',
                        maxWidth: '100%',
                    }}
                />

                {status === 'success' && (
                    <p
                        role="status"
                        aria-live="polite"
                        style={{
                            fontFamily: 'var(--font-serif)',
                            fontSize: 'var(--text-body)',
                            color: '#008000',
                            marginTop:  'var(--space-xs)',
                        }}
                    >
                        thank you! many more interesting experiments await you.
                    </p>
                )}

                {status === 'error' && (
                    <p
                        role="alert"
                        aria-live="assertive"
                        style={{
                            fontFamily: 'var(--font-serif)',
                            fontSize:   'var(--text-body)',
                            color:      '#c0392b',
                            marginTop:  'var(--space-xs)',
                        }}
                    >
                        something went wrong. please try again.
                    </p>
                )}

            </form>
        </section>
    )
}