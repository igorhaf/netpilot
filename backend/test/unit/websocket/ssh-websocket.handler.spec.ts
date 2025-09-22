import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SshWebSocketHandler } from '../../../src/modules/websocket/handlers/ssh-websocket.handler';
import { SshSession } from '../../../src/entities/ssh-session.entity';
import { ConsoleLog } from '../../../src/entities/console-log.entity';
import { ConsoleService } from '../../../src/modules/console/console.service';
import { Server, Socket } from 'socket.io';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

describe('SshWebSocketHandler', () => {
  let handler: SshWebSocketHandler;
  let mockSshSessionRepository: jest.Mocked<Repository<SshSession>>;
  let mockConsoleLogRepository: jest.Mocked<Repository<ConsoleLog>>;
  let mockConsoleService: jest.Mocked<ConsoleService>;
  let mockServer: jest.Mocked<Server>;
  let mockClient: jest.Mocked<AuthenticatedSocket>;

  beforeEach(async () => {
    mockSshSessionRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as any;

    mockConsoleLogRepository = {
      create: jest.fn(),
      save: jest.fn(),
    } as any;

    mockConsoleService = {
      decrypt: jest.fn(),
    } as any;

    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;

    mockClient = {
      id: 'test-client-id',
      userId: 'test-user-id',
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SshWebSocketHandler,
        {
          provide: getRepositoryToken(SshSession),
          useValue: mockSshSessionRepository,
        },
        {
          provide: getRepositoryToken(ConsoleLog),
          useValue: mockConsoleLogRepository,
        },
        {
          provide: ConsoleService,
          useValue: mockConsoleService,
        },
      ],
    }).compile();

    handler = module.get<SshWebSocketHandler>(SshWebSocketHandler);
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

      mockSshSessionRepository.findOne.mockResolvedValue(mockSession as SshSession);

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

      await handler.handleJoin(unauthenticatedClient as any, { sessionId });

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

      mockConsoleLogRepository.create.mockReturnValue(mockLog as any);
      mockConsoleLogRepository.save.mockResolvedValue(mockLog as any);

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

      await handler.handleCommand(unauthenticatedClient as any, { sessionId, command });

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
        handler.handleResize(unauthenticatedClient as any, { sessionId, cols, rows });
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
      handler.setServer(null as any);
      const sessionId = 'test-session-id';
      const event = 'test-event';
      const data = { message: 'test' };

      expect(() => {
        handler.emitToSession(sessionId, event, data);
      }).not.toThrow();
    });
  });
});