import { Page } from '@playwright/test';
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
  }

  /**
  /**
   * Waits for the translation file to be fetched and the UI to be stable.
   */
  static async waitForLocalization(page: Page, lang: string = 'en', action?: Promise<any>) {
    // Start listening for the response before performing the action
    const responsePromise = page.waitForResponse(response =>
      response.url().includes(`/assets/i18n/${lang}.json`) && response.status() === 200
    );

    // Perform the action (e.g., page.goto) if provided
    if (action) {
      await action;
    }

    // Wait for the translation request to complete
    await responsePromise;

    // Give Angular a moment to apply translations
    await page.waitForTimeout(1000);

    // Ensure fonts are ready
    await page.evaluate(() => document.fonts.ready);
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
}
