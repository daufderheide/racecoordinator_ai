import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';
import { DefaultRacedayHarnessE2e } from './testing/default-raceday.harness.e2e';

test.describe('Raceday Visuals for Sorting', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER [${msg.type()}]: ${msg.text()}`));
    page.on('pageerror', err => console.error(`BROWSER ERROR: ${err.message}`));

    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.waitForLoadState('networkidle');

    // Enable sortByStandings
    await TestSetupHelper.setupSettings(page, {
      sortByStandings: true,
      racedayColumns: ['driver.name', 'lapCount', 'lastLapTime'],
      columnLayouts: {
        'driver.name': { 'CenterCenter': 'driver.name' },
        'lapCount': { 'CenterCenter': 'lapCount' },
        'lastLapTime': { 'CenterCenter': 'lastLapTime' }
      },
      columnAnchors: {
        'driver.name': 'Center',
        'lapCount': 'Center',
        'lastLapTime': 'Center'
      },
      columnWidths: {
        'driver.name': 400,
        'lapCount': 180,
        'lastLapTime': 275
      },
      columnVisibility: {}
    });
  });

  test('should sort lanes by standing order when sortByStandings is true', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/default-raceday'));

    const container = page.locator('.dashboard-wrapper');
    const harness = new DefaultRacedayHarnessE2e(container);

    await expect(page.locator('.scalable-content')).toBeVisible();

    // Define data where lane 0 is 'Driver 1' and lane 1 is 'Driver 2'.
    // BUT standings are Driver 2 (rank 1), Driver 1 (rank 2).
    const raceData = {
      race: {
        race: {
          model: { entityId: 'r1' },
          name: 'Sorting Race',
          fuelOptions: { enabled: false },
          track: {
            model: { entityId: 't1' },
            name: 'Test Track',
            lanes: [
              { objectId: 'l1', length: 10, backgroundColor: '#550000', foregroundColor: '#ffffff' },
              { objectId: 'l2', length: 10, backgroundColor: '#005500', foregroundColor: '#ffffff' }
            ]
          }
        },
        drivers: [
          { objectId: 'rp1', driver: { model: { entityId: 'd1' }, name: 'Driver 1' } },
          { objectId: 'rp2', driver: { model: { entityId: 'd2' }, name: 'Driver 2' } }
        ],
        currentHeat: {
          objectId: 'h1',
          heatNumber: 1,
          heatDrivers: [
            {
              objectId: 'hd1',
              laneIndex: 0,
              driver: { objectId: 'rp1', driver: { name: 'Driver 1' } }
            },
            {
              objectId: 'hd2',
              laneIndex: 1,
              driver: { objectId: 'rp2', driver: { name: 'Driver 2' } }
            }
          ],
          standings: ['hd2', 'hd1'] // Order: Driver 2 then Driver 1
        }
      }
    };

    await TestSetupHelper.mockRaceData(page, raceData);

    await page.waitForTimeout(500);

    // Verify visually that Driver 2 is listed first
    // Screenshot will show the visual order
    await expect(page).toHaveScreenshot('raceday-sorted-by-standings.png', { maxDiffPixelRatio: 0.1 });
  });
});
