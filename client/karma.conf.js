module.exports = function (config) {
  console.log('DEBUG: process.env.HOME =', process.env.HOME);
  console.log('DEBUG: process.env.KARMA_PROFILE_DIR =', process.env.KARMA_PROFILE_DIR);
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
        base: 'ChromeHeadless',
        flags: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--disable-extensions',
          '--disable-software-rasterizer',
          '--mute-audio',
          '--no-zygote',
          '--single-process',
          '--disable-crash-reporter',
          '--disable-breakpad',
          '--disable-dev-shm-usage',
          '--disable-setuid-sandbox',
          '--password-store=basic',
          '--use-mock-keychain',
          '--remote-debugging-port=9222',
          '--user-data-dir=' + require('path').resolve(__dirname, '.tmp/karma-chrome-' + Date.now())
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
