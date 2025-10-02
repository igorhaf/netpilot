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
    `Mudando para diretório /home/${projectAlias}`,
    `Terminal do projeto ${projectAlias} pronto!`
  ])
  const [commandHistory, setCommandHistory] = useState<TerminalCommand[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isExecuting, setIsExecuting] = useState(false)
  const [currentPath, setCurrentPath] = useState(`/home/${projectAlias}`)

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
    // Usar a URL da API sem o /api no final
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://netpilot.meadadigital.com'
    const wsUrl = apiUrl.replace('/api', '')

    console.log(`🔌 Conectando WebSocket Terminal em: ${wsUrl}/terminal`)

    const newSocket = io(`${wsUrl}/terminal`, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      query: {
        type: 'project-terminal',
        projectId,
        projectAlias
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })

    socketRef.current = newSocket
    setSocket(newSocket)

    newSocket.on('connect', () => {
      console.log(`✅ WebSocket conectado! ID: ${newSocket.id}`)
      setIsConnected(true)
      setTerminalOutput(prev => [...prev, `Conectado ao terminal do projeto ${projectAlias}`])
    })

    newSocket.on('disconnect', (reason) => {
      console.log(`❌ WebSocket desconectado: ${reason}`)
      setIsConnected(false)
      setTerminalOutput(prev => [...prev, 'Conexão perdida com o terminal'])
    })

    newSocket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão WebSocket:', error)
      setTerminalOutput(prev => [...prev, `Erro de conexão: ${error.message}`])
    })

    // Escutar eventos do gateway
    newSocket.on('commandOutput', (data: { id: string; type: string; data: string; exitCode?: number }) => {
      console.log('📨 [Frontend] Received commandOutput:', data.type, data.data.substring(0, 50))
      if (data.type === 'stdout' || data.type === 'stderr') {
        setTerminalOutput(prev => [...prev, data.data])
      } else if (data.type === 'exit') {
        // Só mostrar mensagem de exit se não for código 0 (sucesso)
        if (data.exitCode !== 0) {
          setTerminalOutput(prev => [...prev, data.data])
        }
        setIsExecuting(false)
      } else if (data.type === 'error') {
        setTerminalOutput(prev => [...prev, `Erro: ${data.data}`])
        setIsExecuting(false)
      }
    })

    newSocket.on('commandStarted', (data: { commandId: string; command: string }) => {
      // Command started successfully
    })

    newSocket.on('commandError', (data: { commandId: string; error: string }) => {
      setTerminalOutput(prev => [...prev, `Erro: ${data.error}`])
      setIsExecuting(false)
    })

    return () => {
      newSocket.disconnect()
    }
  }, [projectId, projectAlias])

  // Obter prompt atual
  const getPrompt = useCallback(() => {
    return `${projectAlias}@${projectAlias}:${currentPath}$`
  }, [projectAlias, currentPath])

  // Lidar com comandos locais (fallback)
  const handleLocalCommand = useCallback((command: string) => {
    let output = ''

    if (command === 'pwd') {
      output = currentPath
    } else if (command === 'ls' || command === 'ls -la') {
      output = command === 'ls -la'
        ? `drwxr-xr-x  3 ${projectAlias} projects 4096 Dec 15 10:30 .\ndrwxr-xr-x  5 ${projectAlias} projects 4096 Dec 15 09:15 ..\n-rw-r--r--  1 ${projectAlias} projects  220 Dec 15 09:15 .env\n-rw-r--r--  1 ${projectAlias} projects 1024 Dec 15 10:30 package.json\ndrwxr-xr-x  2 ${projectAlias} projects 4096 Dec 15 10:25 code`
        : 'code'
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
      output = projectAlias
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
  }, [currentPath, commandHistory, projectAlias, setCurrentPath, setTerminalOutput, setIsExecuting])

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

    // Detectar e processar comandos cd localmente
    if (trimmedCommand.startsWith('cd ')) {
      const newPath = trimmedCommand.substring(3).trim()
      console.log('🚀 [cd] Processando cd localmente:', newPath, 'currentPath:', currentPath)

      let newFullPath = currentPath

      if (newPath === '..') {
        const pathParts = currentPath.split('/').filter(p => p)
        pathParts.pop()
        newFullPath = '/' + pathParts.join('/') || '/'
      } else if (newPath.startsWith('/')) {
        newFullPath = newPath
      } else if (newPath === '~' || newPath === '') {
        newFullPath = `/home/${projectAlias}`
      } else {
        const cleanCurrent = currentPath.endsWith('/') ? currentPath.slice(0, -1) : currentPath
        newFullPath = `${cleanCurrent}/${newPath}`
      }

      console.log('🚀 [cd] Novo path:', newFullPath)
      setCurrentPath(newFullPath)
      setIsExecuting(false)
      return
    }

    // Enviar comando via WebSocket (usando 'executeCommand' que é o que o gateway espera)
    socket.emit('executeCommand', {
      command: trimmedCommand,
      projectId,
      projectAlias,
      workingDir: currentPath
    })
  }, [socket, isConnected, projectId, projectAlias, currentPath, getPrompt, handleLocalCommand])

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