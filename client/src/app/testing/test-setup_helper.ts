import { Page, expect } from '@playwright/test';
import { com } from '../proto/message';

export class TestSetupHelper {
  static async setupStandardMocks(page: Page) {

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
    console.log('DEBUG: CWD:', process.cwd());
    const i18nPath = path.resolve(process.cwd(), 'client/src/assets/i18n'); // Adjusted based on common structure
    const altPath = path.resolve(process.cwd(), 'src/assets/i18n');

    let finalPath = i18nPath;
    if (!fs.existsSync(finalPath) && fs.existsSync(altPath)) {
      finalPath = altPath;
    }
    console.log('DEBUG: Using i18nPath:', finalPath);

    // Use Regex to match the path regardless of query params (e.g. ?t=...)
    await page.route(/\/assets\/i18n\/.*\.json/, async (route) => {
      const url = route.request().url();
      console.log('DEBUG: Route hit for:', url);
      const match = url.match(/\/assets\/i18n\/([a-z]{2,3})\.json/);
      const lang = match ? match[1] : 'en';

      try {
        const filePath = path.join(finalPath, `${lang}.json`);
        if (fs.existsSync(filePath)) {
          console.log(`DEBUG: Serving ${lang} from ${filePath}`);
          const content = fs.readFileSync(filePath, 'utf8');
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: content
          });
          return;
        } else {
          console.error(`DEBUG: File not found: ${filePath}`);
        }
      } catch (e) {
        console.warn(`Failed to mock localization for ${lang}`, e);
      }

      await route.continue();
    });

    // Mock background images to avoid dev-server flakiness
    await page.route('**/assets/images/*.png', async (route) => {
      const url = route.request().url();
      const match = url.match(/\/assets\/images\/(.*\.png)/);
      if (!match) return route.continue();

      const fileName = match[1];
      const imagesPath = path.resolve(process.cwd(), 'client/src/assets/images');
      const filePath = path.join(imagesPath, fileName);

      if (fs.existsSync(filePath)) {
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

  /**
   * Waits for the translation file to be fetched and the UI to be stable.
   */
  static async waitForLocalization(page: Page, lang: string = 'en', action?: Promise<any>) {
    // Start listening for the response before performing the action
    const responsePromise = page.waitForResponse(response =>
      response.url().includes(`/assets/i18n/${lang}.json`) && response.status() === 200,
      { timeout: 5000 } // Don't wait forever if it's cached or won't come
    ).catch(() => null);

    // Perform the action (e.g., page.goto) if provided
    if (action) {
      await action;
    }

    // Wait for the translation request to complete
    await responsePromise;

    // Wait until at least one representative key is translated
    // We look for 'BACK' which is DE_BTN_BACK or DM_BTN_BACK in English
    // Just wait for the body to be visible for now
    await expect(page.locator('body')).toBeVisible();

    // Ensure fonts are ready
    await page.evaluate(() => document.fonts.ready);
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
      const tracks = [
        {
          entity_id: 't1',
          name: 'Classic Circuit',
          lanes: [
            { entity_id: 'l1', length: 12.5, backgroundColor: '#ff0000', foregroundColor: '#ffffff' },
            { entity_id: 'l2', length: 12.5, backgroundColor: '#0000ff', foregroundColor: '#ffffff' }
          ],
          arduino_config: {
            name: 'Arduino 1',
            commPort: 'COM3',
            baudRate: 115200,
            debounceUs: 5000,
            hardwareType: 1, // Mega
            digitalIds: [1001, 1002, -1, -1],
            analogIds: [-1, -1, -1, -1],
            globalInvertLanes: 0,
            normallyClosedRelays: true,
            globalInvertLights: 0,
            useLapsForPits: 0,
            useLapsForPitEnd: 0,
            usePitsAsLaps: 0,
            useLapsForSegments: 0,
            ledStrings: null,
            ledLaneColorOverrides: null
          }
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
          arduino_config: {
            name: 'Arduino 2',
            commPort: 'COM4',
            baudRate: 115200,
            debounceUs: 5000,
            hardwareType: 0, // Uno
            digitalIds: [1001, 1002, 1003, 1004],
            analogIds: [-1, -1, -1, -1],
            globalInvertLanes: 0,
            normallyClosedRelays: true,
            globalInvertLights: 0,
            useLapsForPits: 0,
            useLapsForPitEnd: 0,
            usePitsAsLaps: 0,
            useLapsForSegments: 0,
            ledStrings: null,
            ledLaneColorOverrides: null
          }
        }
      ];

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(tracks),
      });
    });

    await page.route('**/api/serial-ports', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(['COM1', 'COM2', 'COM3', 'COM4']),
      });
    });
  }

  static async setupAssetMocks(page: Page) {
    await page.route('**/api/assets/list', async (route) => {
      const assets = [
        {
          model: { entityId: '1' },
          name: 'Test Image 1',
          type: 'image',
          size: '150 KB',
          url: '',
          filename: 'img1.png'
        },
        {
          model: { entityId: '2' },
          name: 'Test Sound 1',
          type: 'sound',
          size: '50 KB',
          url: '',
          filename: 'snd1.mp3'
        },
        {
          model: { entityId: 'set123' },
          name: 'Custom Dash',
          type: 'image_set',
          size: '1.2 MB',
          url: '',
          filename: 'dash.json',
          images: [
            { percentage: 30, url: 'img1.png', name: 'img1.png' },
            { percentage: 70, url: 'img2.png', name: 'img2.png' }
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
              driver: { // This MUST be named 'driver' to match IDriverHeatData.driver proto
                objectId: 'rp1',
                fuelLevel: 75.5,
                driver: { // This MUST be named 'driver' to match IDriverHeatData.driver proto
                  model: { entityId: 'd1' },
                  name: 'Driver 1',
                  avatarUrl: '/api/assets/download?filename=img1.png'
                }
              }
            },
            {
              objectId: 'hd2',
              driver: { // This MUST be named 'driver' to match IDriverHeatData.driver proto
                objectId: 'rp2',
                fuelLevel: 42.0,
                driver: { // This MUST be named 'driver' to match IDriverHeatData.driver proto
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
      const originalWebSocket = window.WebSocket;
      // Initialize the array to keep track of all mock sockets
      // @ts-ignore
      window.allMockSockets = [];

      window.WebSocket = class MockWebSocket extends EventTarget {
        constructor(url: string, protocols?: string | string[]) {
          super();
          // @ts-ignore
          this.url = url;
          // @ts-ignore
          this.readyState = 0; // CONNECTING

          // @ts-ignore
          window.allMockSockets.push(this);

          setTimeout(() => {
            // @ts-ignore
            this.readyState = 1; // OPEN
            // @ts-ignore
            window.mockSocket = this;
            this.dispatchEvent(new Event('open'));
            // @ts-ignore
            if (this.onopen) this.onopen(new Event('open'));

            // Send our mock data
            if (url.includes('race-data')) {
              const event = new MessageEvent('message', {
                data: new Uint8Array(data).buffer
              });
              this.dispatchEvent(event);
              // @ts-ignore
              if (this.onmessage) this.onmessage(event);
            }
          }, 100);
        }
        send() { }
        close() { }
        // @ts-ignore
        onopen: ((this: WebSocket, ev: Event) => any) | null = null;
        // @ts-ignore
        onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null = null;
        // @ts-ignore
        onclose: ((this: WebSocket, ev: CloseEvent) => any) | null = null;
        // @ts-ignore
        onerror: ((this: WebSocket, ev: Event) => any) | null = null;

        // Add other required properties/methods as no-ops or basic impls
        binaryType: BinaryType = 'blob';
        bufferedAmount = 0;
        extensions = '';
        protocol = '';
        CLOSING = 2;
        CLOSED = 3;
        CONNECTING = 0;
        OPEN = 1;
      } as any;
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
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          transition: none !important;
          animation: none !important;
          transition-duration: 0s !important;
          animation-duration: 0s !important;
          scroll-behavior: auto !important;
          caret-color: transparent !important;
        }
      `
    });
  }
}
