import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';
import { DefaultRacedayHarnessE2e } from './testing/default-raceday.harness.e2e';

test.describe('Raceday Visuals for Empty Lanes', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER [${msg.type()}]: ${msg.text()}`));
    page.on('pageerror', err => console.error(`BROWSER ERROR: ${err.message}`));

    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.waitForLoadState('networkidle');

    await TestSetupHelper.setupSettings(page, {
      racedayColumns: ['driver.name', 'driver.nickname', 'seed', 'rankHeat', 'rankOverall', 'lapCount', 'participant.fuelLevel'],
      columnLayouts: {
        'driver.name': { 'CenterCenter': 'driver.name' },
        'driver.nickname': { 'CenterCenter': 'driver.nickname' },
        'seed': { 'CenterCenter': 'seed' },
        'rankHeat': { 'CenterCenter': 'rankHeat' },
        'rankOverall': { 'CenterCenter': 'rankOverall' },
        'lapCount': { 'CenterCenter': 'lapCount' },
        'participant.fuelLevel': { 'CenterCenter': 'participant.fuelLevel' }
      },
      columnAnchors: {
        'driver.name': 'Center',
        'driver.nickname': 'Center',
        'seed': 'Center',
        'rankHeat': 'Center',
        'rankOverall': 'Center',
        'lapCount': 'Center',
        'participant.fuelLevel': 'Center'
      },
      columnWidths: {
        'driver.name': 200,
        'driver.nickname': 200,
        'seed': 80,
        'rankHeat': 80,
        'rankOverall': 80,
        'lapCount': 80,
        'participant.fuelLevel': 80
      },
      columnVisibility: {}
    });
  });

  test('should hide specific column values for empty lanes', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/default-raceday'));

    const container = page.locator('.dashboard-wrapper');
    const harness = new DefaultRacedayHarnessE2e(container);

    await expect(page.locator('.scalable-content')).toBeVisible();

    await page.evaluate(() => {
      const raceData = {
        race: {
          race: {
            model: { entityId: 'r1' },
            name: 'Empty Lane Test GP',
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
            {
              objectId: 'rp1',
              seed: 5,
              rank: 10,
              driver: {
                model: { entityId: 'd1' },
                name: 'Real Driver',
                nickname: 'Speedy'
              }
            },
            {
              objectId: 'rp_empty',
              seed: 0,
              driver: {
                model: { entityId: '' },
                name: 'Empty',
                nickname: 'Empty'
              }
            }
          ],
          currentHeat: {
            objectId: 'h1',
            heatNumber: 1,
            heatDrivers: [
              {
                objectId: 'hd1',
                laneIndex: 0,
                driver: {
                  objectId: 'rp1',
                  seed: 5,
                  driver: { model: { entityId: 'd1' }, name: 'Real Driver', nickname: 'Speedy' }
                }
              },
              {
                objectId: 'hd2',
                laneIndex: 1,
                driver: {
                  objectId: 'rp_empty',
                  seed: 0,
                  driver: { model: { entityId: '' }, name: 'Empty', nickname: 'Empty' }
                }
              }
            ]
          }
        }
      };
      // @ts-ignore
      window.mockRaceData(raceData);
    });

    await page.waitForTimeout(1000);

    const row0Text = await harness.getDriverRowText(0);
    expect(row0Text).toContain('(5)');

    await expect(page.locator('text=Empty Lane').first()).toBeVisible({ timeout: 10000 });

    await expect(page).toHaveScreenshot('raceday-empty-lanes.png', { maxDiffPixelRatio: 0.1 });
  });
});

