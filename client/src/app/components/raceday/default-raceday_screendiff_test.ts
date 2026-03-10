import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';

test.describe('Raceday Visuals for Fuel', () => {
  test.beforeEach(async ({ page }) => {
    // Listen for console logs from the browser
    page.on('console', msg => console.log(`BROWSER [${msg.type()}]: ${msg.text()}`));
    page.on('pageerror', err => console.error(`BROWSER ERROR: ${err.message}`));

    // Setup standard mocks
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.waitForLoadState('networkidle');

    // Override settings to use fuel columns via localStorage
    await TestSetupHelper.setupSettings(page, {
      racedayColumns: ['driver.name_driver.nickname', 'lapCount', 'participant.fuelLevel', 'fuelCapacity', 'fuelPercentage'],
      columnLayouts: {
        'driver.name_driver.nickname': { 'TopCenter': 'driver.name', 'BottomCenter': 'driver.nickname' },
        'lapCount': { 'CenterCenter': 'lapCount' },
        'participant.fuelLevel': { 'CenterCenter': 'participant.fuelLevel' },
        'fuelCapacity': { 'CenterCenter': 'fuelCapacity' },
        'fuelPercentage': { 'CenterCenter': 'fuelPercentage' }
      },
      columnAnchors: {
        'driver.name_driver.nickname': 'Center',
        'lapCount': 'Center',
        'participant.fuelLevel': 'Center',
        'fuelCapacity': 'Center',
        'fuelPercentage': 'Center'
      },
      columnWidths: {
        'driver.name_driver.nickname': 200,
        'lapCount': 100,
        'participant.fuelLevel': 100,
        'fuelCapacity': 100,
        'fuelPercentage': 100
      },
      columnVisibility: {}
    });
  });

  test('should display fuel levels correctly', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/default-raceday'));

    // Wait for the scalable content to be visible
    await expect(page.locator('.scalable-content')).toBeVisible();

    // Explicitly inject race data to ensure fuel options are enabled and columns are visible
    await page.evaluate(() => {
      const raceData = {
        race: {
          race: {
            model: { entityId: 'r1' },
            name: 'Mock GP',
            fuelOptions: {
              enabled: true,
              capacity: 100,
              usageType: 0,
              usageRate: 1.0,
              startLevel: 100
            },
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
              fuelLevel: 75.5,
              driver: {
                model: { entityId: 'd1' },
                name: 'Driver 1'
              }
            },
            {
              objectId: 'rp2',
              fuelLevel: 42.0,
              driver: {
                model: { entityId: 'd2' },
                name: 'Driver 2'
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
                  fuelLevel: 75.5,
                  driver: {
                    model: { entityId: 'd1' },
                    name: 'Driver 1'
                  }
                }
              },
              {
                objectId: 'hd2',
                laneIndex: 1,
                driver: {
                  objectId: 'rp2',
                  fuelLevel: 42.0,
                  driver: {
                    model: { entityId: 'd2' },
                    name: 'Driver 2'
                  }
                }
              }
            ]
          }
        }
      };
      // @ts-ignore
      window.mockRaceData(raceData);
    });

    // Wait for the component to process the update
    await page.waitForTimeout(500);

    // Verify presence of fuel-related columns
    await expect(page.locator('.table-headers text', { hasText: 'FUEL' }).first()).toBeVisible({ timeout: 10000 });

    await expect(page).toHaveScreenshot('raceday-fuel-levels.png', { maxDiffPixelRatio: 0.1 });
  });

  test('should display driver avatars when column is configured', async ({ page }) => {
    // Override settings for this specific test to include avatar column via localStorage
    await TestSetupHelper.setupSettings(page, {
      racedayColumns: ['driver.avatarUrl', 'driver.name'],
      columnLayouts: {
        'driver.avatarUrl': { 'CenterCenter': 'driver.avatarUrl' },
        'driver.name': { 'CenterCenter': 'driver.name' }
      },
      columnAnchors: {
        'driver.avatarUrl': 'Center',
        'driver.name': 'Center'
      },
      columnWidths: {
        'driver.avatarUrl': 100,
        'driver.name': 200
      },
      columnVisibility: {}
    });

    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/default-raceday'));

    // Emit a mock race update event with driver data and avatar
    await page.evaluate(() => {
      if ((window as any).mockRaceData) {
        const driverModel = {
          model: { entityId: 'd1' },
          name: 'Dave',
          avatarUrl: '/api/assets/download?filename=img1.png'
        };
        const participant = {
          objectId: 'p1',
          fuelLevel: 75,
          driver: driverModel
        };

        (window as any).mockRaceData({
          race: {
            race: {
              model: { entityId: 'r1' },
              name: 'Avatar Race',
              fuelOptions: {
                enabled: true,
                capacity: 100
              },
              track: {
                model: { entityId: 't1' },
                name: 'Test Track',
                lanes: [
                  { objectId: 'l1', length: 10, backgroundColor: '#550000', foregroundColor: '#ffffff' },
                  { objectId: 'l2', length: 10, backgroundColor: '#005500', foregroundColor: '#ffffff' }
                ]
              }
            },
            drivers: [participant],
            currentHeat: {
              objectId: 'h1',
              heatNumber: 1,
              heatDrivers: [
                {
                  objectId: 'hd1',
                  laneIndex: 0,
                  driver: participant,
                  actualDriver: driverModel
                }
              ]
            }
          }
        });
      }
    });

    // Wait for the component to process the update
    await page.waitForTimeout(500);

    // Wait for the avatar to be visible
    // The avatar is rendered as an SVG image tag
    const avatar = page.locator('.driver-row image').first();
    await expect(avatar).toBeVisible({ timeout: 15000 });
    await expect(avatar).toHaveAttribute('href', /img1.png/);

    await expect(page).toHaveScreenshot('raceday-driver-avatars.png', { maxDiffPixelRatio: 0.1 });
  });

  test('should display fuel levels for digital race', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/default-raceday'));

    // Emit a mock digital race update
    await page.evaluate(() => {
      if ((window as any).mockRaceData) {
        (window as any).mockRaceData({
          race: {
            race: {
              model: { entityId: 'r_digital' },
              name: 'Digital Haven Race',
              digitalFuelOptions: {
                enabled: true,
                capacity: 50,
                usageType: 0,
                usageRate: 4.0,
                startLevel: 50
              },
              track: {
                model: { entityId: 't_digital' },
                name: 'Digital Haven',
                hasDigitalFuel: true,
                lanes: [
                  { objectId: 'l1', length: 15, backgroundColor: '#ffff00', foregroundColor: '#000000' }
                ]
              }
            },
            drivers: [
              {
                objectId: 'p1',
                fuelLevel: 25,
                driver: { name: 'Digital Racer' }
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
                    objectId: 'p1',
                    fuelLevel: 25,
                    driver: { name: 'Digital Racer' }
                  }
                }
              ]
            }
          }
        });
      }
    });

    // Wait for the component to process
    await page.waitForTimeout(500);

    // Verify presence of fuel-related columns
    await expect(page.locator('.table-headers text', { hasText: 'FUEL' }).first()).toBeVisible({ timeout: 10000 });

    // Verify 50% fuel level (25/50)
    await expect(page.locator('text=50%')).toBeVisible({ timeout: 10000 });

    await expect(page).toHaveScreenshot('raceday-digital-fuel-levels.png', { maxDiffPixelRatio: 0.1 });
  });

  test('should scale fuel gauge correctly on 1-lane track', async ({ page }) => {
    // Columns: Avatar, nickname, lap count, fuel guage, lap time
    await TestSetupHelper.setupSettings(page, {
      racedayColumns: ['driver.avatarUrl', 'driver.nickname', 'lapCount', 'imageset_fuel-gauge-builtin', 'lastLapTime'],
      columnLayouts: {
        'driver.avatarUrl': { 'CenterCenter': 'driver.avatarUrl' },
        'driver.nickname': { 'CenterCenter': 'driver.nickname' },
        'lapCount': { 'CenterCenter': 'lapCount' },
        'imageset_fuel-gauge-builtin': { 'CenterCenter': 'imageset_fuel-gauge-builtin' },
        'lastLapTime': { 'CenterCenter': 'lastLapTime' }
      },
      columnAnchors: {
        'driver.avatarUrl': 'Center',
        'driver.nickname': 'Center',
        'lapCount': 'Center',
        'imageset_fuel-gauge-builtin': 'Center',
        'lastLapTime': 'Center'
      },
      columnWidths: {
        'driver.avatarUrl': 100,
        'driver.nickname': 200,
        'lapCount': 100,
        'imageset_fuel-gauge-builtin': 180,
        'lastLapTime': 275
      }
    });

    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/default-raceday'));

    await page.evaluate(() => {
      if ((window as any).mockRaceData) {
        (window as any).mockRaceData({
          race: {
            race: {
              model: { entityId: 'r1' },
              name: '1-Lane Scaling Race',
              fuelOptions: { enabled: true, capacity: 100 },
              track: {
                model: { entityId: 't1' },
                name: '1-Lane Track',
                lanes: [{ objectId: 'l1', length: 10, backgroundColor: '#0000ff', foregroundColor: '#ffffff' }]
              }
            },
            drivers: [{
              objectId: 'p1',
              fuelLevel: 50,
              driver: { name: 'Swamper', nickname: 'Swamper G', avatarUrl: '/api/assets/download?filename=img1.png' }
            }],
            heats: [{ heatNumber: 1 }],
            currentHeat: {
              objectId: 'h1',
              heatNumber: 1,
              heatDrivers: [{
                objectId: 'hd1',
                laneIndex: 0,
                lapCount: 4,
                lastLapTime: 12.345,
                driver: {
                  objectId: 'p1',
                  fuelLevel: 50,
                  driver: { name: 'Swamper', nickname: 'Swamper G', avatarUrl: '/api/assets/download?filename=img1.png' }
                }
              }]
            }
          }
        });
      }
    });

    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('raceday-1-lane-fuel-gauge.png', { maxDiffPixelRatio: 0.1 });
  });

  test('should scale fuel gauge correctly on 8-lane track', async ({ page }) => {
    // Columns: Avatar, nickname, lap count, fuel guage, lap time
    await TestSetupHelper.setupSettings(page, {
      racedayColumns: ['driver.avatarUrl', 'driver.nickname', 'lapCount', 'imageset_fuel-gauge-builtin', 'lastLapTime'],
      columnLayouts: {
        'driver.avatarUrl': { 'CenterCenter': 'driver.avatarUrl' },
        'driver.nickname': { 'CenterCenter': 'driver.nickname' },
        'lapCount': { 'CenterCenter': 'lapCount' },
        'imageset_fuel-gauge-builtin': { 'CenterCenter': 'imageset_fuel-gauge-builtin' },
        'lastLapTime': { 'CenterCenter': 'lastLapTime' }
      },
      columnAnchors: {
        'driver.avatarUrl': 'Center',
        'driver.nickname': 'Center',
        'lapCount': 'Center',
        'imageset_fuel-gauge-builtin': 'Center',
        'lastLapTime': 'Center'
      },
      columnWidths: {
        'driver.avatarUrl': 100,
        'driver.nickname': 200,
        'lapCount': 100,
        'imageset_fuel-gauge-builtin': 180,
        'lastLapTime': 275
      }
    });

    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/default-raceday'));

    await page.evaluate(() => {
      if ((window as any).mockRaceData) {
        const lanes = Array.from({ length: 8 }, (_, i) => ({
          objectId: `l${i + 1}`,
          length: 10,
          backgroundColor: i % 2 === 0 ? '#333333' : '#555555',
          foregroundColor: '#ffffff'
        }));

        const heatDrivers = lanes.map((_, i) => ({
          objectId: `hd${i + 1}`,
          laneIndex: i,
          lapCount: i + 1,
          lastLapTime: 10 + i,
          driver: {
            objectId: `p${i + 1}`,
            fuelLevel: 100 - (i * 10),
            driver: { name: `Driver ${i + 1}`, nickname: `Nick ${i + 1}`, avatarUrl: '/api/assets/download?filename=img1.png' }
          }
        }));

        (window as any).mockRaceData({
          race: {
            race: {
              model: { entityId: 'r8' },
              name: '8-Lane Scaling Race',
              fuelOptions: { enabled: true, capacity: 100 },
              track: {
                model: { entityId: 't8' },
                name: '8-Lane Track',
                lanes: lanes
              }
            },
            currentHeat: {
              objectId: 'h1',
              heatNumber: 1,
              heatDrivers: heatDrivers
            }
          }
        });
      }
    });

    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('raceday-8-lane-fuel-gauge.png', { maxDiffPixelRatio: 0.1 });
  });
});
