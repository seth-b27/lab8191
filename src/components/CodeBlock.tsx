'use client'

import React, { useState } from 'react'

type TokenType =
    | 'comment'
    | 'string'
    | 'keyword'
    | 'number'
    | 'tag'
    | 'property'
    | 'function'
    | 'default'

type Token = {
    type: TokenType
    value: string
}

// JS / TS keywords 
const JS_KEYWORDS = new Set([
    'const', 'let', 'var', 'function', 'return', 'if', 'else',
    'for', 'while', 'do', 'switch', 'case', 'break', 'continue',
    'new', 'this', 'typeof', 'instanceof', 'in', 'of', 'import',
    'export', 'default', 'from', 'class', 'extends', 'super',
    'try', 'catch', 'finally', 'throw', 'async', 'await', 'yield',
    'true', 'false', 'null', 'undefined', 'void', 'delete',
    'static', 'get', 'set', 'type', 'interface', 'enum',
])

//Tokenizer 
function tokenize(code: string): Token[] {
    const tokens: Token[] = []
    let i = 0

    while (i < code.length) {

        // Block comment  /* ... */
        if (code[i] === '/' && code[i + 1] === '*') {
            const end = code.indexOf('*/', i + 2)
            const value = end === -1 ? code.slice(i) : code.slice(i, end + 2)
            tokens.push({ type: 'comment', value })
            i += value.length
            continue
        }

        // Line comment  // ...
        if (code[i] === '/' && code[i + 1] === '/') {
            const end = code.indexOf('\n', i)
            const value = end === -1 ? code.slice(i) : code.slice(i, end)
            tokens.push({ type: 'comment', value })
            i += value.length
            continue
        }

        // Template literal  ` ... `
        if (code[i] === '`') {
            let j = i + 1
            while (j < code.length && code[j] !== '`') {
                if (code[j] === '\\') j++
                j++
            }
            tokens.push({ type: 'string', value: code.slice(i, j + 1) })
            i = j + 1
            continue
        }

        // String literal  ' ... ' or " ... "
        if (code[i] === '"' || code[i] === "'") {
            const quote = code[i]
            let j = i + 1
            while (j < code.length && code[j] !== quote) {
                if (code[j] === '\\') j++
                j++
            }
            tokens.push({ type: 'string', value: code.slice(i, j + 1) })
            i = j + 1
            continue
        }

        // JSX / HTML tag  <Tag or </Tag
        if (code[i] === '<' && /[a-zA-Z/]/.test(code[i + 1] ?? '')) {
            let j = i + 1
            while (j < code.length && code[j] !== '>' && code[j] !== ' ' && code[j] !== '\n') j++
            tokens.push({ type: 'tag', value: code.slice(i, j) })
            i = j
            continue
        }

        // Number literal
        if (/[0-9]/.test(code[i])) {
            let j = i
            while (j < code.length && /[0-9._]/.test(code[j])) j++
            tokens.push({ type: 'number', value: code.slice(i, j) })
            i = j
            continue
        }

        // Word — keyword, function call, or property
        if (/[a-zA-Z_$]/.test(code[i])) {
            let j = i
            while (j < code.length && /[a-zA-Z0-9_$]/.test(code[j])) j++
            const word = code.slice(i, j)

            if (JS_KEYWORDS.has(word)) {
                tokens.push({ type: 'keyword', value: word })
            } else if (code[j] === '(') {
                tokens.push({ type: 'function', value: word })
            } else if (code[i - 1] === '.') {
                tokens.push({ type: 'property', value: word })
            } else {
                tokens.push({ type: 'default', value: word })
            }

            i = j
            continue
        }

        // Dot accessor
        if (code[i] === '.') {
            tokens.push({ type: 'default', value: '.' })
            i++
            continue
        }

        tokens.push({ type: 'default', value: code[i] })
        i++
    }

    return tokens
}

//Token → CSS class map 
const CLASS_MAP: Record<TokenType, string> = {
    comment: 'token-comment',
    string: 'token-string',
    keyword: 'token-keyword',
    number: 'token-number',
    tag: 'token-tag',
    property: 'token-property',
    function: 'token-function',
    default: 'token-default',
}

type CodeBlockProps = {
    code: string
    language?: string
    className?: string
}

export default function CodeBlock({ code, language, className = '' }: CodeBlockProps) {
    const [copied, setCopied] = useState(false)

    const trimmed = code.trim()
    const lines = trimmed.split('\n')
    const tokens = tokenize(trimmed)

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(trimmed)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            // fallback 4 browsers without clipboard API
            const el = document.createElement('textarea')
            el.value = trimmed
            el.style.position = 'fixed'
            el.style.opacity = '0'
            document.body.appendChild(el)
            el.select()
            document.execCommand('copy')
            document.body.removeChild(el)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const lineTokens: Token[][] = [[]]
    for (const token of tokens) {
        if (token.value.includes('\n')) {
            const parts = token.value.split('\n')
            parts.forEach((part, idx) => {
                if (idx > 0) lineTokens.push([])
                if (part) lineTokens[lineTokens.length - 1].push({ type: token.type, value: part })
            })
        } else {
            lineTokens[lineTokens.length - 1].push(token)
        }
    }

    while (lineTokens.length > 0 && lineTokens[lineTokens.length - 1].length === 0) {
        lineTokens.pop()
    }

    const lineCount = lineTokens.length

    return (
        <div
            className={className}
            style={{
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(0,0,0,0.1)',
                overflow: 'hidden',
                marginBottom: 'var(--space-sm)',
            }}
        >
            {/*  language badge + copy btn  */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'var(--code-bg)',
                    borderBottom: '1px solid rgba(0,0,0,0.08)',
                    padding: '0.35rem 0.75rem',
                }}
            >
                <span
                    style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-caption)',
                        color: 'var(--color-muted)',
                        letterSpacing: '0.04em',
                    }}
                >
                    {language || 'code'}
                </span>

                <button
                    type="button"
                    onClick={handleCopy}
                    aria-label={copied ? 'Copied!' : 'Copy code'}
                    style={{
                        background: 'none',
                        border: '1px solid rgba(0,0,0,0.12)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        padding: '0.2rem 0.55rem',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-caption)',
                        color: copied ? 'var(--color-muted)' : 'var(--color-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        transition: `opacity var(--duration-base) ease`,
                        opacity: copied ? 0.6 : 1,
                    }}
                >
                    {copied ? '✓ copied':'copy'}
                </button>
            </div>

            {/*  code snippet */}
            <div
                style={{
                    display: 'flex',
                    backgroundColor: 'var(--code-bg)',
                    overflowX: 'auto',
                    marginBottom: '1rem',
                }}
            >
                {/*  Line number gutter  */}
                <div
                    aria-hidden="true"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        padding: '1.25rem 0.75rem 1.25rem 1rem',
                        borderRight: '1px solid rgba(0,0,0,0.06)',
                        backgroundColor: 'rgba(0,0,0,0.02)',
                        userSelect: 'none',
                        flexShrink: 0,
                    }}
                >
                    {Array.from({ length: lineCount }, (_, idx) => (
                        <span
                            key={idx}
                            style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 'var(--text-caption)',
                                lineHeight: 1.7,
                                color: 'rgba(0,0,0,0.25)',
                                minWidth: `${String(lineCount).length}ch`,
                            }}
                        >
                            {idx + 1}
                        </span>
                    ))}
                </div>

                {/*  syntax highlight  */}
                <pre
                    style={{
                        margin: 0,
                        padding: '1.25rem 1rem',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-caption)',
                        lineHeight: 1.7,
                        tabSize: 4,
                        flex: 1,
                        overflowX: 'auto',
                    }}
                >
                    <code>
                        {lineTokens.map((line, lineIdx) => (
                            <span key={lineIdx} style={{ display: 'block' }}>
                                {line.length > 0
                                    ? line.map((token, tIdx) => (
                                        <span key={tIdx} className={CLASS_MAP[token.type]}>
                                            {token.value}
                                        </span>
                                    ))
                                    : '\u00A0' // non-breaking space for empty lines
                                }
                            </span>
                        ))}
                    </code>
                </pre>
            </div>
        </div>
    )
}