import { Page } from "@playwright/test";

import { com } from "../proto/message";
import { MOCK_ASSETS } from "./data/assets_data";
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

    // Mock Screens API for Race Screen Manager with CORS support
    let screens = [
      {
        entity_id: "screen-1",
        name: "Default Screen",
        isDefault: true,
        isEnabled: true,
        columns: ["driver.name", "lapCount"],
        columnLayouts: {
          "driver.name": { CenterCenter: "driver.name" },
          lapCount: { CenterCenter: "lapCount" }
        },
        columnVisibility: {},
        sortByStandings: true,
        highlightRowOnLap: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];

    // Mock list endpoint with full CORS
    await page.route("**/api/screens", async (route) => {
      const method = route.request().method();

      // Handle CORS preflight
      if (method === "OPTIONS") {
        await route.fulfill({
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
          }
        });
        return;
      }

      if (method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify(screens),
        });
      } else if (method === "POST") {
        const data = route.request().postDataJSON();
        const newScreen = { ...data, entity_id: `screen-${Date.now()}`, createdAt: Date.now(), updatedAt: Date.now() };
        screens.push(newScreen);
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify(newScreen),
        });
      }
    });

    // Mock individual screen endpoint with CORS
    await page.route("**/api/screens/**", async (route) => {
      const method = route.request().method();
      const url = route.request().url();
      const id = url.split("/").pop();

      // Handle CORS preflight
      if (method === "OPTIONS") {
        await route.fulfill({
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
          }
        });
        return;
      }

      const screen = screens.find(s => s.entity_id === id) || screens[0];

      if (method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify(screen),
        });
      } else if (method === "PUT") {
        const data = route.request().postDataJSON();
        const idx = screens.findIndex(s => s.entity_id === id);
        if (idx >= 0) {
          screens[idx] = { ...screens[idx], ...data, updatedAt: Date.now() };
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify(screens[idx] || data),
        });
      } else if (method === "DELETE") {
        screens = screens.filter(s => s.entity_id !== id);
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({ success: true }),
        });
      }
    });

    // Mock Localization
    await this.setupLocalizationMocks(page);

    // Mock specialized APIs
    await this.setupDriverMocks(page);
    await this.setupRaceRestMocks(page);
    await this.setupTrackMocks(page);
    await this.setupTeamMocks(page);
    await this.setupAssetMocks(page);

    // Mock Server Version API
    await page.route("**/api/version", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: "TEST-SERVER-VERSION",
      });
    });

    // Mock Client Version Override
    await page.addInitScript(() => {
      (window as any).CLIENT_VERSION_OVERRIDE = "TEST-CLIENT-VERSION";
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
      await route.continue();
    });
  }

  static async waitForLocalization(
    page: Page,
    lang: string = "en",
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

    // 3. Ensure fonts and layout have settled after text swap
    await page.evaluate(() => document.fonts.ready);

    // 4. Wait for a paint cycle to ensure DOM updates are flushed
    await page.evaluate(
      () =>
        new Promise((res) =>
          requestAnimationFrame(() => requestAnimationFrame(res)),
        ),
    );

    // 5. Final safety wait for complex components (like SVGs) to stabilize
    await page.waitForTimeout(750);
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
      const response = com.antigravity.InitializeInterfaceResponse.create({
        success: true,
      });
      const buffer =
        com.antigravity.InitializeInterfaceResponse.encode(response).finish();
      await route.fulfill({
        status: 200,
        contentType: "application/octet-stream",
        body: Buffer.from(buffer),
      });
    });

    await page.route("**/api/update-interface-config", async (route) => {
      const response = com.antigravity.UpdateInterfaceConfigResponse.create({
        success: true,
      });
      const buffer =
        com.antigravity.UpdateInterfaceConfigResponse.encode(response).finish();
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
    // Return a 1x1 transparent PNG for any requested images
    await page.route("**/assets/images/**/*.png", async (route) => {
      // 1x1 base64 transparent PNG
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

    await page.route("**/api/assets/list", async (route) => {
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
      ];

      const response = com.antigravity.ListAssetsResponse.create({ assets });
      const buffer =
        com.antigravity.ListAssetsResponse.encode(response).finish();

      await route.fulfill({
        status: 200,
        contentType: "application/octet-stream",
        body: Buffer.from(buffer),
      });
    });

    // Mock Asset Download API
    await page.route("**/api/assets/download*", async (route) => {
      // Return a 1x1 transparent pixel for all downloads in tests
      const transparentPixel = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
        "base64",
      );
      await route.fulfill({
        status: 200,
        contentType: "image/png",
        body: transparentPixel,
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
  }

  static async setupRaceWebSocketMocks(page: Page) {
    const raceData = com.antigravity.RaceData.create({
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

    const buffer = com.antigravity.RaceData.encode(raceData).finish();
    const dataArray = Array.from(buffer);

    await page.addInitScript((data) => {
      window.mockRaceDataBuffer = new Uint8Array(data).buffer;
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
    const buffer = com.antigravity.RaceData.encode(data).finish();
    const dataArray = Array.from(buffer);
    await page.evaluate((bufferArray) => {
      const buffer = new Uint8Array(bufferArray).buffer;
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
        }),
      });

      // Mock Directory Handle
      const mockDirectoryHandle = {
        kind: "directory",
        name: "mock-custom-dir",
        queryPermission: async () => "granted",
        requestPermission: async () => "granted",
        getFileHandle: async (name: string) => {
          if (files[name]) {
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
        objectStore: (name: string) => mockStore,
      };

      const mockDB = {
        objectStoreNames: { contains: () => true },
        createObjectStore: () => mockStore,
        transaction: (stores: any, mode: any) => mockTransaction,
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
            open: (name: string, version: number) => {
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
          open: (name: string, version: number) => {
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
