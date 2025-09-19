// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Import Cypress plugins
import 'cypress-terminal-report/src/installLogsCollector';

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // We can customize this to ignore specific errors
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false;
  }
  // Don't fail on unhandled promise rejections in test environment
  if (err.message.includes('Unhandled promise rejection')) {
    return false;
  }
  return true;
});

// Custom before hooks
beforeEach(() => {
  // Intercept common API calls
  cy.intercept('GET', '**/api/v1/auth/me', { fixture: 'user.json' }).as('getUser');
  cy.intercept('GET', '**/api/v1/domains', { fixture: 'domains.json' }).as('getDomains');
  cy.intercept('GET', '**/api/v1/proxy-rules', { fixture: 'proxyRules.json' }).as('getProxyRules');
  cy.intercept('GET', '**/api/v1/ssl-certificates', { fixture: 'sslCertificates.json' }).as('getSslCertificates');
  cy.intercept('GET', '**/api/v1/logs', { fixture: 'logs.json' }).as('getLogs');
  cy.intercept('GET', '**/api/v1/dashboard/stats', { fixture: 'dashboardStats.json' }).as('getDashboardStats');

  // Set default viewport
  cy.viewport(1280, 720);
});

// Global after hooks
afterEach(() => {
  // Clean up any test data if needed
  cy.task('log', `Test completed: ${Cypress.currentTest.title}`);
});

// Add custom assertions
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login with credentials
       * @example cy.login('user@example.com', 'password123')
       */
      login(email: string, password: string): Chainable<void>;

      /**
       * Custom command to login as admin
       * @example cy.loginAsAdmin()
       */
      loginAsAdmin(): Chainable<void>;

      /**
       * Custom command to logout
       * @example cy.logout()
       */
      logout(): Chainable<void>;

      /**
       * Custom command to navigate to a page
       * @example cy.navigateTo('domains')
       */
      navigateTo(page: string): Chainable<void>;

      /**
       * Custom command to wait for page to be fully loaded
       * @example cy.waitForPageLoad()
       */
      waitForPageLoad(): Chainable<void>;

      /**
       * Custom command to create a test domain
       * @example cy.createDomain('test.com', { description: 'Test domain' })
       */
      createDomain(name: string, options?: any): Chainable<void>;

      /**
       * Custom command to delete a domain
       * @example cy.deleteDomain('test.com')
       */
      deleteDomain(name: string): Chainable<void>;

      /**
       * Custom command to check if element is visible and enabled
       * @example cy.get('[data-cy=submit]').shouldBeClickable()
       */
      shouldBeClickable(): Chainable<void>;

      /**
       * Custom command to wait for API response
       * @example cy.waitForApi('getDomains')
       */
      waitForApi(aliasName: string): Chainable<void>;

      /**
       * Custom command to check toast message
       * @example cy.shouldShowToast('success', 'Domain created successfully')
       */
      shouldShowToast(type: 'success' | 'error' | 'warning' | 'info', message?: string): Chainable<void>;

      /**
       * Custom command to fill form fields
       * @example cy.fillForm({ email: 'test@example.com', password: 'password123' })
       */
      fillForm(fields: Record<string, string>): Chainable<void>;

      /**
       * Custom command to check table row count
       * @example cy.shouldHaveTableRows(5)
       */
      shouldHaveTableRows(count: number): Chainable<void>;

      /**
       * Custom command to search in table
       * @example cy.searchInTable('test.com')
       */
      searchInTable(query: string): Chainable<void>;

      /**
       * Custom command to check loading state
       * @example cy.shouldBeLoading()
       */
      shouldBeLoading(): Chainable<void>;

      /**
       * Custom command to check if not loading
       * @example cy.shouldNotBeLoading()
       */
      shouldNotBeLoading(): Chainable<void>;

      /**
       * Custom command to mock API response
       * @example cy.mockApiResponse('domains', 'GET', { fixture: 'empty-domains.json' })
       */
      mockApiResponse(endpoint: string, method: string, response: any): Chainable<void>;

      /**
       * Custom command to upload file
       * @example cy.uploadFile('input[type=file]', 'certificate.pem')
       */
      uploadFile(selector: string, fileName: string): Chainable<void>;

      /**
       * Custom command to check accessibility
       * @example cy.checkA11y()
       */
      checkA11y(): Chainable<void>;

      /**
       * Custom command to take screenshot with timestamp
       * @example cy.screenshotWithTimestamp('login-page')
       */
      screenshotWithTimestamp(name: string): Chainable<void>;

      /**
       * Custom command to wait for element to be stable (not moving)
       * @example cy.get('[data-cy=modal]').waitForStable()
       */
      waitForStable(): Chainable<void>;

      /**
       * Custom command to check URL contains path
       * @example cy.shouldBeOnPage('/domains')
       */
      shouldBeOnPage(path: string): Chainable<void>;

      /**
       * Custom command to check page title
       * @example cy.shouldHaveTitle('Domains - NetPilot')
       */
      shouldHaveTitle(title: string): Chainable<void>;

      /**
       * Custom command to check breadcrumb
       * @example cy.shouldHaveBreadcrumb(['Home', 'Domains', 'Create'])
       */
      shouldHaveBreadcrumb(breadcrumbs: string[]): Chainable<void>;

      /**
       * Custom command to test responsive design
       * @example cy.testResponsive()
       */
      testResponsive(): Chainable<void>;

      /**
       * Custom command to check if dark mode is active
       * @example cy.shouldBeDarkMode()
       */
      shouldBeDarkMode(): Chainable<void>;

      /**
       * Custom command to toggle dark mode
       * @example cy.toggleDarkMode()
       */
      toggleDarkMode(): Chainable<void>;
    }
  }
}

// Configure default retry and timeout behavior
Cypress.config('defaultCommandTimeout', 10000);
Cypress.config('requestTimeout', 10000);
Cypress.config('responseTimeout', 10000);
Cypress.config('pageLoadTimeout', 30000);