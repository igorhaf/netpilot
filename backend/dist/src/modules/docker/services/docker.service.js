"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var DockerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerService = void 0;
const common_1 = require("@nestjs/common");
const Docker = require("dockerode");
let DockerService = DockerService_1 = class DockerService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(DockerService_1.name);
        this.docker = new Docker(config);
        this.logger.log(`Docker service initialized with config: ${JSON.stringify(config)}`);
    }
    async listContainers(filters) {
        try {
            const dockerFilters = {};
            if (filters?.status)
                dockerFilters.status = [filters.status];
            if (filters?.label)
                dockerFilters.label = [filters.label];
            if (filters?.name)
                dockerFilters.name = [filters.name];
            const containers = await this.docker.listContainers({
                all: true,
                filters: dockerFilters
            });
            return containers.map(container => ({
                id: container.Id,
                name: container.Names[0]?.replace('/', '') || 'unnamed',
                image: container.Image,
                image_id: container.ImageID,
                status: container.Status,
                state: container.State,
                created: new Date(container.Created * 1000),
                ports: container.Ports?.map(port => ({
                    private_port: port.PrivatePort,
                    public_port: port.PublicPort,
                    type: port.Type
                })) || [],
                labels: container.Labels || {},
                networks: Object.keys(container.NetworkSettings?.Networks || {}),
                mounts: container.Mounts?.map(mount => ({
                    type: mount.Type,
                    source: mount.Source,
                    destination: mount.Destination
                })) || []
            }));
        }
        catch (error) {
            this.logger.error('Failed to list containers', error);
            throw new common_1.InternalServerErrorException('Failed to list containers');
        }
    }
    async createContainer(config) {
        try {
            const dockerConfig = {
                Image: config.image,
                name: config.name,
                Env: config.env || [],
                Labels: config.labels || {},
                Cmd: config.command || [],
                ExposedPorts: {},
                HostConfig: {
                    PortBindings: {},
                    Mounts: [],
                    RestartPolicy: { Name: config.restart_policy || 'no' },
                    NetworkMode: config.networks?.[0] || 'bridge'
                },
                NetworkingConfig: {
                    EndpointsConfig: {}
                }
            };
            if (config.ports) {
                for (const [containerPort, hostPorts] of Object.entries(config.ports)) {
                    dockerConfig.ExposedPorts[containerPort] = {};
                    dockerConfig.HostConfig.PortBindings[containerPort] = hostPorts;
                }
            }
            if (config.volumes) {
                dockerConfig.HostConfig.Mounts = config.volumes.map(vol => ({
                    Type: vol.type,
                    Source: vol.source,
                    Target: vol.target,
                    ReadOnly: vol.readonly || false
                }));
            }
            if (config.networks && config.networks.length > 1) {
                for (const network of config.networks.slice(1)) {
                    dockerConfig.NetworkingConfig.EndpointsConfig[network] = {};
                }
            }
            const container = await this.docker.createContainer(dockerConfig);
            return container.id;
        }
        catch (error) {
            this.logger.error('Failed to create container', error);
            if (error.statusCode === 404) {
                throw new common_1.NotFoundException(`Image '${config.image}' not found`);
            }
            if (error.statusCode === 409) {
                throw new common_1.ConflictException(`Container name '${config.name}' already exists`);
            }
            throw new common_1.BadRequestException(`Failed to create container: ${error.message}`);
        }
    }
    async getContainer(id) {
        try {
            const container = this.docker.getContainer(id);
            const info = await container.inspect();
            return {
                id: info.Id,
                name: info.Name.replace('/', ''),
                config: info.Config,
                host_config: info.HostConfig,
                network_settings: info.NetworkSettings,
                state: info.State,
                mounts: info.Mounts
            };
        }
        catch (error) {
            if (error.statusCode === 404) {
                throw new common_1.NotFoundException(`Container '${id}' not found`);
            }
            throw new common_1.InternalServerErrorException('Failed to inspect container');
        }
    }
    getDockerContainer(id) {
        return this.docker.getContainer(id);
    }
    async containerAction(id, action, options) {
        try {
            const container = this.docker.getContainer(id);
            switch (action) {
                case 'start':
                    await container.start();
                    break;
                case 'stop':
                    await container.stop({ t: options?.timeout || 10 });
                    break;
                case 'restart':
                    await container.restart({ t: options?.timeout || 10 });
                    break;
                case 'pause':
                    await container.pause();
                    break;
                case 'unpause':
                    await container.unpause();
                    break;
                case 'kill':
                    await container.kill({ signal: options?.signal || 'SIGKILL' });
                    break;
                default:
                    throw new common_1.BadRequestException(`Invalid action: ${action}`);
            }
        }
        catch (error) {
            if (error.statusCode === 404) {
                throw new common_1.NotFoundException(`Container '${id}' not found`);
            }
            if (error.statusCode === 409) {
                throw new common_1.ConflictException(`Cannot ${action} container: ${error.message}`);
            }
            throw new common_1.InternalServerErrorException(`Failed to ${action} container`);
        }
    }
    async removeContainer(id, force = false) {
        try {
            const container = this.docker.getContainer(id);
            await container.remove({ force });
        }
        catch (error) {
            if (error.statusCode === 404) {
                throw new common_1.NotFoundException(`Container '${id}' not found`);
            }
            if (error.statusCode === 409) {
                throw new common_1.ConflictException('Cannot remove running container. Stop it first or use force=true');
            }
            throw new common_1.InternalServerErrorException('Failed to remove container');
        }
    }
    async getContainerLogs(id, options) {
        try {
            const container = this.docker.getContainer(id);
            const stream = await container.logs({
                stdout: true,
                stderr: true,
                timestamps: true,
                tail: options.tail || 100,
                since: options.since ? Math.floor(options.since.getTime() / 1000) : undefined,
                until: options.until ? Math.floor(options.until.getTime() / 1000) : undefined
            });
            const logs = stream.toString().split('\n')
                .filter(line => line.length > 0)
                .map(line => {
                const logLine = line.slice(8);
                const timestampMatch = logLine.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)\s+(.*)$/);
                if (timestampMatch) {
                    return {
                        timestamp: new Date(timestampMatch[1]),
                        message: timestampMatch[2],
                        stream: 'stdout'
                    };
                }
                return {
                    timestamp: new Date(),
                    message: logLine,
                    stream: 'stdout'
                };
            });
            return logs;
        }
        catch (error) {
            if (error.statusCode === 404) {
                throw new common_1.NotFoundException(`Container '${id}' not found`);
            }
            throw new common_1.InternalServerErrorException('Failed to get container logs');
        }
    }
    async getContainerStats(id) {
        try {
            const container = this.docker.getContainer(id);
            const stats = await container.stats({ stream: false });
            const cpuUsage = this.calculateCpuPercent(stats);
            const memoryUsage = stats.memory_stats.usage || 0;
            const memoryLimit = stats.memory_stats.limit || 0;
            const memoryPercent = memoryLimit > 0 ? (memoryUsage / memoryLimit) * 100 : 0;
            const networks = stats.networks || {};
            let rxBytes = 0, txBytes = 0;
            Object.values(networks).forEach((network) => {
                rxBytes += network.rx_bytes || 0;
                txBytes += network.tx_bytes || 0;
            });
            const blockIO = stats.blkio_stats || {};
            let readBytes = 0, writeBytes = 0;
            if (blockIO.io_service_bytes_recursive) {
                blockIO.io_service_bytes_recursive.forEach((item) => {
                    if (item.op === 'Read')
                        readBytes += item.value || 0;
                    if (item.op === 'Write')
                        writeBytes += item.value || 0;
                });
            }
            return {
                container_id: id,
                timestamp: new Date(),
                cpu: {
                    usage_percent: cpuUsage,
                    system_usage: stats.cpu_stats.system_cpu_usage || 0
                },
                memory: {
                    usage: memoryUsage,
                    limit: memoryLimit,
                    usage_percent: memoryPercent
                },
                network: {
                    rx_bytes: rxBytes,
                    tx_bytes: txBytes
                },
                block_io: {
                    read_bytes: readBytes,
                    write_bytes: writeBytes
                }
            };
        }
        catch (error) {
            if (error.statusCode === 404) {
                throw new common_1.NotFoundException(`Container '${id}' not found`);
            }
            throw new common_1.InternalServerErrorException('Failed to get container stats');
        }
    }
    calculateCpuPercent(stats) {
        const cpuStats = stats.cpu_stats || {};
        const preCpuStats = stats.precpu_stats || {};
        const cpuUsage = cpuStats.cpu_usage?.total_usage || 0;
        const preCpuUsage = preCpuStats.cpu_usage?.total_usage || 0;
        const systemUsage = cpuStats.system_cpu_usage || 0;
        const preSystemUsage = preCpuStats.system_cpu_usage || 0;
        const numCpus = cpuStats.online_cpus || 1;
        const cpuDelta = cpuUsage - preCpuUsage;
        const systemDelta = systemUsage - preSystemUsage;
        if (systemDelta > 0 && cpuDelta > 0) {
            return (cpuDelta / systemDelta) * numCpus * 100;
        }
        return 0;
    }
    async listVolumes(filters) {
        try {
            const volumesResponse = await this.docker.listVolumes({
                filters: filters ? {
                    driver: filters.driver ? [filters.driver] : undefined,
                    dangling: filters.dangling ? [filters.dangling.toString()] : undefined
                } : undefined
            });
            const volumes = volumesResponse.Volumes || [];
            return Promise.all(volumes.map(async (volume) => {
                let usage = { size: 0, ref_count: 0 };
                try {
                    const containers = await this.listContainers();
                    const refCount = containers.filter(container => container.mounts.some(mount => mount.type === 'volume' && mount.source === volume.Name)).length;
                    usage.ref_count = refCount;
                }
                catch (e) {
                    this.logger.warn(`Failed to get usage for volume ${volume.Name}`, e);
                }
                return {
                    name: volume.Name,
                    driver: volume.Driver,
                    mountpoint: volume.Mountpoint,
                    created: new Date(volume.CreatedAt || new Date()),
                    labels: volume.Labels || {},
                    options: volume.Options || {},
                    usage
                };
            }));
        }
        catch (error) {
            this.logger.error('Failed to list volumes', error);
            throw new common_1.InternalServerErrorException('Failed to list volumes');
        }
    }
    async createVolume(config) {
        try {
            const volume = await this.docker.createVolume({
                Name: config.name,
                Driver: config.driver || 'local',
                DriverOpts: config.driver_opts || {},
                Labels: config.labels || {}
            });
            return volume.Name;
        }
        catch (error) {
            if (error.statusCode === 409) {
                throw new common_1.ConflictException(`Volume '${config.name}' already exists`);
            }
            throw new common_1.BadRequestException(`Failed to create volume: ${error.message}`);
        }
    }
    async getVolume(name) {
        try {
            const volume = this.docker.getVolume(name);
            const info = await volume.inspect();
            const containers = await this.listContainers();
            const refCount = containers.filter(container => container.mounts.some(mount => mount.type === 'volume' && mount.source === name)).length;
            return {
                name: info.Name,
                driver: info.Driver,
                mountpoint: info.Mountpoint,
                created: new Date(info.CreatedAt || new Date()),
                labels: info.Labels || {},
                options: info.Options || {},
                usage: { size: 0, ref_count: refCount }
            };
        }
        catch (error) {
            if (error.statusCode === 404) {
                throw new common_1.NotFoundException(`Volume '${name}' not found`);
            }
            throw new common_1.InternalServerErrorException('Failed to inspect volume');
        }
    }
    async removeVolume(name, force = false) {
        try {
            const volume = this.docker.getVolume(name);
            await volume.remove({ force });
        }
        catch (error) {
            if (error.statusCode === 404) {
                throw new common_1.NotFoundException(`Volume '${name}' not found`);
            }
            if (error.statusCode === 409) {
                throw new common_1.ConflictException('Volume is in use and cannot be removed');
            }
            throw new common_1.InternalServerErrorException('Failed to remove volume');
        }
    }
    async listNetworks(filters) {
        try {
            const networks = await this.docker.listNetworks({
                filters: filters ? {
                    driver: filters.driver ? [filters.driver] : undefined,
                    scope: filters.scope ? [filters.scope] : undefined
                } : undefined
            });
            return networks.map(network => ({
                id: network.Id,
                name: network.Name,
                driver: network.Driver,
                scope: network.Scope,
                attachable: network.Attachable || false,
                created: new Date(network.Created),
                containers: Object.entries(network.Containers || {}).map(([id, info]) => ({
                    name: info.Name,
                    ipv4_address: info.IPv4Address
                }))
            }));
        }
        catch (error) {
            this.logger.error('Failed to list networks', error);
            throw new common_1.InternalServerErrorException('Failed to list networks');
        }
    }
    async createNetwork(config) {
        try {
            const network = await this.docker.createNetwork({
                Name: config.name,
                Driver: config.driver || 'bridge',
                Options: config.options || {},
                Labels: config.labels || {},
                IPAM: config.ipam || {}
            });
            return network.id;
        }
        catch (error) {
            if (error.statusCode === 409) {
                throw new common_1.ConflictException(`Network '${config.name}' already exists`);
            }
            throw new common_1.BadRequestException(`Failed to create network: ${error.message}`);
        }
    }
    async getNetwork(id) {
        try {
            const network = this.docker.getNetwork(id);
            const info = await network.inspect();
            return {
                id: info.Id,
                name: info.Name,
                driver: info.Driver,
                scope: info.Scope,
                attachable: info.Attachable || false,
                created: new Date(info.Created),
                containers: Object.entries(info.Containers || {}).map(([containerId, containerInfo]) => ({
                    name: containerInfo.Name,
                    ipv4_address: containerInfo.IPv4Address
                }))
            };
        }
        catch (error) {
            if (error.statusCode === 404) {
                throw new common_1.NotFoundException(`Network '${id}' not found`);
            }
            throw new common_1.InternalServerErrorException('Failed to inspect network');
        }
    }
    async removeNetwork(id) {
        try {
            const network = this.docker.getNetwork(id);
            await network.remove();
        }
        catch (error) {
            if (error.statusCode === 404) {
                throw new common_1.NotFoundException(`Network '${id}' not found`);
            }
            if (error.statusCode === 409) {
                throw new common_1.ConflictException('Network is in use and cannot be removed');
            }
            throw new common_1.InternalServerErrorException('Failed to remove network');
        }
    }
    async connectContainer(networkId, containerId, options) {
        try {
            const network = this.docker.getNetwork(networkId);
            await network.connect({
                Container: containerId,
                EndpointConfig: {
                    Aliases: options?.aliases || [],
                    IPAMConfig: options?.ipv4_address ? {
                        IPv4Address: options.ipv4_address
                    } : undefined
                }
            });
        }
        catch (error) {
            if (error.statusCode === 404) {
                throw new common_1.NotFoundException('Network or container not found');
            }
            throw new common_1.InternalServerErrorException('Failed to connect container to network');
        }
    }
    async disconnectContainer(networkId, containerId, force = false) {
        try {
            const network = this.docker.getNetwork(networkId);
            await network.disconnect({ Container: containerId, Force: force });
        }
        catch (error) {
            if (error.statusCode === 404) {
                throw new common_1.NotFoundException('Network or container not found');
            }
            throw new common_1.InternalServerErrorException('Failed to disconnect container from network');
        }
    }
    async listImages(filters) {
        try {
            const images = await this.docker.listImages({
                filters: filters ? {
                    dangling: filters.dangling ? [filters.dangling.toString()] : undefined,
                    reference: filters.reference ? [filters.reference] : undefined
                } : undefined
            });
            return images.map(image => ({
                id: image.Id,
                parent_id: image.ParentId || '',
                repo_tags: image.RepoTags || [],
                repo_digests: image.RepoDigests || [],
                created: new Date(image.Created * 1000),
                size: image.Size,
                virtual_size: image.VirtualSize,
                labels: image.Labels || {},
                containers: 0
            }));
        }
        catch (error) {
            this.logger.error('Failed to list images', error);
            throw new common_1.InternalServerErrorException('Failed to list images');
        }
    }
    async getImage(id) {
        try {
            const image = this.docker.getImage(id);
            const info = await image.inspect();
            return {
                id: info.Id,
                parent_id: info.Parent || '',
                repo_tags: info.RepoTags || [],
                repo_digests: info.RepoDigests || [],
                created: new Date(info.Created),
                size: info.Size,
                virtual_size: info.VirtualSize,
                labels: info.Config?.Labels || {},
                containers: 0
            };
        }
        catch (error) {
            if (error.statusCode === 404) {
                throw new common_1.NotFoundException(`Image '${id}' not found`);
            }
            throw new common_1.InternalServerErrorException('Failed to inspect image');
        }
    }
    async removeImage(id, force = false, noprune = false) {
        try {
            const image = this.docker.getImage(id);
            const result = await image.remove({ force, noprune });
            return result;
        }
        catch (error) {
            if (error.statusCode === 404) {
                throw new common_1.NotFoundException(`Image '${id}' not found`);
            }
            if (error.statusCode === 409) {
                throw new common_1.ConflictException('Image is being used by containers');
            }
            throw new common_1.InternalServerErrorException('Failed to remove image');
        }
    }
    async pullImage(reference, auth) {
        try {
            const stream = await this.docker.pull(reference, { authconfig: auth });
            return stream;
        }
        catch (error) {
            if (error.statusCode === 404) {
                throw new common_1.NotFoundException(`Image '${reference}' not found in registry`);
            }
            throw new common_1.InternalServerErrorException('Failed to pull image');
        }
    }
    async pruneImages(dangling = true, until) {
        try {
            const filters = {};
            if (dangling)
                filters.dangling = ['true'];
            if (until)
                filters.until = [Math.floor(until.getTime() / 1000).toString()];
            const result = await this.docker.pruneImages({ filters });
            return result;
        }
        catch (error) {
            throw new common_1.InternalServerErrorException('Failed to prune images');
        }
    }
    async getSystemInfo() {
        try {
            return await this.docker.info();
        }
        catch (error) {
            throw new common_1.InternalServerErrorException('Failed to get Docker system info');
        }
    }
};
exports.DockerService = DockerService;
exports.DockerService = DockerService = DockerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('DOCKER_CONFIG')),
    __metadata("design:paramtypes", [Object])
], DockerService);
//# sourceMappingURL=docker.service.js.map