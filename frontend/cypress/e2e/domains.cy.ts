describe('Domain Management', () => {
  beforeEach(() => {
    // Login as admin before each test
    cy.loginAsAdmin();
    cy.navigateTo('domains');
  });

  afterEach(() => {
    // Clean up any test domains created
    cy.task('cleanDatabase');
  });

  describe('Domain List Page', () => {
    beforeEach(() => {
      // Mock domains data
      cy.fixture('domains').then((domains) => {
        cy.intercept('GET', '**/domains', {
          statusCode: 200,
          body: {
            data: domains,
            total: domains.length,
            page: 1,
            limit: 10,
            totalPages: 1,
          },
        }).as('getDomains');
      });
    });

    it('should display domains list', () => {
      cy.shouldBeOnPage('/domains');
      cy.shouldHaveTitle('Domains - NetPilot');
      cy.shouldHaveBreadcrumb(['Dashboard', 'Domains']);

      cy.waitForApi('getDomains');

      cy.get('[data-cy=domains-table]').should('be.visible');
      cy.get('[data-cy=create-domain-button]').should('be.visible');
      cy.get('[data-cy=search-input]').should('be.visible');
      cy.get('[data-cy=filter-enabled]').should('be.visible');
    });

    it('should show domain details in table', () => {
      cy.waitForApi('getDomains');

      cy.get('[data-cy=domain-row]').first().within(() => {
        cy.get('[data-cy=domain-name]').should('contain.text', 'example.com');
        cy.get('[data-cy=domain-description]').should('be.visible');
        cy.get('[data-cy=domain-status]').should('be.visible');
        cy.get('[data-cy=domain-ssl-status]').should('be.visible');
        cy.get('[data-cy=domain-actions]').should('be.visible');
      });
    });

    it('should search domains', () => {
      cy.waitForApi('getDomains');

      cy.intercept('GET', '**/domains?search=test*', {
        statusCode: 200,
        body: {
          data: [
            {
              id: 1,
              name: 'test.example.com',
              description: 'Test domain',
              enabled: true,
              autoSsl: true,
              proxyRules: [],
            },
          ],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      }).as('searchDomains');

      cy.searchInTable('test');
      cy.waitForApi('searchDomains');

      cy.shouldHaveTableRows(1);
      cy.get('[data-cy=domain-row]').first().should('contain.text', 'test.example.com');
    });

    it('should filter by enabled status', () => {
      cy.waitForApi('getDomains');

      cy.intercept('GET', '**/domains?enabled=false*', {
        statusCode: 200,
        body: {
          data: [
            {
              id: 2,
              name: 'disabled.example.com',
              description: 'Disabled domain',
              enabled: false,
              autoSsl: false,
              proxyRules: [],
            },
          ],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      }).as('getDisabledDomains');

      cy.get('[data-cy=filter-enabled]').select('Disabled');
      cy.waitForApi('getDisabledDomains');

      cy.shouldHaveTableRows(1);
      cy.get('[data-cy=domain-status]').should('contain.text', 'Disabled');
    });

    it('should handle pagination', () => {
      // Mock paginated response
      cy.intercept('GET', '**/domains?page=2*', {
        statusCode: 200,
        body: {
          data: [
            {
              id: 11,
              name: 'page2.example.com',
              description: 'Page 2 domain',
              enabled: true,
              autoSsl: true,
              proxyRules: [],
            },
          ],
          total: 25,
          page: 2,
          limit: 10,
          totalPages: 3,
        },
      }).as('getPage2');

      cy.waitForApi('getDomains');

      cy.get('[data-cy=pagination-next]').click();
      cy.waitForApi('getPage2');

      cy.get('[data-cy=current-page]').should('contain.text', '2');
      cy.get('[data-cy=domain-row]').should('contain.text', 'page2.example.com');
    });

    it('should show empty state when no domains', () => {
      cy.intercept('GET', '**/domains', {
        statusCode: 200,
        body: {
          data: [],
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
      }).as('getEmptyDomains');

      cy.waitForApi('getEmptyDomains');

      cy.get('[data-cy=empty-state]').should('be.visible');
      cy.get('[data-cy=empty-state-title]').should('contain.text', 'No domains found');
      cy.get('[data-cy=create-first-domain-button]').should('be.visible');
    });

    it('should handle loading states', () => {
      cy.intercept('GET', '**/domains', {
        delay: 2000,
        statusCode: 200,
        body: {
          data: [],
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
      }).as('getDomainsSlowly');

      cy.visit('/domains');
      cy.shouldBeLoading();
      cy.get('[data-cy=domains-table]').should('not.exist');

      cy.waitForApi('getDomainsSlowly');
      cy.shouldNotBeLoading();
      cy.get('[data-cy=empty-state]').should('be.visible');
    });

    it('should handle API errors', () => {
      cy.intercept('GET', '**/domains', {
        statusCode: 500,
        body: { message: 'Internal server error' },
      }).as('getDomainsError');

      cy.visit('/domains');
      cy.waitForApi('getDomainsError');

      cy.get('[data-cy=error-state]').should('be.visible');
      cy.get('[data-cy=error-message]').should('contain.text', 'Failed to load domains');
      cy.get('[data-cy=retry-button]').should('be.visible');
    });
  });

  describe('Create Domain', () => {
    beforeEach(() => {
      cy.get('[data-cy=create-domain-button]').click();
      cy.get('[data-cy=create-domain-modal]').should('be.visible');
    });

    it('should display create domain form', () => {
      cy.get('[data-cy=domain-name-input]').should('be.visible');
      cy.get('[data-cy=domain-description-input]').should('be.visible');
      cy.get('[data-cy=domain-enabled-checkbox]').should('be.checked');
      cy.get('[data-cy=auto-ssl-checkbox]').should('be.checked');
      cy.get('[data-cy=force-https-checkbox]').should('be.checked');
      cy.get('[data-cy=block-external-checkbox]').should('not.be.checked');
      cy.get('[data-cy=www-redirect-checkbox]').should('not.be.checked');

      cy.get('[data-cy=create-button]').should('be.visible');
      cy.get('[data-cy=cancel-button]').should('be.visible');
    });

    it('should validate required fields', () => {
      cy.get('[data-cy=create-button]').click();

      cy.get('[data-cy=domain-name-error]').should('contain.text', 'Domain name is required');
      cy.get('[data-cy=create-domain-modal]').should('be.visible'); // Modal should stay open
    });

    it('should validate domain name format', () => {
      const invalidDomains = [
        'invalid..domain',
        '.example.com',
        'example.com.',
        'spaces in domain.com',
        'very-long-domain-name-that-exceeds-the-maximum-length-allowed-for-domain-names.com',
      ];

      invalidDomains.forEach((domain) => {
        cy.get('[data-cy=domain-name-input]').clear().type(domain);
        cy.get('[data-cy=create-button]').click();

        cy.get('[data-cy=domain-name-error]').should('contain.text', 'Invalid domain format');
        cy.get('[data-cy=domain-name-input]').clear();
      });
    });

    it('should create domain successfully', () => {
      const newDomain = {
        name: 'new-domain.com',
        description: 'Test domain creation',
        enabled: true,
        autoSsl: true,
        forceHttps: true,
        blockExternal: false,
        wwwRedirect: false,
      };

      cy.intercept('POST', '**/domains', {
        statusCode: 201,
        body: {
          id: 999,
          ...newDomain,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }).as('createDomain');

      cy.intercept('GET', '**/domains', { fixture: 'domains-with-new.json' }).as('getUpdatedDomains');

      cy.fillForm({
        'domain-name': newDomain.name,
        'domain-description': newDomain.description,
      });

      cy.get('[data-cy=create-button]').click();

      cy.waitForApi('createDomain');
      cy.shouldShowToast('success', 'Domain created successfully');
      cy.get('[data-cy=create-domain-modal]').should('not.exist');

      cy.waitForApi('getUpdatedDomains');
      cy.get('[data-cy=domains-table]').should('contain.text', newDomain.name);
    });

    it('should handle duplicate domain error', () => {
      cy.intercept('POST', '**/domains', {
        statusCode: 409,
        body: { message: 'Domain already exists' },
      }).as('createDuplicateDomain');

      cy.fillForm({
        'domain-name': 'existing-domain.com',
        'domain-description': 'Duplicate domain',
      });

      cy.get('[data-cy=create-button]').click();

      cy.waitForApi('createDuplicateDomain');
      cy.shouldShowToast('error', 'Domain already exists');
      cy.get('[data-cy=create-domain-modal]').should('be.visible'); // Modal should stay open
    });

    it('should normalize domain name', () => {
      const inputs = [
        { input: 'EXAMPLE.COM', expected: 'example.com' },
        { input: 'https://example.com', expected: 'example.com' },
        { input: 'http://example.com/', expected: 'example.com' },
        { input: '  example.com  ', expected: 'example.com' },
      ];

      inputs.forEach(({ input, expected }) => {
        cy.get('[data-cy=domain-name-input]').clear().type(input);
        cy.get('[data-cy=domain-name-input]').should('have.value', expected);
      });
    });

    it('should handle form validation on all fields', () => {
      // Test description max length
      const longDescription = 'a'.repeat(1001);
      cy.get('[data-cy=domain-description-input]').type(longDescription);
      cy.get('[data-cy=create-button]').click();

      cy.get('[data-cy=domain-description-error]').should('contain.text', 'Description is too long');
    });

    it('should cancel domain creation', () => {
      cy.fillForm({
        'domain-name': 'cancel-test.com',
        'domain-description': 'This should be cancelled',
      });

      cy.get('[data-cy=cancel-button]').click();
      cy.get('[data-cy=create-domain-modal]').should('not.exist');

      // Verify domain was not created
      cy.get('[data-cy=domains-table]').should('not.contain.text', 'cancel-test.com');
    });

    it('should close modal on escape key', () => {
      cy.get('[data-cy=create-domain-modal]').trigger('keydown', { key: 'Escape' });
      cy.get('[data-cy=create-domain-modal]').should('not.exist');
    });

    it('should handle complex domain configurations', () => {
      const complexDomain = {
        name: 'complex-domain.com',
        description: 'Complex configuration test',
        enabled: true,
        autoSsl: true,
        forceHttps: false, // Different from default
        blockExternal: true, // Different from default
        wwwRedirect: true, // Different from default
      };

      cy.intercept('POST', '**/domains', {
        statusCode: 201,
        body: { id: 888, ...complexDomain },
      }).as('createComplexDomain');

      cy.fillForm({
        'domain-name': complexDomain.name,
        'domain-description': complexDomain.description,
      });

      // Uncheck force HTTPS
      cy.get('[data-cy=force-https-checkbox]').uncheck();

      // Check block external
      cy.get('[data-cy=block-external-checkbox]').check();

      // Check WWW redirect
      cy.get('[data-cy=www-redirect-checkbox]').check();

      cy.get('[data-cy=create-button]').click();

      cy.waitForApi('createComplexDomain');
      cy.shouldShowToast('success', 'Domain created successfully');
    });
  });

  describe('Domain Actions', () => {
    beforeEach(() => {
      cy.fixture('domains').then((domains) => {
        cy.intercept('GET', '**/domains', {
          statusCode: 200,
          body: {
            data: domains,
            total: domains.length,
            page: 1,
            limit: 10,
            totalPages: 1,
          },
        }).as('getDomains');
      });

      cy.waitForApi('getDomains');
    });

    it('should toggle domain status', () => {
      cy.intercept('PATCH', '**/domains/1/toggle', {
        statusCode: 200,
        body: {
          id: 1,
          name: 'example.com',
          enabled: false, // Toggled from true to false
        },
      }).as('toggleDomain');

      cy.get('[data-cy=domain-row]').first().within(() => {
        cy.get('[data-cy=toggle-domain-button]').click();
      });

      cy.waitForApi('toggleDomain');
      cy.shouldShowToast('success', 'Domain status updated');

      // Verify UI reflects the change
      cy.get('[data-cy=domain-row]').first().within(() => {
        cy.get('[data-cy=domain-status]').should('contain.text', 'Disabled');
      });
    });

    it('should view domain details', () => {
      cy.get('[data-cy=domain-row]').first().within(() => {
        cy.get('[data-cy=view-domain-button]').click();
      });

      cy.shouldBeOnPage('/domains/1');
      cy.shouldHaveTitle('example.com - Domain Details - NetPilot');
    });

    it('should edit domain', () => {
      cy.get('[data-cy=domain-row]').first().within(() => {
        cy.get('[data-cy=edit-domain-button]').click();
      });

      cy.get('[data-cy=edit-domain-modal]').should('be.visible');
      cy.get('[data-cy=domain-name-input]').should('have.value', 'example.com');
      cy.get('[data-cy=domain-name-input]').should('be.disabled'); // Name should not be editable

      // Update description
      cy.get('[data-cy=domain-description-input]').clear().type('Updated description');

      cy.intercept('PUT', '**/domains/1', {
        statusCode: 200,
        body: {
          id: 1,
          name: 'example.com',
          description: 'Updated description',
          enabled: true,
        },
      }).as('updateDomain');

      cy.get('[data-cy=save-button]').click();

      cy.waitForApi('updateDomain');
      cy.shouldShowToast('success', 'Domain updated successfully');
      cy.get('[data-cy=edit-domain-modal]').should('not.exist');
    });

    it('should delete domain with confirmation', () => {
      cy.get('[data-cy=domain-row]').first().within(() => {
        cy.get('[data-cy=delete-domain-button]').click();
      });

      cy.get('[data-cy=delete-domain-modal]').should('be.visible');
      cy.get('[data-cy=delete-confirmation-text]').should('contain.text', 'example.com');

      // Cancel first
      cy.get('[data-cy=cancel-delete-button]').click();
      cy.get('[data-cy=delete-domain-modal]').should('not.exist');

      // Try again and confirm
      cy.get('[data-cy=domain-row]').first().within(() => {
        cy.get('[data-cy=delete-domain-button]').click();
      });

      cy.intercept('DELETE', '**/domains/1', {
        statusCode: 200,
        body: { message: 'Domain deleted successfully' },
      }).as('deleteDomain');

      cy.get('[data-cy=confirm-delete-button]').click();

      cy.waitForApi('deleteDomain');
      cy.shouldShowToast('success', 'Domain deleted successfully');
      cy.get('[data-cy=delete-domain-modal]').should('not.exist');
    });

    it('should handle domain with dependencies warning', () => {
      cy.intercept('DELETE', '**/domains/1', {
        statusCode: 400,
        body: {
          message: 'Domain has dependencies',
          dependencies: {
            proxyRules: 2,
            sslCertificates: 1,
            redirects: 1,
          },
        },
      }).as('deleteDomainWithDependencies');

      cy.get('[data-cy=domain-row]').first().within(() => {
        cy.get('[data-cy=delete-domain-button]').click();
      });

      cy.get('[data-cy=confirm-delete-button]').click();
      cy.waitForApi('deleteDomainWithDependencies');

      cy.get('[data-cy=dependencies-warning]').should('be.visible');
      cy.get('[data-cy=dependencies-list]').should('contain.text', '2 proxy rules');
      cy.get('[data-cy=dependencies-list]').should('contain.text', '1 SSL certificate');
      cy.get('[data-cy=dependencies-list]').should('contain.text', '1 redirect');

      cy.get('[data-cy=force-delete-checkbox]').check();

      cy.intercept('DELETE', '**/domains/1?force=true', {
        statusCode: 200,
        body: { message: 'Domain deleted successfully' },
      }).as('forceDeleteDomain');

      cy.get('[data-cy=confirm-force-delete-button]').click();
      cy.waitForApi('forceDeleteDomain');

      cy.shouldShowToast('success', 'Domain deleted successfully');
    });
  });

  describe('Bulk Actions', () => {
    beforeEach(() => {
      cy.fixture('domains').then((domains) => {
        cy.intercept('GET', '**/domains', {
          statusCode: 200,
          body: {
            data: domains,
            total: domains.length,
            page: 1,
            limit: 10,
            totalPages: 1,
          },
        }).as('getDomains');
      });

      cy.waitForApi('getDomains');
    });

    it('should select and deselect domains', () => {
      // Select first domain
      cy.get('[data-cy=domain-checkbox]').first().check();
      cy.get('[data-cy=bulk-actions-bar]').should('be.visible');
      cy.get('[data-cy=selected-count]').should('contain.text', '1 selected');

      // Select second domain
      cy.get('[data-cy=domain-checkbox]').eq(1).check();
      cy.get('[data-cy=selected-count]').should('contain.text', '2 selected');

      // Select all
      cy.get('[data-cy=select-all-checkbox]').check();
      cy.get('[data-cy=selected-count]').should('contain.text', '3 selected');

      // Deselect all
      cy.get('[data-cy=select-all-checkbox]').uncheck();
      cy.get('[data-cy=bulk-actions-bar]').should('not.exist');
    });

    it('should bulk enable domains', () => {
      cy.get('[data-cy=domain-checkbox]').first().check();
      cy.get('[data-cy=domain-checkbox]').eq(1).check();

      cy.intercept('PATCH', '**/domains/bulk/enable', {
        statusCode: 200,
        body: { updated: 2 },
      }).as('bulkEnable');

      cy.get('[data-cy=bulk-enable-button]').click();
      cy.waitForApi('bulkEnable');

      cy.shouldShowToast('success', '2 domains enabled');
      cy.get('[data-cy=bulk-actions-bar]').should('not.exist');
    });

    it('should bulk disable domains', () => {
      cy.get('[data-cy=domain-checkbox]').first().check();
      cy.get('[data-cy=domain-checkbox]').eq(1).check();

      cy.intercept('PATCH', '**/domains/bulk/disable', {
        statusCode: 200,
        body: { updated: 2 },
      }).as('bulkDisable');

      cy.get('[data-cy=bulk-disable-button]').click();
      cy.waitForApi('bulkDisable');

      cy.shouldShowToast('success', '2 domains disabled');
    });

    it('should bulk delete domains', () => {
      cy.get('[data-cy=domain-checkbox]').first().check();
      cy.get('[data-cy=domain-checkbox]').eq(1).check();

      cy.get('[data-cy=bulk-delete-button]').click();
      cy.get('[data-cy=bulk-delete-modal]').should('be.visible');
      cy.get('[data-cy=bulk-delete-count]').should('contain.text', '2 domains');

      cy.intercept('DELETE', '**/domains/bulk', {
        statusCode: 200,
        body: { deleted: 2 },
      }).as('bulkDelete');

      cy.get('[data-cy=confirm-bulk-delete-button]').click();
      cy.waitForApi('bulkDelete');

      cy.shouldShowToast('success', '2 domains deleted');
      cy.get('[data-cy=bulk-delete-modal]').should('not.exist');
    });
  });

  describe('Domain Statistics', () => {
    it('should display domain statistics', () => {
      cy.intercept('GET', '**/domains/stats', {
        statusCode: 200,
        body: {
          total: 15,
          enabled: 12,
          disabled: 3,
          withSsl: 10,
          withProxyRules: 8,
        },
      }).as('getDomainStats');

      cy.get('[data-cy=domain-stats-card]').should('be.visible');
      cy.waitForApi('getDomainStats');

      cy.get('[data-cy=total-domains]').should('contain.text', '15');
      cy.get('[data-cy=enabled-domains]').should('contain.text', '12');
      cy.get('[data-cy=disabled-domains]').should('contain.text', '3');
      cy.get('[data-cy=ssl-domains]').should('contain.text', '10');
    });

    it('should update stats after domain operations', () => {
      // Initial stats
      cy.intercept('GET', '**/domains/stats', {
        statusCode: 200,
        body: { total: 3, enabled: 3, disabled: 0 },
      }).as('getInitialStats');

      cy.waitForApi('getInitialStats');
      cy.get('[data-cy=enabled-domains]').should('contain.text', '3');

      // Disable a domain
      cy.intercept('PATCH', '**/domains/1/toggle', {
        statusCode: 200,
        body: { id: 1, enabled: false },
      }).as('toggleDomain');

      // Updated stats after toggle
      cy.intercept('GET', '**/domains/stats', {
        statusCode: 200,
        body: { total: 3, enabled: 2, disabled: 1 },
      }).as('getUpdatedStats');

      cy.get('[data-cy=domain-row]').first().within(() => {
        cy.get('[data-cy=toggle-domain-button]').click();
      });

      cy.waitForApi('toggleDomain');
      cy.waitForApi('getUpdatedStats');

      cy.get('[data-cy=enabled-domains]').should('contain.text', '2');
      cy.get('[data-cy=disabled-domains]').should('contain.text', '1');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      cy.intercept('GET', '**/domains', { forceNetworkError: true }).as('networkError');

      cy.visit('/domains');
      cy.waitForApi('networkError');

      cy.get('[data-cy=error-state]').should('be.visible');
      cy.get('[data-cy=error-message]').should('contain.text', 'Network error');
      cy.get('[data-cy=retry-button]').should('be.visible');
    });

    it('should retry failed requests', () => {
      let attemptCount = 0;

      cy.intercept('GET', '**/domains', (req) => {
        attemptCount++;
        if (attemptCount === 1) {
          req.reply({ forceNetworkError: true });
        } else {
          req.reply({ fixture: 'domains.json' });
        }
      }).as('retryRequest');

      cy.visit('/domains');
      cy.waitForApi('retryRequest');

      cy.get('[data-cy=retry-button]').click();
      cy.waitForApi('retryRequest');

      cy.get('[data-cy=domains-table]').should('be.visible');
    });

    it('should handle unauthorized errors', () => {
      cy.intercept('GET', '**/domains', {
        statusCode: 401,
        body: { message: 'Unauthorized' },
      }).as('unauthorizedError');

      cy.visit('/domains');
      cy.waitForApi('unauthorizedError');

      // Should redirect to login
      cy.shouldBeOnPage('/login');
      cy.shouldShowToast('error', 'Session expired');
    });

    it('should handle validation errors in forms', () => {
      cy.get('[data-cy=create-domain-button]').click();

      cy.intercept('POST', '**/domains', {
        statusCode: 400,
        body: {
          message: 'Validation failed',
          errors: {
            name: 'Domain name is invalid',
            description: 'Description is too long',
          },
        },
      }).as('validationError');

      cy.fillForm({
        'domain-name': 'invalid..domain',
        'domain-description': 'a'.repeat(1001),
      });

      cy.get('[data-cy=create-button]').click();
      cy.waitForApi('validationError');

      cy.get('[data-cy=domain-name-error]').should('contain.text', 'Domain name is invalid');
      cy.get('[data-cy=domain-description-error]').should('contain.text', 'Description is too long');
    });
  });

  describe('Accessibility and UX', () => {
    it('should be accessible', () => {
      cy.checkA11y();
    });

    it('should support keyboard navigation', () => {
      cy.get('[data-cy=create-domain-button]').focus().type(' '); // Space to activate
      cy.get('[data-cy=create-domain-modal]').should('be.visible');

      cy.get('[data-cy=domain-name-input]').should('be.focused');
      cy.tab();
      cy.get('[data-cy=domain-description-input]').should('be.focused');
    });

    it('should work responsively', () => {
      cy.testResponsive();

      // Test mobile-specific features
      cy.viewport('iphone-x');
      cy.get('[data-cy=domains-table]').should('be.visible');
      cy.get('[data-cy=create-domain-button]').should('be.visible');
    });

    it('should provide helpful tooltips', () => {
      cy.get('[data-cy=auto-ssl-help]').trigger('mouseenter');
      cy.get('[data-cy=tooltip]').should('contain.text', 'Automatically obtain SSL certificates');

      cy.get('[data-cy=force-https-help]').trigger('mouseenter');
      cy.get('[data-cy=tooltip]').should('contain.text', 'Redirect HTTP to HTTPS');
    });

    it('should maintain focus management in modals', () => {
      cy.get('[data-cy=create-domain-button]').click();
      cy.get('[data-cy=domain-name-input]').should('be.focused');

      // Escape should close modal and return focus
      cy.get('[data-cy=create-domain-modal]').trigger('keydown', { key: 'Escape' });
      cy.get('[data-cy=create-domain-modal]').should('not.exist');
      cy.get('[data-cy=create-domain-button]').should('be.focused');
    });
  });
});