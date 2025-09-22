export interface ContainerFilters {
  status?: 'running' | 'exited' | 'paused' | 'created' | 'restarting' | 'removing' | 'dead';
  image?: string;
  name?: string;
  label?: string;
}

export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  image_id: string;
  status: string;
  state: string;
  created: Date;
  ports: Array<{
    private_port: number;
    public_port?: number;
    type: string;
  }>;
  labels: Record<string, string>;
  networks: string[];
  mounts: Array<{
    type: string;
    source: string;
    destination: string;
  }>;
}

export interface ContainerInspectInfo {
  id: string;
  name: string;
  config: any;
  host_config: any;
  network_settings: any;
  state: any;
  mounts: any[];
}

export interface CreateContainerConfig {
  name: string;
  image: string;
  env?: string[];
  ports?: Record<string, Array<{ HostPort: string }>>;
  volumes?: Array<{
    source: string;
    target: string;
    type: 'bind' | 'volume';
    readonly?: boolean;
  }>;
  networks?: string[];
  restart_policy?: 'no' | 'always' | 'unless-stopped' | 'on-failure';
  labels?: Record<string, string>;
  command?: string[];
}

export type ContainerAction = 'start' | 'stop' | 'restart' | 'pause' | 'unpause' | 'kill';

export interface LogOptions {
  tail?: number;
  since?: Date;
  until?: Date;
  follow?: boolean;
}

export interface LogEntry {
  timestamp: Date;
  message: string;
  stream: 'stdout' | 'stderr';
}

export interface VolumeFilters {
  driver?: string;
  dangling?: boolean;
}

export interface VolumeInfo {
  name: string;
  driver: string;
  mountpoint: string;
  created: Date;
  labels: Record<string, string>;
  options: Record<string, string>;
  usage: {
    size: number;
    ref_count: number;
  };
}

export interface CreateVolumeConfig {
  name: string;
  driver?: string;
  driver_opts?: Record<string, string>;
  labels?: Record<string, string>;
}

export interface NetworkFilters {
  driver?: 'bridge' | 'host' | 'overlay' | 'macvlan';
  scope?: 'local' | 'global' | 'swarm';
}

export interface NetworkInfo {
  id: string;
  name: string;
  driver: string;
  scope: string;
  attachable: boolean;
  created: Date;
  containers: Array<{
    name: string;
    ipv4_address: string;
  }>;
}

export interface CreateNetworkConfig {
  name: string;
  driver?: string;
  options?: Record<string, string>;
  labels?: Record<string, string>;
  ipam?: {
    driver?: string;
    config?: Array<{
      subnet?: string;
      gateway?: string;
    }>;
  };
}

export interface ImageFilters {
  dangling?: boolean;
  reference?: string;
}

export interface ImageInfo {
  id: string;
  parent_id: string;
  repo_tags: string[];
  repo_digests: string[];
  created: Date;
  size: number;
  virtual_size: number;
  labels: Record<string, string>;
  containers: number;
}

export interface ContainerStats {
  container_id: string;
  timestamp: Date;
  cpu: {
    usage_percent: number;
    system_usage: number;
  };
  memory: {
    usage: number;
    limit: number;
    usage_percent: number;
  };
  network: {
    rx_bytes: number;
    tx_bytes: number;
  };
  block_io: {
    read_bytes: number;
    write_bytes: number;
  };
}

export interface IDockerService {
  // Containers
  listContainers(filters?: ContainerFilters): Promise<ContainerInfo[]>;
  createContainer(config: CreateContainerConfig): Promise<string>;
  getContainer(id: string): Promise<ContainerInspectInfo>;
  containerAction(id: string, action: ContainerAction, options?: any): Promise<void>;
  removeContainer(id: string, force?: boolean): Promise<void>;
  getContainerLogs(id: string, options: LogOptions): Promise<LogEntry[]>;
  getContainerStats(id: string): Promise<ContainerStats>;

  // Volumes
  listVolumes(filters?: VolumeFilters): Promise<VolumeInfo[]>;
  createVolume(config: CreateVolumeConfig): Promise<string>;
  getVolume(name: string): Promise<VolumeInfo>;
  removeVolume(name: string, force?: boolean): Promise<void>;

  // Networks
  listNetworks(filters?: NetworkFilters): Promise<NetworkInfo[]>;
  createNetwork(config: CreateNetworkConfig): Promise<string>;
  getNetwork(id: string): Promise<NetworkInfo>;
  removeNetwork(id: string): Promise<void>;
  connectContainer(networkId: string, containerId: string, options?: any): Promise<void>;
  disconnectContainer(networkId: string, containerId: string, force?: boolean): Promise<void>;

  // Images
  listImages(filters?: ImageFilters): Promise<ImageInfo[]>;
  getImage(id: string): Promise<ImageInfo>;
  removeImage(id: string, force?: boolean, noprune?: boolean): Promise<any>;
  pullImage(reference: string, auth?: any): Promise<any>;
  pruneImages(dangling?: boolean, until?: Date): Promise<any>;

  // System
  getSystemInfo(): Promise<any>;
}

export type JobType = 'backup' | 'restore' | 'pull' | 'prune' | 'exec';
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface JobProgress {
  progress: number;
  message: string;
}