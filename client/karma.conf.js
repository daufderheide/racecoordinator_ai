module.exports = function (config) {
  // Override HOME to a temporary directory to avoid permission issues with Chrome
  const fs = require('fs');
  const path = require('path');

  // Use system temp directory to avoid permission issues and spaces in paths
  const os = require('os');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'karma-chrome-'));

  // Define dedicated directories
  const chromeHome = path.join(tmpDir, 'chrome-home');
  const chromeUserData = path.join(tmpDir, 'chrome-user-data');
  const chromeCrashDumps = path.join(tmpDir, 'chrome-crash');

  // Create them proactively
  if (!fs.existsSync(chromeHome)) fs.mkdirSync(chromeHome, { recursive: true });
  if (!fs.existsSync(chromeUserData)) fs.mkdirSync(chromeUserData, { recursive: true });
  if (!fs.existsSync(chromeCrashDumps)) fs.mkdirSync(chromeCrashDumps, { recursive: true });

  // Override environment variables
  process.env.HOME = chromeHome;
  process.env.CHROME_USER_DATA_DIR = chromeUserData;

  console.log('DEBUG: Overridden process.env.HOME =', process.env.HOME);
  console.log('DEBUG: process.env.CHROME_USER_DATA_DIR =', process.env.CHROME_USER_DATA_DIR);
  console.log('DEBUG: chromeUserData =', chromeUserData);

  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      jasmine: {
        // you can add configuration options for Jasmine here
        // the possible options are listed at https://jasmine.github.io/api/edge/Configuration.html
        // for example, you can disable the random execution with `random: false`
        // or set a specific seed with `seed: 4321`
      },
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    jasmineHtmlReporter: {
      suppressAll: true // removes the duplicated traces
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/client'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' }
      ]
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['ChromeHeadlessWithCustomConfig'],
    customLaunchers: {
      ChromeHeadlessWithCustomConfig: {
        base: 'Chrome',
        flags: [
          '--headless=new',
          '--no-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--user-data-dir=' + chromeUserData,
          '--disable-crash-reporter',
          '--disable-breakpad',
          '--crash-dumps-dir=' + chromeCrashDumps,
          '--no-default-browser-check',
          '--no-first-run',
          '--disable-signin',
          '--disable-sync'
        ]
      }
    },
    captureTimeout: 210000,
    browserDisconnectTolerance: 3,
    browserDisconnectTimeout: 210000,
    browserNoActivityTimeout: 210000,
    singleRun: true,
    restartOnFileChange: true
  });
};
