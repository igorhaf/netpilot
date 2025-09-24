import { api } from './api'

export interface DockerContainer {
  id: string
  names: string[]
  image: string
  status: string
  state: string
  ports: Array<{
    PrivatePort: number
    PublicPort?: number
    Type: string
    IP?: string
  }>
}

export interface DockerContainersResponse {
  data: DockerContainer[]
  total: number
  message: string
  error?: string
}

export class DockerApiService {
  /**
   * Lista todos os containers do Docker
   */
  static async listContainers(): Promise<DockerContainersResponse> {
    try {
      const response = await api.get<DockerContainersResponse>('/docker/containers')
      return response.data
    } catch (error: any) {
      console.error('Error fetching Docker containers:', error)
      return {
        data: [],
        total: 0,
        message: 'Failed to fetch containers',
        error: error.response?.data?.message || error.message
      }
    }
  }

  /**
   * Inicia um container
   */
  static async startContainer(containerId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post(`/docker/containers/${containerId}/start`)
      return response.data
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to start container'
      }
    }
  }

  /**
   * Para um container
   */
  static async stopContainer(containerId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post(`/docker/containers/${containerId}/stop`)
      return response.data
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to stop container'
      }
    }
  }

  /**
   * Reinicia um container
   */
  static async restartContainer(containerId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post(`/docker/containers/${containerId}/restart`)
      return response.data
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to restart container'
      }
    }
  }

  /**
   * Obtém logs de um container
   */
  static async getContainerLogs(containerId: string): Promise<{ logs: string; error?: string }> {
    try {
      const response = await api.get(`/api/docker/containers/${containerId}/logs`)
      return { logs: response.data.logs || '' }
    } catch (error: any) {
      return {
        logs: '',
        error: error.response?.data?.message || 'Failed to fetch container logs'
      }
    }
  }

  /**
   * Obtém dados do dashboard Docker
   */
  static async getDashboardData() {
    try {
      const response = await api.get('/docker/dashboard')
      return response.data
    } catch (error: any) {
      console.error('Error fetching Docker dashboard:', error)
      return {
        containers: { total: 0, running: 0, stopped: 0 },
        volumes: { total: 0, used_space: '0 B' },
        networks: { total: 0, custom: 0 },
        images: { total: 0, total_size: '0 B' },
        active_jobs: [],
        error: error.response?.data?.message || error.message
      }
    }
  }

  /**
   * Lista volumes Docker
   */
  static async listVolumes() {
    try {
      const response = await api.get('/docker/volumes')
      return response.data
    } catch (error: any) {
      console.error('Error fetching Docker volumes:', error)
      return {
        data: [],
        total: 0,
        error: error.response?.data?.message || error.message
      }
    }
  }

  /**
   * Lista networks Docker
   */
  static async listNetworks() {
    try {
      const response = await api.get('/docker/networks')
      return response.data
    } catch (error: any) {
      console.error('Error fetching Docker networks:', error)
      return {
        data: [],
        total: 0,
        custom: 0,
        error: error.response?.data?.message || error.message
      }
    }
  }

  /**
   * Lista images Docker
   */
  static async listImages() {
    try {
      const response = await api.get('/docker/images')
      return response.data
    } catch (error: any) {
      console.error('Error fetching Docker images:', error)
      return {
        data: [],
        total: 0,
        totalSize: 0,
        error: error.response?.data?.message || error.message
      }
    }
  }

  /**
   * Remove um volume Docker
   */
  static async removeVolume(volumeName: string, force?: boolean): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete(`/docker/volumes/${volumeName}`, {
        data: { force }
      })
      return response.data
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to remove volume'
      }
    }
  }

  /**
   * Cria backup de um volume
   */
  static async backupVolume(volumeName: string): Promise<{ job_id: string }> {
    try {
      const response = await api.post(`/docker/volumes/${volumeName}/backup`)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to backup volume')
    }
  }

  /**
   * Remove uma rede Docker
   */
  static async removeNetwork(networkId: string, force?: boolean): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete(`/docker/networks/${networkId}`, {
        data: { force }
      })
      return response.data
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to remove network'
      }
    }
  }

  /**
   * Remove uma imagem Docker
   */
  static async removeImage(imageId: string, force?: boolean, noprune?: boolean): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete(`/docker/images/${imageId}`, {
        data: { force, noprune }
      })
      return response.data
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to remove image'
      }
    }
  }

  /**
   * Faz pull de uma imagem Docker
   */
  static async pullImage(imageName: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post(`/docker/images/pull`, {
        image: imageName
      })
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to pull image')
    }
  }
}