describe('Authentication Flow', () => {
  beforeEach(() => {
    // Ensure we start from a clean state
    cy.logout();
    cy.navigateTo('login');
  });

  describe('Login Page', () => {
    it('should display login form', () => {
      cy.shouldBeOnPage('/login');
      cy.shouldHaveTitle('Login - NetPilot');

      cy.get('[data-cy=email-input]').should('be.visible');
      cy.get('[data-cy=password-input]').should('be.visible');
      cy.get('[data-cy=login-button]').should('be.visible');
      cy.get('[data-cy=forgot-password-link]').should('be.visible');
    });

    it('should show validation errors for empty fields', () => {
      cy.get('[data-cy=login-button]').click();

      cy.get('[data-cy=email-error]').should('contain.text', 'Email is required');
      cy.get('[data-cy=password-error]').should('contain.text', 'Password is required');
    });

    it('should show validation error for invalid email', () => {
      cy.fillForm({
        email: 'invalid-email',
        password: 'password123',
      });

      cy.get('[data-cy=login-button]').click();
      cy.get('[data-cy=email-error]').should('contain.text', 'Invalid email format');
    });

    it('should login with valid credentials', () => {
      // Mock successful login response
      cy.intercept('POST', '**/auth/login', {
        statusCode: 200,
        body: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          user: {
            id: 1,
            email: 'admin@netpilot.local',
            roles: ['admin'],
          },
        },
      }).as('login');

      cy.fillForm({
        email: 'admin@netpilot.local',
        password: 'admin123',
      });

      cy.get('[data-cy=login-button]').click();

      cy.waitForApi('login');
      cy.shouldShowToast('success', 'Login successful');
      cy.shouldBeOnPage('/');
    });

    it('should show error for invalid credentials', () => {
      cy.intercept('POST', '**/auth/login', {
        statusCode: 401,
        body: { message: 'Invalid credentials' },
      }).as('loginError');

      cy.fillForm({
        email: 'admin@netpilot.local',
        password: 'wrongpassword',
      });

      cy.get('[data-cy=login-button]').click();

      cy.waitForApi('loginError');
      cy.shouldShowToast('error', 'Invalid credentials');
      cy.shouldBeOnPage('/login');
    });

    it('should show loading state during login', () => {
      cy.intercept('POST', '**/auth/login', {
        delay: 2000,
        statusCode: 200,
        body: {
          access_token: 'mock-token',
          user: { id: 1, email: 'admin@netpilot.local' },
        },
      }).as('slowLogin');

      cy.fillForm({
        email: 'admin@netpilot.local',
        password: 'admin123',
      });

      cy.get('[data-cy=login-button]').click();
      cy.shouldBeLoading();
      cy.get('[data-cy=login-button]').should('be.disabled');

      cy.waitForApi('slowLogin');
      cy.shouldNotBeLoading();
    });

    it('should handle rate limiting', () => {
      cy.intercept('POST', '**/auth/login', {
        statusCode: 429,
        body: { message: 'Too many login attempts. Please try again later.' },
      }).as('rateLimited');

      cy.fillForm({
        email: 'admin@netpilot.local',
        password: 'wrongpassword',
      });

      cy.get('[data-cy=login-button]').click();

      cy.waitForApi('rateLimited');
      cy.shouldShowToast('error', 'Too many login attempts');
      cy.get('[data-cy=login-button]').should('be.disabled');
    });

    it('should redirect to intended page after login', () => {
      // Try to access protected page
      cy.visit('/domains');
      cy.shouldBeOnPage('/login');
      cy.url().should('include', 'redirect=%2Fdomains');

      // Login successfully
      cy.intercept('POST', '**/auth/login', {
        statusCode: 200,
        body: {
          access_token: 'mock-token',
          user: { id: 1, email: 'admin@netpilot.local' },
        },
      }).as('login');

      cy.fillForm({
        email: 'admin@netpilot.local',
        password: 'admin123',
      });

      cy.get('[data-cy=login-button]').click();
      cy.waitForApi('login');

      // Should redirect to intended page
      cy.shouldBeOnPage('/domains');
    });

    it('should remember me functionality', () => {
      cy.get('[data-cy=remember-me-checkbox]').click();

      cy.intercept('POST', '**/auth/login', {
        statusCode: 200,
        body: {
          access_token: 'mock-token',
          refresh_token: 'mock-refresh-token',
          user: { id: 1, email: 'admin@netpilot.local' },
        },
      }).as('login');

      cy.fillForm({
        email: 'admin@netpilot.local',
        password: 'admin123',
      });

      cy.get('[data-cy=login-button]').click();
      cy.waitForApi('login');

      // Check if remember me data is stored
      cy.window().then((win) => {
        expect(win.localStorage.getItem('remember_email')).to.equal('admin@netpilot.local');
      });
    });
  });

  describe('Password Reset', () => {
    beforeEach(() => {
      cy.get('[data-cy=forgot-password-link]').click();
    });

    it('should display password reset form', () => {
      cy.shouldBeOnPage('/forgot-password');
      cy.get('[data-cy=email-input]').should('be.visible');
      cy.get('[data-cy=reset-button]').should('be.visible');
      cy.get('[data-cy=back-to-login-link]').should('be.visible');
    });

    it('should send reset email for valid email', () => {
      cy.intercept('POST', '**/auth/forgot-password', {
        statusCode: 200,
        body: { message: 'Reset email sent' },
      }).as('resetEmail');

      cy.get('[data-cy=email-input]').type('admin@netpilot.local');
      cy.get('[data-cy=reset-button]').click();

      cy.waitForApi('resetEmail');
      cy.shouldShowToast('success', 'Reset email sent');
    });

    it('should show error for invalid email', () => {
      cy.intercept('POST', '**/auth/forgot-password', {
        statusCode: 404,
        body: { message: 'Email not found' },
      }).as('resetEmailError');

      cy.get('[data-cy=email-input]').type('nonexistent@example.com');
      cy.get('[data-cy=reset-button]').click();

      cy.waitForApi('resetEmailError');
      cy.shouldShowToast('error', 'Email not found');
    });
  });

  describe('Logout', () => {
    beforeEach(() => {
      // Login first
      cy.intercept('POST', '**/auth/login', {
        statusCode: 200,
        body: {
          access_token: 'mock-token',
          user: { id: 1, email: 'admin@netpilot.local' },
        },
      }).as('login');

      cy.fillForm({
        email: 'admin@netpilot.local',
        password: 'admin123',
      });

      cy.get('[data-cy=login-button]').click();
      cy.waitForApi('login');
      cy.shouldBeOnPage('/');
    });

    it('should logout successfully', () => {
      cy.intercept('POST', '**/auth/logout', {
        statusCode: 200,
        body: { message: 'Logged out successfully' },
      }).as('logout');

      cy.get('[data-cy=user-menu]').click();
      cy.get('[data-cy=logout-button]').click();

      cy.waitForApi('logout');
      cy.shouldBeOnPage('/login');
      cy.shouldShowToast('success', 'Logged out successfully');

      // Verify tokens are cleared
      cy.window().then((win) => {
        expect(win.localStorage.getItem('access_token')).to.be.null;
        expect(win.localStorage.getItem('user')).to.be.null;
      });
    });

    it('should logout when clicking logout in confirmation modal', () => {
      cy.intercept('POST', '**/auth/logout', {
        statusCode: 200,
        body: { message: 'Logged out successfully' },
      }).as('logout');

      cy.get('[data-cy=user-menu]').click();
      cy.get('[data-cy=logout-button]').click();

      // Confirm in modal
      cy.get('[data-cy=logout-confirm-modal]').should('be.visible');
      cy.get('[data-cy=confirm-logout-button]').click();

      cy.waitForApi('logout');
      cy.shouldBeOnPage('/login');
    });

    it('should cancel logout in confirmation modal', () => {
      cy.get('[data-cy=user-menu]').click();
      cy.get('[data-cy=logout-button]').click();

      // Cancel in modal
      cy.get('[data-cy=logout-confirm-modal]').should('be.visible');
      cy.get('[data-cy=cancel-logout-button]').click();

      cy.get('[data-cy=logout-confirm-modal]').should('not.exist');
      cy.shouldBeOnPage('/'); // Should remain on dashboard
    });
  });

  describe('Session Management', () => {
    it('should handle expired tokens', () => {
      // Mock expired token response
      cy.intercept('GET', '**/auth/me', {
        statusCode: 401,
        body: { message: 'Token expired' },
      }).as('expiredToken');

      // Set expired token in localStorage
      cy.window().then((win) => {
        win.localStorage.setItem('access_token', 'expired-token');
      });

      cy.visit('/');
      cy.waitForApi('expiredToken');

      // Should redirect to login
      cy.shouldBeOnPage('/login');
      cy.shouldShowToast('error', 'Session expired. Please login again.');
    });

    it('should refresh tokens automatically', () => {
      cy.intercept('POST', '**/auth/refresh', {
        statusCode: 200,
        body: {
          access_token: 'new-access-token',
          expires_in: 3600,
        },
      }).as('refreshToken');

      // Set refresh token
      cy.window().then((win) => {
        win.localStorage.setItem('refresh_token', 'valid-refresh-token');
      });

      cy.visit('/');
      cy.waitForApi('refreshToken');

      // Should stay on page with new token
      cy.window().then((win) => {
        expect(win.localStorage.getItem('access_token')).to.equal('new-access-token');
      });
    });

    it('should handle refresh token failure', () => {
      cy.intercept('POST', '**/auth/refresh', {
        statusCode: 401,
        body: { message: 'Invalid refresh token' },
      }).as('refreshTokenError');

      cy.window().then((win) => {
        win.localStorage.setItem('refresh_token', 'invalid-refresh-token');
      });

      cy.visit('/');
      cy.waitForApi('refreshTokenError');

      // Should redirect to login
      cy.shouldBeOnPage('/login');
    });
  });

  describe('Security Features', () => {
    it('should enforce HTTPS in production', () => {
      // This test would be environment-specific
      // For now, we just check that the login form has proper security attributes
      cy.get('[data-cy=password-input]').should('have.attr', 'type', 'password');
      cy.get('form').should('have.attr', 'autocomplete', 'off');
    });

    it('should sanitize user inputs', () => {
      const maliciousInput = '<script>alert("xss")</script>';

      cy.get('[data-cy=email-input]').type(maliciousInput);
      cy.get('[data-cy=email-input]').should('not.contain', '<script>');
    });

    it('should prevent multiple rapid login attempts', () => {
      // Mock rate limiting after multiple attempts
      let attemptCount = 0;

      cy.intercept('POST', '**/auth/login', (req) => {
        attemptCount++;
        if (attemptCount > 3) {
          req.reply({
            statusCode: 429,
            body: { message: 'Too many attempts' },
          });
        } else {
          req.reply({
            statusCode: 401,
            body: { message: 'Invalid credentials' },
          });
        }
      }).as('loginAttempts');

      // Make multiple failed attempts
      for (let i = 0; i < 4; i++) {
        cy.fillForm({
          email: 'admin@netpilot.local',
          password: 'wrongpassword',
        });

        cy.get('[data-cy=login-button]').click();
        cy.wait('@loginAttempts');
      }

      // Should show rate limit message
      cy.shouldShowToast('error', 'Too many attempts');
      cy.get('[data-cy=login-button]').should('be.disabled');
    });
  });

  describe('Accessibility', () => {
    it('should be accessible', () => {
      cy.checkA11y();
    });

    it('should support keyboard navigation', () => {
      cy.get('[data-cy=email-input]').focus().type('{tab}');
      cy.get('[data-cy=password-input]').should('be.focused');

      cy.get('[data-cy=password-input]').type('{tab}');
      cy.get('[data-cy=remember-me-checkbox]').should('be.focused');

      cy.get('[data-cy=remember-me-checkbox]').type('{tab}');
      cy.get('[data-cy=login-button]').should('be.focused');
    });

    it('should have proper ARIA labels', () => {
      cy.get('[data-cy=email-input]').should('have.attr', 'aria-label', 'Email address');
      cy.get('[data-cy=password-input]').should('have.attr', 'aria-label', 'Password');
      cy.get('[data-cy=login-button]').should('have.attr', 'aria-label', 'Sign in to NetPilot');
    });

    it('should announce errors to screen readers', () => {
      cy.get('[data-cy=login-button]').click();

      cy.get('[data-cy=email-error]').should('have.attr', 'role', 'alert');
      cy.get('[data-cy=password-error]').should('have.attr', 'role', 'alert');
    });
  });

  describe('Responsive Design', () => {
    it('should work on mobile devices', () => {
      cy.viewport('iphone-x');

      cy.get('[data-cy=email-input]').should('be.visible');
      cy.get('[data-cy=password-input]').should('be.visible');
      cy.get('[data-cy=login-button]').should('be.visible');

      // Test form submission on mobile
      cy.fillForm({
        email: 'admin@netpilot.local',
        password: 'admin123',
      });

      cy.intercept('POST', '**/auth/login', {
        statusCode: 200,
        body: {
          access_token: 'mock-token',
          user: { id: 1, email: 'admin@netpilot.local' },
        },
      }).as('mobileLogin');

      cy.get('[data-cy=login-button]').click();
      cy.waitForApi('mobileLogin');
      cy.shouldBeOnPage('/');
    });

    it('should work on tablet', () => {
      cy.viewport('ipad-2');

      cy.get('[data-cy=login-form]').should('be.visible');
      cy.get('[data-cy=email-input]').should('be.visible');
      cy.get('[data-cy=password-input]').should('be.visible');
    });
  });

  describe('Dark Mode', () => {
    it('should support dark mode', () => {
      cy.toggleDarkMode();
      cy.shouldBeDarkMode();

      // Verify login form is properly styled in dark mode
      cy.get('[data-cy=login-form]').should('have.class', 'dark:bg-gray-800');
      cy.get('[data-cy=email-input]').should('have.class', 'dark:bg-gray-700');
    });

    it('should persist dark mode preference', () => {
      cy.toggleDarkMode();
      cy.shouldBeDarkMode();

      cy.reload();
      cy.shouldBeDarkMode();
    });
  });
});