import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { Send, Terminal as TerminalIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useProjectTerminal } from '@/hooks/useProjectTerminal'

interface ProjectTerminalProps {
  projectId: string
  projectAlias: string
}

// Converter códigos ANSI para classes CSS
const parseAnsiColors = (text: string): JSX.Element[] => {
  const ansiRegex = /\x1b\[([0-9;]+)m/g
  const parts: JSX.Element[] = []
  let lastIndex = 0
  let currentClasses: string[] = []

  const colorMap: { [key: string]: string } = {
    '30': 'text-gray-800',
    '31': 'text-red-400',
    '32': 'text-green-400',
    '33': 'text-yellow-300',
    '34': 'text-blue-400',
    '35': 'text-purple-400',
    '36': 'text-cyan-400',
    '37': 'text-gray-300',
    '90': 'text-gray-600',
    '91': 'text-red-300',
    '92': 'text-green-300',
    '93': 'text-yellow-200',
    '94': 'text-blue-300',
    '95': 'text-purple-300',
    '96': 'text-cyan-300',
    '97': 'text-white',
    '1': 'font-bold',
    '2': 'opacity-60',
    '3': 'italic',
    '4': 'underline',
  }

  let match
  while ((match = ansiRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const textPart = text.slice(lastIndex, match.index)
      parts.push(
        <span key={lastIndex} className={currentClasses.length > 0 ? currentClasses.join(' ') : 'text-gray-200'}>
          {textPart}
        </span>
      )
    }

    const codes = match[1].split(';')
    if (codes.includes('0')) {
      currentClasses = []
    } else {
      codes.forEach(code => {
        if (colorMap[code]) {
          currentClasses.push(colorMap[code])
        }
      })
    }

    lastIndex = ansiRegex.lastIndex
  }

  if (lastIndex < text.length) {
    const textPart = text.slice(lastIndex)
    parts.push(
      <span key={lastIndex} className={currentClasses.length > 0 ? currentClasses.join(' ') : 'text-gray-200'}>
        {textPart}
      </span>
    )
  }

  return parts.length > 0 ? parts : [<span key="0" className="text-gray-200">{text}</span>]
}

export function ProjectTerminal({ projectId, projectAlias }: ProjectTerminalProps) {
  const [command, setCommand] = useState('')
  const [currentLine, setCurrentLine] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)

  const {
    isConnected,
    terminalOutput,
    isExecuting,
    executeCommand,
    navigateHistory,
  } = useProjectTerminal({ projectId, projectAlias })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [terminalOutput])

  // Focus no terminal quando clicar
  useEffect(() => {
    const handleClick = () => {
      terminalRef.current?.focus()
    }
    const terminal = terminalRef.current?.parentElement
    terminal?.addEventListener('click', handleClick)
    return () => terminal?.removeEventListener('click', handleClick)
  }, [])

  const handleTerminalKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!isConnected || isExecuting) return

    if (e.key === 'Enter') {
      e.preventDefault()
      if (currentLine.trim()) {
        executeCommand(currentLine)
        setCurrentLine('')
        setCursorPosition(0)
      }
    } else if (e.key === 'Backspace') {
      e.preventDefault()
      if (cursorPosition > 0) {
        setCurrentLine(prev => prev.slice(0, cursorPosition - 1) + prev.slice(cursorPosition))
        setCursorPosition(prev => prev - 1)
      }
    } else if (e.key === 'Delete') {
      e.preventDefault()
      if (cursorPosition < currentLine.length) {
        setCurrentLine(prev => prev.slice(0, cursorPosition) + prev.slice(cursorPosition + 1))
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      setCursorPosition(prev => Math.max(0, prev - 1))
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      setCursorPosition(prev => Math.min(currentLine.length, prev + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const historyCommand = navigateHistory('up')
      if (historyCommand) {
        setCurrentLine(historyCommand)
        setCursorPosition(historyCommand.length)
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const historyCommand = navigateHistory('down')
      if (historyCommand) {
        setCurrentLine(historyCommand)
        setCursorPosition(historyCommand.length)
      }
    } else if (e.key === 'Home') {
      e.preventDefault()
      setCursorPosition(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setCursorPosition(currentLine.length)
    } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault()
      setCurrentLine(prev => prev.slice(0, cursorPosition) + e.key + prev.slice(cursorPosition))
      setCursorPosition(prev => prev + 1)
    }
  }

  const handleSendCommand = () => {
    if (!command.trim() || !isConnected) return
    executeCommand(command)
    setCommand('')
  }

  return (
    <div className="h-[calc(100vh-180px)]">
      <Card className="h-full flex flex-col">
        <CardContent
          className="flex-1 overflow-y-auto p-6 space-y-1 bg-gray-950 font-mono text-sm cursor-text"
          ref={terminalRef}
          tabIndex={0}
          onKeyDown={handleTerminalKeyDown}
        >
          {terminalOutput.map((line, idx) => (
            <div key={idx} className="whitespace-pre-wrap break-words leading-relaxed">
              {parseAnsiColors(line)}
            </div>
          ))}

          {/* Prompt atual */}
          <div className="flex items-center">
            <span className="text-emerald-400 font-bold">{projectAlias}</span>
            <span className="text-gray-500">@</span>
            <span className="text-sky-400 font-bold">netpilot</span>
            <span className="text-gray-500">:</span>
            <span className="text-blue-400">~</span>
            <span className="text-purple-400 font-bold">$&nbsp;</span>
            <span className="flex-1 text-gray-200">
              {currentLine.slice(0, cursorPosition)}
              <span className="bg-gray-200 text-gray-950">
                {cursorPosition < currentLine.length ? currentLine[cursorPosition] : ' '}
              </span>
              {currentLine.slice(cursorPosition + 1)}
            </span>
          </div>

          <div ref={messagesEndRef} />
        </CardContent>

        <div className="p-2 border-t">
          <div className="flex gap-2 items-end">
            <Textarea
              placeholder="Campo reservado para uso futuro..."
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              className="min-h-[36px] max-h-[120px] resize-none py-2 font-mono"
              rows={1}
              disabled={true}
            />
            <Button
              onClick={handleSendCommand}
              size="sm"
              className="h-9 w-9 flex-shrink-0 p-0"
              disabled={true}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
