import { Locator, Page } from "@playwright/test";
import { Settings } from "@app/models/settings";
import {
  GetPhidgetDevicesResponse,
  InitializeInterfaceResponse,
  IRaceTime,
  ListAssetsResponse,
  RaceData,
  RaceFlag,
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
  uiEditorHelpShown?: boolean;
  recentRaceIds?: string[];
  selectedDriverIds?: string[];
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
        text.includes("MockWebSocket") ||
        text.includes("RACE_FLAG_DEBUG")
      ) {
        console.log(`BROWSER [${type.toUpperCase()}]: ${text}`);
      }
    });

    page.on("pageerror", (err) =>
      console.error(`BROWSER ERROR: ${err.message}`),
    );

    page.on("requestfailed", (request) => {
      console.log(
        `BROWSER [REQUEST_FAILED]: ${request.url()} failed with: ${request.failure()?.errorText}`,
      );
    });

    // Mock WebSockets by default to avoid connection refused/watchdog issues
    await this.setupWebSocketMock(page);

    // Mock Localization
    await this.setupLocalizationMocks(page);

    // Mock specialized APIs
    await this.setupDriverMocks(page);
    await this.setupRaceRestMocks(page);
    await this.setupTrackMocks(page);
    await this.setupTeamMocks(page);
    await this.setupEventMocks(page);
    await this.setupSeasonMocks(page);
    await this.setupAssetMocks(page);
    await this.setupThemeMocks(page);
    await page.route("**/api/custom-ui", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });
    await page.route("**/api/custom-ui/*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

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
      uiEditorHelpShown: options.uiEditorHelpShown ?? true,
      recentRaceIds: options.recentRaceIds ?? ["r1", "r2"],
      selectedDriverIds: options.selectedDriverIds ?? ["d1", "d2"],

      racedayColumns: ["driver.name", "lapCount"],

      columnLayouts: {
        "driver.name": { CenterCenter: "driver.name" },
        lapCount: { CenterCenter: "lapCount" },
      },
      columnAnchors: {
        "driver.name": "Center",
        lapCount: "Center",
      },
      columnWidths: {},
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

    const fs = require("fs");
    const path = require("path");

    // Helper to find the fonts directory in both source and isolated test runner path
    const getFontFilePath = (filename: string) => {
      const paths = [
        path.resolve(process.cwd(), "src/app/testing/fonts", filename),
        path.resolve(process.cwd(), "client/src/app/testing/fonts", filename),
        path.resolve(__dirname, "fonts", filename),
      ];
      for (const p of paths) {
        if (fs.existsSync(p)) return p;
      }
      return "";
    };

    // Serve local Material Icons font file from testing/fonts directory
    await page.route("**/s/materialicons/**/*.woff2", async (route) => {
      const filePath = getFontFilePath("materialicons.woff2");
      if (filePath) {
        await route.fulfill({
          status: 200,
          contentType: "font/woff2",
          body: fs.readFileSync(filePath),
        });
      } else {
        await route.continue();
      }
    });

    // Serve local Rajdhani font files from testing/fonts directory
    await page.route("**/s/rajdhani/**/*.woff2", async (route) => {
      const url = route.request().url();
      let filename = "rajdhani-500.woff2";
      if (url.includes("L0x5DFM4tM2s7KCDQIm32C5yXg")) {
        filename = "rajdhani-300.woff2";
      } else if (url.includes("L0x5DFM4tM2s7KCDQIm3Bx5yXg")) {
        filename = "rajdhani-700.woff2";
      }
      const filePath = getFontFilePath(filename);
      if (filePath) {
        await route.fulfill({
          status: 200,
          contentType: "font/woff2",
          body: fs.readFileSync(filePath),
        });
      } else {
        await route.continue();
      }
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

  static async setupEventMocks(page: Page) {
    let currentEvents: any[] = [
      {
        entity_id: "evt_1",
        name: "Grand Prix Event",
        description: "Standard grand prix event",
        auto_advance_time: 5,
        races: [{ raceId: "r1", maxDrivers: 0 }],
      },
    ];

    await page.route("**/api/events", async (route) => {
      const method = route.request().method();
      if (method === "POST") {
        const postData = route.request().postDataJSON();
        const newEvent = { ...postData, entity_id: `evt-${Date.now()}` };
        currentEvents.push(newEvent);
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(newEvent),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(currentEvents),
        });
      }
    });

    await page.route("**/api/events/*", async (route) => {
      const method = route.request().method();
      const url = route.request().url();
      const id = url.split("/").pop();

      if (method === "PUT") {
        const postData = route.request().postDataJSON();
        const index = currentEvents.findIndex((e) => e.entity_id === id);
        if (index !== -1) {
          currentEvents[index] = { ...currentEvents[index], ...postData };
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(postData),
        });
      } else if (method === "DELETE") {
        currentEvents = currentEvents.filter((e) => e.entity_id !== id);
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
      } else if (method === "GET") {
        const found = currentEvents.find((e) => e.entity_id === id);
        if (found) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(found),
          });
        } else {
          await route.fulfill({ status: 404 });
        }
      } else {
        await route.continue();
      }
    });
  }

  static async setupSeasonMocks(page: Page) {
    const mockSeasons = [
      {
        entity_id: "s_empty",
        name: "2026 Empty Championship",
        drops: 0,
        races: [],
      },
      {
        entity_id: "s_active",
        name: "2026 Pro GT Championship",
        drops: 1,
        races: [
          {
            race_id: "r_demo1",
            race_name: "Grand Prix Practice (Demo)",
            timestamp: 1700000000000,
            is_demo: true,
            driver_results: [
              {
                driver_id: "d1",
                driver_name: "Alice",
                overall_rank: 1,
                overall_points: 25,
                heat_points: 10,
                total_points: 35,
              },
              {
                driver_id: "d2",
                driver_name: "Bob",
                overall_rank: 2,
                overall_points: 18,
                heat_points: 8,
                total_points: 26,
              },
              {
                driver_id: "d3",
                driver_name: "Charlie",
                overall_rank: 3,
                overall_points: 15,
                heat_points: 6,
                total_points: 21,
              },
            ],
          },
          {
            race_id: "r_official1",
            race_name: "Daytona 500 Championship",
            timestamp: 1700003600000,
            is_demo: false,
            driver_results: [
              {
                driver_id: "d2",
                driver_name: "Bob",
                overall_rank: 1,
                overall_points: 25,
                heat_points: 12,
                total_points: 37,
              },
              {
                driver_id: "d1",
                driver_name: "Alice",
                overall_rank: 2,
                overall_points: 18,
                heat_points: 9,
                total_points: 27,
              },
              {
                driver_id: "d3",
                driver_name: "Charlie",
                overall_rank: 3,
                overall_points: 15,
                heat_points: 7,
                total_points: 22,
              },
            ],
          },
        ],
      },
    ];

    const mockFinishedRaceHistory = [
      {
        _id: "hist_demo1",
        original_entity_id: "r_demo1",
        timestamp: 1700000000000,
        is_demo: true,
        isDemo: true,
        model: { entity_id: "r_demo1", name: "Grand Prix Practice (Demo)" },
      },
      {
        _id: "hist_off1",
        original_entity_id: "r_official1",
        timestamp: 1700003600000,
        is_demo: false,
        isDemo: false,
        model: { entity_id: "r_official1", name: "Daytona 500 Championship" },
      },
      {
        _id: "hist_demo2",
        original_entity_id: "r_demo2",
        timestamp: 1700007200000,
        is_demo: true,
        isDemo: true,
        model: {
          entity_id: "r_demo2",
          name: "Monaco Simulation Sprint (Demo)",
        },
      },
      {
        _id: "hist_off2",
        original_entity_id: "r_official2",
        timestamp: 1700010800000,
        is_demo: false,
        isDemo: false,
        model: {
          entity_id: "r_official2",
          name: "Le Mans 24h Endurance Qualifier",
        },
      },
      {
        _id: "hist_demo3",
        original_entity_id: "r_demo3",
        timestamp: 1700014400000,
        is_demo: true,
        isDemo: true,
        model: {
          entity_id: "r_demo3",
          name: "Silverstone Test Session (Demo)",
        },
      },
      {
        _id: "hist_off3",
        original_entity_id: "r_official3",
        timestamp: 1700018000000,
        is_demo: false,
        isDemo: false,
        model: {
          entity_id: "r_official3",
          name: "Spa-Francorchamps Grand Prix",
        },
      },
      {
        _id: "hist_demo4",
        original_entity_id: "r_demo4",
        timestamp: 1700021600000,
        is_demo: true,
        isDemo: true,
        model: { entity_id: "r_demo4", name: "Nürburgring Time Trial (Demo)" },
      },
      {
        _id: "hist_off4",
        original_entity_id: "r_official4",
        timestamp: 1700025200000,
        is_demo: false,
        isDemo: false,
        model: {
          entity_id: "r_official4",
          name: "Indy 500 Championship Final",
        },
      },
      {
        _id: "hist_demo5",
        original_entity_id: "r_demo5",
        timestamp: 1700028800000,
        is_demo: true,
        isDemo: true,
        model: { entity_id: "r_demo5", name: "Suzuka Warmup Session (Demo)" },
      },
      {
        _id: "hist_off5",
        original_entity_id: "r_official5",
        timestamp: 1700032400000,
        is_demo: false,
        isDemo: false,
        model: { entity_id: "r_official5", name: "Interlagos Season Finale" },
      },
    ];

    await page.route("**/api/seasons", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockSeasons),
        });
      } else {
        await route.continue();
      }
    });

    await page.route("**/api/seasons/*", async (route) => {
      const url = route.request().url();
      const seasonId = url.split("/").pop()?.split("?")[0];
      const match =
        mockSeasons.find((s) => s.entity_id === seasonId) || mockSeasons[0];
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(match),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(match),
        });
      }
    });

    await page.route("**/api/history/races*", async (route) => {
      const isDemo = route.request().url().includes("demo=true");
      const filtered = mockFinishedRaceHistory.filter((r) =>
        isDemo ? r.is_demo : !r.is_demo,
      );
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          filtered.length > 0 ? filtered : mockFinishedRaceHistory,
        ),
      });
    });

    await page.route("**/api/race-history/finished", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockFinishedRaceHistory),
      });
    });

    await page.route("**/api/race-history", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockFinishedRaceHistory),
      });
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
    await page.route("**/*.png", async (route) => {
      const url = route.request().url();
      console.log(`DEBUG: Asset request hit: ${url}`);

      // Extract filename
      const match = url.match(/\/([^\/]+\.png)(\?.*)?$/);
      if (!match) {
        console.warn(`DEBUG: Asset URL did not match regex: ${url}`);
        return route.continue();
      }

      let filename = match[1];

      // Strip Vite asset hash if present (e.g., splash_screen.a2761eff2852baea.png -> splash_screen.png)
      const hashMatch = filename.match(/^(.*?)\.[0-9a-f]{8,20}\.png$/i);
      if (hashMatch) {
        filename = hashMatch[1] + ".png";
      }

      // Try multiple potential base paths
      const potentialPaths = [
        path.resolve(process.cwd(), "client/src/assets/images/defaults"),
        path.resolve(process.cwd(), "src/assets/images/defaults"),
        path.resolve(process.cwd(), "assets/images/defaults"),
        path.resolve(process.cwd(), "client/src/assets/images"),
        path.resolve(process.cwd(), "src/assets/images"),
        path.resolve(process.cwd(), "assets/images"),
        path.resolve(process.cwd(), "client/src/assets"),
        path.resolve(process.cwd(), "src/assets"),
        path.resolve(process.cwd(), "assets"),
        path.resolve(process.cwd(), "server/src/main/resources/defaults"),
        path.resolve(process.cwd(), "../server/src/main/resources/defaults"),
        path.resolve(process.cwd(), "src/main/resources/defaults"),
      ];

      let filePath = "";
      for (const basePath of potentialPaths) {
        const testPath = path.join(basePath, filename);
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

    // Wait a brief moment to ensure all synchronous image mocks and CSS have painted
    await page.waitForTimeout(500);

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

  static async waitForImagesLoaded(target: Locator | Page) {
    await (target as any).evaluate((node: HTMLElement | Document) => {
      const root = node instanceof Document ? node.body : (node as HTMLElement);
      const images = Array.from(root.querySelectorAll("img"));
      return Promise.all(
        images.map((img) => {
          if (img.complete && img.naturalWidth > 0) return Promise.resolve();
          return new Promise<void>((resolve) => {
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
            setTimeout(resolve, 1000);
          });
        }),
      );
    });
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

    await page.route("**/api/phidgets", async (route) => {
      const resp = GetPhidgetDevicesResponse.create({
        devices: [
          {
            name: "Phidget 8/8/8",
            serialNumber: 12345,
            isHubPort: false,
            hubPort: 0,
            digitalInputCount: 8,
            digitalOutputCount: 8,
            analogInputCount: 8,
          },
        ],
      });
      const buffer = GetPhidgetDevicesResponse.encode(resp).finish();
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
    const fs = require("fs");
    const path = require("path");

    const defaultAssets = [
      {
        model: { entityId: "default_flag_green" },
        name: "Green Flag",
        type: "image",
        size: "28 KB",
        url: "/api/assets/download?filename=flag_green.png",
        filename: "flag_green.png",
      },
      {
        model: { entityId: "default_flag_red" },
        name: "Red Flag",
        type: "image",
        size: "28 KB",
        url: "/api/assets/download?filename=flag_red.png",
        filename: "flag_red.png",
      },
      {
        model: { entityId: "default_flag_yellow" },
        name: "Yellow Flag",
        type: "image",
        size: "30 KB",
        url: "/api/assets/download?filename=flag_yellow.png",
        filename: "flag_yellow.png",
      },
      {
        model: { entityId: "default_flag_green_yellow" },
        name: "Yellow Green Flag",
        type: "image",
        size: "24 KB",
        url: "/api/assets/download?filename=flag_green_yellow.png",
        filename: "flag_green_yellow.png",
      },
      {
        model: { entityId: "default_flag_black" },
        name: "Black Flag",
        type: "image",
        size: "27 KB",
        url: "/api/assets/download?filename=flag_black.png",
        filename: "flag_black.png",
      },
      {
        model: { entityId: "default_flag_white" },
        name: "White Flag",
        type: "image",
        size: "24 KB",
        url: "/api/assets/download?filename=flag_white.png",
        filename: "flag_white.png",
      },
      {
        model: { entityId: "default_flag_checkered" },
        name: "Checkered Flag",
        type: "image",
        size: "28 KB",
        url: "/api/assets/download?filename=flag_checkered.png",
        filename: "flag_checkered.png",
      },
      {
        model: { entityId: "default_start_red_on" },
        name: "Start Lamp Red",
        type: "image",
        size: "27 KB",
        url: "assets/images/start_red_on.png",
        filename: "start_red_on.png",
      },
      {
        model: { entityId: "default_start_red_dim" },
        name: "Start Lamp Dim",
        type: "image",
        size: "26 KB",
        url: "assets/images/start_red_dim.png",
        filename: "start_red_dim.png",
      },
      {
        model: { entityId: "default_start_green" },
        name: "Start Lamp Green",
        type: "image",
        size: "28 KB",
        url: "assets/images/start_green.png",
        filename: "start_green.png",
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
            url: "/api/assets/download?filename=fuel_0.png",
            name: "fuel_0.png",
          },
          {
            percentage: 50,
            url: "/api/assets/download?filename=fuel_50.png",
            name: "fuel_50.png",
          },
          {
            percentage: 100,
            url: "/api/assets/download?filename=fuel_100.png",
            name: "fuel_100.png",
          },
        ],
      },
      {
        model: { entityId: "1" },
        name: "Test Image 1 with a very long name that should wrap to two lines",
        type: "image",
        size: "150 KB",
        url: "/api/assets/download?filename=img1.png",
        filename: "img1.png",
      },
      {
        model: { entityId: "2" },
        name: "Test Sound 1",
        type: "audio",
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
        model: { entityId: "mock-flag-1" },
        name: "Checker Flag",
        type: "image",
        url: "/api/assets/download?filename=flag_checkered.png",
        filename: "flag_checkered.png",
      },
      {
        model: { entityId: "mock-flag-2" },
        name: "Blue Flag",
        type: "image",
        url: "/api/assets/download?filename=blue.png",
        filename: "blue.png",
      },
      {
        model: { entityId: "mock-flag-3" },
        name: "Yellow Flag",
        type: "image",
        url: "/api/assets/download?filename=flag_yellow.png",
        filename: "flag_yellow.png",
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

    const idToFilenameMap: Record<string, string> = {
      default_flag_green: "flag_green.png",
      default_flag_red: "flag_red.png",
      default_flag_yellow: "flag_yellow.png",
      default_flag_green_yellow: "flag_green_yellow.png",
      default_flag_black: "flag_black.png",
      default_flag_white: "flag_white.png",
      default_flag_checkered: "flag_checkered.png",
      default_start_red_on: "start_red_on.png",
      default_start_red_dim: "start_red_dim.png",
      default_start_green: "start_green.png",
      "fuel-0.png": "fuel_0.png",
      "fuel-50.png": "fuel_50.png",
      "fuel-100.png": "fuel_100.png",
    };

    const findAssetFile = (rawNameOrId: string) => {
      if (!rawNameOrId) return null;
      let target = idToFilenameMap[rawNameOrId] || rawNameOrId;

      const matchedAsset = defaultAssets.find(
        (a) => a.model?.entityId === rawNameOrId || a.filename === rawNameOrId,
      );
      if (matchedAsset && matchedAsset.filename) {
        target =
          idToFilenameMap[matchedAsset.filename] || matchedAsset.filename;
      }

      const baseName = path.basename(target);
      const potentialDirs = [
        path.resolve(process.cwd(), "client/src/assets/images/defaults"),
        path.resolve(process.cwd(), "src/assets/images/defaults"),
        path.resolve(process.cwd(), "assets/images/defaults"),
        path.resolve(process.cwd(), "client/src/assets/images"),
        path.resolve(process.cwd(), "src/assets/images"),
        path.resolve(process.cwd(), "assets/images"),
        path.resolve(process.cwd(), "server/src/main/resources/defaults"),
        path.resolve(process.cwd(), "../server/src/main/resources/defaults"),
        path.resolve(process.cwd(), "src/main/resources/defaults"),
        path.resolve(process.cwd(), "client/src/assets"),
        path.resolve(process.cwd(), "src/assets"),
        path.resolve(process.cwd(), "assets"),
      ];

      for (const dir of potentialDirs) {
        const testPath = path.join(dir, baseName);
        if (fs.existsSync(testPath) && fs.statSync(testPath).isFile()) {
          return testPath;
        }
      }
      return null;
    };

    const generateFallbackSvg = (nameOrId: string) => {
      const lower = (nameOrId || "").toLowerCase();
      let fill = "#3f51b5";
      let text = "CUSTOM IMAGE";
      let textColor = "white";

      if (
        lower.includes("green_yellow") ||
        lower.includes("yellow_green") ||
        lower.includes("green-yellow")
      ) {
        fill = "#8bc34a";
        text = "GREEN/YELLOW";
      } else if (lower.includes("green")) {
        fill = "#2e7d32";
        text = "GREEN";
      } else if (lower.includes("yellow")) {
        fill = "#fbc02d";
        text = "YELLOW";
        textColor = "#111827";
      } else if (lower.includes("red")) {
        fill = "#c62828";
        text = "RED";
      } else if (lower.includes("white")) {
        fill = "#f5f5f5";
        text = "WHITE";
        textColor = "#111827";
      } else if (lower.includes("black")) {
        fill = "#212121";
        text = "BLACK";
      } else if (lower.includes("checkered") || lower.includes("checker")) {
        return `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="checkers" width="20" height="20" patternUnits="userSpaceOnUse">
              <rect width="10" height="10" fill="#000000" />
              <rect x="10" width="10" height="10" fill="#ffffff" />
              <rect y="10" width="10" height="10" fill="#ffffff" />
              <rect x="10" y="10" width="10" height="10" fill="#000000" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#checkers)" />
        </svg>`.trim();
      }

      return `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="${fill}" />
        <text x="50" y="50" font-family="Arial" font-size="14" font-weight="bold" text-anchor="middle" fill="${textColor}" dominant-baseline="middle">${text}</text>
      </svg>`.trim();
    };

    await page.route(
      (url) =>
        url.pathname.endsWith("/api/assets/list") ||
        url.pathname.includes("/api/assets/list"),
      async (route) => {
        const response = ListAssetsResponse.create({ assets: defaultAssets });
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
        const urlStr = route.request().url();
        let nameOrId = "";
        try {
          const parsed = new URL(urlStr);
          nameOrId = parsed.searchParams.get("filename") || "";
          if (!nameOrId) {
            const match = parsed.pathname.match(
              /\/api\/assets\/download\/(.+)$/,
            );
            if (match) {
              nameOrId = match[1];
            }
          }
        } catch (e) {
          // fallback
        }

        const filePath = findAssetFile(nameOrId);
        if (filePath) {
          const isSvg = filePath.endsWith(".svg");
          const isJpg = filePath.endsWith(".jpg") || filePath.endsWith(".jpeg");
          const isPng = filePath.endsWith(".png");
          const contentType = isSvg
            ? "image/svg+xml"
            : isJpg
              ? "image/jpeg"
              : isPng
                ? "image/png"
                : "application/octet-stream";
          await route.fulfill({
            status: 200,
            contentType,
            body: fs.readFileSync(filePath),
          });
          return;
        }

        await route.fulfill({
          status: 200,
          contentType: "image/svg+xml",
          body: generateFallbackSvg(nameOrId),
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
      if (typeof (window as any).INITIAL_WATCHDOG_TIMEOUT === "undefined") {
        (window as any).INITIAL_WATCHDOG_TIMEOUT = 99999999;
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
        private openTimeout: any;
        private initialHeartbeatTimeout: any;

        constructor(url: string) {
          super();
          this.url = url;
          this.readyState = 0; // CONNECTING
          window.allMockSockets?.push(this);

          this.openTimeout = setTimeout(() => {
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
              this.initialHeartbeatTimeout = setTimeout(() => {
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
          if (this.openTimeout) clearTimeout(this.openTimeout);
          if (this.initialHeartbeatTimeout)
            clearTimeout(this.initialHeartbeatTimeout);
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

    await page.route("**/api/saved-races*", async (route) => {
      const url = route.request().url();
      const isDemo = url.includes("demo=true");
      if (isDemo) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            { filename: "20260826-020000_Demo_Sprint.json", corrupt: false },
          ]),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            { filename: "20260826-005121_Super_Cup.json", corrupt: false },
            { filename: "20260826-011234_Night_Race.json", corrupt: false },
          ]),
        });
      }
    });

    await page.route("**/api/rename-saved-race", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: "Race save renamed successfully: My_New_Race.json",
      });
    });

    await page.route("**/api/save-race", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: "Race saved successfully: Custom_Save.json",
      });
    });

    await page.route("**/api/load-race", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: "Race loaded successfully",
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
          standings: ["hd1", "hd2"],
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
    // Inject missing ranks into mock drivers so that leaderboard and position visuals
    // work automatically (they rely on rank rather than pure array index now)
    if (data?.race?.drivers) {
      data.race.drivers.forEach((driver: any, index: number) => {
        // Don't inject rank for empty drivers (usually have empty entityId)
        const isEmptyDriver = driver?.driver?.model?.entityId === "";
        if (driver.rank === undefined && !isEmptyDriver) {
          driver.rank = index + 1;
        }
      });
    }

    const injectHeatStandings = (heat: any) => {
      if (!heat) return;
      if (heat.heatDrivers) {
        heat.heatDrivers.forEach((hd: any, index: number) => {
          if (!hd.objectId) {
            hd.objectId =
              hd.driver?.objectId ||
              hd.driver?.driver?.model?.entityId ||
              hd.driver?.model?.entityId ||
              hd.actualDriver?.model?.entityId ||
              `hd_${hd.laneIndex ?? index}`;
          }
        });
        if (!heat.standings || heat.standings.length === 0) {
          heat.standings = heat.heatDrivers
            .filter((hd: any) => {
              const isEmptyDriver =
                hd?.driver?.driver?.model?.entityId === "" ||
                hd?.driver?.model?.entityId === "" ||
                hd?.actualDriver?.model?.entityId === "" ||
                hd?.driver?.name === "Empty";
              return !isEmptyDriver && hd.objectId;
            })
            .map((hd: any) => hd.objectId);
        }
      }
      if (heat.standings) {
        heat.standings = heat.standings.filter(
          (s: any) => typeof s === "string" && s.length > 0,
        );
      }
    };

    if (data?.race?.currentHeat) {
      injectHeatStandings(data.race.currentHeat);
    }
    if (data?.race?.heats && Array.isArray(data.race.heats)) {
      data.race.heats.forEach((h: any) => injectHeatStandings(h));
    }
    if (data?.heat) {
      injectHeatStandings(data.heat);
    }

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

  static async sendRaceFlag(page: Page, raceFlag: RaceFlag) {
    const raceData = { flag: raceFlag };
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
  static async setupThemeMocks(page: Page, customThemesList?: any[]) {
    await page.route("**/api/themes", async (route) => {
      const themes = customThemesList ?? [
        {
          entity_id: "default_classic_rc_ai",
          name: "Classic Theme",
          is_default: true,
          uiId: "default_ui_layout_rc_ai",
          slots: {
            "flag.racing": "default_flag_green",
            "flag.heat_paused": "default_flag_yellow",
            "flag.heat_over": "default_flag_red",
            "flag.race_over": "default_flag_checkered",
            "flag.not_started": "default_flag_red",
            "flag.starting": "default_flag_red",
            "flag.restarting": "default_flag_yellow",
            "flag.one_lap_to_go": "default_flag_white",
            "flag.heat_finishing": "default_flag_checkered",
            "flag.warmup": "default_flag_green_yellow",
            "flag.driver_finished": "default_flag_red",
            "flag.penalty": "default_flag_black",
            "lamp.red.on": "default_start_red_on",
            "lamp.red.dim": "default_start_red_dim",
            "lamp.green": "default_start_green",
            "gauge.fuel": "fuel-gauge-builtin",
          },
          audio_slots: {},
        },
        {
          entity_id: "practice_theme_rc_ai",
          name: "Practice Theme",
          is_default: true,
          uiId: "practice_ui_layout_rc_ai",
          slots: {
            "flag.racing": "default_flag_green",
            "flag.heat_paused": "default_flag_yellow",
            "flag.heat_over": "default_flag_red",
            "flag.race_over": "default_flag_checkered",
            "flag.not_started": "default_flag_red",
            "flag.starting": "default_flag_red",
            "flag.restarting": "default_flag_yellow",
            "flag.one_lap_to_go": "default_flag_white",
            "flag.heat_finishing": "default_flag_checkered",
            "flag.warmup": "default_flag_green_yellow",
            "flag.driver_finished": "default_flag_red",
            "flag.penalty": "default_flag_black",
            "lamp.red.on": "default_start_red_on",
            "lamp.red.dim": "default_start_red_dim",
            "lamp.green": "default_start_green",
            "gauge.fuel": "fuel-gauge-builtin",
          },
          audio_slots: {},
        },
        {
          entity_id: "default_fuel_theme_rc_ai",
          name: "Fuel Theme",
          is_default: true,
          uiId: "default_fuel_ui_layout_rc_ai",
          slots: {
            "flag.racing": "default_flag_green",
            "flag.heat_paused": "default_flag_yellow",
            "flag.heat_over": "default_flag_red",
            "flag.race_over": "default_flag_checkered",
            "flag.not_started": "default_flag_red",
            "flag.starting": "default_flag_red",
            "flag.restarting": "default_flag_yellow",
            "flag.one_lap_to_go": "default_flag_white",
            "flag.heat_finishing": "default_flag_checkered",
            "flag.warmup": "default_flag_green_yellow",
            "flag.driver_finished": "default_flag_red",
            "flag.penalty": "default_flag_black",
            "lamp.red.on": "default_start_red_on",
            "lamp.red.dim": "default_start_red_dim",
            "lamp.green": "default_start_green",
            "gauge.fuel": "fuel-gauge-builtin",
          },
          audio_slots: {},
        },
        {
          entity_id: "custom_theme_1",
          name: "Custom Theme",
          is_default: false,
          uiId: "default_ui_layout_rc_ai",
          slots: {
            "flag.racing": "default_flag_green",
            "flag.heat_paused": "default_flag_yellow",
            "flag.heat_over": "default_flag_red",
            "flag.race_over": "default_flag_checkered",
            "flag.not_started": "default_flag_red",
            "flag.starting": "default_flag_red",
            "flag.restarting": "default_flag_yellow",
            "flag.one_lap_to_go": "default_flag_white",
            "flag.heat_finishing": "default_flag_checkered",
            "flag.warmup": "default_flag_green_yellow",
            "flag.driver_finished": "default_flag_red",
            "flag.penalty": "default_flag_black",
            "lamp.red.on": "default_start_red_on",
            "lamp.red.dim": "default_start_red_dim",
            "lamp.green": "default_start_green",
            "gauge.fuel": "fuel-gauge-builtin",
          },
          audio_slots: {},
        },
      ];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(themes),
      });
    });

    await page.route("**/api/themes/*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });
  }

  static async setupCustomUiMocks(page: Page, customUIsList?: any[]) {
    await page.route("**/api/custom-ui", async (route) => {
      const customUIs = customUIsList ?? [
        {
          entity_id: "default_ui_layout_rc_ai",
          name: "Default UI Layout",
          is_default: true,
          layoutJson: JSON.stringify(Settings.DEFAULT_LAYOUT),
          columnsJson: JSON.stringify(Settings.DEFAULT_COLUMNS),
        },
        {
          entity_id: "practice_ui_layout_rc_ai",
          name: "Practice UI Layout",
          is_default: true,
          layoutJson: JSON.stringify(Settings.DEFAULT_PRACTICE_LAYOUT),
          columnsJson: JSON.stringify(Settings.DEFAULT_PRACTICE_COLUMNS),
        },
        {
          entity_id: "default_fuel_ui_layout_rc_ai",
          name: "Fuel Race UI Layout",
          is_default: true,
          layoutJson: JSON.stringify(Settings.DEFAULT_LAYOUT),
          columnsJson: JSON.stringify(Settings.DEFAULT_COLUMNS),
        },
        {
          entity_id: "custom_ui_1",
          name: "Custom UI Layout",
          is_default: false,
          layoutJson: JSON.stringify(Settings.DEFAULT_LAYOUT),
          columnsJson: JSON.stringify(Settings.DEFAULT_COLUMNS),
        },
      ];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(customUIs),
      });
    });

    await page.route("**/api/custom-ui/*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
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
      const existing = localStorage.getItem("racecoordinator_settings");
      const parsedExisting = existing ? JSON.parse(existing) : {};

      // Preserve help and walkthrough flags so we don't accidentally trigger UI overlays in tests
      const preserved: any = {};
      for (const key of Object.keys(parsedExisting)) {
        if (
          key.endsWith("HelpShown") ||
          key === "racedaySetupWalkthroughSeen"
        ) {
          preserved[key] = parsedExisting[key];
        }
      }

      const newSettings = { ...preserved, ...s };
      newSettings.serverPort = parseInt(window.location.port) || 4250;
      localStorage.setItem(
        "racecoordinator_settings",
        JSON.stringify(newSettings),
      );
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

  static async setupCustomWidgets(
    page: Page,
    widgetFilesByFolder: Record<string, Record<string, string>>,
  ) {
    await page.addInitScript((filesMap) => {
      function createMockHandle(
        filesByFolder: Record<string, Record<string, string>>,
      ) {
        return {
          name: "MockWidgetsDir",
          kind: "directory",
          queryPermission: async () => "granted",
          requestPermission: async () => "granted",
          async *values() {
            for (const folderName of Object.keys(filesByFolder)) {
              yield createSubHandle(folderName, filesByFolder[folderName]);
            }
          },
          async getDirectoryHandle(name: string) {
            if (filesByFolder[name]) {
              return createSubHandle(name, filesByFolder[name]);
            }
            throw new Error("Directory not found: " + name);
          },
        };

        function createSubHandle(
          folderName: string,
          files: Record<string, string>,
        ) {
          return {
            name: folderName,
            kind: "directory",
            queryPermission: async () => "granted",
            requestPermission: async () => "granted",
            async *values() {
              for (const fileName of Object.keys(files)) {
                yield {
                  name: fileName,
                  kind: "file",
                  async getFile() {
                    return new File([files[fileName]], fileName, {
                      type: "text/plain",
                    });
                  },
                };
              }
            },
            async getFileHandle(fileName: string) {
              if (files[fileName] !== undefined) {
                return {
                  name: fileName,
                  kind: "file",
                  async getFile() {
                    return new File([files[fileName]], fileName, {
                      type: "text/plain",
                    });
                  },
                  async createWritable() {
                    return {
                      write: async (content: string) => {
                        files[fileName] = content;
                      },
                      close: async () => {},
                    };
                  },
                };
              }
              throw new Error("File not found: " + fileName);
            },
          };
        }
      }

      const mockHandle = createMockHandle(filesMap);

      if (typeof IDBObjectStore !== "undefined") {
        const origGet = IDBObjectStore.prototype.get;
        IDBObjectStore.prototype.get = function (query: any) {
          if (this.name === "handles" && query === "custom-widgets-dir") {
            const req = {
              result: mockHandle,
              onsuccess: null as any,
              onerror: null as any,
              readyState: "done",
            };
            setTimeout(() => {
              if (typeof req.onsuccess === "function") {
                req.onsuccess({ target: req });
              }
            }, 0);
            return req as any;
          }
          return origGet.apply(this, arguments as any);
        };
      }
    }, widgetFilesByFolder);
  }
}
