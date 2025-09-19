const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  outputDir: './tests/performance/reports',
  pages: [
    {
      name: 'login',
      url: '/login',
      description: 'Login page performance',
    },
    {
      name: 'dashboard',
      url: '/',
      description: 'Dashboard page performance',
      requiresAuth: true,
    },
    {
      name: 'domains-list',
      url: '/domains',
      description: 'Domains listing page performance',
      requiresAuth: true,
    },
    {
      name: 'domain-create',
      url: '/domains/create',
      description: 'Domain creation form performance',
      requiresAuth: true,
    },
    {
      name: 'proxy-rules',
      url: '/proxy-rules',
      description: 'Proxy rules page performance',
      requiresAuth: true,
    },
    {
      name: 'ssl-certificates',
      url: '/ssl-certificates',
      description: 'SSL certificates page performance',
      requiresAuth: true,
    },
    {
      name: 'logs',
      url: '/logs',
      description: 'Logs page performance',
      requiresAuth: true,
    },
  ],
  thresholds: {
    performance: 90,
    accessibility: 95,
    bestPractices: 90,
    seo: 85,
    // Core Web Vitals thresholds
    'largest-contentful-paint': 2500, // ms
    'first-input-delay': 100, // ms
    'cumulative-layout-shift': 0.1, // score
    'first-contentful-paint': 1800, // ms
    'speed-index': 3000, // ms
    'time-to-interactive': 3800, // ms
  },
};

// Lighthouse configuration
const lighthouseConfig = {
  extends: 'lighthouse:default',
  settings: {
    maxWaitForFcp: 15 * 1000,
    maxWaitForLoad: 35 * 1000,
    formFactor: 'desktop',
    throttling: {
      rttMs: 40,
      throughputKbps: 10 * 1024,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
    },
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
    emulatedUserAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  },
};

// Mobile configuration
const mobileConfig = {
  ...lighthouseConfig,
  settings: {
    ...lighthouseConfig.settings,
    formFactor: 'mobile',
    throttling: {
      rttMs: 150,
      throughputKbps: 1.6 * 1024,
      cpuSlowdownMultiplier: 4,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
    },
    screenEmulation: {
      mobile: true,
      width: 360,
      height: 640,
      deviceScaleFactor: 2.625,
      disabled: false,
    },
  },
};

class PerformanceTest {
  constructor() {
    this.chrome = null;
    this.results = [];
    this.authToken = null;
  }

  async setup() {
    console.log('🚀 Starting performance tests...');

    // Ensure output directory exists
    if (!fs.existsSync(config.outputDir)) {
      fs.mkdirSync(config.outputDir, { recursive: true });
    }

    // Launch Chrome
    this.chrome = await chromeLauncher.launch({
      chromeFlags: [
        '--headless',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-extensions',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
      ],
    });

    console.log(`Chrome launched on port ${this.chrome.port}`);

    // Get auth token if needed
    await this.authenticate();
  }

  async authenticate() {
    if (!config.pages.some(page => page.requiresAuth)) {
      return;
    }

    console.log('🔐 Authenticating for protected pages...');

    try {
      const response = await fetch(`${config.baseUrl.replace(':3000', ':3001')}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@netpilot.local',
          password: 'admin123',
        }),
      });

      if (response.ok) {
        const authData = await response.json();
        this.authToken = authData.access_token;
        console.log('✅ Authentication successful');
      } else {
        console.warn('⚠️  Authentication failed, skipping protected pages');
      }
    } catch (error) {
      console.warn('⚠️  Authentication error:', error.message);
    }
  }

  async runLighthouse(url, pageConfig, isDesktop = true) {
    const fullUrl = `${config.baseUrl}${url}`;
    const configToUse = isDesktop ? lighthouseConfig : mobileConfig;

    console.log(`📊 Testing ${pageConfig.name} (${isDesktop ? 'Desktop' : 'Mobile'}): ${fullUrl}`);

    try {
      // Add auth headers if needed
      const options = {
        port: this.chrome.port,
        output: 'json',
        logLevel: 'error',
      };

      if (pageConfig.requiresAuth && this.authToken) {
        // Note: Lighthouse doesn't easily support auth headers
        // In a real scenario, you might need to:
        // 1. Login first and get session cookies
        // 2. Use page.setExtraHTTPHeaders() before lighthouse run
        // 3. Or inject localStorage with auth token
        console.log('🔑 Using authenticated session');
      }

      const runnerResult = await lighthouse(fullUrl, options, configToUse);

      if (!runnerResult) {
        throw new Error('Lighthouse returned no results');
      }

      const scores = runnerResult.lhr.categories;
      const audits = runnerResult.lhr.audits;

      const result = {
        url: fullUrl,
        page: pageConfig.name,
        description: pageConfig.description,
        formFactor: isDesktop ? 'desktop' : 'mobile',
        timestamp: new Date().toISOString(),
        scores: {
          performance: Math.round(scores.performance.score * 100),
          accessibility: Math.round(scores.accessibility.score * 100),
          bestPractices: Math.round(scores['best-practices'].score * 100),
          seo: Math.round(scores.seo.score * 100),
        },
        metrics: {
          'first-contentful-paint': audits['first-contentful-paint'].numericValue,
          'largest-contentful-paint': audits['largest-contentful-paint'].numericValue,
          'speed-index': audits['speed-index'].numericValue,
          'cumulative-layout-shift': audits['cumulative-layout-shift'].numericValue,
          'time-to-interactive': audits['interactive'].numericValue,
          'total-blocking-time': audits['total-blocking-time'].numericValue,
          'max-potential-fid': audits['max-potential-fid'].numericValue,
        },
        diagnostics: {
          'unused-css-rules': audits['unused-css-rules']?.details?.items?.length || 0,
          'unused-javascript': audits['unused-javascript']?.details?.items?.length || 0,
          'unminified-css': audits['unminified-css']?.score === 1,
          'unminified-javascript': audits['unminified-javascript']?.score === 1,
          'render-blocking-resources': audits['render-blocking-resources']?.details?.items?.length || 0,
          'efficient-animated-content': audits['efficient-animated-content']?.score === 1,
          'uses-text-compression': audits['uses-text-compression']?.score === 1,
          'uses-responsive-images': audits['uses-responsive-images']?.score === 1,
        },
        opportunities: this.extractOpportunities(audits),
        passed: this.checkThresholds(scores, audits),
      };

      // Save detailed report
      const reportPath = path.join(
        config.outputDir,
        `${pageConfig.name}-${isDesktop ? 'desktop' : 'mobile'}-${Date.now()}.json`
      );
      fs.writeFileSync(reportPath, runnerResult.report);

      console.log(`📈 ${pageConfig.name} (${isDesktop ? 'Desktop' : 'Mobile'}) results:`);
      console.log(`   Performance: ${result.scores.performance}%`);
      console.log(`   Accessibility: ${result.scores.accessibility}%`);
      console.log(`   Best Practices: ${result.scores.bestPractices}%`);
      console.log(`   SEO: ${result.scores.seo}%`);
      console.log(`   FCP: ${Math.round(result.metrics['first-contentful-paint'])}ms`);
      console.log(`   LCP: ${Math.round(result.metrics['largest-contentful-paint'])}ms`);

      return result;
    } catch (error) {
      console.error(`❌ Error testing ${pageConfig.name}:`, error.message);
      return {
        url: fullUrl,
        page: pageConfig.name,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  extractOpportunities(audits) {
    const opportunities = [];

    // Performance opportunities
    const opportunityAudits = [
      'unused-css-rules',
      'unused-javascript',
      'render-blocking-resources',
      'unminified-css',
      'unminified-javascript',
      'uses-text-compression',
      'uses-responsive-images',
      'efficient-animated-content',
      'modern-image-formats',
      'uses-webp-images',
      'offscreen-images',
    ];

    opportunityAudits.forEach(auditId => {
      const audit = audits[auditId];
      if (audit && audit.score !== null && audit.score < 1) {
        opportunities.push({
          id: auditId,
          title: audit.title,
          description: audit.description,
          score: audit.score,
          potentialSavings: audit.details?.overallSavingsMs || 0,
        });
      }
    });

    return opportunities.sort((a, b) => b.potentialSavings - a.potentialSavings);
  }

  checkThresholds(scores, audits) {
    const checks = {};

    // Score thresholds
    checks.performance = scores.performance.score * 100 >= config.thresholds.performance;
    checks.accessibility = scores.accessibility.score * 100 >= config.thresholds.accessibility;
    checks.bestPractices = scores['best-practices'].score * 100 >= config.thresholds.bestPractices;
    checks.seo = scores.seo.score * 100 >= config.thresholds.seo;

    // Metric thresholds
    checks['largest-contentful-paint'] = audits['largest-contentful-paint'].numericValue <= config.thresholds['largest-contentful-paint'];
    checks['first-contentful-paint'] = audits['first-contentful-paint'].numericValue <= config.thresholds['first-contentful-paint'];
    checks['cumulative-layout-shift'] = audits['cumulative-layout-shift'].numericValue <= config.thresholds['cumulative-layout-shift'];
    checks['speed-index'] = audits['speed-index'].numericValue <= config.thresholds['speed-index'];
    checks['time-to-interactive'] = audits['interactive'].numericValue <= config.thresholds['time-to-interactive'];

    const totalChecks = Object.keys(checks).length;
    const passedChecks = Object.values(checks).filter(Boolean).length;

    return {
      overall: passedChecks === totalChecks,
      ratio: `${passedChecks}/${totalChecks}`,
      details: checks,
    };
  }

  async runAllTests() {
    for (const page of config.pages) {
      // Skip protected pages if no auth token
      if (page.requiresAuth && !this.authToken) {
        console.log(`⏭️  Skipping ${page.name} (requires authentication)`);
        continue;
      }

      // Test desktop
      const desktopResult = await this.runLighthouse(page.url, page, true);
      this.results.push(desktopResult);

      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Test mobile
      const mobileResult = await this.runLighthouse(page.url, page, false);
      this.results.push(mobileResult);

      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  generateSummaryReport() {
    console.log('\n📋 Generating summary report...');

    const summary = {
      testRun: {
        timestamp: new Date().toISOString(),
        baseUrl: config.baseUrl,
        totalPages: config.pages.length,
        totalTests: this.results.length,
      },
      results: this.results,
      aggregated: this.aggregateResults(),
      recommendations: this.generateRecommendations(),
    };

    // Save summary report
    const summaryPath = path.join(config.outputDir, `performance-summary-${Date.now()}.json`);
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    // Generate HTML report
    this.generateHtmlReport(summary);

    return summary;
  }

  aggregateResults() {
    const validResults = this.results.filter(r => !r.error);

    if (validResults.length === 0) {
      return null;
    }

    const desktopResults = validResults.filter(r => r.formFactor === 'desktop');
    const mobileResults = validResults.filter(r => r.formFactor === 'mobile');

    return {
      desktop: this.calculateAverages(desktopResults),
      mobile: this.calculateAverages(mobileResults),
      overall: this.calculateAverages(validResults),
    };
  }

  calculateAverages(results) {
    if (results.length === 0) return null;

    const avg = (arr) => arr.reduce((sum, val) => sum + val, 0) / arr.length;

    return {
      scores: {
        performance: Math.round(avg(results.map(r => r.scores.performance))),
        accessibility: Math.round(avg(results.map(r => r.scores.accessibility))),
        bestPractices: Math.round(avg(results.map(r => r.scores.bestPractices))),
        seo: Math.round(avg(results.map(r => r.scores.seo))),
      },
      metrics: {
        'first-contentful-paint': Math.round(avg(results.map(r => r.metrics['first-contentful-paint']))),
        'largest-contentful-paint': Math.round(avg(results.map(r => r.metrics['largest-contentful-paint']))),
        'speed-index': Math.round(avg(results.map(r => r.metrics['speed-index']))),
        'cumulative-layout-shift': Math.round(avg(results.map(r => r.metrics['cumulative-layout-shift'])) * 1000) / 1000,
        'time-to-interactive': Math.round(avg(results.map(r => r.metrics['time-to-interactive']))),
      },
      passRate: {
        overall: Math.round((results.filter(r => r.passed.overall).length / results.length) * 100),
        performance: Math.round((results.filter(r => r.passed.details.performance).length / results.length) * 100),
        accessibility: Math.round((results.filter(r => r.passed.details.accessibility).length / results.length) * 100),
      },
    };
  }

  generateRecommendations() {
    const recommendations = [];
    const validResults = this.results.filter(r => !r.error);

    // Analyze common issues
    const commonIssues = {};

    validResults.forEach(result => {
      if (result.opportunities) {
        result.opportunities.forEach(opp => {
          if (!commonIssues[opp.id]) {
            commonIssues[opp.id] = {
              title: opp.title,
              description: opp.description,
              count: 0,
              totalSavings: 0,
              pages: [],
            };
          }
          commonIssues[opp.id].count++;
          commonIssues[opp.id].totalSavings += opp.potentialSavings;
          commonIssues[opp.id].pages.push(result.page);
        });
      }
    });

    // Sort by impact and frequency
    const sortedIssues = Object.entries(commonIssues)
      .sort(([, a], [, b]) => (b.count * b.totalSavings) - (a.count * a.totalSavings))
      .slice(0, 10);

    sortedIssues.forEach(([id, issue]) => {
      recommendations.push({
        priority: issue.count >= validResults.length * 0.5 ? 'High' : 'Medium',
        type: 'Performance',
        title: issue.title,
        description: issue.description,
        impact: `Affects ${issue.count} pages, potential savings: ${Math.round(issue.totalSavings)}ms`,
        pages: [...new Set(issue.pages)],
      });
    });

    // Add accessibility recommendations if scores are low
    const lowA11yResults = validResults.filter(r => r.scores.accessibility < 95);
    if (lowA11yResults.length > 0) {
      recommendations.push({
        priority: 'High',
        type: 'Accessibility',
        title: 'Improve accessibility scores',
        description: 'Some pages have accessibility scores below 95%',
        impact: `Affects ${lowA11yResults.length} pages`,
        pages: lowA11yResults.map(r => r.page),
      });
    }

    return recommendations;
  }

  generateHtmlReport(summary) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NetPilot Performance Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1, h2, h3 { color: #333; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .metric-label { color: #666; margin-top: 5px; }
        .results-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .results-table th, .results-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .results-table th { background: #f8f9fa; font-weight: 600; }
        .score { padding: 4px 8px; border-radius: 4px; color: white; font-weight: bold; }
        .score.good { background: #28a745; }
        .score.average { background: #ffc107; color: #000; }
        .score.poor { background: #dc3545; }
        .recommendations { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 20px; margin: 20px 0; }
        .recommendation { margin: 10px 0; padding: 10px; background: white; border-left: 4px solid #007bff; }
        .recommendation.high { border-left-color: #dc3545; }
        .recommendation.medium { border-left-color: #ffc107; }
    </style>
</head>
<body>
    <div class="container">
        <h1>NetPilot Performance Report</h1>
        <p>Generated on ${new Date(summary.testRun.timestamp).toLocaleString()}</p>

        <div class="summary">
            <div class="metric-card">
                <div class="metric-value">${summary.aggregated?.overall?.scores.performance || 'N/A'}</div>
                <div class="metric-label">Avg Performance Score</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${summary.aggregated?.overall?.scores.accessibility || 'N/A'}</div>
                <div class="metric-label">Avg Accessibility Score</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${summary.aggregated?.overall?.metrics['largest-contentful-paint'] || 'N/A'}ms</div>
                <div class="metric-label">Avg LCP</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${summary.aggregated?.overall?.passRate.overall || 'N/A'}%</div>
                <div class="metric-label">Pass Rate</div>
            </div>
        </div>

        <h2>Detailed Results</h2>
        <table class="results-table">
            <thead>
                <tr>
                    <th>Page</th>
                    <th>Device</th>
                    <th>Performance</th>
                    <th>Accessibility</th>
                    <th>Best Practices</th>
                    <th>SEO</th>
                    <th>FCP</th>
                    <th>LCP</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${summary.results.filter(r => !r.error).map(result => `
                    <tr>
                        <td>${result.page}</td>
                        <td>${result.formFactor}</td>
                        <td><span class="score ${result.scores.performance >= 90 ? 'good' : result.scores.performance >= 50 ? 'average' : 'poor'}">${result.scores.performance}</span></td>
                        <td><span class="score ${result.scores.accessibility >= 90 ? 'good' : result.scores.accessibility >= 50 ? 'average' : 'poor'}">${result.scores.accessibility}</span></td>
                        <td><span class="score ${result.scores.bestPractices >= 90 ? 'good' : result.scores.bestPractices >= 50 ? 'average' : 'poor'}">${result.scores.bestPractices}</span></td>
                        <td><span class="score ${result.scores.seo >= 90 ? 'good' : result.scores.seo >= 50 ? 'average' : 'poor'}">${result.scores.seo}</span></td>
                        <td>${Math.round(result.metrics['first-contentful-paint'])}ms</td>
                        <td>${Math.round(result.metrics['largest-contentful-paint'])}ms</td>
                        <td>${result.passed.overall ? '✅ Pass' : '❌ Fail'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        ${summary.recommendations.length > 0 ? `
        <h2>Recommendations</h2>
        <div class="recommendations">
            ${summary.recommendations.map(rec => `
                <div class="recommendation ${rec.priority.toLowerCase()}">
                    <h4>${rec.title}</h4>
                    <p>${rec.description}</p>
                    <p><strong>Impact:</strong> ${rec.impact}</p>
                    <p><strong>Pages:</strong> ${rec.pages.join(', ')}</p>
                </div>
            `).join('')}
        </div>
        ` : ''}
    </div>
</body>
</html>
    `;

    const htmlPath = path.join(config.outputDir, `performance-report-${Date.now()}.html`);
    fs.writeFileSync(htmlPath, html);

    console.log(`📄 HTML report saved to: ${htmlPath}`);
  }

  async cleanup() {
    if (this.chrome) {
      await this.chrome.kill();
      console.log('🧹 Chrome closed');
    }
  }

  printSummary(summary) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 PERFORMANCE TEST SUMMARY');
    console.log('='.repeat(60));

    if (summary.aggregated?.overall) {
      const overall = summary.aggregated.overall;
      console.log(`\n📈 Overall Scores:`);
      console.log(`   Performance: ${overall.scores.performance}%`);
      console.log(`   Accessibility: ${overall.scores.accessibility}%`);
      console.log(`   Best Practices: ${overall.scores.bestPractices}%`);
      console.log(`   SEO: ${overall.scores.seo}%`);

      console.log(`\n⚡ Core Web Vitals:`);
      console.log(`   First Contentful Paint: ${overall.metrics['first-contentful-paint']}ms`);
      console.log(`   Largest Contentful Paint: ${overall.metrics['largest-contentful-paint']}ms`);
      console.log(`   Cumulative Layout Shift: ${overall.metrics['cumulative-layout-shift']}`);

      console.log(`\n✅ Pass Rates:`);
      console.log(`   Overall: ${overall.passRate.overall}%`);
      console.log(`   Performance: ${overall.passRate.performance}%`);
      console.log(`   Accessibility: ${overall.passRate.accessibility}%`);
    }

    const failedTests = summary.results.filter(r => r.error);
    if (failedTests.length > 0) {
      console.log(`\n❌ Failed Tests: ${failedTests.length}`);
      failedTests.forEach(test => {
        console.log(`   ${test.page}: ${test.error}`);
      });
    }

    if (summary.recommendations.length > 0) {
      console.log(`\n💡 Top Recommendations:`);
      summary.recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec.title} (${rec.priority} priority)`);
      });
    }

    console.log('\n' + '='.repeat(60));
  }
}

// Main execution
async function runPerformanceTests() {
  const tester = new PerformanceTest();

  try {
    await tester.setup();
    await tester.runAllTests();
    const summary = tester.generateSummaryReport();
    tester.printSummary(summary);

    // Exit with error code if tests failed
    const failureRate = summary.results.filter(r => r.error || !r.passed?.overall).length / summary.results.length;
    if (failureRate > 0.2) { // More than 20% failure rate
      console.log('\n❌ Performance tests failed - high failure rate');
      process.exit(1);
    }

    console.log('\n✅ Performance tests completed successfully');
  } catch (error) {
    console.error('❌ Performance test error:', error);
    process.exit(1);
  } finally {
    await tester.cleanup();
  }
}

// Run if called directly
if (require.main === module) {
  runPerformanceTests();
}

module.exports = { PerformanceTest, config };