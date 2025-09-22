describe('Domains Management', () => {
  const testUser = {
    email: 'test@netpilot.local',
    password: 'test123',
  };

  const testDomain = {
    name: 'test-domain.example.com',
    description: 'Test domain for E2E testing',
  };

  beforeEach(() => {
    // Reset database state
    cy.task('resetDatabase');

    // Create test user
    cy.task('createUser', testUser);

    // Visit login page and authenticate
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type(testUser.email);
    cy.get('[data-testid="password-input"]').type(testUser.password);
    cy.get('[data-testid="login-button"]').click();

    // Verify successful login
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="user-menu"]').should('be.visible');
  });

  describe('Domain List Page', () => {
    beforeEach(() => {
      cy.visit('/domains');
    });

    it('should display domains page correctly', () => {
      cy.get('[data-testid="domains-page"]').should('be.visible');
      cy.get('[data-testid="page-title"]').should('contain', 'Domínios');
      cy.get('[data-testid="add-domain-button"]').should('be.visible');
      cy.get('[data-testid="domains-table"]').should('be.visible');
    });

    it('should show empty state when no domains exist', () => {
      cy.get('[data-testid="empty-state"]').should('be.visible');
      cy.get('[data-testid="empty-state-message"]').should('contain', 'Nenhum domínio');
      cy.get('[data-testid="create-first-domain-button"]').should('be.visible');
    });

    it('should display search and filter controls', () => {
      cy.get('[data-testid="search-input"]').should('be.visible');
      cy.get('[data-testid="status-filter"]').should('be.visible');
      cy.get('[data-testid="refresh-button"]').should('be.visible');
    });
  });

  describe('Create Domain', () => {
    beforeEach(() => {
      cy.visit('/domains');
      cy.get('[data-testid="add-domain-button"]').click();
    });

    it('should open create domain modal', () => {
      cy.get('[data-testid="create-domain-modal"]').should('be.visible');
      cy.get('[data-testid="modal-title"]').should('contain', 'Novo Domínio');
      cy.get('[data-testid="domain-form"]').should('be.visible');
    });

    it('should create a domain successfully', () => {
      // Fill form
      cy.get('[data-testid="domain-name-input"]').type(testDomain.name);
      cy.get('[data-testid="domain-description-input"]').type(testDomain.description);
      cy.get('[data-testid="auto-tls-checkbox"]').check();
      cy.get('[data-testid="force-https-checkbox"]').check();

      // Submit form
      cy.get('[data-testid="submit-button"]').click();

      // Verify success
      cy.get('[data-testid="success-toast"]').should('be.visible');
      cy.get('[data-testid="success-toast"]').should('contain', 'Domínio criado');
      cy.get('[data-testid="create-domain-modal"]').should('not.exist');

      // Verify domain appears in list
      cy.get('[data-testid="domains-table"]').should('contain', testDomain.name);
      cy.get('[data-testid="domains-table"]').should('contain', testDomain.description);
    });

    it('should validate required fields', () => {
      // Try to submit without filling required fields
      cy.get('[data-testid="submit-button"]').click();

      // Check validation errors
      cy.get('[data-testid="domain-name-error"]').should('be.visible');
      cy.get('[data-testid="domain-name-error"]').should('contain', 'obrigatório');
    });

    it('should validate domain name format', () => {
      // Enter invalid domain name
      cy.get('[data-testid="domain-name-input"]').type('invalid..domain');
      cy.get('[data-testid="submit-button"]').click();

      // Check validation error
      cy.get('[data-testid="domain-name-error"]').should('be.visible');
      cy.get('[data-testid="domain-name-error"]').should('contain', 'formato inválido');
    });

    it('should prevent duplicate domain names', () => {
      // Create first domain
      cy.get('[data-testid="domain-name-input"]').type(testDomain.name);
      cy.get('[data-testid="domain-description-input"]').type(testDomain.description);
      cy.get('[data-testid="submit-button"]').click();
      cy.get('[data-testid="success-toast"]').should('be.visible');

      // Try to create duplicate
      cy.get('[data-testid="add-domain-button"]').click();
      cy.get('[data-testid="domain-name-input"]').type(testDomain.name);
      cy.get('[data-testid="domain-description-input"]').type('Duplicate domain');
      cy.get('[data-testid="submit-button"]').click();

      // Check error
      cy.get('[data-testid="error-toast"]').should('be.visible');
      cy.get('[data-testid="error-toast"]').should('contain', 'já existe');
    });

    it('should cancel domain creation', () => {
      // Fill some data
      cy.get('[data-testid="domain-name-input"]').type('cancel-test.com');

      // Cancel
      cy.get('[data-testid="cancel-button"]').click();

      // Verify modal is closed and no domain was created
      cy.get('[data-testid="create-domain-modal"]').should('not.exist');
      cy.get('[data-testid="domains-table"]').should('not.contain', 'cancel-test.com');
    });
  });

  describe('Domain Management', () => {
    beforeEach(() => {
      // Create test domain via API
      cy.task('createDomain', {
        ...testDomain,
        userId: testUser.id,
      });
      cy.visit('/domains');
    });

    it('should display domain information correctly', () => {
      cy.get('[data-testid="domain-row"]').should('be.visible');
      cy.get('[data-testid="domain-name"]').should('contain', testDomain.name);
      cy.get('[data-testid="domain-description"]').should('contain', testDomain.description);
      cy.get('[data-testid="domain-status"]').should('be.visible');
      cy.get('[data-testid="domain-actions"]').should('be.visible');
    });

    it('should edit domain', () => {
      cy.get('[data-testid="edit-domain-button"]').click();
      cy.get('[data-testid="edit-domain-modal"]').should('be.visible');

      // Update description
      const newDescription = 'Updated domain description';
      cy.get('[data-testid="domain-description-input"]').clear().type(newDescription);

      // Toggle settings
      cy.get('[data-testid="force-https-checkbox"]').uncheck();

      // Save changes
      cy.get('[data-testid="save-button"]').click();

      // Verify success
      cy.get('[data-testid="success-toast"]').should('contain', 'atualizado');
      cy.get('[data-testid="domain-description"]').should('contain', newDescription);
    });

    it('should toggle domain status', () => {
      // Get initial status
      cy.get('[data-testid="domain-status"]').then(($status) => {
        const isEnabled = $status.hasClass('enabled');

        // Click toggle
        cy.get('[data-testid="toggle-domain-button"]').click();

        // Confirm action
        cy.get('[data-testid="confirm-modal"]').should('be.visible');
        cy.get('[data-testid="confirm-button"]').click();

        // Verify status changed
        cy.get('[data-testid="success-toast"]').should('be.visible');
        if (isEnabled) {
          cy.get('[data-testid="domain-status"]').should('contain', 'Desabilitado');
        } else {
          cy.get('[data-testid="domain-status"]').should('contain', 'Habilitado');
        }
      });
    });

    it('should delete domain', () => {
      cy.get('[data-testid="delete-domain-button"]').click();
      cy.get('[data-testid="delete-modal"]').should('be.visible');

      // Confirm deletion
      cy.get('[data-testid="confirm-delete-button"]').click();

      // Verify success
      cy.get('[data-testid="success-toast"]').should('contain', 'removido');
      cy.get('[data-testid="domains-table"]').should('not.contain', testDomain.name);
    });

    it('should view domain details', () => {
      cy.get('[data-testid="view-domain-button"]').click();
      cy.url().should('include', '/domains/');

      // Verify domain details page
      cy.get('[data-testid="domain-details-page"]').should('be.visible');
      cy.get('[data-testid="domain-title"]').should('contain', testDomain.name);
      cy.get('[data-testid="domain-description"]').should('contain', testDomain.description);

      // Verify related data sections
      cy.get('[data-testid="proxy-rules-section"]').should('be.visible');
      cy.get('[data-testid="redirects-section"]').should('be.visible');
      cy.get('[data-testid="ssl-certificates-section"]').should('be.visible');
    });
  });

  describe('Domain Search and Filtering', () => {
    beforeEach(() => {
      // Create multiple test domains
      const domains = [
        { name: 'active-domain.com', description: 'Active domain', enabled: true },
        { name: 'disabled-domain.com', description: 'Disabled domain', enabled: false },
        { name: 'test-site.org', description: 'Test site', enabled: true },
        { name: 'demo-app.net', description: 'Demo application', enabled: true },
      ];

      domains.forEach((domain, index) => {
        cy.task('createDomain', {
          ...domain,
          userId: testUser.id,
          id: `domain-${index}`,
        });
      });

      cy.visit('/domains');
    });

    it('should search domains by name', () => {
      cy.get('[data-testid="search-input"]').type('test');
      cy.get('[data-testid="domains-table"] tbody tr').should('have.length', 1);
      cy.get('[data-testid="domains-table"]').should('contain', 'test-site.org');
    });

    it('should search domains by description', () => {
      cy.get('[data-testid="search-input"]').type('Demo');
      cy.get('[data-testid="domains-table"] tbody tr').should('have.length', 1);
      cy.get('[data-testid="domains-table"]').should('contain', 'demo-app.net');
    });

    it('should filter domains by status', () => {
      // Filter by enabled
      cy.get('[data-testid="status-filter"]').select('enabled');
      cy.get('[data-testid="domains-table"] tbody tr').should('have.length', 3);

      // Filter by disabled
      cy.get('[data-testid="status-filter"]').select('disabled');
      cy.get('[data-testid="domains-table"] tbody tr').should('have.length', 1);
      cy.get('[data-testid="domains-table"]').should('contain', 'disabled-domain.com');

      // Show all
      cy.get('[data-testid="status-filter"]').select('all');
      cy.get('[data-testid="domains-table"] tbody tr').should('have.length', 4);
    });

    it('should combine search and filter', () => {
      cy.get('[data-testid="search-input"]').type('domain');
      cy.get('[data-testid="status-filter"]').select('enabled');
      cy.get('[data-testid="domains-table"] tbody tr').should('have.length', 1);
      cy.get('[data-testid="domains-table"]').should('contain', 'active-domain.com');
    });

    it('should clear search', () => {
      cy.get('[data-testid="search-input"]').type('test');
      cy.get('[data-testid="domains-table"] tbody tr').should('have.length', 1);

      cy.get('[data-testid="clear-search-button"]').click();
      cy.get('[data-testid="search-input"]').should('have.value', '');
      cy.get('[data-testid="domains-table"] tbody tr').should('have.length', 4);
    });
  });

  describe('Domain Pagination', () => {
    beforeEach(() => {
      // Create many domains for pagination testing
      const domains = Array.from({ length: 25 }, (_, i) => ({
        name: `domain-${i + 1}.com`,
        description: `Test domain ${i + 1}`,
        enabled: i % 2 === 0,
        userId: testUser.id,
      }));

      domains.forEach(domain => {
        cy.task('createDomain', domain);
      });

      cy.visit('/domains');
    });

    it('should display pagination controls', () => {
      cy.get('[data-testid="pagination"]').should('be.visible');
      cy.get('[data-testid="page-info"]').should('contain', 'Página 1');
      cy.get('[data-testid="next-page-button"]').should('be.visible');
      cy.get('[data-testid="prev-page-button"]').should('be.disabled');
    });

    it('should navigate between pages', () => {
      // Go to next page
      cy.get('[data-testid="next-page-button"]').click();
      cy.get('[data-testid="page-info"]').should('contain', 'Página 2');
      cy.get('[data-testid="prev-page-button"]').should('be.enabled');

      // Go back to previous page
      cy.get('[data-testid="prev-page-button"]').click();
      cy.get('[data-testid="page-info"]').should('contain', 'Página 1');
    });

    it('should change page size', () => {
      cy.get('[data-testid="page-size-select"]').select('50');
      cy.get('[data-testid="domains-table"] tbody tr').should('have.length', 25);
      cy.get('[data-testid="next-page-button"]').should('be.disabled');
    });
  });

  describe('Domain Configuration', () => {
    beforeEach(() => {
      cy.task('createDomain', {
        ...testDomain,
        userId: testUser.id,
      });
      cy.visit('/domains');
      cy.get('[data-testid="view-domain-button"]').click();
    });

    it('should display SSL certificate information', () => {
      cy.get('[data-testid="ssl-section"]').should('be.visible');
      cy.get('[data-testid="ssl-status"]').should('be.visible');
      cy.get('[data-testid="ssl-expiry"]').should('be.visible');
    });

    it('should manage proxy rules', () => {
      cy.get('[data-testid="proxy-rules-section"]').should('be.visible');
      cy.get('[data-testid="add-proxy-rule-button"]').click();

      // Create proxy rule
      cy.get('[data-testid="proxy-rule-modal"]').should('be.visible');
      cy.get('[data-testid="origin-path-input"]').type('/api/*');
      cy.get('[data-testid="destination-url-input"]').type('http://backend:3001');
      cy.get('[data-testid="priority-input"]').type('10');
      cy.get('[data-testid="save-proxy-rule-button"]').click();

      // Verify proxy rule was created
      cy.get('[data-testid="success-toast"]').should('be.visible');
      cy.get('[data-testid="proxy-rules-list"]').should('contain', '/api/*');
    });

    it('should manage redirects', () => {
      cy.get('[data-testid="redirects-section"]').should('be.visible');
      cy.get('[data-testid="add-redirect-button"]').click();

      // Create redirect
      cy.get('[data-testid="redirect-modal"]').should('be.visible');
      cy.get('[data-testid="redirect-from-input"]').type('/old-path');
      cy.get('[data-testid="redirect-to-input"]').type('/new-path');
      cy.get('[data-testid="redirect-type-select"]').select('301');
      cy.get('[data-testid="save-redirect-button"]').click();

      // Verify redirect was created
      cy.get('[data-testid="success-toast"]').should('be.visible');
      cy.get('[data-testid="redirects-list"]').should('contain', '/old-path');
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      cy.task('createDomain', {
        ...testDomain,
        userId: testUser.id,
      });
    });

    it('should work on mobile devices', () => {
      cy.viewport('iphone-6');
      cy.visit('/domains');

      // Check mobile layout
      cy.get('[data-testid="mobile-menu-button"]').should('be.visible');
      cy.get('[data-testid="domains-mobile-list"]').should('be.visible');
      cy.get('[data-testid="domains-table"]').should('not.be.visible');

      // Open domain actions
      cy.get('[data-testid="domain-mobile-card"]').click();
      cy.get('[data-testid="mobile-actions"]').should('be.visible');
    });

    it('should work on tablet devices', () => {
      cy.viewport('ipad-2');
      cy.visit('/domains');

      // Check tablet layout
      cy.get('[data-testid="domains-table"]').should('be.visible');
      cy.get('[data-testid="add-domain-button"]').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      cy.visit('/domains');
    });

    it('should be keyboard navigable', () => {
      // Tab through interactive elements
      cy.get('[data-testid="search-input"]').focus().tab();
      cy.get('[data-testid="status-filter"]').should('be.focused').tab();
      cy.get('[data-testid="add-domain-button"]').should('be.focused');
    });

    it('should have proper ARIA labels', () => {
      cy.get('[data-testid="search-input"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="add-domain-button"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="domains-table"]').should('have.attr', 'role', 'table');
    });

    it('should announce status changes to screen readers', () => {
      cy.get('[data-testid="add-domain-button"]').click();
      cy.get('[data-testid="domain-name-input"]').type(testDomain.name);
      cy.get('[data-testid="submit-button"]').click();

      cy.get('[data-testid="sr-announcement"]').should('contain', 'Domínio criado com sucesso');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      cy.visit('/domains');
    });

    it('should handle API errors gracefully', () => {
      // Simulate API error
      cy.intercept('POST', '/api/domains', { statusCode: 500, body: { message: 'Internal server error' } });

      cy.get('[data-testid="add-domain-button"]').click();
      cy.get('[data-testid="domain-name-input"]').type(testDomain.name);
      cy.get('[data-testid="submit-button"]').click();

      cy.get('[data-testid="error-toast"]').should('be.visible');
      cy.get('[data-testid="error-toast"]').should('contain', 'Erro interno');
    });

    it('should handle network errors', () => {
      // Simulate network error
      cy.intercept('GET', '/api/domains', { forceNetworkError: true });
      cy.visit('/domains');

      cy.get('[data-testid="error-message"]').should('be.visible');
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });

    it('should recover from errors', () => {
      // Simulate initial error
      cy.intercept('GET', '/api/domains', { statusCode: 500 }).as('domainsError');
      cy.visit('/domains');
      cy.wait('@domainsError');

      // Fix the error and retry
      cy.intercept('GET', '/api/domains', { fixture: 'domains.json' }).as('domainsSuccess');
      cy.get('[data-testid="retry-button"]').click();
      cy.wait('@domainsSuccess');

      cy.get('[data-testid="domains-table"]').should('be.visible');
    });
  });
});