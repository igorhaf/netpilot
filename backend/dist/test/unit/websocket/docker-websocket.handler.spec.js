"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const docker_websocket_handler_1 = require("../../../src/modules/websocket/handlers/docker-websocket.handler");
const docker_service_1 = require("../../../src/modules/docker/services/docker.service");
const containers_service_1 = require("../../../src/modules/docker/services/containers.service");
const events_1 = require("events");
describe('DockerWebSocketHandler', () => {
    let handler;
    let mockDockerService;
    let mockContainersService;
    let mockServer;
    let mockClient;
    let mockContainer;
    beforeEach(async () => {
        mockContainer = {
            inspect: jest.fn(),
            logs: jest.fn(),
            stats: jest.fn(),
            exec: jest.fn(),
        };
        mockDockerService = {
            getDockerContainer: jest.fn().mockReturnValue(mockContainer),
        };
        mockContainersService = {};
        mockServer = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
        };
        mockClient = {
            id: 'test-client-id',
            userId: 'test-user-id',
            join: jest.fn(),
            leave: jest.fn(),
            emit: jest.fn(),
            to: jest.fn().mockReturnThis(),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                docker_websocket_handler_1.DockerWebSocketHandler,
                {
                    provide: docker_service_1.DockerService,
                    useValue: mockDockerService,
                },
                {
                    provide: containers_service_1.ContainersService,
                    useValue: mockContainersService,
                },
            ],
        }).compile();
        handler = module.get(docker_websocket_handler_1.DockerWebSocketHandler);
        handler.setServer(mockServer);
    });
    it('should be defined', () => {
        expect(handler).toBeDefined();
    });
    describe('handleLogsStart', () => {
        it('should start log streaming when container exists', async () => {
            const containerId = 'test-container-id';
            const mockLogStream = new events_1.EventEmitter();
            mockContainer.inspect.mockResolvedValue({});
            mockContainer.logs.mockResolvedValue(mockLogStream);
            await handler.handleLogsStart(mockClient, { containerId });
            expect(mockDockerService.getDockerContainer).toHaveBeenCalledWith(containerId);
            expect(mockContainer.inspect).toHaveBeenCalled();
            expect(mockContainer.logs).toHaveBeenCalledWith({
                follow: true,
                stdout: true,
                stderr: true,
                tail: 100,
                timestamps: true
            });
            expect(mockClient.join).toHaveBeenCalledWith(`docker:logs:${containerId}`);
            expect(mockClient.emit).toHaveBeenCalledWith('docker:logs:started', { containerId });
        });
        it('should emit error when container not found', async () => {
            const containerId = 'non-existent-container';
            mockContainer.inspect.mockRejectedValue(new Error('Container not found'));
            await handler.handleLogsStart(mockClient, { containerId });
            expect(mockClient.emit).toHaveBeenCalledWith('docker:error', {
                containerId,
                message: 'Container not found'
            });
        });
        it('should handle unauthenticated client', async () => {
            const containerId = 'test-container-id';
            const unauthenticatedClient = { ...mockClient, userId: undefined };
            await handler.handleLogsStart(unauthenticatedClient, { containerId });
            expect(mockClient.emit).toHaveBeenCalledWith('docker:error', {
                message: 'Not authenticated'
            });
        });
    });
    describe('handleLogsStop', () => {
        it('should stop log streaming', async () => {
            const containerId = 'test-container-id';
            await handler.handleLogsStop(mockClient, { containerId });
            expect(mockClient.leave).toHaveBeenCalledWith(`docker:logs:${containerId}`);
            expect(mockClient.emit).toHaveBeenCalledWith('docker:logs:stopped', { containerId });
        });
    });
    describe('handleStatsStart', () => {
        it('should start stats streaming when container exists', async () => {
            const containerId = 'test-container-id';
            const mockStatsStream = new events_1.EventEmitter();
            mockContainer.inspect.mockResolvedValue({});
            mockContainer.stats.mockResolvedValue(mockStatsStream);
            await handler.handleStatsStart(mockClient, { containerId });
            expect(mockContainer.stats).toHaveBeenCalledWith({ stream: true });
            expect(mockClient.join).toHaveBeenCalledWith(`docker:stats:${containerId}`);
            expect(mockClient.emit).toHaveBeenCalledWith('docker:stats:started', { containerId });
        });
        it('should emit error when container not found', async () => {
            const containerId = 'non-existent-container';
            mockContainer.inspect.mockRejectedValue(new Error('Container not found'));
            await handler.handleStatsStart(mockClient, { containerId });
            expect(mockClient.emit).toHaveBeenCalledWith('docker:error', {
                containerId,
                message: 'Container not found'
            });
        });
    });
    describe('handleStatsStop', () => {
        it('should stop stats streaming', async () => {
            const containerId = 'test-container-id';
            await handler.handleStatsStop(mockClient, { containerId });
            expect(mockClient.leave).toHaveBeenCalledWith(`docker:stats:${containerId}`);
            expect(mockClient.emit).toHaveBeenCalledWith('docker:stats:stopped', { containerId });
        });
    });
    describe('handleExecStart', () => {
        it('should start exec session when container exists', async () => {
            const containerId = 'test-container-id';
            const command = ['/bin/bash'];
            const mockExec = {
                id: 'exec-123',
                start: jest.fn(),
            };
            const mockStream = new events_1.EventEmitter();
            mockContainer.inspect.mockResolvedValue({});
            mockContainer.exec.mockResolvedValue(mockExec);
            mockExec.start.mockResolvedValue(mockStream);
            await handler.handleExecStart(mockClient, { containerId, command });
            expect(mockContainer.exec).toHaveBeenCalledWith({
                Cmd: command,
                AttachStdout: true,
                AttachStderr: true,
                AttachStdin: true,
                Tty: true,
                Env: []
            });
            expect(mockClient.join).toHaveBeenCalledWith(`docker:exec:${mockExec.id}`);
            expect(mockClient.emit).toHaveBeenCalledWith('docker:exec:started', {
                containerId,
                execId: mockExec.id
            });
        });
        it('should emit error when container not found', async () => {
            const containerId = 'non-existent-container';
            const command = ['/bin/bash'];
            mockContainer.inspect.mockRejectedValue(new Error('Container not found'));
            await handler.handleExecStart(mockClient, { containerId, command });
            expect(mockClient.emit).toHaveBeenCalledWith('docker:error', {
                containerId,
                message: 'Container not found'
            });
        });
    });
    describe('handleExecInput', () => {
        it('should handle unauthenticated client', async () => {
            const execId = 'exec-123';
            const input = 'echo hello\n';
            const unauthenticatedClient = { ...mockClient, userId: undefined };
            await handler.handleExecInput(unauthenticatedClient, { execId, input });
            expect(mockClient.emit).not.toHaveBeenCalled();
        });
    });
    describe('handleExecStop', () => {
        it('should stop exec session', async () => {
            const execId = 'exec-123';
            await handler.handleExecStop(mockClient, { execId });
            expect(mockClient.leave).toHaveBeenCalledWith(`docker:exec:${execId}`);
            expect(mockClient.emit).toHaveBeenCalledWith('docker:exec:stopped', { execId });
        });
    });
    describe('utility methods', () => {
        describe('calculateCpuUsage', () => {
            it('should calculate CPU usage correctly', () => {
                const handler_any = handler;
                const stats = {
                    cpu_stats: {
                        cpu_usage: { total_usage: 200000000 },
                        system_cpu_usage: 4000000000,
                        online_cpus: 2
                    },
                    precpu_stats: {
                        cpu_usage: { total_usage: 100000000 },
                        system_cpu_usage: 2000000000
                    }
                };
                const cpuUsage = handler_any.calculateCpuUsage(stats);
                expect(cpuUsage).toBe(10);
            });
            it('should return 0 for invalid stats', () => {
                const handler_any = handler;
                const stats = {};
                const cpuUsage = handler_any.calculateCpuUsage(stats);
                expect(cpuUsage).toBe(0);
            });
        });
        describe('calculateMemoryUsage', () => {
            it('should calculate memory usage correctly', () => {
                const handler_any = handler;
                const stats = {
                    memory_stats: {
                        usage: 500000000,
                        limit: 1000000000
                    }
                };
                const memoryUsage = handler_any.calculateMemoryUsage(stats);
                expect(memoryUsage).toEqual({
                    used: 500000000,
                    available: 1000000000,
                    percentage: 50
                });
            });
        });
        describe('calculateNetworkIO', () => {
            it('should calculate network I/O correctly', () => {
                const handler_any = handler;
                const stats = {
                    networks: {
                        eth0: { rx_bytes: 1000, tx_bytes: 2000 },
                        lo: { rx_bytes: 500, tx_bytes: 500 }
                    }
                };
                const networkIO = handler_any.calculateNetworkIO(stats);
                expect(networkIO).toEqual({
                    rx: 1500,
                    tx: 2500
                });
            });
        });
    });
    describe('getActiveStreams', () => {
        it('should return active streams count', () => {
            const activeStreams = handler.getActiveStreams();
            expect(activeStreams).toEqual({
                logs: 0,
                stats: 0,
                exec: 0
            });
        });
    });
    describe('emitToContainer', () => {
        it('should emit to container rooms', () => {
            const containerId = 'test-container-id';
            const event = 'test-event';
            const data = { message: 'test' };
            handler.emitToContainer(containerId, event, data);
            expect(mockServer.to).toHaveBeenCalledWith(`docker:logs:${containerId}`);
            expect(mockServer.to).toHaveBeenCalledWith(`docker:stats:${containerId}`);
            expect(mockServer.emit).toHaveBeenCalledWith(event, data);
        });
    });
});
//# sourceMappingURL=docker-websocket.handler.spec.js.map