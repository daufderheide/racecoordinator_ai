module.exports = function (config) {
  // Override HOME to a temporary directory to avoid permission issues with Chrome
  var fs = require("fs");
  var path = require("path");

  // Use a local directory to avoid permission issues with system temp, but short enough for socket limits
  var tmpDir = path.join(__dirname, "tmp", "kc");
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
  process.env.HOME = chromeHome;
  process.env.XDG_CONFIG_HOME = path.join(tmpDir, "config");
  process.env.XDG_CACHE_HOME = path.join(tmpDir, "cache");
  process.env.XDG_RUNTIME_DIR = path.join(tmpDir, "run");
  process.env.TMPDIR = path.join(tmpDir, "t");
  process.env.CHROME_USER_DATA_DIR = chromeUserData;

  [
    process.env.XDG_CONFIG_HOME,
    process.env.XDG_CACHE_HOME,
    process.env.XDG_RUNTIME_DIR,
    process.env.TMPDIR,
  ].forEach(function (dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  var isCI = !!process.env.GITHUB_ACTIONS;
  var isAgent = !!process.env.ANTIGRAVITY_AGENT;

  var chromeFlags = [
    isCI || isAgent ? "--headless=new" : "--headless",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--user-data-dir=" + chromeUserData,
    "--disable-crash-reporter",
    "--disable-breakpad",
    "--crash-dumps-dir=" + chromeCrashDumps,
    "--no-default-browser-check",
    "--no-first-run",
    "--disable-signin",
    "--disable-sync",
    "--remote-debugging-port=9222",
    "--disable-software-rasterizer",
    "--disk-cache-dir=" + path.join(tmpDir, "cache"),
    "--remote-allow-origins=*",
    "--use-mock-keychain",
    "--no-pings",
    "--disable-features=IsolateOrigins,site-per-process,Dial",
  ];

  if (isCI) {
    // GitHub Actions specific fixes
    chromeFlags.push(
      "--disable-setuid-sandbox",
      "--disable-extensions",
      "--disable-features=Translate,PasswordImport,AutofillServerCommunication,OptimizationHints,VizDisplayCompositor",
    );
  } else {
    // Local/Agent flags
    chromeFlags.push(
      "--disable-setuid-sandbox",
      "--disable-gpu-sandbox",
      "--disable-namespace-sandbox",
    );
  }

  config.set({
    basePath: "",
    frameworks: ["jasmine", "@angular-devkit/build-angular"],
    reporters: ["progress", "kjhtml"],
    plugins: [
      require("karma-jasmine"),
      require("karma-chrome-launcher"),
      require("karma-jasmine-html-reporter"),
      require("karma-coverage"),
      require("@angular-devkit/build-angular/plugins/karma"),
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
      reporters: [{ type: "html" }, { type: "text-summary" }],
    },
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ["ChromeHeadlessWithCustomConfig"],
    customLaunchers: {
      ChromeHeadlessWithCustomConfig: {
        base: "Chrome",
        flags: chromeFlags,
      },
    },
    captureTimeout: 60000,
    browserDisconnectTolerance: 3,
    browserDisconnectTimeout: 60000,
    browserNoActivityTimeout: 60000,
    singleRun: true,
    restartOnFileChange: true,
  });
};
