import { Page } from "@playwright/test";
import {
  InitializeInterfaceResponse,
  IRaceTime,
  ListAssetsResponse,
  RaceData,
  RaceState,
  SaveCustomRotationResponse,
  UpdateInterfaceConfigResponse,
} from "@app/proto/antigravity";

import {} from "./data/assets_data";
import { MOCK_DRIVERS } from "./data/drivers_data";
import { MOCK_RACES } from "./data/races_data";
import { MOCK_TEAMS } from "./data/teams_data";
import { MOCK_FACTORY_SETTINGS, MOCK_TRACKS } from "./data/tracks_data";

export interface SetupOptions {
  skipIntro?: boolean;
  walkthroughSeen?: boolean;
  trackManagerHelpShown?: boolean;
  trackEditorHelpShown?: boolean;
  driverManagerHelpShown?: boolean;
  driverEditorHelpShown?: boolean;
  teamManagerHelpShown?: boolean;
  teamEditorHelpShown?: boolean;
  assetManagerHelpShown?: boolean;
  raceManagerHelpShown?: boolean;
  raceEditorHelpShown?: boolean;
}

export class TestSetupHelper {
  static async setupStandardMocks(page: Page, options: SetupOptions = {}) {
    // Listen for console logs from the browser and prefix them for visibility
    page.on("console", (msg) => {
      const type = msg.type();
      const text = msg.text();
      // Only log if it's not a noisy debug message, or if it's one of our HEARTBEAT logs
      if (
        type === "error" ||
        type === "warning" ||
        text.includes("MockWebSocket")
      ) {
        console.log(`BROWSER [${type.toUpperCase()}]: ${text}`);
      }
    });

    page.on("pageerror", (err) =>
      console.error(`BROWSER ERROR: ${err.message}`),
    );

    // Mock WebSockets by default to avoid connection refused/watchdog issues
    await this.setupWebSocketMock(page);

    // Mock Localization
    await this.setupLocalizationMocks(page);

    // Mock specialized APIs
    await this.setupDriverMocks(page);
    await this.setupRaceRestMocks(page);
    await this.setupTrackMocks(page);
    await this.setupTeamMocks(page);
    await this.setupAssetMocks(page);
    await this.setupThemeMocks(page);

    // Mock Server Version API
    await page.route("**/api/version", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: "TEST-SERVER-VERSION",
      });
    });

    // Mock Auth Role API to ensure UI tests run as DIRECTOR
    await page.route("**/api/auth/role", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ role: "DIRECTOR" }),
      });
    });

    // Mock Client Version Override
    await page.addInitScript(() => {
      (window as any).CLIENT_VERSION_OVERRIDE = "TEST-CLIENT-VERSION";
      (window as any).isPlaywright = true;
    });

    // Mock Server IP API
    await page.route("**/api/server-ip", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: "192.168.1.100",
      });
    });

    // Mock Database Stats API
    await page.route("**/api/databases/current*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          name: "Mock_Database.db",
          totalSize: "450 KB",
          imageCount: 5,
          soundCount: 3,
        }),
      });
    });

    // Mock Settings using localStorage (since no component actually calls /api/settings)
    await this.setupSettings(page, {
      racedaySetupWalkthroughSeen: options.walkthroughSeen ?? true,
      trackManagerHelpShown: options.trackManagerHelpShown ?? true,
      trackEditorHelpShown: options.trackEditorHelpShown ?? true,
      driverManagerHelpShown: options.driverManagerHelpShown ?? true,
      driverEditorHelpShown: options.driverEditorHelpShown ?? true,
      teamManagerHelpShown: options.teamManagerHelpShown ?? true,
      teamEditorHelpShown: options.teamEditorHelpShown ?? true,
      assetManagerHelpShown: options.assetManagerHelpShown ?? true,
      raceManagerHelpShown: options.raceManagerHelpShown ?? true,
      raceEditorHelpShown: options.raceEditorHelpShown ?? true,

      racedayColumns: ["driver.name", "lapCount"],

      columnLayouts: {
        "driver.name": { CenterCenter: "driver.name" },
        lapCount: { CenterCenter: "lapCount" },
      },
      columnAnchors: {
        "driver.name": "Center",
        lapCount: "Center",
      },
      columnWidths: {
        "driver.name": 200,
        lapCount: 100,
      },
      columnVisibility: {},
    });

    // Mock Google Analytics to prevent external network requests that cause layout shifts
    await page.route("**/gtag/js*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: "window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} window.gtag = gtag;",
      });
    });

    // Mock Analytics Config API
    await page.route("**/api/analytics/config", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          clientId: "mock-client-id",
          measurementId: "G-MOCK-ID",
        }),
      });
    });

    // Mock Log Level API
    await page.route("**/api/settings/log-level*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: "OK",
      });
    });

    // Mock Google Fonts and Material Icons CSS requests to return local fallbacks and original URLs
    // to avoid hitting external networks that block/hang visual tests, but allowing real fonts when online.
    await page.route("**/icon?family=Material+Icons*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/css",
        body: `@font-face {
          font-family: 'Material Icons';
          font-style: normal;
          font-weight: 400;
          src: local('Material Icons'),
               local('MaterialIcons-Regular'),
               url('https://fonts.gstatic.com/s/materialicons/v142/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2') format('woff2');
        }
        .material-icons {
          font-family: 'Material Icons';
          font-weight: normal;
          font-style: normal;
          font-size: 24px;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          display: inline-block;
          white-space: nowrap;
          word-wrap: normal;
          direction: ltr;
          -webkit-font-feature-settings: 'liga';
          -webkit-font-smoothing: antialiased;
        }`,
      });
    });

    await page.route("**/css2?family=Rajdhani*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/css",
        body: `@font-face {
          font-family: 'Rajdhani';
          font-style: normal;
          font-weight: 300;
          src: local('Rajdhani'),
               local('Rajdhani-Light'),
               url('https://fonts.gstatic.com/s/rajdhani/v15/L0x5DFM4tM2s7KCDQIm32C5yXg.woff2') format('woff2'),
               local('sans-serif');
        }
        @font-face {
          font-family: 'Rajdhani';
          font-style: normal;
          font-weight: 500;
          src: local('Rajdhani'),
               local('Rajdhani-Medium'),
               url('https://fonts.gstatic.com/s/rajdhani/v15/L0x5DFM4tM2s7KCDQIm3Fh5yXg.woff2') format('woff2'),
               local('sans-serif');
        }
        @font-face {
          font-family: 'Rajdhani';
          font-style: normal;
          font-weight: 700;
          src: local('Rajdhani'),
               local('Rajdhani-Bold'),
               url('https://fonts.gstatic.com/s/rajdhani/v15/L0x5DFM4tM2s7KCDQIm3Bx5yXg.woff2') format('woff2'),
               local('sans-serif');
        }`,
      });
    });

    // Force load fonts only during tests to prevent flakiness without changing app code
    await page.addStyleTag({
      url: "https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;500;700&display=swap",
    });

    // Handle skip intro
    if (options.skipIntro) {
      await page.addInitScript(() => {
        window.sessionStorage.setItem("skipIntro", "true");
      });
    }
  }

  static async setupDriverMocks(page: Page) {
    let currentDrivers = [...MOCK_DRIVERS];

    await page.route("**/api/drivers", async (route) => {
      const method = route.request().method();
      if (method === "POST") {
        const postData = route.request().postDataJSON();
        const newDriver = { ...postData, entity_id: `d-${Date.now()}` };
        currentDrivers.push(newDriver);
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(newDriver),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(currentDrivers),
        });
      }
    });

    await page.route("**/api/drivers/*", async (route) => {
      const method = route.request().method();
      const url = route.request().url();
      const id = url.split("/").pop();

      if (method === "PUT") {
        const postData = route.request().postDataJSON();
        const index = currentDrivers.findIndex((d) => d.entity_id === id);
        if (index !== -1) {
          currentDrivers[index] = { ...currentDrivers[index], ...postData };
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(postData),
        });
      } else if (method === "DELETE") {
        currentDrivers = currentDrivers.filter((d) => d.entity_id !== id);
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route("**/api/history/drivers/*/stats", async (route) => {
      const url = route.request().url();
      const matches = url.match(/\/api\/history\/drivers\/([^\/]+)\/stats/);
      const driverId = matches ? matches[1] : "d1";
      const isTeam = driverId.includes("team") || driverId.startsWith("t_");

      const mockStats = {
        driver_id: driverId,
        race_id: "race123",
        best_lap_time: isTeam ? 9.8 : 9.8,
        best_lap_count: isTeam ? 4.0 : 3.0,
        lane_best_lap_times: isTeam ? [9.8, 10.2] : [9.8, 10.5],
        lane_best_lap_counts: isTeam ? [4.0, 3.0] : [3.0, 2.0],
      };

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockStats),
      });
    });
  }

  static async setupTeamMocks(page: Page) {
    let currentTeams = [...MOCK_TEAMS];

    await page.route("**/api/teams", async (route) => {
      const method = route.request().method();
      if (method === "POST") {
        const postData = route.request().postDataJSON();
        const newTeam = { ...postData, entity_id: `team-${Date.now()}` };
        currentTeams.push(newTeam);
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(newTeam),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(currentTeams),
        });
      }
    });

    await page.route("**/api/teams/*", async (route) => {
      const method = route.request().method();
      const url = route.request().url();
      const id = url.split("/").pop();

      if (method === "PUT") {
        const postData = route.request().postDataJSON();
        const index = currentTeams.findIndex((t) => t.entity_id === id);
        if (index !== -1) {
          currentTeams[index] = { ...currentTeams[index], ...postData };
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(postData),
        });
      } else if (method === "DELETE") {
        currentTeams = currentTeams.filter((t) => t.entity_id !== id);
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.continue();
      }
    });
  }

  static async setupLocalizationMocks(page: Page) {
    // Read en.json from disk to serve as mock
    const fs = require("fs");
    const path = require("path");

    // Try to locate the assets folder relative to CWD
    const i18nPath = path.resolve(process.cwd(), "client/src/assets/i18n");
    const altPath = path.resolve(process.cwd(), "src/assets/i18n");
    const rootPath = path.resolve(process.cwd(), "assets/i18n");
    const relativePath = path.resolve(__dirname, "../../assets/i18n");

    let finalPath = i18nPath;
    if (!fs.existsSync(finalPath)) {
      if (fs.existsSync(altPath)) {
        finalPath = altPath;
      } else if (fs.existsSync(rootPath)) {
        finalPath = rootPath;
      } else if (fs.existsSync(relativePath)) {
        finalPath = relativePath;
      }
    }

    // Use Regex to match the path regardless of query params (e.g. ?t=...)
    await page.route(/\/assets\/i18n\/.*\.json/, async (route) => {
      const url = route.request().url();
      const match = url.match(/\/assets\/i18n\/([a-z]{2,3})\.json/);
      const lang = match ? match[1] : "en";
      try {
        const filePath = path.join(finalPath, `${lang}.json`);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, "utf8");
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: content,
          });
          return;
        }
      } catch (e) {
        // Silent fail
      }

      await route.continue();
    });

    // Mock background images to avoid dev-server flakiness
    await page.route("**/assets/**/*.png", async (route) => {
      const url = route.request().url();
      console.log(`DEBUG: Asset request hit: ${url}`);

      // Match anything under assets/
      const match = url.match(/\/assets\/(.*\.png)/);
      if (!match) {
        console.warn(`DEBUG: Asset URL did not match regex: ${url}`);
        return route.continue();
      }

      const relativePath = match[1];

      // Try multiple potential base paths
      const potentialPaths = [
        path.resolve(process.cwd(), "src/assets"), // Case where CWD is /client
        path.resolve(process.cwd(), "assets"), // Case where CWD is /client/src
        path.resolve(process.cwd(), "client/src/assets"), // Case where CWD is project root
      ];

      let filePath = "";
      for (const basePath of potentialPaths) {
        const testPath = path.join(basePath, relativePath);
        if (fs.existsSync(testPath)) {
          filePath = testPath;
          break;
        }
      }

      if (filePath) {
        const content = fs.readFileSync(filePath);
        await route.fulfill({
          status: 200,
          contentType: "image/png",
          body: content,
        });
        return;
      }

      // FALLBACK: If physical file is missing, return a 1x1 transparent PNG to keep tests stable
      const transparentPng = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
        "base64",
      );
      await route.fulfill({
        status: 200,
        contentType: "image/png",
        body: transparentPng,
      });
    });
  }

  static async waitForLocalization(
    page: Page,
    _lang: string = "en",
    action?: Promise<any>,
  ) {
    // 1. Perform the action (e.g. goto)
    if (action) await action;

    // 2. Wait for the Service level readiness flag
    // This is set to true in TranslationService.ts when the JSON is loaded and applied
    // We wait for it to be exactly true (it starts as undefined/false)
    await page.waitForFunction(
      () => (window as any).isTranslationsLoaded === true,
      { timeout: 15000 },
    );

    // 3. Wait for any visible keys to be replaced by text (e.g. RD_TITLE -> "Modify Heats")
    // This is more robust than just waiting for the flag, as Angular's change detection
    // might still be catching up.
    await page
      .waitForFunction(
        () => {
          const walk = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
          );
          let node;
          while ((node = walk.nextNode())) {
            const text = node.textContent?.trim() || "";
            // If the text looks like one of our common localization keys, it hasn't been replaced yet.
            const prefixes =
              /^(RD|DE|RE|RDS|AM|DBM|DM|AE|TEM|TE|TMM|TM|RM|UE|UI|ASSET|AS|GEN|HELP|HR|OR|IS|LOG|ACK|APP|CD|DR|RGB|TOOLBAR)_/;
            if (/^[A-Z][A-Z0-9_]+$/.test(text) && prefixes.test(text)) {
              return false;
            }
          }
          return true;
        },
        { timeout: 5000 },
      )
      .catch(() => {
        // Log a warning but don't fail, as some text might legitimately look like a key
        console.warn(
          "TestSetupHelper: Some potential localization keys (RD_/DE_/RE_/RDS_) might still be visible in the DOM after timeout.",
        );
      });

    // 4. Ensure fonts and layout have settled after text swap
    // We execute the font loading in the browser, but race it at the Node level with a 2-second timeout
    // to prevent any event loop stalls or fake timer issues from hanging the test suite.
    const fontsEvaluatePromise = page
      .evaluate(async () => {
        try {
          await Promise.all([
            document.fonts.load("16px Rajdhani"),
            document.fonts.load("24px Rajdhani"),
            document.fonts.load("700 16px Rajdhani"),
            document.fonts.load("16px 'Material Icons'"),
          ]);
          await document.fonts.ready;
        } catch (e) {
          // Ignore font loading errors/stalls
        }
      })
      .catch((err) => {
        console.warn(
          "TestSetupHelper: font settling evaluate failed/timed out:",
          err,
        );
      });

    const fontsTimeoutPromise = new Promise<void>((resolve) => {
      setTimeout(resolve, 2000);
    });

    await Promise.race([fontsEvaluatePromise, fontsTimeoutPromise]);

    // 5. Wait for a paint cycle to ensure DOM updates are flushed
    // Race with a setTimeout fallback in case the tab is throttled in the background
    await page.evaluate(
      () =>
        new Promise<void>((res) => {
          let done = false;
          const resolve = () => {
            if (done) return;
            done = true;
            res();
          };
          setTimeout(resolve, 500);
          requestAnimationFrame(() => requestAnimationFrame(resolve));
        }),
    );

    // 6. Final safety wait for complex components (like SVGs) to stabilize
    // Increased to 500ms to ensure stability with 18 workers and production rendering
    await page.waitForTimeout(500);
  }

  static async setupTrackMocks(page: Page) {
    let currentTracks = [...MOCK_TRACKS];

    await page.route("**/api/tracks", async (route) => {
      const method = route.request().method();
      if (method === "POST") {
        const postData = route.request().postDataJSON();
        const newTrack = { ...postData, entity_id: `t-${Date.now()}` };
        currentTracks.push(newTrack);
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(newTrack),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(currentTracks),
        });
      }
    });

    await page.route("**/api/tracks/*", async (route) => {
      const method = route.request().method();
      const url = route.request().url();
      const id = url.split("/").pop()?.split("?")[0];

      if (method === "PUT") {
        const postData = route.request().postDataJSON();
        const index = currentTracks.findIndex((t) => t.entity_id === id);
        if (index !== -1) {
          currentTracks[index] = { ...currentTracks[index], ...postData };
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(postData),
        });
      } else if (method === "DELETE") {
        currentTracks = currentTracks.filter((t) => t.entity_id !== id);
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
      } else if (method === "GET") {
        const found = currentTracks.find((t) => t.entity_id === id);
        if (found) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(found),
          });
        } else {
          await route.fulfill({
            status: 404,
            contentType: "application/json",
            body: JSON.stringify({ error: "Track not found" }),
          });
        }
      } else {
        await route.continue();
      }
    });

    await page.route("**/api/serial-ports", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(["COM1", "COM2", "COM3", "COM4"]),
      });
    });

    await page.route("**/api/tracks/factory-settings", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_FACTORY_SETTINGS),
      });
    });

    // Mock interface initialization and updates to avoid browser errors
    await page.route("**/api/initialize-interface", async (route) => {
      const response = InitializeInterfaceResponse.create({
        success: true,
      });
      const buffer = InitializeInterfaceResponse.encode(response).finish();
      await route.fulfill({
        status: 200,
        contentType: "application/octet-stream",
        body: Buffer.from(buffer),
      });
    });

    await page.route("**/api/update-interface-config", async (route) => {
      const response = UpdateInterfaceConfigResponse.create({
        success: true,
      });
      const buffer = UpdateInterfaceConfigResponse.encode(response).finish();
      await route.fulfill({
        status: 200,
        contentType: "application/octet-stream",
        body: Buffer.from(buffer),
      });
    });
  }

  static async setupDigitalTrackMocks(page: Page) {
    await page.route("**/api/tracks", async (route) => {
      const tracks = [
        {
          entity_id: "t_digital",
          name: "Digital Haven",
          has_digital_fuel: true, // Use the new property we added to the model/converter
          lanes: [
            {
              entity_id: "l1",
              length: 15.0,
              backgroundColor: "#ffff00",
              foregroundColor: "#000000",
            },
          ],
          arduino_configs: [
            {
              name: "Arduino Digital",
              commPort: "COM5",
              baudRate: 115200,
              debounceUs: 5000,
              hardwareType: 1,
              digitalIds: [1001],
              analogIds: [-1],
              voltageConfigs: { 1: 12.0 }, // This also indicates digital fuel
              normallyClosedLaneSensors: false,
              normallyClosedRelays: true,
              globalInvertLights: 0,
              useLapsForPits: 0,
              useLapsForPitEnd: 0,
              usePitsAsLaps: false,
              useLapsForSegments: true,
              ledStrings: null,
              ledLaneColorOverrides: null,
              lapPinPitBehavior: 3,
            },
          ],
        },
      ];

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(tracks),
      });
    });
  }

  static async setupAssetMocks(page: Page) {
    const mockImage = `
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="#3f51b5" />
        <text x="50" y="50" font-family="Arial" font-size="20" text-anchor="middle" fill="white" dominant-baseline="middle">IMG</text>
      </svg>
    `.trim();

    await page.route("**/assets/images/**/*.png", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "image/svg+xml",
        body: mockImage,
      });
    });

    await page.route(
      (url) =>
        url.pathname.endsWith("/api/assets/list") ||
        url.pathname.includes("/api/assets/list"),
      async (route) => {
        const assets = [
          {
            model: { entityId: "1" },
            name: "Test Image 1",
            type: "image",
            size: "150 KB",
            url: "/api/assets/download?filename=img1.png",
            filename: "img1.png",
          },
          {
            model: { entityId: "2" },
            name: "Test Sound 1",
            type: "sound",
            size: "50 KB",
            url: "/api/assets/download?filename=snd1.mp3",
            filename: "snd1.mp3",
          },
          {
            model: { entityId: "set123" },
            name: "Custom Dash",
            type: "image_set",
            size: "1.2 MB",
            url: "/api/assets/download?filename=dash.json",
            filename: "dash.json",
            images: [
              {
                percentage: 30,
                url: "/api/assets/download?filename=img1.png",
                name: "img1.png",
              },
              {
                percentage: 70,
                url: "/api/assets/download?filename=img2.png",
                name: "img2.png",
              },
            ],
          },
          {
            model: { entityId: "fuel-gauge-builtin" },
            name: "Fuel Gauge",
            type: "image_set",
            size: "1.2 MB",
            url: "/api/assets/download?filename=fuel-gauge.json",
            filename: "fuel-gauge.json",
            images: [
              {
                percentage: 0,
                url: "/api/assets/download?filename=fuel-0.png",
                name: "fuel-0.png",
              },
              {
                percentage: 50,
                url: "/api/assets/download?filename=fuel-50.png",
                name: "fuel-50.png",
              },
              {
                percentage: 100,
                url: "/api/assets/download?filename=fuel-100.png",
                name: "fuel-100.png",
              },
            ],
          },
          {
            model: { entityId: "default_start_red_on" },
            name: "Start Lamp Red",
            type: "image",
            url: "assets/images/start_red_on.png",
          },
          {
            model: { entityId: "default_start_red_dim" },
            name: "Start Lamp Dim",
            type: "image",
            url: "assets/images/start_red_dim.png",
          },
          {
            model: { entityId: "default_start_green" },
            name: "Start Lamp Green",
            type: "image",
            url: "assets/images/start_green.png",
          },
          {
            model: { entityId: "mock-flag-1" },
            name: "Checker Flag",
            type: "image",
            url: "/api/assets/download?filename=checker.png",
          },
          {
            model: { entityId: "mock-flag-2" },
            name: "Blue Flag",
            type: "image",
            url: "/api/assets/download?filename=blue.png",
          },
          {
            model: { entityId: "mock-flag-3" },
            name: "Yellow Flag",
            type: "image",
            url: "/api/assets/download?filename=yellow.png",
          },
          {
            model: { entityId: "audioset1" },
            name: "Test Audio Set",
            type: "audio_set",
            size: "200 KB",
            audioEntries: [
              {
                name: "Entry 1",
                timeSeconds: 1,
                url: "/api/assets/download?filename=snd1.mp3",
              },
              {
                name: "Entry 2",
                timeSeconds: 2,
                url: "/api/assets/download?filename=snd2.mp3",
              },
            ],
          },
          {
            model: { entityId: "rotation1" },
            name: "4-Lane Rotation",
            type: "custom_rotation",
            size: "10 KB",
            numLanes: 4,
            customRotations: [
              {
                numDrivers: 4,
                heats: [
                  { driverIndices: [0, 1, 2, 3] },
                  { driverIndices: [1, 2, 3, 0] },
                ],
              },
            ],
          },
        ];

        const response = ListAssetsResponse.create({ assets });
        const buffer = ListAssetsResponse.encode(response).finish();

        await route.fulfill({
          status: 200,
          contentType: "application/octet-stream",
          body: Buffer.from(buffer),
        });
      },
    );

    // Mock Asset Download API
    await page.route(
      (url) =>
        url.pathname.includes("/api/assets/download") ||
        url.pathname.endsWith("/api/assets/download"),
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "image/svg+xml",
          body: mockImage,
        });
      },
    );

    // Mock Custom Rotation Save API
    await page.route("**/api/assets/save-custom-rotation", async (route) => {
      const response = SaveCustomRotationResponse.create({
        success: true,
        asset: {
          model: { entityId: "mock-new-rotation-id" },
          name: "New Custom Rotation 1",
          type: "custom_rotation",
          numLanes: 4,
          customRotations: [],
        },
      });
      const buffer = SaveCustomRotationResponse.encode(response).finish();
      await route.fulfill({
        status: 200,
        contentType: "application/octet-stream",
        body: Buffer.from(buffer),
      });
    });
  }

  /**
   * Universal WebSocket mock to avoid ERR_CONNECTION_REFUSED and watchdog timeouts.
   */
  static async setupWebSocketMock(page: Page) {
    await page.addInitScript(() => {
      // General testing disables the watchdog to prevent unstable timeouts. Tests that need it will override it.
      if (typeof (window as any).WATCHDOG_TIMEOUT === "undefined") {
        (window as any).WATCHDOG_TIMEOUT = 99999999;
      }

      window.allMockSockets = [];
      window.MockWebSocket = class extends EventTarget {
        url: string;
        readyState: number;
        protocol: string = "";
        extensions: string = "";
        binaryType: BinaryType = "blob";
        bufferedAmount = 0;
        onopen: any = null;
        onmessage: any = null;
        onclose: any = null;
        onerror: any = null;
        private heartbeatInterval: any;

        constructor(url: string) {
          super();
          this.url = url;
          this.readyState = 0; // CONNECTING
          window.allMockSockets?.push(this);

          setTimeout(() => {
            this.readyState = 1; // OPEN
            window.mockSocket = this;
            const openEvent = new Event("open");
            this.dispatchEvent(openEvent);
            if (this.onopen) this.onopen(openEvent);

            if (url.includes("interface-data")) {
              console.log(
                `MockWebSocket: Detected interface-data socket. heartbeatDisabled=${!!(window as any).disableMockHeartbeat}`,
              );

              // status 0 = CONNECTED. InterfaceEvent (Tag 3, Len 2) -> InterfaceStatusEvent (Tag 1, Val 0)
              // Bytes: 1A 02 08 00
              const connectedBuffer = new Uint8Array([0x1a, 0x02, 0x08, 0x00])
                .buffer;
              const sendHeartbeat = () => {
                try {
                  const event = new MessageEvent("message", {
                    data: connectedBuffer,
                  });
                  this.dispatchEvent(event);
                  if (this.onmessage) this.onmessage(event);
                  console.debug(
                    "MockWebSocket: Sent CONNECTED heartbeat (RAW)",
                  );
                } catch (e) {
                  console.error("Error sending mock interface heartbeat", e);
                }
              };

              // Initial heartbeat if not disabled
              setTimeout(() => {
                // @ts-ignore
                if (!window.disableMockHeartbeat) {
                  console.log("MockWebSocket: Sending initial pulse");
                  sendHeartbeat();
                } else {
                  console.log("MockWebSocket: Initial pulse suppressed");
                }
              }, 500);

              // Periodic heartbeat if not disabled
              // @ts-ignore
              if (!window.disableMockHeartbeat) {
                // Heartbeat disabled: we rely on WATCHDOG_TIMEOUT scaling instead to avoid breaking Playwright's auto-waiting stability checks with an active running setInterval
                console.log(
                  "MockWebSocket: Periodic heartbeat disabled by test framework to prevent auto-waiting flakes.",
                );
              }
            }

            // Initial race data if available
            if (url.includes("race-data") && window.mockRaceDataBuffer) {
              const event = new MessageEvent("message", {
                data: window.mockRaceDataBuffer,
              });
              this.dispatchEvent(event);
              if (this.onmessage) this.onmessage(event);
            }
          }, 100);
        }

        send(data: any) {
          console.debug(`MockWebSocket: send called with ${data.length} bytes`);
        }
        close() {
          if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        }

        static get CONNECTING() {
          return 0;
        }
        static get OPEN() {
          return 1;
        }
        static get CLOSING() {
          return 2;
        }
        static get CLOSED() {
          return 3;
        }
      };

      // @ts-ignore
      window.WebSocket = window.MockWebSocket;
    });
  }

  static async setupRaceRestMocks(page: Page) {
    let currentRaces = [...MOCK_RACES];

    await page.route("**/api/races", async (route) => {
      const method = route.request().method();
      if (method === "POST") {
        const postData = route.request().postDataJSON();
        const newRace = { ...postData, entity_id: `r-${Date.now()}` };
        currentRaces.push(newRace);
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(newRace),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(currentRaces),
        });
      }
    });

    await page.route("**/api/races/*", async (route) => {
      const method = route.request().method();
      const url = route.request().url();
      const id = url.split("/").pop()?.split("?")[0];

      if (method === "PUT") {
        const postData = route.request().postDataJSON();
        const index = currentRaces.findIndex((r) => r.entity_id === id);
        if (index !== -1) {
          currentRaces[index] = { ...currentRaces[index], ...postData };
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(postData),
        });
      } else if (method === "DELETE") {
        currentRaces = currentRaces.filter((r) => r.entity_id !== id);
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
      } else if (method === "GET") {
        const found = currentRaces.find((r) => r.entity_id === id);
        if (found) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(found),
          });
        } else {
          await route.fulfill({
            status: 404,
            contentType: "application/json",
            body: JSON.stringify({ error: "Race not found" }),
          });
        }
      } else {
        await route.continue();
      }
    });

    // Mock heats modification endpoints
    await page.route("**/api/modify-heats", async (route) => {
      console.log("Mocking **/api/modify-heats");
      // Return a successful ModifyHeatsResponse (success: true)
      // Tag 1 (success) = true (1) -> 08 01
      const buffer = new Uint8Array([0x08, 0x01]);
      await route.fulfill({
        status: 200,
        contentType: "application/octet-stream",
        body: Buffer.from(buffer),
      });
    });

    await page.route("**/api/regenerate-heats", async (route) => {
      console.log("Mocking **/api/regenerate-heats");
      // Return a successful RegenerateHeatsResponse (success: true)
      // Tag 1 (success) = true (1) -> 08 01
      const buffer = new Uint8Array([0x08, 0x01]);
      await route.fulfill({
        status: 200,
        contentType: "application/octet-stream",
        body: Buffer.from(buffer),
      });
    });

    await page.route("**/api/heats/preview", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ heats: [] }),
      });
    });
  }

  static async setupRaceWebSocketMocks(page: Page) {
    const raceData = RaceData.create({
      race: {
        // IRace
        race: {
          // IRaceModel
          model: { entityId: "r1" },
          name: "Mock GP",
          track: {
            // ITrackModel
            model: { entityId: "t1" },
            name: "Test Track",
            lanes: [
              {
                objectId: "l1",
                length: 10,
                backgroundColor: "#550000",
                foregroundColor: "#ffffff",
              },
              {
                objectId: "l2",
                length: 10,
                backgroundColor: "#005500",
                foregroundColor: "#ffffff",
              },
            ],
          },
          fuelOptions: {
            enabled: true,
            capacity: 100,
            usageType: 0, // Per lap
            usageRate: 1.0,
            startLevel: 100,
          },
        },
        currentHeat: {
          heatNumber: 1,
          heatDrivers: [
            {
              objectId: "hd1",
              driver: {
                objectId: "rp1",
                fuelLevel: 75.5,
                driver: {
                  model: { entityId: "d1" },
                  name: "Driver 1",
                  avatarUrl: "/api/assets/download?filename=img1.png",
                },
              },
            },
            {
              objectId: "hd2",
              driver: {
                objectId: "rp2",
                fuelLevel: 42.0,
                driver: {
                  model: { entityId: "d2" },
                  name: "Driver 2",
                  avatarUrl: "/api/assets/download?filename=img1.png",
                },
              },
            },
          ],
        },
        heats: [{ heatNumber: 1 }, { heatNumber: 2 }],
      },
    });

    const buffer = RaceData.encode(raceData).finish();
    const dataArray = Array.from(buffer);

    await page.addInitScript((data) => {
      window.mockRaceDataBuffer = new Uint8Array(data as number[]).buffer;
      // Also broadcast it to any already open sockets
      if (window.allMockSockets) {
        const raceSockets = window.allMockSockets.filter((s: any) =>
          s.url.includes("race-data"),
        );
        raceSockets.forEach((s: any) => {
          const event = new MessageEvent("message", {
            data: window.mockRaceDataBuffer,
          });
          s.dispatchEvent(event);
          if (s.onmessage) s.onmessage(event);
        });
      }
    }, dataArray);
  }

  static async mockRaceData(page: Page, data: any) {
    const buffer = RaceData.encode(data).finish();
    const dataArray = Array.from(buffer);
    await page.evaluate((bufferArray) => {
      const buffer = new Uint8Array(bufferArray as number[]).buffer;
      // Broadcast to mock sockets
      // @ts-ignore
      if (window.allMockSockets) {
        // @ts-ignore
        const raceSockets = window.allMockSockets.filter((s: any) =>
          s.url.includes("race-data"),
        );
        raceSockets.forEach((s: any) => {
          const event = new MessageEvent("message", { data: buffer });
          s.dispatchEvent(event);
          if (s.onmessage) s.onmessage(event);
        });
      }
    }, dataArray);
  }

  static async sendRaceState(page: Page, raceState: RaceState) {
    const raceData = { raceState };
    const buffer = RaceData.encode(raceData).finish();
    const dataArray = Array.from(buffer);
    await page.evaluate((bufferArray) => {
      const buffer = new Uint8Array(bufferArray as number[]).buffer;
      // @ts-ignore
      if (window.allMockSockets) {
        // @ts-ignore
        const raceSockets = window.allMockSockets.filter((s: any) =>
          s.url.includes("race-data"),
        );
        raceSockets.forEach((s: any) => {
          const event = new MessageEvent("message", { data: buffer });
          s.dispatchEvent(event);
          if (s.onmessage) s.onmessage(event);
        });
      }
    }, dataArray);
  }

  static async sendRaceTime(page: Page, raceTime: IRaceTime) {
    const raceData = { raceTime };
    const buffer = RaceData.encode(raceData).finish();
    const dataArray = Array.from(buffer);
    await page.evaluate((bufferArray) => {
      const buffer = new Uint8Array(bufferArray as number[]).buffer;
      // @ts-ignore
      if (window.allMockSockets) {
        // @ts-ignore
        const raceSockets = window.allMockSockets.filter((s: any) =>
          s.url.includes("race-data"),
        );
        raceSockets.forEach((s: any) => {
          const event = new MessageEvent("message", { data: buffer });
          s.dispatchEvent(event);
          if (s.onmessage) s.onmessage(event);
        });
      }
    }, dataArray);
  }

  static async setupLocalStorage(
    page: Page,
    settings: {
      recentRaceIds?: string[];
      selectedDriverIds?: string[];
      racedaySetupWalkthroughSeen?: boolean;
      shareAnalytics?: boolean;
      language?: string;
    } = {},
  ) {
    await page.addInitScript((s) => {
      const defaultSettings = {
        recentRaceIds: ["r1", "r2"],
        selectedDriverIds: ["d1", "d2"],
        racedaySetupWalkthroughSeen: false,
        language: "",
      };
      // @ts-ignore
      window.localStorage.setItem(
        "racecoordinator_settings",
        JSON.stringify({ ...defaultSettings, ...s }),
      );
    }, settings);
  }

  static async setupSessionStorage(
    page: Page,
    settings: Record<string, string> = {},
  ) {
    await page.addInitScript((s) => {
      for (const [key, value] of Object.entries(s)) {
        window.sessionStorage.setItem(key, value);
      }
    }, settings);
  }
  static async setupThemeMocks(page: Page) {
    await page.route("**/api/themes", async (route) => {
      const themes = [
        {
          entity_id: "t-default",
          name: "Default Theme",
          is_default: true,
          slots: {
            "flag.green": "1",
            "flag.red": "1",
            "flag.yellow": "1",
            "flag.white": "1",
            "flag.checkered": "1",
            "flag.black": "1",
            "lamp.red.on": "1",
            "lamp.red.dim": "1",
            "lamp.green": "1",
            "gauge.fuel": "1",
          },
        },
        {
          entity_id: "t-custom",
          name: "Custom Theme",
          is_default: false,
          slots: {
            "flag.green": "1",
            "flag.red": "1",
            "flag.yellow": "1",
            "flag.white": "1",
            "flag.checkered": "1",
            "flag.black": "1",
            "lamp.red.on": "1",
            "lamp.red.dim": "1",
            "lamp.green": "1",
            "gauge.fuel": "1",
          },
        },
      ];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(themes),
      });
    });
  }

  static async setupFileSystemMock(
    page: Page,
    customFiles: Record<string, string>,
  ) {
    await page.addInitScript((files) => {
      // Helper to create a file handle
      const createMockFileHandle = (name: string, content: string) => ({
        kind: "file",
        name: name,
        getFile: async () => ({
          text: async () => content,
          size: content.length,
        }),
        createWritable: async () => ({
          seek: async () => {},
          write: async (newContent: string) => {
            files[name] += newContent;
          },
          close: async () => {},
        }),
      });

      // Mock Directory Handle
      const mockDirectoryHandle = {
        kind: "directory",
        name: "mock-custom-dir",
        queryPermission: async () => "granted",
        requestPermission: async () => "granted",
        getFileHandle: async (name: string, options?: { create?: boolean }) => {
          if (files[name]) {
            return createMockFileHandle(name, files[name]);
          }
          if (options?.create) {
            files[name] = ""; // Create empty file
            return createMockFileHandle(name, files[name]);
          }
          throw new Error("File not found: " + name);
        },
      };

      // Mock IndexedDB Structure
      const mockStore = {
        get: (key: string) => {
          const request: any = { result: null, onsuccess: null, onerror: null };
          setTimeout(() => {
            if (key === "raceday-setup-dir") {
              request.result = mockDirectoryHandle;
            }
            if (request.onsuccess) request.onsuccess({ target: request });
          }, 10);
          return request;
        },
        put: () => ({ onsuccess: null, onerror: null }), // No-op for put
        delete: () => ({ onsuccess: null, onerror: null }), // No-op for delete
      };

      const mockTransaction = {
        objectStore: (_name: string) => mockStore,
      };

      const mockDB = {
        objectStoreNames: { contains: () => true },
        createObjectStore: () => mockStore,
        transaction: (_stores: any, _mode: any) => mockTransaction,
      };

      const mockOpenRequest: any = {
        result: mockDB,
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
      };

      // Override window.indexedDB
      try {
        Object.defineProperty(window, "indexedDB", {
          value: {
            open: (_name: string, _version: number) => {
              setTimeout(() => {
                if (mockOpenRequest.onsuccess) {
                  mockOpenRequest.onsuccess({ target: mockOpenRequest });
                }
              }, 10);
              return mockOpenRequest;
            },
          },
          writable: true,
        });
      } catch (e) {
        // Fallback
        (window as any).indexedDB = {
          open: (_name: string, _version: number) => {
            setTimeout(() => {
              if (mockOpenRequest.onsuccess) {
                mockOpenRequest.onsuccess({ target: mockOpenRequest });
              }
            }, 10);
            return mockOpenRequest;
          },
        };
      }
    }, customFiles);
  }

  /**
   * Mock Settings using localStorage.
   * Raceday component reads settings directly from localStorage via SettingsService.
   */
  static async setupSettings(page: Page, settings: any) {
    await page.addInitScript((s) => {
      localStorage.setItem("racecoordinator_settings", JSON.stringify(s));
    }, settings);
  }

  static async disableAnimations(page: Page) {
    const css = `
      *, *::before, *::after {
        transition: none !important;
        animation: none !important;
        transition-duration: 0s !important;
        animation-duration: 0s !important;
        scroll-behavior: auto !important;
        caret-color: transparent !important;
        clip-path: none !important;
        backdrop-filter: none !important;
      }
    `;

    // Persist across navigation
    await page.addInitScript((styleContent) => {
      const injectStyle = () => {
        if (document.getElementById("playwright-disable-animations")) return;
        const style = document.createElement("style");
        style.id = "playwright-disable-animations";
        style.textContent = styleContent;
        document.head.appendChild(style);
      };
      if (document.head) {
        injectStyle();
      } else {
        document.addEventListener("DOMContentLoaded", injectStyle);
      }

      // Also inject periodically just in case Angular or something rewrites head
      const observer = new MutationObserver(() => {
        if (
          document.head &&
          !document.getElementById("playwright-disable-animations")
        ) {
          injectStyle();
        }
      });
      observer.observe(document, { childList: true, subtree: true });
    }, css);

    // Apply immediately to current execution context to be safe
    await page.addStyleTag({ content: css }).catch(() => {});
  }

  static async setupManyTracksMock(page: Page) {
    await page.route("**/api/tracks", async (route) => {
      const tracks = [];
      for (let i = 1; i <= 20; i++) {
        let name = `Track ${i}`;
        if (i === 5) {
          name =
            "Extremely Long Track Name That Should Definitely Be Truncated In Both The Sidebar And The Summary Title To Prevent Layout Issues";
        }
        tracks.push({
          entity_id: `t${i}`,
          name: name,
          lanes: [
            {
              entity_id: `l${i}_1`,
              length: 10,
              backgroundColor: "#ff0000",
              foregroundColor: "#ffffff",
            },
            {
              entity_id: `l${i}_2`,
              length: 10,
              backgroundColor: "#0000ff",
              foregroundColor: "#ffffff",
            },
          ],
          arduino_configs: [
            {
              name: `Arduino ${i}`,
              commPort: `COM${i}`,
              baudRate: 115200,
              debounceUs: 5000,
              hardwareType: 1,
              digitalIds: [1001, 1002],
              analogIds: [-1, -1],
              normallyClosedLaneSensors: false,
              normallyClosedRelays: true,
              globalInvertLights: 0,
              useLapsForPits: 0,
              useLapsForPitEnd: 0,
              usePitsAsLaps: false,
              useLapsForSegments: true,
              ledStrings: null,
              ledLaneColorOverrides: null,
              lapPinPitBehavior: 3,
            },
          ],
        });
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(tracks),
      });
    });
  }
}
