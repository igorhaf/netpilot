import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { Terminal, Wifi, WifiOff, History, Command, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useProjectTerminal } from '@/hooks/useProjectTerminal'

interface ProjectTerminalProps {
  projectId: string
  projectAlias: string
}

export function ProjectTerminal({ projectId, projectAlias }: ProjectTerminalProps) {
  const [command, setCommand] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState(0)
  const [showHistory, setShowHistory] = useState(false)

  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    isConnected,
    terminalOutput,
    commandHistory,
    currentPath,
    isExecuting,
    suggestions,
    executeCommand,
    navigateHistory,
    getAutocompleteSuggestions,
    clearTerminal,
    getPrompt
  } = useProjectTerminal({ projectId, projectAlias })

  // Auto-scroll para baixo quando novo output chegar
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [terminalOutput])

  // Focar no input quando componente montar
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Handle key events
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (showSuggestions && suggestions.length > 0) {
        setCommand(suggestions[selectedSuggestion])
        setShowSuggestions(false)
        setSelectedSuggestion(0)
      } else {
        executeCommand(command)
        setCommand('')
        setShowSuggestions(false)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (showSuggestions) {
        setSelectedSuggestion(Math.max(0, selectedSuggestion - 1))
      } else if (showHistory) {
        // Navigate command history
        const historyCommand = navigateHistory('up')
        if (historyCommand) {
          setCommand(historyCommand)
        }
      } else {
        const historyCommand = navigateHistory('up')
        if (historyCommand) {
          setCommand(historyCommand)
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (showSuggestions) {
        setSelectedSuggestion(Math.min(suggestions.length - 1, selectedSuggestion + 1))
      } else {
        const historyCommand = navigateHistory('down')
        setCommand(historyCommand)
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      if (suggestions.length > 0) {
        setCommand(suggestions[0])
        setShowSuggestions(false)
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setShowHistory(false)
    } else if (e.ctrlKey && e.key === 'c') {
      e.preventDefault()
      setCommand('')
      setShowSuggestions(false)
    } else if (e.ctrlKey && e.key === 'l') {
      e.preventDefault()
      clearTerminal()
    }
  }

  // Handle input change
  const handleInputChange = (value: string) => {
    setCommand(value)

    if (value.trim()) {
      const suggestions = getAutocompleteSuggestions(value.trim())
      setShowSuggestions(suggestions.length > 0)
      setSelectedSuggestion(0)
    } else {
      setShowSuggestions(false)
    }
  }

  // Execute command
  const handleExecuteCommand = () => {
    if (command.trim()) {
      executeCommand(command)
      setCommand('')
      setShowSuggestions(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm font-medium">
              {isConnected ? `Conectado ao projeto ${projectAlias}` : 'Desconectado'}
            </span>
          </div>
          <Badge variant="secondary">{currentPath}</Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1"
          >
            <History className="h-3 w-3" />
            Histórico ({commandHistory.length})
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearTerminal}
            className="flex items-center gap-1"
          >
            <Command className="h-3 w-3" />
            Limpar
          </Button>
        </div>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="p-3 bg-muted/30 rounded-lg border">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico de Comandos
          </h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {commandHistory.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum comando executado ainda</p>
            ) : (
              commandHistory.slice(-10).map((cmd, index) => (
                <div
                  key={cmd.id}
                  className="text-xs font-mono p-2 bg-background rounded cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    setCommand(cmd.command)
                    setShowHistory(false)
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-foreground">{cmd.command}</span>
                    <span className="text-muted-foreground">
                      {cmd.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Terminal Output */}
      <div
        ref={terminalRef}
        className="bg-black rounded-lg p-4 font-mono text-sm h-96 overflow-y-auto relative"
      >
        {terminalOutput.map((line, index) => (
          <div key={index} className="text-green-400 mb-1 whitespace-pre-wrap">
            {line}
          </div>
        ))}

        {/* Current prompt line */}
        <div className="flex items-center text-green-400">
          <span className="text-blue-400">{getPrompt()}&nbsp;</span>
          {isExecuting && (
            <div className="w-2 h-4 bg-green-400 animate-pulse"></div>
          )}
        </div>
      </div>

      {/* Command Input Area */}
      <div className="space-y-2">
        {/* Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="p-2 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-3 w-3 text-yellow-500" />
              <span className="text-xs font-medium">Sugestões (Tab para completar)</span>
            </div>
            <div className="grid grid-cols-3 gap-1 max-h-20 overflow-y-auto">
              {suggestions.slice(0, 12).map((suggestion, index) => (
                <button
                  key={suggestion}
                  className={`text-xs p-1 rounded font-mono text-left transition-colors ${
                    index === selectedSuggestion
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-muted'
                  }`}
                  onClick={() => {
                    setCommand(suggestion)
                    setShowSuggestions(false)
                    inputRef.current?.focus()
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <div className="flex items-center bg-black text-green-400 px-3 py-2 rounded font-mono text-sm">
            {getPrompt()}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isConnected ? "Digite um comando..." : "Aguarde conexão..."}
            className="flex-1 px-3 py-2 bg-input border border-border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={!isConnected || isExecuting}
          />
          <Button
            onClick={handleExecuteCommand}
            disabled={!command.trim() || !isConnected || isExecuting}
            variant="secondary"
            className="px-4"
          >
            {isExecuting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            ) : (
              'Executar'
            )}
          </Button>
        </div>

        {/* Keyboard shortcuts help */}
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">Atalhos:</span> ↑/↓ Histórico • Tab Autocomplete • Ctrl+L Limpar • Ctrl+C Cancelar • Enter Executar
        </div>
      </div>
    </div>
  )
}