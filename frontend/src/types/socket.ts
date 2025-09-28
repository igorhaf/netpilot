export interface ServerToClientEvents {
  'terminal:output': (data: { output: string; exitCode?: number }) => void
  'terminal:error': (data: { error: string }) => void
  'terminal:path-changed': (data: { path: string }) => void
  'project:status': (data: { projectId: string; status: string }) => void
}

export interface ClientToServerEvents {
  'terminal:execute': (data: {
    command: string
    projectId: string
    workingDir: string
  }) => void
  'project:connect': (data: { projectId: string }) => void
  'project:disconnect': (data: { projectId: string }) => void
}

export interface InterServerEvents {
  ping: () => void
}

export interface SocketData {
  userId: string
  projectId?: string
}