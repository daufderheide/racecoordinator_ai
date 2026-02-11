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

    // Mock Races API
    await page.route('**/api/races', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { entity_id: 'r1', name: 'Grand Prix' },
          { entity_id: 'r2', name: 'Time Trial' },
          { entity_id: 'r3', name: 'Endurance' },
          { entity_id: 'r4', name: 'Sprint' },
          { entity_id: 'r5', name: 'Elimination' },
          { entity_id: 'r6', name: 'Team Race' },
          { entity_id: 'r7', name: 'Junior GP' },
          { entity_id: 'r8', name: 'Veteran GP' },
        ]),
      });
    });

    // Mock Localization
    await this.setupLocalizationMocks(page);

    // Mock Tracks API
    await this.setupTrackMocks(page);
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
    // Using a more robust regex to catch common key patterns.
    // We REMOVE the catch() so the test fails if keys don't resolve.
    // TODO(aufderheide): Look into why we need 10s here, 3s was too short
    await expect(page.locator('body')).not.toContainText(/[A-Z]{2,3}_[A-Z_]+/, { timeout: 10000 });

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
            normallyClosedRelays: false,
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
            normallyClosedRelays: false,
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
          }
        },
        currentHeat: {
          heatNumber: 1,
          heatDrivers: [
            {
              objectId: 'hd1',
              driver: {
                objectId: 'rp1',
                driver: {
                  model: { entityId: 'd1' },
                  name: 'Driver 1'
                }
              }
            },
            {
              objectId: 'hd2',
              driver: {
                objectId: 'rp2',
                driver: {
                  model: { entityId: 'd2' },
                  name: 'Driver 2'
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


  static async setupLocalStorage(page: Page, settings: { recentRaceIds?: string[], selectedDriverIds?: string[] } = {}) {
    await page.addInitScript((s) => {
      const defaultSettings = {
        recentRaceIds: ['r1', 'r2'],
        selectedDriverIds: ['d1', 'd2']
      };
      window.localStorage.setItem('racecoordinator_settings', JSON.stringify({ ...defaultSettings, ...s }));
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

  static async disableAnimations(page: Page) {
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          transition: none !important;
          animation: none !important;
          transition-duration: 0s !important;
          animation-duration: 0s !important;
          caret-color: transparent !important;
        }
      `
    });
  }
}
