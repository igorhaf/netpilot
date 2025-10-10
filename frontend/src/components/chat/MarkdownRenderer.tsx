'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check } from 'lucide-react'

interface MarkdownRendererProps {
  content: string
}

function CodeBlock({ language, children }: { language: string, children: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group border border-gray-600 rounded-lg">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded bg-gray-700/90 hover:bg-gray-600 opacity-70 hover:opacity-100 transition-all z-50 shadow-lg"
        title="Copiar código"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-400" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-gray-200" />
        )}
      </button>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language}
        PreTag="div"
        className="rounded-lg !mt-0 !mb-0"
        customStyle={{
          margin: 0,
          borderRadius: '0.375rem',
          fontSize: '0.75rem',
          padding: '0.5rem',
          paddingTop: '0.75rem',
          paddingRight: '2.5rem',
          border: 'none',
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  )
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        components={{
        code(props: any) {
          const { node, inline, className, children, ...rest } = props
          const match = /language-(\w+)/.exec(className || '')
          const language = match ? match[1] : ''

          return !inline && language ? (
            <CodeBlock language={language}>
              {String(children).replace(/\n$/, '')}
            </CodeBlock>
          ) : (
            <code
              className="bg-muted px-1 py-0.5 rounded text-xs font-mono"
              {...rest}
            >
              {children}
            </code>
          )
        },
        pre(props) {
          return <>{props.children}</>
        },
        p(props) {
          return <p className="mb-1 last:mb-0 text-xs">{props.children}</p>
        },
        ul(props) {
          return <ul className="list-disc list-inside mb-1 space-y-0.5 text-xs">{props.children}</ul>
        },
        ol(props) {
          return <ol className="list-decimal list-inside mb-1 space-y-0.5 text-xs">{props.children}</ol>
        },
        li(props) {
          return <li className="text-xs">{props.children}</li>
        },
        h1(props) {
          return <h1 className="text-base font-bold mb-1 mt-2 first:mt-0">{props.children}</h1>
        },
        h2(props) {
          return <h2 className="text-sm font-bold mb-1 mt-2 first:mt-0">{props.children}</h2>
        },
        h3(props) {
          return <h3 className="text-xs font-bold mb-1 mt-1 first:mt-0">{props.children}</h3>
        },
        blockquote(props) {
          return (
            <blockquote className="border-l-2 border-muted-foreground/30 pl-2 italic my-1 text-xs">
              {props.children}
            </blockquote>
          )
        },
        a(props) {
          return (
            <a
              href={props.href}
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {props.children}
            </a>
          )
        },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
