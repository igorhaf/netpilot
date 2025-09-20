import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://meadadigital.com:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    video: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000,
    requestTimeout: 10000,
    responseTimeout: 10000,

    // Environment variables
    env: {
      API_URL: 'https://netpilot.meadadigital.com/api',
      TEST_USER_EMAIL: 'cypress@netpilot.local',
      TEST_USER_PASSWORD: 'cypress123',
      ADMIN_EMAIL: 'admin@netpilot.local',
      ADMIN_PASSWORD: 'admin123'
    },

    setupNodeEvents(on, config) {
      // Task definitions
      on('task', {
        log(message) {
          console.log(message)
          return null
        },

        // Database seeding task
        seedDatabase() {
          // This would connect to test database and seed data
          console.log('Seeding test database...')
          return null
        },

        // Clean database task
        cleanDatabase() {
          console.log('Cleaning test database...')
          return null
        },

        // Generate test data
        generateTestData(options) {
          console.log(`Generating test data with options:`, options)
          return {
            domains: Array.from({ length: options.domainCount || 5 }, (_, i) => ({
              id: i + 1,
              domain: `test${i + 1}.example.com`,
              enabled: true
            })),
            proxyRules: Array.from({ length: options.proxyRuleCount || 3 }, (_, i) => ({
              id: i + 1,
              sourcePath: `/api/v${i + 1}`,
              targetUrl: `http://backend${i + 1}.local:3001`
            }))
          }
        }
      })

      // Browser launch options
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome') {
          launchOptions.args.push('--disable-dev-shm-usage')
          launchOptions.args.push('--disable-gpu')
          launchOptions.args.push('--no-sandbox')
        }
        return launchOptions
      })

      // Plugin configurations
      require('cypress-terminal-report/src/installLogsPrinter')(on, {
        printLogsToConsole: 'onFail',
      })

      return config
    },
  },

  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    supportFile: 'cypress/support/component.ts',
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
    indexHtmlFile: 'cypress/support/component-index.html',
  },

  // Global configuration
  retries: {
    runMode: 2,
    openMode: 0,
  },

  // File handling
  fileServerFolder: '.',
  fixturesFolder: 'cypress/fixtures',

  // Experimental features
  experimentalStudio: true,
  experimentalMemoryManagement: true,
})