describe('SSH Console', () => {
  const testUser = {
    email: 'test@netpilot.local',
    password: 'test123',
  };

  beforeEach(() => {
    // Reset database and create test user
    cy.task('resetDatabase');
    cy.task('createUser', testUser);

    // Login
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type(testUser.email);
    cy.get('[data-testid="password-input"]').type(testUser.password);
    cy.get('[data-testid="login-button"]').click();

    // Navigate to console
    cy.visit('/console');
  });

  describe('Console Interface', () => {
    it('should display console interface correctly', () => {
      cy.get('[data-testid="console-page"]').should('be.visible');
      cy.get('[data-testid="page-title"]').should('contain', 'Console SSH');
      cy.get('[data-testid="terminal-container"]').should('be.visible');
      cy.get('[data-testid="connection-controls"]').should('be.visible');
    });

    it('should show connection form initially', () => {
      cy.get('[data-testid="connection-form"]').should('be.visible');
      cy.get('[data-testid="host-input"]').should('be.visible');
      cy.get('[data-testid="port-input"]').should('have.value', '22');
      cy.get('[data-testid="username-input"]').should('be.visible');
      cy.get('[data-testid="password-input"]').should('be.visible');
      cy.get('[data-testid="connect-button"]').should('be.visible');
    });

    it('should display connection status', () => {
      cy.get('[data-testid="connection-status"]').should('be.visible');
      cy.get('[data-testid="connection-status"]').should('contain', 'Desconectado');
      cy.get('[data-testid="status-indicator"]').should('have.class', 'disconnected');
    });
  });

  describe('SSH Connection', () => {
    it('should validate connection form', () => {
      // Try to connect without required fields
      cy.get('[data-testid="connect-button"]').click();

      // Check validation errors
      cy.get('[data-testid="host-error"]').should('be.visible');
      cy.get('[data-testid="username-error"]').should('be.visible');
      cy.get('[data-testid="password-error"]').should('be.visible');
    });

    it('should connect to SSH server successfully', () => {
      // Mock successful SSH connection
      cy.intercept('POST', '/api/console/connect', {
        statusCode: 200,
        body: {
          sessionId: 'test-session-123',
          connected: true,
          message: 'Connected successfully'
        }
      }).as('connectSSH');

      // Fill connection form
      cy.get('[data-testid="host-input"]').type('172.18.0.1');
      cy.get('[data-testid="port-input"]').clear().type('22');
      cy.get('[data-testid="username-input"]').type('root');
      cy.get('[data-testid="password-input"]').type('password');

      // Connect
      cy.get('[data-testid="connect-button"]').click();
      cy.wait('@connectSSH');

      // Verify connection success
      cy.get('[data-testid="success-toast"]').should('contain', 'Conectado com sucesso');
      cy.get('[data-testid="connection-status"]').should('contain', 'Conectado');
      cy.get('[data-testid="status-indicator"]').should('have.class', 'connected');
      cy.get('[data-testid="disconnect-button"]').should('be.visible');
    });

    it('should handle connection errors', () => {
      // Mock connection error
      cy.intercept('POST', '/api/console/connect', {
        statusCode: 401,
        body: { message: 'Authentication failed' }
      }).as('connectError');

      // Fill connection form
      cy.get('[data-testid="host-input"]').type('172.18.0.1');
      cy.get('[data-testid="username-input"]').type('root');
      cy.get('[data-testid="password-input"]').type('wrongpassword');

      // Try to connect
      cy.get('[data-testid="connect-button"]').click();
      cy.wait('@connectError');

      // Verify error handling
      cy.get('[data-testid="error-toast"]').should('contain', 'Falha na autenticação');
      cy.get('[data-testid="connection-status"]').should('contain', 'Erro de conexão');
      cy.get('[data-testid="status-indicator"]').should('have.class', 'error');
    });

    it('should disconnect from SSH server', () => {
      // First connect
      cy.intercept('POST', '/api/console/connect', {
        statusCode: 200,
        body: { sessionId: 'test-session-123', connected: true }
      });

      cy.get('[data-testid="host-input"]').type('172.18.0.1');
      cy.get('[data-testid="username-input"]').type('root');
      cy.get('[data-testid="password-input"]').type('password');
      cy.get('[data-testid="connect-button"]').click();

      // Mock disconnect
      cy.intercept('POST', '/api/console/disconnect', {
        statusCode: 200,
        body: { message: 'Disconnected successfully' }
      }).as('disconnectSSH');

      // Disconnect
      cy.get('[data-testid="disconnect-button"]').click();
      cy.wait('@disconnectSSH');

      // Verify disconnection
      cy.get('[data-testid="success-toast"]').should('contain', 'Desconectado');
      cy.get('[data-testid="connection-status"]').should('contain', 'Desconectado');
      cy.get('[data-testid="connect-button"]').should('be.visible');
    });
  });

  describe('Terminal Interface', () => {
    beforeEach(() => {
      // Setup connected state
      cy.intercept('POST', '/api/console/connect', {
        statusCode: 200,
        body: { sessionId: 'test-session-123', connected: true }
      });

      cy.get('[data-testid="host-input"]').type('172.18.0.1');
      cy.get('[data-testid="username-input"]').type('root');
      cy.get('[data-testid="password-input"]').type('password');
      cy.get('[data-testid="connect-button"]').click();
    });

    it('should display terminal correctly', () => {
      cy.get('[data-testid="terminal"]').should('be.visible');
      cy.get('[data-testid="terminal-screen"]').should('be.visible');
      cy.get('[data-testid="command-input"]').should('be.visible');
      cy.get('[data-testid="terminal-controls"]').should('be.visible');
    });

    it('should execute commands via WebSocket', () => {
      // Mock WebSocket command execution
      cy.mockWebSocket((ws) => {
        ws.on('command', (data) => {
          if (data.command === 'ls -la') {
            ws.emit('output', {
              sessionId: 'test-session-123',
              output: 'total 8\ndrwxr-xr-x 2 root root 4096 Jan 1 12:00 .\ndrwxr-xr-x 3 root root 4096 Jan 1 12:00 ..',
              type: 'stdout'
            });
          }
        });
      });

      // Type and execute command
      cy.get('[data-testid="command-input"]').type('ls -la{enter}');

      // Verify command output
      cy.get('[data-testid="terminal-output"]').should('contain', 'total 8');
      cy.get('[data-testid="terminal-output"]').should('contain', 'drwxr-xr-x');
    });

    it('should handle command errors', () => {
      // Mock WebSocket error response
      cy.mockWebSocket((ws) => {
        ws.on('command', (data) => {
          if (data.command === 'invalidcommand') {
            ws.emit('output', {
              sessionId: 'test-session-123',
              output: 'bash: invalidcommand: command not found',
              type: 'stderr'
            });
          }
        });
      });

      // Execute invalid command
      cy.get('[data-testid="command-input"]').type('invalidcommand{enter}');

      // Verify error output
      cy.get('[data-testid="terminal-output"]').should('contain', 'command not found');
      cy.get('[data-testid="terminal-output"] .error').should('exist');
    });

    it('should maintain command history', () => {
      const commands = ['pwd', 'ls', 'whoami'];

      // Execute multiple commands
      commands.forEach(cmd => {
        cy.get('[data-testid="command-input"]').type(`${cmd}{enter}`);
      });

      // Test history navigation
      cy.get('[data-testid="command-input"]').type('{uparrow}');
      cy.get('[data-testid="command-input"]').should('have.value', 'whoami');

      cy.get('[data-testid="command-input"]').type('{uparrow}');
      cy.get('[data-testid="command-input"]').should('have.value', 'ls');

      cy.get('[data-testid="command-input"]').type('{downarrow}');
      cy.get('[data-testid="command-input"]').should('have.value', 'whoami');
    });

    it('should auto-complete commands', () => {
      // Mock tab completion
      cy.intercept('POST', '/api/console/complete', {
        statusCode: 200,
        body: {
          suggestions: ['ls', 'less', 'ln'],
          partial: 'l'
        }
      }).as('tabComplete');

      // Type partial command and press tab
      cy.get('[data-testid="command-input"]').type('l{tab}');
      cy.wait('@tabComplete');

      // Verify completion suggestions
      cy.get('[data-testid="completion-popup"]').should('be.visible');
      cy.get('[data-testid="completion-options"]').should('contain', 'ls');
      cy.get('[data-testid="completion-options"]').should('contain', 'less');
    });

    it('should clear terminal', () => {
      // Add some output
      cy.get('[data-testid="command-input"]').type('echo "test output"{enter}');
      cy.get('[data-testid="terminal-output"]').should('contain', 'test output');

      // Clear terminal
      cy.get('[data-testid="clear-terminal-button"]').click();

      // Verify terminal is cleared
      cy.get('[data-testid="terminal-output"]').should('be.empty');
    });

    it('should copy terminal output', () => {
      // Add some output
      cy.get('[data-testid="command-input"]').type('echo "copyable text"{enter}');

      // Select and copy output
      cy.get('[data-testid="terminal-output"]').contains('copyable text').dblclick();
      cy.get('[data-testid="copy-button"]').click();

      // Verify copy success
      cy.get('[data-testid="success-toast"]').should('contain', 'Copiado');
    });
  });

  describe('File Operations', () => {
    beforeEach(() => {
      // Setup connected state
      cy.intercept('POST', '/api/console/connect', {
        statusCode: 200,
        body: { sessionId: 'test-session-123', connected: true }
      });

      cy.get('[data-testid="host-input"]').type('172.18.0.1');
      cy.get('[data-testid="username-input"]').type('root');
      cy.get('[data-testid="password-input"]').type('password');
      cy.get('[data-testid="connect-button"]').click();
    });

    it('should upload files', () => {
      // Open file upload
      cy.get('[data-testid="upload-file-button"]').click();
      cy.get('[data-testid="file-upload-modal"]').should('be.visible');

      // Mock file upload
      cy.intercept('POST', '/api/console/upload', {
        statusCode: 200,
        body: { message: 'File uploaded successfully' }
      }).as('uploadFile');

      // Select and upload file
      cy.get('[data-testid="file-input"]').selectFile('cypress/fixtures/test-file.txt');
      cy.get('[data-testid="upload-path-input"]').type('/tmp/');
      cy.get('[data-testid="upload-button"]').click();
      cy.wait('@uploadFile');

      // Verify upload success
      cy.get('[data-testid="success-toast"]').should('contain', 'Arquivo enviado');
    });

    it('should download files', () => {
      // Mock file download
      cy.intercept('POST', '/api/console/download', {
        statusCode: 200,
        body: { downloadUrl: '/api/files/test-download' }
      }).as('downloadFile');

      // Trigger download
      cy.get('[data-testid="command-input"]').type('cat /etc/passwd{enter}');
      cy.get('[data-testid="download-output-button"]').click();
      cy.wait('@downloadFile');

      // Verify download initiated
      cy.get('[data-testid="success-toast"]').should('contain', 'Download iniciado');
    });

    it('should navigate directories', () => {
      // Mock directory listing
      cy.mockWebSocket((ws) => {
        ws.on('command', (data) => {
          if (data.command === 'ls -la') {
            ws.emit('output', {
              output: 'drwxr-xr-x 2 root root 4096 Jan 1 12:00 Documents\ndrwxr-xr-x 2 root root 4096 Jan 1 12:00 Downloads',
              type: 'stdout'
            });
          }
        });
      });

      // List directory
      cy.get('[data-testid="command-input"]').type('ls -la{enter}');

      // Click on directory link
      cy.get('[data-testid="terminal-output"] .directory-link').contains('Documents').click();

      // Verify directory change
      cy.get('[data-testid="command-input"]').should('contain', 'cd Documents');
    });
  });

  describe('Multiple Sessions', () => {
    it('should manage multiple SSH sessions', () => {
      // Connect first session
      cy.intercept('POST', '/api/console/connect', {
        statusCode: 200,
        body: { sessionId: 'session-1', connected: true }
      }).as('connect1');

      cy.get('[data-testid="host-input"]').type('172.18.0.1');
      cy.get('[data-testid="username-input"]').type('root');
      cy.get('[data-testid="password-input"]').type('password');
      cy.get('[data-testid="connect-button"]').click();
      cy.wait('@connect1');

      // Open new session tab
      cy.get('[data-testid="new-session-button"]').click();

      // Connect second session
      cy.intercept('POST', '/api/console/connect', {
        statusCode: 200,
        body: { sessionId: 'session-2', connected: true }
      }).as('connect2');

      cy.get('[data-testid="host-input"]').clear().type('172.18.0.2');
      cy.get('[data-testid="username-input"]').clear().type('user');
      cy.get('[data-testid="password-input"]').clear().type('password');
      cy.get('[data-testid="connect-button"]').click();
      cy.wait('@connect2');

      // Verify multiple sessions
      cy.get('[data-testid="session-tabs"]').should('be.visible');
      cy.get('[data-testid="session-tab"]').should('have.length', 2);
      cy.get('[data-testid="active-session"]').should('contain', 'session-2');
    });

    it('should switch between sessions', () => {
      // Setup two sessions (mock setup)
      cy.task('createSessions', ['session-1', 'session-2']);

      // Switch to first session
      cy.get('[data-testid="session-tab"]').contains('session-1').click();
      cy.get('[data-testid="active-session"]').should('contain', 'session-1');

      // Switch to second session
      cy.get('[data-testid="session-tab"]').contains('session-2').click();
      cy.get('[data-testid="active-session"]').should('contain', 'session-2');
    });

    it('should close sessions', () => {
      // Setup session
      cy.task('createSessions', ['session-1']);

      // Close session
      cy.get('[data-testid="session-tab"] [data-testid="close-session-button"]').click();
      cy.get('[data-testid="confirm-modal"]').should('be.visible');
      cy.get('[data-testid="confirm-button"]').click();

      // Verify session closed
      cy.get('[data-testid="session-tabs"]').should('not.exist');
      cy.get('[data-testid="connection-form"]').should('be.visible');
    });
  });

  describe('Terminal Customization', () => {
    beforeEach(() => {
      // Setup connected state
      cy.intercept('POST', '/api/console/connect', {
        statusCode: 200,
        body: { sessionId: 'test-session-123', connected: true }
      });

      cy.get('[data-testid="host-input"]').type('172.18.0.1');
      cy.get('[data-testid="username-input"]').type('root');
      cy.get('[data-testid="password-input"]').type('password');
      cy.get('[data-testid="connect-button"]').click();
    });

    it('should change terminal theme', () => {
      // Open settings
      cy.get('[data-testid="terminal-settings-button"]').click();
      cy.get('[data-testid="settings-modal"]').should('be.visible');

      // Change theme
      cy.get('[data-testid="theme-select"]').select('dark');
      cy.get('[data-testid="apply-settings-button"]').click();

      // Verify theme change
      cy.get('[data-testid="terminal"]').should('have.class', 'dark-theme');
    });

    it('should adjust font size', () => {
      // Open settings
      cy.get('[data-testid="terminal-settings-button"]').click();

      // Change font size
      cy.get('[data-testid="font-size-input"]').clear().type('16');
      cy.get('[data-testid="apply-settings-button"]').click();

      // Verify font size change
      cy.get('[data-testid="terminal"]').should('have.css', 'font-size', '16px');
    });

    it('should change color scheme', () => {
      // Open settings
      cy.get('[data-testid="terminal-settings-button"]').click();

      // Change color scheme
      cy.get('[data-testid="color-scheme-select"]').select('solarized');
      cy.get('[data-testid="apply-settings-button"]').click();

      // Verify color scheme
      cy.get('[data-testid="terminal"]').should('have.class', 'solarized-scheme');
    });
  });

  describe('Keyboard Shortcuts', () => {
    beforeEach(() => {
      // Setup connected state
      cy.intercept('POST', '/api/console/connect', {
        statusCode: 200,
        body: { sessionId: 'test-session-123', connected: true }
      });

      cy.get('[data-testid="host-input"]').type('172.18.0.1');
      cy.get('[data-testid="username-input"]').type('root');
      cy.get('[data-testid="password-input"]').type('password');
      cy.get('[data-testid="connect-button"]').click();
    });

    it('should support Ctrl+C to interrupt command', () => {
      // Start long-running command
      cy.get('[data-testid="command-input"]').type('sleep 30');
      cy.get('[data-testid="command-input"]').type('{enter}');

      // Interrupt with Ctrl+C
      cy.get('[data-testid="terminal"]').type('{ctrl+c}');

      // Verify command interrupted
      cy.get('[data-testid="terminal-output"]').should('contain', '^C');
    });

    it('should support Ctrl+L to clear screen', () => {
      // Add some output
      cy.get('[data-testid="command-input"]').type('echo "test"{enter}');

      // Clear with Ctrl+L
      cy.get('[data-testid="terminal"]').type('{ctrl+l}');

      // Verify screen cleared
      cy.get('[data-testid="terminal-output"]').should('be.empty');
    });

    it('should support Tab for completion', () => {
      // Type partial command
      cy.get('[data-testid="command-input"]').type('ec');

      // Press Tab
      cy.get('[data-testid="command-input"]').type('{tab}');

      // Verify completion
      cy.get('[data-testid="command-input"]').should('have.value', 'echo');
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle connection loss gracefully', () => {
      // Setup connection
      cy.intercept('POST', '/api/console/connect', {
        statusCode: 200,
        body: { sessionId: 'test-session-123', connected: true }
      });

      cy.get('[data-testid="host-input"]').type('172.18.0.1');
      cy.get('[data-testid="username-input"]').type('root');
      cy.get('[data-testid="password-input"]').type('password');
      cy.get('[data-testid="connect-button"]').click();

      // Simulate connection loss
      cy.mockWebSocketDisconnect();

      // Verify disconnection handling
      cy.get('[data-testid="connection-lost-alert"]').should('be.visible');
      cy.get('[data-testid="reconnect-button"]').should('be.visible');
    });

    it('should auto-reconnect when possible', () => {
      // Setup auto-reconnect scenario
      cy.mockWebSocketReconnect();

      // Verify auto-reconnect
      cy.get('[data-testid="reconnecting-indicator"]').should('be.visible');
      cy.get('[data-testid="success-toast"]').should('contain', 'Reconectado');
    });

    it('should handle large output efficiently', () => {
      // Generate large output
      const largeOutput = 'line of output\n'.repeat(1000);

      cy.mockWebSocket((ws) => {
        ws.emit('output', {
          sessionId: 'test-session-123',
          output: largeOutput,
          type: 'stdout'
        });
      });

      // Verify terminal handles large output
      cy.get('[data-testid="terminal-output"]').should('contain', 'line of output');
      cy.get('[data-testid="terminal"]').should('be.visible'); // Should not crash
    });
  });

  describe('Security Features', () => {
    it('should mask sensitive commands in history', () => {
      const sensitiveCommands = [
        'mysql -p password123',
        'wget http://site.com --password=secret',
        'echo "password123" | sudo -S command'
      ];

      sensitiveCommands.forEach(cmd => {
        cy.get('[data-testid="command-input"]').type(`${cmd}{enter}`);
      });

      // Check history - sensitive parts should be masked
      cy.get('[data-testid="command-history-button"]').click();
      cy.get('[data-testid="history-modal"]').should('be.visible');
      cy.get('[data-testid="history-item"]').should('contain', 'mysql -p ****');
    });

    it('should warn about dangerous commands', () => {
      const dangerousCommands = [
        'rm -rf /',
        'dd if=/dev/zero of=/dev/sda',
        'mkfs.ext4 /dev/sda1'
      ];

      dangerousCommands.forEach(cmd => {
        cy.get('[data-testid="command-input"]').type(cmd);
        cy.get('[data-testid="warning-indicator"]').should('be.visible');
        cy.get('[data-testid="command-input"]').clear();
      });
    });

    it('should timeout idle sessions', () => {
      // Setup connection
      cy.intercept('POST', '/api/console/connect', {
        statusCode: 200,
        body: { sessionId: 'test-session-123', connected: true }
      });

      cy.get('[data-testid="host-input"]').type('172.18.0.1');
      cy.get('[data-testid="username-input"]').type('root');
      cy.get('[data-testid="password-input"]').type('password');
      cy.get('[data-testid="connect-button"]').click();

      // Simulate idle timeout
      cy.clock();
      cy.tick(30 * 60 * 1000); // 30 minutes

      // Verify session timeout
      cy.get('[data-testid="session-timeout-alert"]').should('be.visible');
      cy.get('[data-testid="extend-session-button"]').should('be.visible');
    });
  });
});