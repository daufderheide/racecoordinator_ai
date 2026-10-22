module.exports = function (config) {
  // Override HOME to a temporary directory to avoid permission issues with Chrome
  var fs = require("fs");
  var path = require("path");

  // Use /tmp for CI compatibility - short paths avoid Unix socket limits
  var tmpDir = "/tmp/kc";
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  // Define dedicated directories
  var chromeHome = path.join(tmpDir, "h");
  var chromeUserData = path.join(tmpDir, "u");
  var chromeCrashDumps = path.join(tmpDir, "c");

  // Create them proactively
  if (!fs.existsSync(chromeHome)) fs.mkdirSync(chromeHome, { recursive: true });
  if (!fs.existsSync(chromeUserData))
    fs.mkdirSync(chromeUserData, { recursive: true });
  if (!fs.existsSync(chromeCrashDumps))
    fs.mkdirSync(chromeCrashDumps, { recursive: true });

  // Override environment variables
  // NOTE: Do NOT override process.env.HOME - it breaks Chrome's Mach port / Crashpad on macOS
  process.env.XDG_CONFIG_HOME = path.join(tmpDir, "config");
  process.env.XDG_CACHE_HOME = path.join(tmpDir, "cache");
  process.env.XDG_RUNTIME_DIR = path.join(tmpDir, "run");

  if (!process.env.TMPDIR) {
    process.env.TMPDIR = path.join(tmpDir, "t");
  }

  [
    process.env.XDG_CONFIG_HOME,
    process.env.XDG_CACHE_HOME,
    process.env.XDG_RUNTIME_DIR,
    process.env.TMPDIR,
  ].forEach(function (dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  var chromeFlags = [
    "--headless",
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--disable-software-rasterizer",
    "--window-size=1920,1080",
    "--user-data-dir=" + chromeUserData,
    "--disable-crash-reporter",
    "--disable-breakpad",
    "--crash-dumps-dir=" + chromeCrashDumps,
    "--no-default-browser-check",
    "--no-first-run",
    "--disable-signin",
    "--disable-sync",
    "--remote-debugging-port=9222",
    "--disk-cache-dir=" + path.join(tmpDir, "cache"),
    "--remote-allow-origins=*",
    "--use-mock-keychain",
    "--no-pings",
    "--disable-extensions",
    "--disable-features=Translate,PasswordImport,AutofillServerCommunication,Dial",
    "--js-flags=--max-old-space-size=4096",
    "--window-size=1920,1080",
  ];

  var timingReporterPlugin = {
    "reporter:timing": [
      "type",
      function (baseReporterDecorator) {
        baseReporterDecorator(this);
        var suiteTimes = {};
        var currentSuite = "";
        var currentSuiteStart = Date.now();

        this.onSpecComplete = function (browser, result) {
          var suiteName = (result.suite && result.suite[0]) || "unknown";
          if (suiteName !== currentSuite) {
            if (currentSuite) {
              suiteTimes[currentSuite] =
                (suiteTimes[currentSuite] || 0) +
                (Date.now() - currentSuiteStart);
            }
            currentSuite = suiteName;
            currentSuiteStart = Date.now();
          }
        };

        this.onRunComplete = function (browsers, results) {
          if (currentSuite) {
            suiteTimes[currentSuite] =
              (suiteTimes[currentSuite] || 0) +
              (Date.now() - currentSuiteStart);
          }
          var sorted = Object.entries(suiteTimes)
            .sort(function (a, b) {
              return b[1] - a[1];
            })
            .slice(0, 15);
          console.log(
            "\n================ TOP 15 SLOWEST SUITES (WALL CLOCK) ================",
          );
          sorted.forEach(function (pair, idx) {
            console.log(
              idx +
                1 +
                ". " +
                pair[0] +
                ": " +
                (pair[1] / 1000).toFixed(2) +
                "s",
            );
          });
          console.log(
            "====================================================================\n",
          );
        };
      },
    ],
  };

  config.set({
    basePath: "",
    frameworks: ["jasmine", "@angular-devkit/build-angular"],
    reporters: ["progress", "timing", "coverage"],
    plugins: [
      require("karma-jasmine"),
      require("karma-chrome-launcher"),
      require("karma-jasmine-html-reporter"),
      require("karma-coverage"),
      require("@angular-devkit/build-angular/plugins/karma"),
      timingReporterPlugin,
    ],
    client: {
      jasmine: {
        random: false,
      },
      clearContext: false, // leave Jasmine Spec Runner output visible in browser
    },
    jasmineHtmlReporter: {
      suppressAll: true, // removes the duplicated traces
    },
    coverageReporter: {
      dir: require("path").join(__dirname, "./coverage/client"),
      subdir: ".",
      reporters: [
        { type: "html" },
        { type: "text-summary" },
        { type: "lcovonly" },
      ],
      check: {
        global: {
          statements: 80,
          lines: 82,
          functions: 80,
          branches: 67,
        },
      },
    },
    port: 9888,
    hostname: "127.0.0.1",
    listenAddress: "127.0.0.1",
    colors: true,
    browserConsoleLogOptions: {
      level: "error",
      terminal: true,
    },
    logLevel: config.LOG_ERROR,
    autoWatch: true,
    browsers: ["ChromeHeadlessWithCustomConfig"],
    customLaunchers: {
      ChromeHeadlessWithCustomConfig: {
        base: "Chrome",
        flags: chromeFlags,
      },
    },
    captureTimeout: 240000,
    browserDisconnectTolerance: 3,
    browserDisconnectTimeout: 240000,
    browserNoActivityTimeout: 240000,
    singleRun: true,
    restartOnFileChange: true,
  });
};
