import { Page, expect } from '@playwright/test';
import { com } from '../proto/message';

export interface SetupOptions {
  skipIntro?: boolean;
  walkthroughSeen?: boolean;
  trackManagerHelpShown?: boolean;
  trackEditorHelpShown?: boolean;
}

export class TestSetupHelper {
  static async setupStandardMocks(page: Page, options: SetupOptions = {}) {
    // Listen for console logs from the browser and prefix them for visibility
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      // Only log if it's not a noisy debug message, or if it's one of our HEARTBEAT logs
      if (type === 'error' || type === 'warning' || text.includes('MockWebSocket')) {
        console.log(`BROWSER [${type.toUpperCase()}]: ${text}`);
      }
    });

    page.on('pageerror', err => console.error(`BROWSER ERROR: ${err.message}`));

    // Mock WebSockets by default to avoid connection refused/watchdog issues
    await this.setupWebSocketMock(page);

    // Mock Drivers API
    await page.route('**/api/drivers', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { entity_id: 'd1', name: 'Alice', nickname: 'The Rocket' },
          { entity_id: 'd2', name: 'Bob', nickname: 'Drift King' },
          { entity_id: 'd3', name: 'Charlie', nickname: 'Speedy' },
          { entity_id: 'd4', name: 'Dave', nickname: 'Noob' },
        ]),
      });
    });

    await page.route('**/api/races', async (route) => {
      const standardRace = (id: string, name: string) => ({
        entity_id: id,
        name: name,
        track_entity_id: 't1',
        track: {
          entity_id: 't1',
          name: 'Classic Circuit',
          lanes: [
            { entity_id: 'l1', length: 12.5, backgroundColor: '#ff0000', foregroundColor: '#ffffff' },
            { entity_id: 'l2', length: 12.5, backgroundColor: '#0000ff', foregroundColor: '#ffffff' }
          ]
        },
        heat_rotation_type: 'RoundRobin',
        heat_scoring: {
          finish_method: 'Lap',
          finish_value: 10,
          heat_ranking: 'LAP_COUNT',
          heat_ranking_tiebreaker: 'FASTEST_LAP_TIME',
          allow_finish: 'None'
        },
        overall_scoring: {
          dropped_heats: 0,
          ranking_method: 'LAP_COUNT',
          tiebreaker: 'FASTEST_LAP_TIME'
        }
      });

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          standardRace('r1', 'Grand Prix'),
          standardRace('r2', 'Time Trial'),
          standardRace('r3', 'Endurance'),
          standardRace('r4', 'Sprint'),
          standardRace('r5', 'Elimination'),
          standardRace('r6', 'Team Race'),
          standardRace('r7', 'Junior GP'),
          standardRace('r8', 'Veteran GP'),
        ]),
      });
    });

    // Mock Localization
    await this.setupLocalizationMocks(page);

    // Mock Tracks API
    await this.setupTrackMocks(page);

    // Mock Teams API
    await this.setupTeamMocks(page);

    // Mock Assets API
    await this.setupAssetMocks(page);

    // Mock Server Version API
    await page.route('**/api/version', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/plain',
        body: '0.0.0.1'
      });
    });

    // Mock Database Stats API
    await page.route('**/api/databases/current*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          name: 'Mock_Database.db',
          totalSize: '450 KB',
          imageCount: 5,
          soundCount: 3
        }),
      });
    });

    // Mock Settings using localStorage (since no component actually calls /api/settings)
    await this.setupSettings(page, {
      racedaySetupWalkthroughSeen: options.walkthroughSeen ?? false,
      trackManagerHelpShown: options.trackManagerHelpShown ?? true,
      trackEditorHelpShown: options.trackEditorHelpShown ?? true,
      racedayColumns: ['driver.name', 'lapCount'],
      columnLayouts: {
        'driver.name': { 'CenterCenter': 'driver.name' },
        'lapCount': { 'CenterCenter': 'lapCount' }
      },
      columnAnchors: {
        'driver.name': 'Center',
        'lapCount': 'Center'
      },
      columnWidths: {
        'driver.name': 200,
        'lapCount': 100
      },
      columnVisibility: {}
    });

    // Handle skip intro
    if (options.skipIntro) {
      await page.addInitScript(() => {
        window.sessionStorage.setItem('skipIntro', 'true');
      });
    }
  }

  static async setupTeamMocks(page: Page) {
    await page.route('**/api/teams', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { entity_id: 't1', name: 'Team Alpha', avatarUrl: '', driverIds: ['d1', 'd2'] },
          { entity_id: 't2', name: 'Team Beta', avatarUrl: '', driverIds: ['d3', 'd4'] },
        ]),
      });
    });
  }

  static async setupLocalizationMocks(page: Page) {
    // Read en.json from disk to serve as mock
    const fs = require('fs');
    const path = require('path');

    // Try to locate the assets folder relative to CWD
    const i18nPath = path.resolve(process.cwd(), 'client/src/assets/i18n');
    const altPath = path.resolve(process.cwd(), 'src/assets/i18n');
    const rootPath = path.resolve(process.cwd(), 'assets/i18n');
    const relativePath = path.resolve(__dirname, '../../assets/i18n');

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
      const lang = match ? match[1] : 'en';
      try {
        const filePath = path.join(finalPath, `${lang}.json`);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: content
          });
          return;
        }
      } catch (e) {
        // Silent fail
      }

      await route.continue();
    });

    // Mock background images to avoid dev-server flakiness
    await page.route('**/assets/**/*.png', async (route) => {
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
        path.resolve(process.cwd(), 'src/assets'),        // Case where CWD is /client
        path.resolve(process.cwd(), 'assets'),             // Case where CWD is /client/src
        path.resolve(process.cwd(), 'client/src/assets'), // Case where CWD is project root
      ];

      let filePath = '';
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
          contentType: 'image/png',
          body: content
        });
        return;
      }
      await route.continue();
    });
  }

  static async waitForLocalization(page: Page, lang: string = 'en', action?: Promise<any>) {
    const backTranslations: Record<string, string> = {
      'en': 'BACK', 'de': 'ZURÜCK', 'es': 'ATRÁS', 'fr': 'RETOUR', 'it': 'INDIETRO', 'pt': 'VOLTAR', 'nl': 'TERUG'
    };
    const expectedText = backTranslations[lang] || backTranslations['en'];

    // 1. Setup response promise BEFORE action
    const responsePromise = page.waitForResponse(response =>
      response.url().includes(`/assets/i18n/${lang}.json`) && response.status() === 200,
      { timeout: 5000 }
    ).catch(() => null);

    // 2. Perform the action
    if (action) await action;

    // 3. If text is already there, we can skip waiting for the response (it was fast/cached)
    const isAlreadyLocalized = await page.evaluate((text) => {
      return document.body.innerText.toUpperCase().includes(text);
    }, expectedText);

    if (isAlreadyLocalized) {
      await page.evaluate(() => document.fonts.ready);
      return;
    }

    // 4. Wait for response and text
    await responsePromise;

    try {
      await page.waitForFunction((text) => {
        return document.body.innerText.toUpperCase().includes(text);
      }, expectedText, { timeout: 5000 });
    } catch (e) {
      // Continue anyway
    }

    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(100);
  }

  /**
   * Helper to wait for a specific text to appear, indicating that localization and rendering are complete.
   */
  static async waitForText(page: Page, text: string) {
    // TODO(aufderheide): Look into why we need 10s here
    await expect(page.locator('body')).toContainText(text, { timeout: 10000 });
  }

  static async setupTrackMocks(page: Page) {
    await page.route('**/api/tracks', async (route) => {
      const method = route.request().method();
      const tracks = [
        {
          entity_id: 't1',
          name: 'Classic Circuit',
          lanes: [
            { entity_id: 'l1', length: 12.5, backgroundColor: '#ff0000', foregroundColor: '#ffffff' },
            { entity_id: 'l2', length: 12.5, backgroundColor: '#0000ff', foregroundColor: '#ffffff' }
          ],
          arduino_configs: [{
            name: 'Arduino 1',
            commPort: 'COM3',
            baudRate: 115200,
            debounceUs: 5000,
            hardwareType: 1, // Mega
            digitalIds: new Array(60).fill(0),
            analogIds: new Array(16).fill(0),
            normallyClosedLaneSensors: false,
            normallyClosedRelays: true,
            globalInvertLights: 0,
            useLapsForPits: 0,
            useLapsForPitEnd: 0,
            usePitsAsLaps: false,
            useLapsForSegments: true,
            ledStrings: null,
            ledLaneColorOverrides: null,
            lapPinPitBehavior: 3
          }]
        },
        {
          entity_id: 't2',
          name: 'Speedway',
          lanes: [
            { entity_id: 'l1', length: 15.0, backgroundColor: '#ffff00', foregroundColor: '#000000' },
            { entity_id: 'l2', length: 15.0, backgroundColor: '#00ff00', foregroundColor: '#000000' },
            { entity_id: 'l3', length: 15.0, backgroundColor: '#ff00ff', foregroundColor: '#ffffff' },
            { entity_id: 'l4', length: 15.0, backgroundColor: '#00ffff', foregroundColor: '#000000' }
          ],
          arduino_configs: [{
            name: 'Arduino 2',
            commPort: 'COM4',
            baudRate: 115200,
            debounceUs: 5000,
            hardwareType: 0, // Uno
            digitalIds: new Array(60).fill(0),
            analogIds: new Array(16).fill(0),
            normallyClosedLaneSensors: false,
            normallyClosedRelays: true,
            globalInvertLights: 0,
            useLapsForPits: 0,
            useLapsForPitEnd: 0,
            usePitsAsLaps: false,
            useLapsForSegments: true,
            ledStrings: null,
            ledLaneColorOverrides: null,
            lapPinPitBehavior: 3
          }]
        }
      ];

      if (method === 'POST') {
        const postData = route.request().postDataJSON();
        const newTrack = { ...postData, entity_id: 't-new-id' };
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(newTrack),
        });
      } else {
        // Include t-new-id if it's "created" (flexible for tests)
        const extendedTracks = [...tracks, {
          entity_id: 't-new-id',
          name: 'New Track',
          lanes: [
            { entity_id: 'l1', length: 10, backgroundColor: '#ef4444', foregroundColor: 'black' },
            { entity_id: 'l2', length: 10, backgroundColor: '#ffffff', foregroundColor: 'black' },
            { entity_id: 'l3', length: 10, backgroundColor: '#3b82f6', foregroundColor: 'black' },
            { entity_id: 'l4', length: 10, backgroundColor: '#fbbf24', foregroundColor: 'black' }
          ],
          arduino_configs: []
        }];

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(extendedTracks),
        });
      }
    });

    await page.route('**/api/tracks/*', async (route) => {
      const method = route.request().method();
      if (method === 'PUT') {
        const postData = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(postData),
        });
      } else if (method === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/serial-ports', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(['COM1', 'COM2', 'COM3', 'COM4']),
      });
    });

    await page.route('**/api/tracks/factory-settings', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          lanes: [
            { background_color: '#ef4444', foreground_color: 'black', length: 10 },
            { background_color: '#ffffff', foreground_color: 'black', length: 10 },
            { background_color: '#3b82f6', foreground_color: 'black', length: 10 },
            { background_color: '#fbbf24', foreground_color: 'black', length: 10 }
          ],
          arduino_configs: [{
            name: 'Arduino 1',
            commPort: '',
            baudRate: 115200,
            debounceUs: 5000,
            hardwareType: 0,
            digitalIds: new Array(60).fill(0),
            analogIds: new Array(16).fill(0),
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
            voltageConfigs: {}
          }]
        }),
      });
    });

    // Mock interface initialization and updates to avoid browser errors
    await page.route('**/api/initialize-interface', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.route('**/api/update-interface-config', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });
  }

  static async setupDigitalTrackMocks(page: Page) {
    await page.route('**/api/tracks', async (route) => {
      const tracks = [
        {
          entity_id: 't_digital',
          name: 'Digital Haven',
          has_digital_fuel: true, // Use the new property we added to the model/converter
          lanes: [
            { entity_id: 'l1', length: 15.0, backgroundColor: '#ffff00', foregroundColor: '#000000' }
          ],
          arduino_configs: [{
            name: 'Arduino Digital',
            commPort: 'COM5',
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
            lapPinPitBehavior: 3
          }]
        }
      ];

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(tracks),
      });
    });
  }

  static async setupAssetMocks(page: Page) {
    // Return a 1x1 transparent PNG for any requested images
    await page.route('**/assets/images/**/*.png', async (route) => {
      // 1x1 base64 transparent PNG
      const transparentPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: transparentPng
      });
    });

    await page.route('**/api/assets/list', async (route) => {
      const assets = [
        {
          model: { entityId: '1' },
          name: 'Test Image 1',
          type: 'image',
          size: '150 KB',
          url: '/api/assets/download?filename=img1.png',
          filename: 'img1.png'
        },
        {
          model: { entityId: '2' },
          name: 'Test Sound 1',
          type: 'sound',
          size: '50 KB',
          url: '/api/assets/download?filename=snd1.mp3',
          filename: 'snd1.mp3'
        },
        {
          model: { entityId: 'set123' },
          name: 'Custom Dash',
          type: 'image_set',
          size: '1.2 MB',
          url: '/api/assets/download?filename=dash.json',
          filename: 'dash.json',
          images: [
            { percentage: 30, url: '/api/assets/download?filename=img1.png', name: 'img1.png' },
            { percentage: 70, url: '/api/assets/download?filename=img2.png', name: 'img2.png' }
          ]
        },
        {
          model: { entityId: 'fuel-gauge-builtin' },
          name: 'Fuel Gauge',
          type: 'image_set',
          size: '1.2 MB',
          url: '/api/assets/download?filename=fuel-gauge.json',
          filename: 'fuel-gauge.json',
          images: [
            { percentage: 0, url: '/api/assets/download?filename=fuel-0.png', name: 'fuel-0.png' },
            { percentage: 50, url: '/api/assets/download?filename=fuel-50.png', name: 'fuel-50.png' },
            { percentage: 100, url: '/api/assets/download?filename=fuel-100.png', name: 'fuel-100.png' }
          ]
        }
      ];

      const response = com.antigravity.ListAssetsResponse.create({ assets });
      const buffer = com.antigravity.ListAssetsResponse.encode(response).finish();

      await route.fulfill({
        status: 200,
        contentType: 'application/octet-stream',
        body: Buffer.from(buffer),
      });
    });

    // Mock Asset Download API
    await page.route('**/api/assets/download*', async (route) => {
      // Return a 1x1 transparent pixel for all downloads in tests
      const transparentPixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: transparentPixel
      });
    });
  }

  /**
   * Universal WebSocket mock to avoid ERR_CONNECTION_REFUSED and watchdog timeouts.
   */
  static async setupWebSocketMock(page: Page) {
    await page.addInitScript(() => {
      // General testing disables the watchdog to prevent unstable timeouts. Tests that need it will override it.
      if (typeof (window as any).WATCHDOG_TIMEOUT === 'undefined') {
        (window as any).WATCHDOG_TIMEOUT = 99999999;
      }

      // @ts-ignore
      window.allMockSockets = [];
      // @ts-ignore
      window.MockWebSocket = class extends EventTarget {
        url: string;
        readyState: number;
        protocol: string = '';
        extensions: string = '';
        binaryType: BinaryType = 'blob';
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
          // @ts-ignore
          window.allMockSockets.push(this);

          setTimeout(() => {
            this.readyState = 1; // OPEN
            // @ts-ignore
            window.mockSocket = this;
            const openEvent = new Event('open');
            this.dispatchEvent(openEvent);
            if (this.onopen) this.onopen(openEvent);

            if (url.includes('interface-data')) {
              console.log(`MockWebSocket: Detected interface-data socket. heartbeatDisabled=${!!(window as any).disableMockHeartbeat}`);

              // status 0 = CONNECTED. InterfaceEvent (Tag 3, Len 2) -> InterfaceStatusEvent (Tag 1, Val 0)
              // Bytes: 1A 02 08 00
              const connectedBuffer = new Uint8Array([0x1A, 0x02, 0x08, 0x00]).buffer;
              const sendHeartbeat = () => {
                try {
                  const event = new MessageEvent('message', { data: connectedBuffer });
                  this.dispatchEvent(event);
                  if (this.onmessage) this.onmessage(event);
                  console.debug('MockWebSocket: Sent CONNECTED heartbeat (RAW)');
                } catch (e) {
                  console.error('Error sending mock interface heartbeat', e);
                }
              };

              // Initial heartbeat if not disabled
              setTimeout(() => {
                // @ts-ignore
                if (!window.disableMockHeartbeat) {
                  console.log('MockWebSocket: Sending initial pulse');
                  sendHeartbeat();
                } else {
                  console.log('MockWebSocket: Initial pulse suppressed');
                }
              }, 500);

              // Periodic heartbeat if not disabled
              // @ts-ignore
              if (!window.disableMockHeartbeat) {
                // Heartbeat disabled: we rely on WATCHDOG_TIMEOUT scaling instead to avoid breaking Playwright's auto-waiting stability checks with an active running setInterval
                console.log('MockWebSocket: Periodic heartbeat disabled by test framework to prevent auto-waiting flakes.');
              }
            }

            // Initial race data if available
            // @ts-ignore
            if (url.includes('race-data') && window.mockRaceDataBuffer) {
              // @ts-ignore
              const event = new MessageEvent('message', { data: window.mockRaceDataBuffer });
              this.dispatchEvent(event);
              if (this.onmessage) this.onmessage(event);
            }
          }, 100);
        }

        send(data: any) { console.debug(`MockWebSocket: send called with ${data.length} bytes`); }
        close() { if (this.heartbeatInterval) clearInterval(this.heartbeatInterval); }

        static get CONNECTING() { return 0; }
        static get OPEN() { return 1; }
        static get CLOSING() { return 2; }
        static get CLOSED() { return 3; }
      };

      // @ts-ignore
      window.WebSocket = window.MockWebSocket;
    });
  }

  static async setupRaceMocks(page: Page) {
    const raceData = com.antigravity.RaceData.create({
      race: { // IRace
        race: { // IRaceModel
          model: { entityId: 'r1' },
          name: 'Mock GP',
          track: { // ITrackModel
            model: { entityId: 't1' },
            name: 'Test Track',
            lanes: [
              { objectId: 'l1', length: 10, backgroundColor: '#550000', foregroundColor: '#ffffff' },
              { objectId: 'l2', length: 10, backgroundColor: '#005500', foregroundColor: '#ffffff' }
            ]
          },
          fuelOptions: {
            enabled: true,
            capacity: 100,
            usageType: 0, // Per lap
            usageRate: 1.0,
            startLevel: 100
          }
        },
        currentHeat: {
          heatNumber: 1,
          heatDrivers: [
            {
              objectId: 'hd1',
              driver: {
                objectId: 'rp1',
                fuelLevel: 75.5,
                driver: {
                  model: { entityId: 'd1' },
                  name: 'Driver 1',
                  avatarUrl: '/api/assets/download?filename=img1.png'
                }
              }
            },
            {
              objectId: 'hd2',
              driver: {
                objectId: 'rp2',
                fuelLevel: 42.0,
                driver: {
                  model: { entityId: 'd2' },
                  name: 'Driver 2',
                  avatarUrl: '/api/assets/download?filename=img1.png'
                }
              }
            }
          ]
        },
        heats: [
          { heatNumber: 1 },
          { heatNumber: 2 }
        ]
      }
    });

    const buffer = com.antigravity.RaceData.encode(raceData).finish();
    const dataArray = Array.from(buffer);

    await page.addInitScript((data) => {
      // @ts-ignore
      window.mockRaceDataBuffer = new Uint8Array(data).buffer;
      // Also broadcast it to any already open sockets
      // @ts-ignore
      if (window.allMockSockets) {
        // @ts-ignore
        const raceSockets = window.allMockSockets.filter((s: any) => s.url.includes('race-data'));
        raceSockets.forEach((s: any) => {
          // @ts-ignore
          const event = new MessageEvent('message', { data: window.mockRaceDataBuffer });
          // @ts-ignore
          s.dispatchEvent(event);
          // @ts-ignore
          if (s.onmessage) s.onmessage(event);
        });
      }
    }, dataArray);
  }


  static async setupLocalStorage(page: Page, settings: { recentRaceIds?: string[], selectedDriverIds?: string[], racedaySetupWalkthroughSeen?: boolean, language?: string } = {}) {
    await page.addInitScript((s) => {
      const defaultSettings = {
        recentRaceIds: ['r1', 'r2'],
        selectedDriverIds: ['d1', 'd2'],
        racedaySetupWalkthroughSeen: false,
        language: ''
      };
      // @ts-ignore
      window.localStorage.setItem('racecoordinator_settings', JSON.stringify({ ...defaultSettings, ...s }));
    }, settings);
  }

  static async setupSessionStorage(page: Page, settings: Record<string, string> = {}) {
    await page.addInitScript((s) => {
      for (const [key, value] of Object.entries(s)) {
        window.sessionStorage.setItem(key, value);
      }
    }, settings);
  }
  static async setupFileSystemMock(page: Page, customFiles: Record<string, string>) {
    await page.addInitScript((files) => {
      // Helper to create a file handle
      const createMockFileHandle = (name: string, content: string) => ({
        kind: 'file',
        name: name,
        getFile: async () => ({
          text: async () => content
        })
      });

      // Mock Directory Handle
      const mockDirectoryHandle = {
        kind: 'directory',
        name: 'mock-custom-dir',
        queryPermission: async () => 'granted',
        requestPermission: async () => 'granted',
        getFileHandle: async (name: string) => {
          if (files[name]) {
            return createMockFileHandle(name, files[name]);
          }
          throw new Error('File not found: ' + name);
        }
      };

      // Mock IndexedDB Structure
      const mockStore = {
        get: (key: string) => {
          const request: any = { result: null, onsuccess: null, onerror: null };
          setTimeout(() => {
            if (key === 'raceday-setup-dir') {
              request.result = mockDirectoryHandle;
            }
            if (request.onsuccess) request.onsuccess({ target: request });
          }, 10);
          return request;
        },
        put: () => ({ onsuccess: null, onerror: null }), // No-op for put
        delete: () => ({ onsuccess: null, onerror: null }) // No-op for delete
      };

      const mockTransaction = {
        objectStore: (name: string) => mockStore,
      };

      const mockDB = {
        objectStoreNames: { contains: () => true },
        createObjectStore: () => mockStore,
        transaction: (stores: any, mode: any) => mockTransaction
      };

      const mockOpenRequest: any = {
        result: mockDB,
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null
      };

      // Override window.indexedDB
      try {
        Object.defineProperty(window, 'indexedDB', {
          value: {
            open: (name: string, version: number) => {
              setTimeout(() => {
                if (mockOpenRequest.onsuccess) {
                  mockOpenRequest.onsuccess({ target: mockOpenRequest });
                }
              }, 10);
              return mockOpenRequest;
            }
          },
          writable: true
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
          }
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
      localStorage.setItem('racecoordinator_settings', JSON.stringify(s));
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
        if (document.getElementById('playwright-disable-animations')) return;
        const style = document.createElement('style');
        style.id = 'playwright-disable-animations';
        style.textContent = styleContent;
        document.head.appendChild(style);
      };
      if (document.head) {
        injectStyle();
      } else {
        document.addEventListener('DOMContentLoaded', injectStyle);
      }
      
      // Also inject periodically just in case Angular or something rewrites head
      const observer = new MutationObserver(() => {
        if (document.head && !document.getElementById('playwright-disable-animations')) {
          injectStyle();
        }
      });
      observer.observe(document, { childList: true, subtree: true });
    }, css);

    // Apply immediately to current execution context to be safe
    await page.addStyleTag({ content: css }).catch(() => {});
  }

  static async setupManyTracksMock(page: Page) {
    await page.route('**/api/tracks', async (route) => {
      const tracks = [];
      for (let i = 1; i <= 20; i++) {
        let name = `Track ${i}`;
        if (i === 5) {
          name = 'Extremely Long Track Name That Should Definitely Be Truncated In Both The Sidebar And The Summary Title To Prevent Layout Issues';
        }
        tracks.push({
          entity_id: `t${i}`,
          name: name,
          lanes: [
            { entity_id: `l${i}_1`, length: 10, backgroundColor: '#ff0000', foregroundColor: '#ffffff' },
            { entity_id: `l${i}_2`, length: 10, backgroundColor: '#0000ff', foregroundColor: '#ffffff' }
          ],
          arduino_configs: [{
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
            lapPinPitBehavior: 3
          }]
        });
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(tracks),
      });
    });
  }
}
