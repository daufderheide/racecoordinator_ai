import { Page } from '@playwright/test';

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

    // Translation mocking removed to allow identifying untranslated elements
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
}
