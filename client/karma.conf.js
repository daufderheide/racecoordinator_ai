module.exports = function (config) {
  // Override HOME to a temporary directory to avoid permission issues with Chrome
  var fs = require("fs");
  var path = require("path");

  // Use a local directory to avoid permission issues with system temp, but short enough for socket limits
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
  // process.env.HOME = chromeHome; // Commenting out to avoid Mach port permission errors on macOS
  process.env.XDG_CONFIG_HOME = path.join(tmpDir, "config");
  process.env.XDG_CACHE_HOME = path.join(tmpDir, "cache");
  process.env.XDG_RUNTIME_DIR = path.join(tmpDir, "run");
  // process.env.TMPDIR = path.join(tmpDir, 't'); // Commenting out to avoid Mach port permission errors on macOS

  if (!process.env.TMPDIR) {
    process.env.TMPDIR = path.join(tmpDir, "t");
  }

  if (!fs.existsSync(process.env.XDG_CONFIG_HOME))
    fs.mkdirSync(process.env.XDG_CONFIG_HOME, { recursive: true });
  if (!fs.existsSync(process.env.XDG_CACHE_HOME))
    fs.mkdirSync(process.env.XDG_CACHE_HOME, { recursive: true });
  if (!fs.existsSync(process.env.XDG_RUNTIME_DIR))
    fs.mkdirSync(process.env.XDG_RUNTIME_DIR, { recursive: true });
  if (!fs.existsSync(process.env.TMPDIR))
    fs.mkdirSync(process.env.TMPDIR, { recursive: true });

  console.log("DEBUG: Overridden process.env.HOME =", process.env.HOME);
  console.log(
    "DEBUG: process.env.CHROME_USER_DATA_DIR =",
    process.env.CHROME_USER_DATA_DIR,
  );
  console.log("DEBUG: XDG_CONFIG_HOME =", process.env.XDG_CONFIG_HOME);
  console.log("DEBUG: XDG_CACHE_HOME =", process.env.XDG_CACHE_HOME);
  console.log("DEBUG: XDG_RUNTIME_DIR =", process.env.XDG_RUNTIME_DIR);
  console.log("DEBUG: TMPDIR =", process.env.TMPDIR);
  console.log("DEBUG: chromeUserData =", chromeUserData);

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
        // you can add configuration options for Jasmine here
        // the possible options are listed at https://jasmine.github.io/api/edge/Configuration.html
        // for example, you can disable the random execution with `random: false`
        // or set a specific seed with `seed: 4321`
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
        flags: [
          "--headless",
          "--no-sandbox",
          "--single-process",
          "--disable-namespace-sandbox",
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
          "--disable-features=Dial",
          "--remote-allow-origins=*",
          "--disable-gpu-sandbox",
        ],
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
