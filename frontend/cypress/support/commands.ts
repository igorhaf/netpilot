/// <reference types="cypress" />

// Custom command implementations

// Authentication commands
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('API_URL')}/auth/login`,
    body: { email, password },
  }).then((response) => {
    expect(response.status).to.eq(200);
    const { access_token, user } = response.body;

    // Store tokens in local storage
    window.localStorage.setItem('access_token', access_token);
    window.localStorage.setItem('user', JSON.stringify(user));

    // Set authorization header for future requests
    Cypress.env('authToken', access_token);
  });
});

Cypress.Commands.add('loginAsAdmin', () => {
  cy.login(Cypress.env('ADMIN_EMAIL'), Cypress.env('ADMIN_PASSWORD'));
});

Cypress.Commands.add('logout', () => {
  const token = window.localStorage.getItem('access_token');

  if (token) {
    cy.request({
      method: 'POST',
      url: `${Cypress.env('API_URL')}/auth/logout`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    });
  }

  // Clear local storage
  window.localStorage.clear();
  window.sessionStorage.clear();

  // Clear cookies
  cy.clearCookies();
});

// Navigation commands
Cypress.Commands.add('navigateTo', (page: string) => {
  const routes = {
    dashboard: '/',
    domains: '/domains',
    'proxy-rules': '/proxy-rules',
    redirects: '/redirects',
    'ssl-certificates': '/ssl-certificates',
    logs: '/logs',
    settings: '/settings',
    login: '/login',
  };

  const path = routes[page] || `/${page}`;
  cy.visit(path);
  cy.waitForPageLoad();
});

Cypress.Commands.add('waitForPageLoad', () => {
  // Wait for page to be fully loaded
  cy.get('[data-cy=page-loader]', { timeout: 30000 }).should('not.exist');
  cy.get('[data-cy=main-content]').should('be.visible');
});

// Domain management commands
Cypress.Commands.add('createDomain', (name: string, options = {}) => {
  const token = window.localStorage.getItem('access_token');

  cy.request({
    method: 'POST',
    url: `${Cypress.env('API_URL')}/domains`,
    headers: { Authorization: `Bearer ${token}` },
    body: {
      name,
      enabled: true,
      autoSsl: true,
      forceHttps: true,
      blockExternal: false,
      wwwRedirect: false,
      ...options,
    },
  }).then((response) => {
    expect(response.status).to.eq(201);
    return cy.wrap(response.body);
  });
});

Cypress.Commands.add('deleteDomain', (name: string) => {
  const token = window.localStorage.getItem('access_token');

  // First find the domain by name
  cy.request({
    method: 'GET',
    url: `${Cypress.env('API_URL')}/domains?search=${name}`,
    headers: { Authorization: `Bearer ${token}` },
  }).then((response) => {
    const domain = response.body.data.find(d => d.name === name);
    if (domain) {
      cy.request({
        method: 'DELETE',
        url: `${Cypress.env('API_URL')}/domains/${domain.id}`,
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  });
});

// UI interaction commands
Cypress.Commands.add('shouldBeClickable', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).should('be.visible').and('not.be.disabled');
});

Cypress.Commands.add('waitForApi', (aliasName: string) => {
  cy.wait(`@${aliasName}`).then((interception) => {
    expect(interception.response.statusCode).to.be.oneOf([200, 201, 204]);
  });
});

Cypress.Commands.add('shouldShowToast', (type: 'success' | 'error' | 'warning' | 'info', message?: string) => {
  cy.get(`[data-cy=toast-${type}]`, { timeout: 10000 }).should('be.visible');

  if (message) {
    cy.get(`[data-cy=toast-${type}]`).should('contain.text', message);
  }

  // Wait for toast to disappear
  cy.get(`[data-cy=toast-${type}]`, { timeout: 10000 }).should('not.exist');
});

Cypress.Commands.add('fillForm', (fields: Record<string, string>) => {
  Object.entries(fields).forEach(([fieldName, value]) => {
    cy.get(`[data-cy=${fieldName}]`).clear().type(value);
  });
});

Cypress.Commands.add('shouldHaveTableRows', (count: number) => {
  cy.get('[data-cy=table-body] tr').should('have.length', count);
});

Cypress.Commands.add('searchInTable', (query: string) => {
  cy.get('[data-cy=search-input]').clear().type(query);
  cy.get('[data-cy=search-button]').click();
  cy.waitForApi('getDomains'); // Assuming domains is the most common search
});

// Loading state commands
Cypress.Commands.add('shouldBeLoading', () => {
  cy.get('[data-cy=loading-spinner]').should('be.visible');
});

Cypress.Commands.add('shouldNotBeLoading', () => {
  cy.get('[data-cy=loading-spinner]').should('not.exist');
});

// API mocking commands
Cypress.Commands.add('mockApiResponse', (endpoint: string, method: string, response: any) => {
  cy.intercept(method, `**${endpoint}`, response).as(`mock${endpoint.replace(/\//g, '')}`);
});

// File upload commands
Cypress.Commands.add('uploadFile', (selector: string, fileName: string) => {
  cy.fixture(fileName, 'base64').then((fileContent) => {
    cy.get(selector).selectFile({
      contents: Cypress.Buffer.from(fileContent, 'base64'),
      fileName,
    });
  });
});

// Accessibility commands
Cypress.Commands.add('checkA11y', () => {
  // Basic accessibility checks
  cy.get('img').each(($img) => {
    cy.wrap($img).should('have.attr', 'alt');
  });

  cy.get('input').each(($input) => {
    const id = $input.attr('id');
    if (id) {
      cy.get(`label[for="${id}"]`).should('exist');
    }
  });

  // Check for proper heading hierarchy
  cy.get('h1').should('have.length.at.most', 1);
});

// Screenshot commands
Cypress.Commands.add('screenshotWithTimestamp', (name: string) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  cy.screenshot(`${name}-${timestamp}`);
});

// Stability commands
Cypress.Commands.add('waitForStable', { prevSubject: 'element' }, (subject) => {
  let previousPosition: { top: number; left: number } | null = null;

  cy.wrap(subject).then(($el) => {
    const checkStability = () => {
      const currentPosition = $el[0].getBoundingClientRect();
      const currentPos = { top: currentPosition.top, left: currentPosition.left };

      if (previousPosition &&
          Math.abs(currentPos.top - previousPosition.top) < 1 &&
          Math.abs(currentPos.left - previousPosition.left) < 1) {
        return; // Element is stable
      }

      previousPosition = currentPos;
      cy.wait(100).then(checkStability);
    };

    checkStability();
  });
});

// Page verification commands
Cypress.Commands.add('shouldBeOnPage', (path: string) => {
  cy.url().should('include', path);
  cy.get('[data-cy=page-title]').should('be.visible');
});

Cypress.Commands.add('shouldHaveTitle', (title: string) => {
  cy.title().should('eq', title);
  cy.get('[data-cy=page-title]').should('contain.text', title);
});

Cypress.Commands.add('shouldHaveBreadcrumb', (breadcrumbs: string[]) => {
  cy.get('[data-cy=breadcrumb]').should('be.visible');
  breadcrumbs.forEach((breadcrumb, index) => {
    cy.get(`[data-cy=breadcrumb-item-${index}]`).should('contain.text', breadcrumb);
  });
});

// Responsive design commands
Cypress.Commands.add('testResponsive', () => {
  const viewports = [
    { width: 375, height: 667 }, // Mobile
    { width: 768, height: 1024 }, // Tablet
    { width: 1024, height: 768 }, // Desktop
    { width: 1920, height: 1080 }, // Large desktop
  ];

  viewports.forEach((viewport) => {
    cy.viewport(viewport.width, viewport.height);
    cy.get('[data-cy=main-content]').should('be.visible');
    cy.wait(500); // Allow for responsive transitions
  });

  // Reset to default viewport
  cy.viewport(1280, 720);
});

// Dark mode commands
Cypress.Commands.add('shouldBeDarkMode', () => {
  cy.get('html').should('have.class', 'dark');
  cy.get('[data-cy=dark-mode-toggle]').should('have.attr', 'aria-pressed', 'true');
});

Cypress.Commands.add('toggleDarkMode', () => {
  cy.get('[data-cy=dark-mode-toggle]').click();
  cy.wait(300); // Allow for theme transition
});

// Enhanced error handling
Cypress.on('fail', (error, runnable) => {
  // Log additional context on failure
  cy.task('log', `Test failed: ${runnable.title}`);
  cy.task('log', `Error: ${error.message}`);

  // Take screenshot on failure
  cy.screenshotWithTimestamp('failure');

  throw error;
});

// Network error handling
beforeEach(() => {
  cy.on('window:before:load', (win) => {
    // Handle uncaught promise rejections
    win.addEventListener('unhandledrejection', (event) => {
      console.log('Unhandled promise rejection:', event.reason);
      event.preventDefault();
    });
  });
});

// Performance monitoring
beforeEach(() => {
  cy.window().then((win) => {
    // Monitor page load performance
    win.performance.mark('test-start');
  });
});

afterEach(() => {
  cy.window().then((win) => {
    win.performance.mark('test-end');
    win.performance.measure('test-duration', 'test-start', 'test-end');

    const measures = win.performance.getEntriesByType('measure');
    const testDuration = measures[measures.length - 1];

    if (testDuration) {
      cy.task('log', `Test duration: ${testDuration.duration}ms`);
    }
  });
});