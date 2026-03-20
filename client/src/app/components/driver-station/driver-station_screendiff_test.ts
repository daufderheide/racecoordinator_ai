import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';
import { DriverStationHarnessE2e } from './testing/driver-station.harness.e2e';

test.describe('Driver Station Visuals', () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceMocks(page);
    await TestSetupHelper.disableAnimations(page);
    
    // Set viewport size to a mobile device layout, e.g., iPhone X
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForLoadState('networkidle');
  });

  test('should display default single lane view', async ({ page }) => {
    // Navigate to lane 0
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/driver-station/0'));

    const container = page.locator('app-driver-station');
    // harness variable defined but not strictly used for validation directly as per instructions
    const harness = new DriverStationHarnessE2e(container);

    // Wait for the view container to render
    await expect(page.locator('.driver-station-container')).toBeVisible();

    await page.evaluate(() => {
      const raceData = {
        race: {
          race: {
            model: { entityId: 'r1' },
            name: 'Mock GP',
            fuelOptions: { enabled: false }, // Non Fuel
            track: {
              lanes: [
                { objectId: 'l1', length: 10, backgroundColor: '#5b1010', foregroundColor: '#ffffff' }
              ]
            }
          },
          drivers: [
            { objectId: 'rp1', fuelLevel: 0, driver: { name: 'Driver 1', nickname: 'The Rocket' } }
          ],
          currentHeat: {
            objectId: 'h1',
            heatDrivers: [
              { objectId: 'hd1', laneIndex: 0, lapCount: 5, lastLapTime: 1.23, bestLapTime: 1.11, driver: { objectId: 'rp1', driver: { nickname: 'The Rocket' } } }
            ],
            standings: ['hd1'] 
          }
        }
      };
      
      if ((window as any).mockRaceData) {
        (window as any).mockRaceData(raceData);
      }
    });

    await page.waitForTimeout(500);

    // Verify visual snapshot
    await expect(page).toHaveScreenshot('driver-station-default.png', { maxDiffPixelRatio: 0.1 });
  });

  test('should display fuel thermometer layout if fuel race', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/driver-station/0'));

    await page.evaluate(() => {
      const raceData = {
        race: {
          race: {
            model: { entityId: 'r1' },
            name: 'Fuel Race',
            fuelOptions: { enabled: true, capacity: 100 },
            track: {
              lanes: [
                { objectId: 'l1', length: 10, backgroundColor: '#105b10', foregroundColor: '#ffffff' }
              ]
            }
          },
          drivers: [
            { objectId: 'rp1', fuelLevel: 45.0, driver: { name: 'Driver 1', nickname: 'The Rocket' } }
          ],
          currentHeat: {
            objectId: 'h1',
            heatDrivers: [
              { objectId: 'hd1', laneIndex: 0, lapCount: 5, lastLapTime: 1.23, driver: { objectId: 'rp1', fuelLevel: 45.0, driver: { nickname: 'The Rocket' } } }
            ],
            standings: ['hd1']
          }
        }
      };
      
      if ((window as any).mockRaceData) {
        (window as any).mockRaceData(raceData);
      }
    });

    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('driver-station-fuel.png', { maxDiffPixelRatio: 0.1 });
  });
});
