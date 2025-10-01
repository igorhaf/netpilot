import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import io, { Socket } from 'socket.io-client'

interface TerminalCommand {
  id: string
  command: string
  output: string
  timestamp: Date
  exitCode?: number
  isRunning: boolean
}

interface UseProjectTerminalProps {
  projectId: string
  projectAlias: string
}

export function useProjectTerminal({ projectId, projectAlias }: UseProjectTerminalProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    `Conectando ao projeto ${projectAlias}...`,
    `Mudando para diretório /var/www/${projectAlias}`,
    `Terminal do projeto ${projectAlias} pronto!`
  ])
  const [commandHistory, setCommandHistory] = useState<TerminalCommand[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isExecuting, setIsExecuting] = useState(false)
  const [currentPath, setCurrentPath] = useState(`/var/www/${projectAlias}`)

  // Comandos pré-definidos para autocomplete
  const [suggestions, setSuggestions] = useState<string[]>([])
  const commonCommands = useMemo(() => [
    'ls', 'ls -la', 'pwd', 'cd', 'mkdir', 'rm', 'cp', 'mv', 'cat', 'grep',
    'npm install', 'npm run dev', 'npm run build', 'npm test', 'npm start',
    'yarn install', 'yarn dev', 'yarn build', 'yarn test',
    'git status', 'git add .', 'git commit', 'git push', 'git pull', 'git log',
    'docker ps', 'docker build', 'docker run', 'docker stop',
    'composer install', 'php artisan', 'python -m', 'pip install',
    'chmod +x', 'sudo', 'systemctl status', 'ps aux', 'top', 'htop',
    'tail -f', 'head', 'find', 'which', 'history', 'clear'
  ], [])

  const socketRef = useRef<Socket | null>(null)

  // Conectar ao WebSocket
  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'https://netpilot.meadadigital.com', {
      path: '/socket.io',
      transports: ['websocket'],
      query: {
        type: 'project-terminal',
        projectId,
        projectAlias
      }
    })

    socketRef.current = newSocket
    setSocket(newSocket)

    newSocket.on('connect', () => {
      setIsConnected(true)
      setTerminalOutput(prev => [...prev, `Conectado ao terminal do projeto ${projectAlias}`])
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
      setTerminalOutput(prev => [...prev, 'Conexão perdida com o terminal'])
    })

    newSocket.on('terminal:output', (data: { output: string; exitCode?: number }) => {
      setTerminalOutput(prev => [...prev, data.output])
      setIsExecuting(false)
    })

    newSocket.on('terminal:error', (data: { error: string }) => {
      setTerminalOutput(prev => [...prev, `Erro: ${data.error}`])
      setIsExecuting(false)
    })

    newSocket.on('terminal:path-changed', (data: { path: string }) => {
      setCurrentPath(data.path)
    })

    return () => {
      newSocket.disconnect()
    }
  }, [projectId, projectAlias])

  // Obter prompt atual
  const getPrompt = useCallback(() => {
    return `netpilot@${projectAlias}:${currentPath}$`
  }, [projectAlias, currentPath])

  // Lidar com comandos locais (fallback)
  const handleLocalCommand = useCallback((command: string) => {
    let output = ''

    if (command === 'pwd') {
      output = currentPath
    } else if (command === 'ls' || command === 'ls -la') {
      output = command === 'ls -la'
        ? 'drwxr-xr-x  3 netpilot netpilot 4096 Dec 15 10:30 .\ndrwxr-xr-x  5 netpilot netpilot 4096 Dec 15 09:15 ..\n-rw-r--r--  1 netpilot netpilot  220 Dec 15 09:15 .env\n-rw-r--r--  1 netpilot netpilot 1024 Dec 15 10:30 package.json\ndrwxr-xr-x  2 netpilot netpilot 4096 Dec 15 10:25 src'
        : 'package.json  src  .env'
    } else if (command.startsWith('cd ')) {
      const newPath = command.substring(3).trim()
      if (newPath === '..') {
        const pathParts = currentPath.split('/').filter(p => p)
        pathParts.pop()
        setCurrentPath('/' + pathParts.join('/') || '/')
      } else if (newPath.startsWith('/')) {
        setCurrentPath(newPath)
      } else {
        setCurrentPath(`${currentPath}/${newPath}`.replace('//', '/'))
      }
      output = ''
    } else if (command === 'whoami') {
      output = 'netpilot'
    } else if (command === 'date') {
      output = new Date().toString()
    } else if (command === 'clear') {
      setTerminalOutput([])
      setIsExecuting(false)
      return
    } else if (command === 'history') {
      output = commandHistory.map((cmd, index) => `${index + 1}  ${cmd.command}`).join('\n')
    } else if (command.startsWith('echo ')) {
      output = command.substring(5)
    } else if (command === 'git status') {
      output = 'On branch main\nYour branch is up to date with \'origin/main\'.\n\nnothing to commit, working tree clean'
    } else if (command === 'npm --version') {
      output = '10.2.4'
    } else if (command === 'node --version') {
      output = 'v20.10.0'
    } else {
      output = `bash: ${command.split(' ')[0]}: command not found`
    }

    if (output) {
      setTerminalOutput(prev => [...prev, output])
    }
    setIsExecuting(false)
  }, [currentPath, commandHistory, setCurrentPath, setTerminalOutput, setIsExecuting])

  // Executar comando
  const executeCommand = useCallback(async (command: string) => {
    if (!socket || !isConnected || !command.trim()) return

    const trimmedCommand = command.trim()
    setIsExecuting(true)

    // Adicionar comando ao histórico
    const newCommand: TerminalCommand = {
      id: Date.now().toString(),
      command: trimmedCommand,
      output: '',
      timestamp: new Date(),
      isRunning: true
    }

    setCommandHistory(prev => [...prev, newCommand])
    setTerminalOutput(prev => [...prev, `${getPrompt()} ${trimmedCommand}`])
    setHistoryIndex(-1)

    // Simular execução para comandos comuns (fallback se WebSocket não estiver disponível)
    if (!socket.connected) {
      setTimeout(() => {
        handleLocalCommand(trimmedCommand)
      }, 500)
      return
    }

    // Enviar comando via WebSocket
    socket.emit('terminal:execute', {
      command: trimmedCommand,
      projectId,
      workingDir: currentPath
    })
  }, [socket, isConnected, projectId, currentPath, getPrompt, handleLocalCommand])

  // Navegar pelo histórico
  const navigateHistory = useCallback((direction: 'up' | 'down') => {
    if (commandHistory.length === 0) return ''

    let newIndex = historyIndex

    if (direction === 'up') {
      newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1)
    } else {
      newIndex = historyIndex === -1 ? -1 : Math.min(commandHistory.length - 1, historyIndex + 1)
    }

    setHistoryIndex(newIndex)
    return newIndex >= 0 ? commandHistory[newIndex].command : ''
  }, [commandHistory, historyIndex])

  // Autocomplete
  const getAutocompleteSuggestions = useCallback((input: string) => {
    if (!input.trim()) return []

    const filtered = commonCommands.filter(cmd =>
      cmd.toLowerCase().startsWith(input.toLowerCase())
    )

    setSuggestions(filtered)
    return filtered
  }, [commonCommands])

  // Limpar terminal
  const clearTerminal = useCallback(() => {
    setTerminalOutput([])
  }, [])

  return {
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
  }
}