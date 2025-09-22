"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const websocket_service_1 = require("../../../src/modules/websocket/services/websocket.service");
describe('WebSocketService', () => {
    let service;
    let mockServer;
    let mockSocket;
    beforeEach(async () => {
        mockServer = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
            sockets: {
                sockets: new Map()
            }
        };
        mockSocket = {
            id: 'test-socket-id',
            join: jest.fn(),
            leave: jest.fn(),
            emit: jest.fn(),
            to: jest.fn().mockReturnThis()
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [websocket_service_1.WebSocketService],
        }).compile();
        service = module.get(websocket_service_1.WebSocketService);
        service.setServer(mockServer);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('addClientConnection', () => {
        it('should add client connection and track user-socket mapping', () => {
            const userId = 'user-123';
            const socketId = 'socket-456';
            service.addClientConnection(userId, socketId);
            const userSockets = service.getUserSockets(userId);
            expect(userSockets.has(socketId)).toBe(true);
            expect(service.getSocketUser(socketId)).toBe(userId);
            expect(service.isUserConnected(userId)).toBe(true);
        });
        it('should handle multiple sockets for same user', () => {
            const userId = 'user-123';
            const socketId1 = 'socket-456';
            const socketId2 = 'socket-789';
            service.addClientConnection(userId, socketId1);
            service.addClientConnection(userId, socketId2);
            const userSockets = service.getUserSockets(userId);
            expect(userSockets.size).toBe(2);
            expect(userSockets.has(socketId1)).toBe(true);
            expect(userSockets.has(socketId2)).toBe(true);
        });
    });
    describe('removeClientConnection', () => {
        it('should remove client connection and clean up mappings', () => {
            const userId = 'user-123';
            const socketId = 'socket-456';
            service.addClientConnection(userId, socketId);
            service.removeClientConnection(userId, socketId);
            const userSockets = service.getUserSockets(userId);
            expect(userSockets.has(socketId)).toBe(false);
            expect(service.getSocketUser(socketId)).toBeUndefined();
            expect(service.isUserConnected(userId)).toBe(false);
        });
        it('should preserve other sockets when removing one', () => {
            const userId = 'user-123';
            const socketId1 = 'socket-456';
            const socketId2 = 'socket-789';
            service.addClientConnection(userId, socketId1);
            service.addClientConnection(userId, socketId2);
            service.removeClientConnection(userId, socketId1);
            const userSockets = service.getUserSockets(userId);
            expect(userSockets.size).toBe(1);
            expect(userSockets.has(socketId2)).toBe(true);
            expect(service.isUserConnected(userId)).toBe(true);
        });
    });
    describe('emitToUser', () => {
        it('should emit to all user sockets', () => {
            const userId = 'user-123';
            const socketId1 = 'socket-456';
            const socketId2 = 'socket-789';
            const event = 'test-event';
            const data = { message: 'test' };
            service.addClientConnection(userId, socketId1);
            service.addClientConnection(userId, socketId2);
            service.emitToUser(userId, event, data);
            expect(mockServer.to).toHaveBeenCalledWith(socketId1);
            expect(mockServer.to).toHaveBeenCalledWith(socketId2);
            expect(mockServer.emit).toHaveBeenCalledWith(event, data);
        });
        it('should handle non-existent user gracefully', () => {
            const userId = 'non-existent-user';
            const event = 'test-event';
            const data = { message: 'test' };
            expect(() => {
                service.emitToUser(userId, event, data);
            }).not.toThrow();
        });
    });
    describe('emitToSocket', () => {
        it('should emit to specific socket', () => {
            const socketId = 'socket-456';
            const event = 'test-event';
            const data = { message: 'test' };
            service.emitToSocket(socketId, event, data);
            expect(mockServer.to).toHaveBeenCalledWith(socketId);
            expect(mockServer.emit).toHaveBeenCalledWith(event, data);
        });
    });
    describe('emitToRoom', () => {
        it('should emit to room', () => {
            const room = 'test-room';
            const event = 'test-event';
            const data = { message: 'test' };
            service.emitToRoom(room, event, data);
            expect(mockServer.to).toHaveBeenCalledWith(room);
            expect(mockServer.emit).toHaveBeenCalledWith(event, data);
        });
    });
    describe('getConnectionStats', () => {
        it('should return connection statistics', () => {
            const userId1 = 'user-123';
            const userId2 = 'user-456';
            const socketId1 = 'socket-789';
            const socketId2 = 'socket-101';
            const socketId3 = 'socket-112';
            service.addClientConnection(userId1, socketId1);
            service.addClientConnection(userId1, socketId2);
            service.addClientConnection(userId2, socketId3);
            const stats = service.getConnectionStats();
            expect(stats.totalConnections).toBe(3);
            expect(stats.totalUsers).toBe(2);
            expect(stats.userConnectionCounts[userId1]).toBe(2);
            expect(stats.userConnectionCounts[userId2]).toBe(1);
            expect(stats.timestamp).toBeInstanceOf(Date);
        });
    });
    describe('room management', () => {
        beforeEach(() => {
            mockServer.sockets.sockets.set('socket-456', mockSocket);
        });
        it('should join room', () => {
            const socketId = 'socket-456';
            const room = 'test-room';
            service.joinRoom(socketId, room);
            expect(mockSocket.join).toHaveBeenCalledWith(room);
        });
        it('should leave room', () => {
            const socketId = 'socket-456';
            const room = 'test-room';
            service.leaveRoom(socketId, room);
            expect(mockSocket.leave).toHaveBeenCalledWith(room);
        });
        it('should handle non-existent socket gracefully', () => {
            const socketId = 'non-existent-socket';
            const room = 'test-room';
            expect(() => {
                service.joinRoom(socketId, room);
                service.leaveRoom(socketId, room);
            }).not.toThrow();
        });
    });
});
//# sourceMappingURL=websocket.service.spec.js.map