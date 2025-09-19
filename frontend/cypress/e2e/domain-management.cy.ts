/// <reference types="cypress" />

describe('Domain Management E2E Tests', () => {
  const testDomain = `test-${Date.now()}.example.com`
  const apiUrl = Cypress.env('API_URL')

  beforeEach(() => {
    // Clear database and seed initial data
    cy.task('cleanDatabase')
    cy.task('seedDatabase')

    // Login before each test
    cy.login()

    // Visit domains page
    cy.visit('/domains')
  })

  afterEach(() => {
    // Clean up any created test data
    cy.cleanupTestDomains()
  })

  describe('Domain List Page', () => {
    it('should display the domains page correctly', () => {
      cy.get('[data-testid="page-title"]').should('contain', 'Domains')
      cy.get('[data-testid="create-domain-button"]').should('be.visible')
      cy.get('[data-testid="domains-table"]').should('be.visible')
    })

    it('should show empty state when no domains exist', () => {
      // Ensure no domains exist
      cy.request({
        method: 'DELETE',
        url: `${apiUrl}/domains/bulk-delete`,
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem('access_token')}`
        },
        failOnStatusCode: false
      })

      cy.reload()
      cy.get('[data-testid="empty-state"]').should('be.visible')
      cy.get('[data-testid="empty-state-message"]').should('contain', 'No domains found')
    })

    it('should handle pagination correctly', () => {
      // Create multiple domains for pagination testing
      cy.task('generateTestData', { domainCount: 15 }).then((testData: any) => {
        testData.domains.forEach((domain: any, index: number) => {
          cy.createDomainViaApi(`pagination-test-${index}.com`)
        })
      })

      cy.reload()

      // Check pagination controls
      cy.get('[data-testid="pagination"]').should('be.visible')
      cy.get('[data-testid="pagination-next"]').should('be.visible')
      cy.get('[data-testid="page-info"]').should('contain', '1 of')

      // Navigate to next page
      cy.get('[data-testid="pagination-next"]').click()
      cy.get('[data-testid="page-info"]').should('contain', '2 of')
    })

    it('should filter domains by search term', () => {
      // Create test domains
      cy.createDomainViaApi('searchable-domain.com')
      cy.createDomainViaApi('another-domain.com')
      cy.reload()

      // Search for specific domain
      cy.get('[data-testid="search-input"]').type('searchable')
      cy.get('[data-testid="search-button"]').click()

      // Verify filtered results
      cy.get('[data-testid="domains-table"] tbody tr').should('have.length', 1)
      cy.get('[data-testid="domains-table"]').should('contain', 'searchable-domain.com')
    })

    it('should filter domains by status', () => {
      // Create domains with different statuses
      cy.createDomainViaApi('enabled-domain.com', true)
      cy.createDomainViaApi('disabled-domain.com', false)
      cy.reload()

      // Filter by enabled status
      cy.get('[data-testid="status-filter"]').select('enabled')
      cy.get('[data-testid="apply-filters"]').click()

      cy.get('[data-testid="domains-table"]').should('contain', 'enabled-domain.com')
      cy.get('[data-testid="domains-table"]').should('not.contain', 'disabled-domain.com')

      // Filter by disabled status
      cy.get('[data-testid="status-filter"]').select('disabled')
      cy.get('[data-testid="apply-filters"]').click()

      cy.get('[data-testid="domains-table"]').should('contain', 'disabled-domain.com')
      cy.get('[data-testid="domains-table"]').should('not.contain', 'enabled-domain.com')
    })

    it('should sort domains correctly', () => {
      // Create domains with predictable names
      const domains = ['a-domain.com', 'z-domain.com', 'm-domain.com']
      domains.forEach(domain => cy.createDomainViaApi(domain))
      cy.reload()

      // Sort by domain name ascending
      cy.get('[data-testid="sort-domain-name"]').click()
      cy.get('[data-testid="domains-table"] tbody tr:first-child').should('contain', 'a-domain.com')

      // Sort by domain name descending
      cy.get('[data-testid="sort-domain-name"]').click()
      cy.get('[data-testid="domains-table"] tbody tr:first-child').should('contain', 'z-domain.com')
    })
  })

  describe('Create Domain', () => {
    it('should create a new domain successfully', () => {
      cy.get('[data-testid="create-domain-button"]').click()

      // Verify modal opened
      cy.get('[data-testid="create-domain-modal"]').should('be.visible')
      cy.get('[data-testid="modal-title"]').should('contain', 'Create Domain')

      // Fill form
      cy.get('[data-testid="domain-name-input"]').type(testDomain)
      cy.get('[data-testid="domain-description-input"]').type('Test domain for E2E testing')
      cy.get('[data-testid="domain-enabled-checkbox"]').check()

      // Submit form
      cy.get('[data-testid="submit-button"]').click()

      // Verify success
      cy.get('[data-testid="success-notification"]').should('be.visible')
      cy.get('[data-testid="success-notification"]').should('contain', 'Domain created successfully')

      // Verify domain appears in list
      cy.get('[data-testid="domains-table"]').should('contain', testDomain)

      // Verify modal closed
      cy.get('[data-testid="create-domain-modal"]').should('not.exist')
    })

    it('should validate domain name format', () => {
      cy.get('[data-testid="create-domain-button"]').click()

      // Test invalid domain formats
      const invalidDomains = [
        '',
        'invalid..domain',
        '.example.com',
        'example.com.',
        'http://example.com',
        'example',
        'ex ample.com'
      ]

      invalidDomains.forEach(invalidDomain => {
        cy.get('[data-testid="domain-name-input"]').clear().type(invalidDomain)
        cy.get('[data-testid="submit-button"]').click()

        cy.get('[data-testid="domain-name-error"]')
          .should('be.visible')
          .should('contain', 'Invalid domain format')
      })
    })

    it('should handle duplicate domain names', () => {
      // Create domain first
      cy.createDomainViaApi(testDomain)

      // Try to create duplicate
      cy.get('[data-testid="create-domain-button"]').click()
      cy.get('[data-testid="domain-name-input"]').type(testDomain)
      cy.get('[data-testid="submit-button"]').click()

      // Verify error message
      cy.get('[data-testid="error-notification"]').should('be.visible')
      cy.get('[data-testid="error-notification"]').should('contain', 'Domain already exists')
    })

    it('should cancel domain creation', () => {
      cy.get('[data-testid="create-domain-button"]').click()
      cy.get('[data-testid="domain-name-input"]').type(testDomain)

      // Cancel
      cy.get('[data-testid="cancel-button"]').click()

      // Verify modal closed and domain not created
      cy.get('[data-testid="create-domain-modal"]').should('not.exist')
      cy.get('[data-testid="domains-table"]').should('not.contain', testDomain)
    })
  })

  describe('Domain Actions', () => {
    beforeEach(() => {
      cy.createDomainViaApi(testDomain)
      cy.reload()
    })

    it('should view domain details', () => {
      cy.get(`[data-testid="domain-row-${testDomain}"]`).within(() => {
        cy.get('[data-testid="view-domain-button"]').click()
      })

      // Verify navigation to domain details page
      cy.url().should('include', '/domains/')
      cy.get('[data-testid="domain-name"]').should('contain', testDomain)
      cy.get('[data-testid="domain-details"]').should('be.visible')
    })

    it('should edit domain', () => {
      cy.get(`[data-testid="domain-row-${testDomain}"]`).within(() => {
        cy.get('[data-testid="edit-domain-button"]').click()
      })

      // Verify edit modal opened
      cy.get('[data-testid="edit-domain-modal"]').should('be.visible')
      cy.get('[data-testid="modal-title"]').should('contain', 'Edit Domain')

      // Modify domain
      const newDescription = 'Updated description for E2E test'
      cy.get('[data-testid="domain-description-input"]').clear().type(newDescription)
      cy.get('[data-testid="domain-enabled-checkbox"]').uncheck()

      // Save changes
      cy.get('[data-testid="submit-button"]').click()

      // Verify success
      cy.get('[data-testid="success-notification"]').should('contain', 'Domain updated successfully')

      // Verify changes reflected in table
      cy.get(`[data-testid="domain-row-${testDomain}"]`).within(() => {
        cy.get('[data-testid="domain-status"]').should('contain', 'Disabled')
      })
    })

    it('should toggle domain status', () => {
      // Check initial status
      cy.get(`[data-testid="domain-row-${testDomain}"]`).within(() => {
        cy.get('[data-testid="domain-status"]').should('contain', 'Enabled')
        cy.get('[data-testid="toggle-status-button"]').click()
      })

      // Verify status changed
      cy.get('[data-testid="success-notification"]').should('contain', 'Domain status updated')
      cy.get(`[data-testid="domain-row-${testDomain}"]`).within(() => {
        cy.get('[data-testid="domain-status"]').should('contain', 'Disabled')
      })

      // Toggle back
      cy.get(`[data-testid="domain-row-${testDomain}"]`).within(() => {
        cy.get('[data-testid="toggle-status-button"]').click()
      })

      cy.get(`[data-testid="domain-row-${testDomain}"]`).within(() => {
        cy.get('[data-testid="domain-status"]').should('contain', 'Enabled')
      })
    })

    it('should delete domain with confirmation', () => {
      cy.get(`[data-testid="domain-row-${testDomain}"]`).within(() => {
        cy.get('[data-testid="delete-domain-button"]').click()
      })

      // Verify confirmation dialog
      cy.get('[data-testid="delete-confirmation-modal"]').should('be.visible')
      cy.get('[data-testid="modal-title"]').should('contain', 'Delete Domain')
      cy.get('[data-testid="confirmation-message"]').should('contain', testDomain)

      // Cancel first
      cy.get('[data-testid="cancel-button"]').click()
      cy.get('[data-testid="delete-confirmation-modal"]').should('not.exist')
      cy.get('[data-testid="domains-table"]').should('contain', testDomain)

      // Delete for real
      cy.get(`[data-testid="domain-row-${testDomain}"]`).within(() => {
        cy.get('[data-testid="delete-domain-button"]').click()
      })

      cy.get('[data-testid="delete-confirmation-modal"]').should('be.visible')
      cy.get('[data-testid="confirm-delete-button"]').click()

      // Verify deletion
      cy.get('[data-testid="success-notification"]').should('contain', 'Domain deleted successfully')
      cy.get('[data-testid="domains-table"]').should('not.contain', testDomain)
    })

    it('should handle delete domain with dependencies', () => {
      // Create proxy rule for the domain
      cy.createProxyRuleViaApi(testDomain, '/api', 'http://backend.local:3001')

      // Try to delete domain
      cy.get(`[data-testid="domain-row-${testDomain}"]`).within(() => {
        cy.get('[data-testid="delete-domain-button"]').click()
      })

      cy.get('[data-testid="confirm-delete-button"]').click()

      // Should show error about dependencies
      cy.get('[data-testid="error-notification"]')
        .should('be.visible')
        .should('contain', 'Cannot delete domain with active dependencies')

      // Domain should still exist
      cy.get('[data-testid="domains-table"]').should('contain', testDomain)
    })
  })

  describe('Bulk Operations', () => {
    beforeEach(() => {
      // Create multiple test domains
      const domains = [`bulk1-${Date.now()}.com`, `bulk2-${Date.now()}.com`, `bulk3-${Date.now()}.com`]
      domains.forEach(domain => cy.createDomainViaApi(domain))
      cy.reload()
    })

    it('should select multiple domains', () => {
      // Select first two domains
      cy.get('[data-testid="domains-table"] tbody tr:nth-child(1) [data-testid="select-checkbox"]').check()
      cy.get('[data-testid="domains-table"] tbody tr:nth-child(2) [data-testid="select-checkbox"]').check()

      // Verify bulk actions toolbar appears
      cy.get('[data-testid="bulk-actions-toolbar"]').should('be.visible')
      cy.get('[data-testid="selected-count"]').should('contain', '2 selected')
    })

    it('should enable/disable multiple domains', () => {
      // Select domains
      cy.get('[data-testid="select-all-checkbox"]').check()

      // Bulk disable
      cy.get('[data-testid="bulk-disable-button"]').click()
      cy.get('[data-testid="confirm-bulk-action-button"]').click()

      // Verify success
      cy.get('[data-testid="success-notification"]').should('contain', 'Domains updated successfully')

      // Verify all selected domains are disabled
      cy.get('[data-testid="domains-table"] tbody tr').each(($row) => {
        cy.wrap($row).within(() => {
          cy.get('[data-testid="domain-status"]').should('contain', 'Disabled')
        })
      })
    })

    it('should bulk delete domains', () => {
      // Select first two domains
      cy.get('[data-testid="domains-table"] tbody tr:nth-child(1) [data-testid="select-checkbox"]').check()
      cy.get('[data-testid="domains-table"] tbody tr:nth-child(2) [data-testid="select-checkbox"]').check()

      // Bulk delete
      cy.get('[data-testid="bulk-delete-button"]').click()
      cy.get('[data-testid="confirm-bulk-delete-button"]').click()

      // Verify success
      cy.get('[data-testid="success-notification"]').should('contain', 'Domains deleted successfully')

      // Verify only one domain remains
      cy.get('[data-testid="domains-table"] tbody tr').should('have.length', 1)
    })
  })

  describe('Real-time Updates', () => {
    it('should update domain list when domains change', () => {
      const initialCount = Cypress.$('[data-testid="domains-table"] tbody tr').length

      // Create domain via API (simulating another user)
      const newDomain = `realtime-${Date.now()}.com`
      cy.createDomainViaApi(newDomain)

      // Verify list updates automatically
      cy.get('[data-testid="domains-table"] tbody tr').should('have.length', initialCount + 1)
      cy.get('[data-testid="domains-table"]').should('contain', newDomain)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      // Simulate network error by intercepting API calls
      cy.intercept('GET', '**/domains*', { forceNetworkError: true }).as('getDomainsError')

      cy.reload()

      // Verify error state
      cy.get('[data-testid="error-message"]').should('be.visible')
      cy.get('[data-testid="retry-button"]').should('be.visible')

      // Test retry functionality
      cy.intercept('GET', '**/domains*', { fixture: 'domains.json' }).as('getDomainsSuccess')
      cy.get('[data-testid="retry-button"]').click()

      cy.wait('@getDomainsSuccess')
      cy.get('[data-testid="domains-table"]').should('be.visible')
    })

    it('should handle API errors with proper messages', () => {
      // Simulate 500 error
      cy.intercept('POST', '**/domains', { statusCode: 500, body: { error: { message: 'Internal server error' } } })

      cy.get('[data-testid="create-domain-button"]').click()
      cy.get('[data-testid="domain-name-input"]').type(testDomain)
      cy.get('[data-testid="submit-button"]').click()

      cy.get('[data-testid="error-notification"]')
        .should('be.visible')
        .should('contain', 'Internal server error')
    })
  })

  describe('Performance', () => {
    it('should load domains page within acceptable time', () => {
      const startTime = Date.now()

      cy.visit('/domains').then(() => {
        const loadTime = Date.now() - startTime
        expect(loadTime).to.be.lessThan(3000) // Should load within 3 seconds
      })

      cy.get('[data-testid="domains-table"]').should('be.visible')
    })

    it('should handle large datasets efficiently', () => {
      // Create many domains for performance testing
      Cypress._.times(50, (i) => {
        cy.createDomainViaApi(`perf-test-${i}.com`)
      })

      cy.reload()

      // Verify page loads and is responsive
      cy.get('[data-testid="domains-table"]').should('be.visible')
      cy.get('[data-testid="pagination"]').should('be.visible')

      // Test scrolling performance
      cy.get('[data-testid="domains-table"]').scrollTo('bottom')
      cy.get('[data-testid="domains-table"]').scrollTo('top')
    })
  })

  describe('Accessibility', () => {
    it('should be accessible with keyboard navigation', () => {
      // Test tab navigation
      cy.get('body').tab()
      cy.focused().should('have.attr', 'data-testid', 'main-navigation')

      // Navigate to create button
      cy.get('[data-testid="create-domain-button"]').focus().should('be.focused')

      // Test modal accessibility
      cy.get('[data-testid="create-domain-button"]').type('{enter}')
      cy.get('[data-testid="create-domain-modal"]').should('be.visible')

      // Verify focus trap
      cy.get('[data-testid="domain-name-input"]').should('be.focused')
      cy.get('body').tab()
      cy.focused().should('have.attr', 'data-testid', 'domain-description-input')
    })

    it('should have proper ARIA labels and roles', () => {
      cy.get('[data-testid="domains-table"]').should('have.attr', 'role', 'table')
      cy.get('[data-testid="create-domain-button"]').should('have.attr', 'aria-label')
      cy.get('[data-testid="search-input"]').should('have.attr', 'aria-label')
    })

    it('should support screen readers', () => {
      cy.get('[data-testid="page-title"]').should('have.attr', 'role', 'heading')
      cy.get('[data-testid="domains-table"]').within(() => {
        cy.get('th').each(($header) => {
          cy.wrap($header).should('have.attr', 'scope', 'col')
        })
      })
    })
  })
})