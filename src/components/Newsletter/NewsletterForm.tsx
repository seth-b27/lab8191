'use client'

import { useEffect, useState } from 'react'
import styles from './NewsletterForm.module.css'
// import { subscribeToNewsletter } from '@/lib/subscribe'

type Status = 'idle' | 'loading' | 'success' | 'error'
type ErrorType = 'invalid' | 'server' | null

const SUCCESS = 'Submitted =)'
const INVALID = 'Please enter a valid email address.'
const ERROR = 'Something went wrong. Please try again.'
const SUCCESS_VISIBLE_MS = 5000

export default function NewsletterForm() {
    const [status, setStatus] = useState<Status>('idle')
    const [errorType, setErrorType] = useState<ErrorType>(null)
    const [email, setEmail] = useState('')

    useEffect(() => {
        if (status !== 'success') return
        const timer = setTimeout(() => {
            setStatus('idle')
        }, SUCCESS_VISIBLE_MS)
        return () => clearTimeout(timer)
    }, [status])


    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setEmail(e.target.value)
        if (status === 'error') {
            setStatus('idle')
            setErrorType(null)
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (status === 'loading') return;

        setStatus('loading')
        // const result = await subscribeToNewsletter(email)

        // if (result.ok) {
        //     setStatus('success')
        //     setEmail('')
        // } else {
        //     setStatus('error')
        //     setErrorType(result.error)
        // }
    }

    const tooltipVisible = status === 'loading' || status === 'success' || status === 'error'
    const tooltipMessage = status === 'loading' ? 'Sending…' : status === 'error' ? (errorType === 'invalid' ? INVALID : ERROR) : SUCCESS
    // i got it correct, right? RIGHT?

    return (
        <section
            aria-label="Newsletter"
            style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-xl)'}}
        >
            <p
                style={{
                    fontSize: 'var(--text-md)',
                    lineHeight: 1.1,
                    color: 'var(--color-ink)',
                    marginBottom: 'var(--space-sm)',
                }}
            >
                Yep, there are more to come!
            </p>

            <form
                onSubmit={handleSubmit}
                aria-label="Subscribe for updates"
                noValidate
                style={{ position: 'relative', width: '18rem', maxWidth: '100%' }}
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
                    disabled={status === 'loading'} // also guards against a stale-value resubmit 
                    placeholder="johndoe@gmail.com"
                    value={email}
                    onChange={handleChange}
                    aria-describedby="newsletter-tooltip"
                    className={styles.emailInput}
                    style={{ width: '100%'}}
                />
                <p
                    id="newsletter-tooltip"
                    role={status === 'error' ? 'alert' : 'status'}
                    aria-live={status === 'error' ? 'assertive' : 'polite'}
                    className={`${styles.tooltip}${tooltipVisible ? ` ${styles.tooltipVisible}` : ''}`}
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: 'var(--space-xs)',
                        fontSize: 'var(--text-caption)',
                        color: status === 'error' ? '#d32f2f' : status === 'loading' ? 'var(--color-muted)' : 'var(--color-accent-purple)',
                    }}
                >
                    {tooltipVisible ? tooltipMessage : ''}
                </p>
            </form>
            <p
                style={{
                    fontSize: 'var(--text-caption)',
                    color: 'var(--color-muted)',
                    marginTop: '2rem',
                    // opacity: '0.6',
                    maxWidth: '60ch',
                }}
            >
                ⓘ By subscribing, you agree to receive email updates from Lab 8191. Unsubscribe any time.
            </p>
        </section>
    )
}