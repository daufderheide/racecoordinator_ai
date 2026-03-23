import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';
import { com } from '../../proto/message';

test.describe('Heat Results Visuals', () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  test('should display dual charts for heat results', async ({ page }) => {
    // Setup Mock Race and Heat data with Laps populated
    const mockData = {
      race: {
        race: {
          name: 'Mock Race',
          track: {
            lanes: [
              { backgroundColor: '#ef4444', foregroundColor: '#ffffff' },
              { backgroundColor: '#3b82f6', foregroundColor: '#ffffff' },
              { backgroundColor: '#10b981', foregroundColor: '#ffffff' }
            ]
          }
        },
        currentHeat: {
          heatNumber: 1,
              heatDrivers: [
                {
                  objectId: 'hd1',
                  driver: { objectId: 'rp1', driver: { name: 'Alice', nickname: 'Ally' } },
                  actualDriver: { name: 'Alice', nickname: 'Ally' },
                  laps: [{ lapTime: 10.5 }, { lapTime: 10.2 }, { lapTime: 10.4 }]
                },
                {
                  objectId: 'hd2',
                  driver: { objectId: 'rp2', driver: { name: 'Bob', nickname: 'Bobby' } },
                  actualDriver: { name: 'Bob', nickname: 'Bobby' },
                  laps: [{ lapTime: 11.1 }, { lapTime: 10.8 }, { lapTime: 10.7 }]
                },
                {
                  objectId: 'hd3',
                  driver: { objectId: 'rp3', driver: { name: 'Charlie', nickname: 'Chuck' } },
                  actualDriver: { name: 'Charlie', nickname: 'Chuck' },
                  laps: [{ lapTime: 12.0 }, { lapTime: 11.2 }, { lapTime: 11.5 }]
                }
              ]
        }
      }
    };

    // Encode and inject over init-state buffer delivery
    const buffer = com.antigravity.RaceData.encode(mockData).finish();
    const dataArray = Array.from(buffer);
    await page.addInitScript((data) => {
      // @ts-ignore
      window.mockRaceDataBuffer = new Uint8Array(data).buffer;
    }, dataArray);

    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/heat-results'));

    // Verify Loader not covering canvas 
    await expect(page.locator('.loader-overlay')).not.toBeVisible();

    // Visual screenshot verification
    await expect(page).toHaveScreenshot('heat-results-charts.png', {
         maxDiffPixelRatio: 0.05 // allowance for dynamic elements triggers.
    });
  });
});
