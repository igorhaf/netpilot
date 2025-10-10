'use client'

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface TerminalMessageProps {
  content: string
  isCommand?: boolean
}

export function TerminalMessage({ content, isCommand }: TerminalMessageProps) {
  if (isCommand) {
    // Comando do usuário - estilo de prompt bash
    return (
      <div className="font-mono text-sm bg-blue-900 p-2 rounded border border-gray-600">
        <div className="flex items-start gap-2">
          <span className="text-green-500 font-bold select-none">$</span>
          <SyntaxHighlighter
            language="bash"
            style={vscDarkPlus}
            PreTag="span"
            customStyle={{
              background: 'transparent',
              padding: 0,
              margin: 0,
              fontSize: '0.875rem',
              display: 'inline',
            }}
            codeTagProps={{
              style: {
                background: 'transparent',
                padding: 0,
              }
            }}
          >
            {content}
          </SyntaxHighlighter>
        </div>
      </div>
    )
  }

  // Saída do comando - estilo terminal output
  return (
    <div className="font-mono text-sm bg-red-900 p-2 rounded border border-gray-600">
      <div className="text-yellow-300 text-xs mb-1">TERMINAL OUTPUT:</div>
      <SyntaxHighlighter
        language="bash"
        style={vscDarkPlus}
        PreTag="div"
        customStyle={{
          background: 'rgba(0, 0, 0, 0.5)',
          padding: '0.75rem',
          borderRadius: '0.375rem',
          margin: 0,
          fontSize: '0.875rem',
        }}
      >
        {content}
      </SyntaxHighlighter>
    </div>
  )
}
