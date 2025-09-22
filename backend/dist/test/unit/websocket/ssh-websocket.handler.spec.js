"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const typeorm_1 = require("@nestjs/typeorm");
const ssh_websocket_handler_1 = require("../../../src/modules/websocket/handlers/ssh-websocket.handler");
const ssh_session_entity_1 = require("../../../src/entities/ssh-session.entity");
const console_log_entity_1 = require("../../../src/entities/console-log.entity");
const console_service_1 = require("../../../src/modules/console/console.service");
describe('SshWebSocketHandler', () => {
    let handler;
    let mockSshSessionRepository;
    let mockConsoleLogRepository;
    let mockConsoleService;
    let mockServer;
    let mockClient;
    beforeEach(async () => {
        mockSshSessionRepository = {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
        };
        mockConsoleLogRepository = {
            create: jest.fn(),
            save: jest.fn(),
        };
        mockConsoleService = {
            decrypt: jest.fn(),
        };
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
                ssh_websocket_handler_1.SshWebSocketHandler,
                {
                    provide: (0, typeorm_1.getRepositoryToken)(ssh_session_entity_1.SshSession),
                    useValue: mockSshSessionRepository,
                },
                {
                    provide: (0, typeorm_1.getRepositoryToken)(console_log_entity_1.ConsoleLog),
                    useValue: mockConsoleLogRepository,
                },
                {
                    provide: console_service_1.ConsoleService,
                    useValue: mockConsoleService,
                },
            ],
        }).compile();
        handler = module.get(ssh_websocket_handler_1.SshWebSocketHandler);
        handler.setServer(mockServer);
    });
    it('should be defined', () => {
        expect(handler).toBeDefined();
    });
    describe('handleJoin', () => {
        it('should join SSH session room when session exists', async () => {
            const sessionId = 'test-session-id';
            const mockSession = {
                id: sessionId,
                hostname: 'test.example.com',
                port: 22,
                username: 'testuser',
            };
            mockSshSessionRepository.findOne.mockResolvedValue(mockSession);
            await handler.handleJoin(mockClient, { sessionId });
            expect(mockSshSessionRepository.findOne).toHaveBeenCalledWith({
                where: { id: sessionId, userId: mockClient.userId }
            });
            expect(mockClient.join).toHaveBeenCalledWith(`ssh:${sessionId}`);
            expect(mockClient.emit).toHaveBeenCalledWith('ssh:joined', { sessionId });
        });
        it('should emit error when session not found', async () => {
            const sessionId = 'non-existent-session';
            mockSshSessionRepository.findOne.mockResolvedValue(null);
            await handler.handleJoin(mockClient, { sessionId });
            expect(mockClient.emit).toHaveBeenCalledWith('ssh:error', {
                sessionId,
                message: 'Session not found'
            });
        });
        it('should handle unauthenticated client', async () => {
            const sessionId = 'test-session-id';
            const unauthenticatedClient = { ...mockClient, userId: undefined };
            await handler.handleJoin(unauthenticatedClient, { sessionId });
            expect(mockSshSessionRepository.findOne).not.toHaveBeenCalled();
        });
    });
    describe('handleLeave', () => {
        it('should leave SSH session room', () => {
            const sessionId = 'test-session-id';
            handler.handleLeave(mockClient, { sessionId });
            expect(mockClient.leave).toHaveBeenCalledWith(`ssh:${sessionId}`);
            expect(mockClient.emit).toHaveBeenCalledWith('ssh:left', { sessionId });
        });
    });
    describe('handleCommand', () => {
        it('should save command log when executed', async () => {
            const sessionId = 'test-session-id';
            const command = 'ls -la';
            const requestId = 'test-request-id';
            const mockLog = {
                sessionId,
                userId: mockClient.userId,
                command,
                status: 'completed',
                workingDirectory: '~',
                exitCode: 0,
                output: '',
                errorOutput: ''
            };
            mockConsoleLogRepository.create.mockReturnValue(mockLog);
            mockConsoleLogRepository.save.mockResolvedValue(mockLog);
            await handler.handleCommand(mockClient, { sessionId, command, requestId });
            expect(mockConsoleLogRepository.create).toHaveBeenCalledWith({
                sessionId,
                userId: mockClient.userId,
                command,
                executedAt: expect.any(Date),
                executionTime: expect.any(Number),
                status: 'completed',
                workingDirectory: '~',
                exitCode: 0,
                output: '',
                errorOutput: ''
            });
            expect(mockConsoleLogRepository.save).toHaveBeenCalledWith(mockLog);
        });
        it('should emit error for unauthenticated client', async () => {
            const sessionId = 'test-session-id';
            const command = 'ls -la';
            const unauthenticatedClient = { ...mockClient, userId: undefined };
            await handler.handleCommand(unauthenticatedClient, { sessionId, command });
            expect(mockClient.emit).toHaveBeenCalledWith('ssh:error', {
                message: 'Not authenticated'
            });
        });
    });
    describe('handleResize', () => {
        it('should handle terminal resize', () => {
            const sessionId = 'test-session-id';
            const cols = 80;
            const rows = 24;
            handler.handleResize(mockClient, { sessionId, cols, rows });
            expect(mockClient.to).toHaveBeenCalledWith(`ssh:${sessionId}`);
            expect(mockClient.emit).toHaveBeenCalledWith('ssh:resize', {
                sessionId,
                cols,
                rows
            });
        });
        it('should handle unauthenticated client gracefully', () => {
            const sessionId = 'test-session-id';
            const cols = 80;
            const rows = 24;
            const unauthenticatedClient = { ...mockClient, userId: undefined };
            expect(() => {
                handler.handleResize(unauthenticatedClient, { sessionId, cols, rows });
            }).not.toThrow();
        });
    });
    describe('getActiveConnections', () => {
        it('should return active connections map', () => {
            const connections = handler.getActiveConnections();
            expect(connections).toBeInstanceOf(Map);
        });
    });
    describe('emitToSession', () => {
        it('should emit to session room', () => {
            const sessionId = 'test-session-id';
            const event = 'test-event';
            const data = { message: 'test' };
            handler.emitToSession(sessionId, event, data);
            expect(mockServer.to).toHaveBeenCalledWith(`ssh:${sessionId}`);
            expect(mockServer.emit).toHaveBeenCalledWith(event, data);
        });
        it('should handle missing server gracefully', () => {
            handler.setServer(null);
            const sessionId = 'test-session-id';
            const event = 'test-event';
            const data = { message: 'test' };
            expect(() => {
                handler.emitToSession(sessionId, event, data);
            }).not.toThrow();
        });
    });
});
//# sourceMappingURL=ssh-websocket.handler.spec.js.map