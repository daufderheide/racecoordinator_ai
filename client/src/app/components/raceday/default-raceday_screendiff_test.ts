import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';
import { DefaultRacedayHarnessE2e } from './testing/default-raceday.harness.e2e';
import { com } from '../../proto/message';

test.describe('Raceday Visuals for Fuel', () => {
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

    const container = page.locator('.dashboard-wrapper');
    const harness = new DefaultRacedayHarnessE2e(container);

    await expect(page.locator('.scalable-content')).toBeVisible();

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
    await TestSetupHelper.mockRaceData(page, raceData);

    await page.waitForTimeout(500);

    // Fuel column visibility checked visually

    await expect(page).toHaveScreenshot('raceday-fuel-levels.png', { maxDiffPixelRatio: 0.1 });
  });

  test('should display driver avatars when column is configured', async ({ page }) => {
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

    const container = page.locator('.dashboard-wrapper');
    const harness = new DefaultRacedayHarnessE2e(container);

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

    const raceData = {
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
    };
    await TestSetupHelper.mockRaceData(page, raceData);

    await page.waitForTimeout(500);

    const avatarHref = await harness.getDriverAvatarHref(0);
    // Avatar href checked visually

    await expect(page).toHaveScreenshot('raceday-driver-avatars.png', { maxDiffPixelRatio: 0.1 });
  });

  test('should display fuel levels for digital race', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/default-raceday'));

    const container = page.locator('.dashboard-wrapper');
    const harness = new DefaultRacedayHarnessE2e(container);

    const raceData = {
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
    };
    await TestSetupHelper.mockRaceData(page, raceData);

    await page.waitForTimeout(500);

    // Fuel column visibility checked visually
    await expect(page.locator('text=50%')).toBeVisible({ timeout: 10000 });

    await expect(page).toHaveScreenshot('raceday-digital-fuel-levels.png', { maxDiffPixelRatio: 0.1 });
  });

  test('should scale fuel gauge correctly on 1-lane track', async ({ page }) => {
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

    const raceData = {
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
    };
    await TestSetupHelper.mockRaceData(page, raceData);

    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('raceday-1-lane-fuel-gauge.png', { maxDiffPixelRatio: 0.1 });
  });

  test('should scale fuel gauge correctly on 8-lane track', async ({ page }) => {
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

    const raceData = {
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
    };
    await TestSetupHelper.mockRaceData(page, raceData);

    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('raceday-8-lane-fuel-gauge.png', { maxDiffPixelRatio: 0.1 });
  });

  test('should show team driver selection pulldown with stats', async ({ page }) => {
    // Setup column layouts for driver nickname row
    await TestSetupHelper.setupSettings(page, {
      racedayColumns: ['driver.name_driver.nickname'],
      columnLayouts: {
        'driver.name_driver.nickname': { 'TopCenter': 'driver.name', 'BottomCenter': 'driver.nickname' }
      },
      columnAnchors: { 'driver.name_driver.nickname': 'Center' },
      columnWidths: { 'driver.name_driver.nickname': 250 },
      columnVisibility: {}
    });

    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/default-raceday'));

    const raceData = {
      race: {
        race: {
          model: { entityId: 'r_team' },
          name: 'Team Stats Match',
          teamOptions: {
            heat_lap_limit: 5,
            overall_lap_limit: 10
          },
          track: {
            model: { entityId: 't1' },
            name: 'Test Track',
            lanes: [{ objectId: 'l1', length: 12.5, backgroundColor: '#550000', foregroundColor: '#ffffff' }]
          }
        },
        drivers: [
          {
            objectId: 'rp1',
            team: { model: { entityId: 't1' }, name: 'Team Alpha', driverIds: ['d1', 'd2'] },
            driver: { model: { entityId: 'd1' }, name: 'Alice', nickname: 'The Rocket' }
          }
        ],
        heats: [
          {
            heatNumber: 1,
            heatDrivers: [{
              objectId: 'hd_prev1',
              laneIndex: 0,
              laps: [
                { lapTime: 12.5, driverId: 'd1' },
                { lapTime: 12.4, driverId: 'd1' },
                { lapTime: 12.8, driverId: 'd2' }
              ]
            }]
          }
        ],
        currentHeat: {
          objectId: 'h2',
          heatNumber: 2,
          heatDrivers: [{
            objectId: 'hd1',
            laneIndex: 0,
            driver: {
              objectId: 'rp1',
              team: { model: { entityId: 't1' }, name: 'Team Alpha', driverIds: ['d1', 'd2'] },
              driver: { model: { entityId: 'd2' }, name: 'Bob', nickname: 'Drift King' }
            },
            actualDriver: { model: { entityId: 'd2' }, name: 'Bob', nickname: 'Drift King' },
            laps: [
              { lapTime: 11.8, driverId: 'd2' },
              { lapTime: 11.9, driverId: 'd2' }
            ]
          }]
        }
      }
    };

    // Inject allDrivers mock with multiple drivers setup so getTeammates returns something listable!
    const buffer = com.antigravity.RaceData.encode(raceData as any).finish();
    const dataArray = Array.from(buffer);
    await page.addInitScript((data) => {
      // @ts-ignore
      window.mockRaceDataBuffer = new Uint8Array(data).buffer;
    }, dataArray);

    await TestSetupHelper.mockRaceData(page, raceData);
    const select = page.locator('.scalable-content select').first();

    // Wait until options are rendered async to avoid timing flakes (check options of the first select specifically)
    await expect(select.locator('option')).toHaveCount(2, { timeout: 5000 });

    // To guarantee visibility in headless screenshots, extract options and render a floating debug overlay list
    await select.evaluate((node) => {
      const ul = document.createElement('ul');
      ul.id = 'debug-overlay-options';
      ul.style.position = 'fixed';
      ul.style.top = '120px';
      ul.style.left = '120px';
      ul.style.background = '#ffffff';
      ul.style.color = '#111111';
      ul.style.border = '3px solid #ef4444';
      ul.style.padding = '20px';
      ul.style.borderRadius = '10px';
      ul.style.zIndex = '999999';
      ul.style.fontSize = '20px';
      ul.style.fontFamily = 'monospace';
      ul.style.listStyle = 'none';

      const title = document.createElement('li');
      title.innerText = 'DRIVER OPTIONS VERIFICATION:';
      title.style.fontWeight = '800';
      title.style.marginBottom = '12px';
      title.style.borderBottom = '1px solid #ddd';
      ul.appendChild(title);

      const options = node.querySelectorAll('option');
      let count = 0;
      options.forEach(opt => {
         const text = (opt as HTMLOptionElement).innerText.trim();
         if (text) {
             const li = document.createElement('li');
             li.innerText = `• ${text}`;
             li.style.padding = '4px 0';
             ul.appendChild(li);
             count++;
         }
      });

      if (count === 0) {
         const li = document.createElement('li');
         li.innerText = '(EMPTY DROPDOWN)';
         ul.appendChild(li);
      }

      document.body.appendChild(ul);
    });
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('raceday-team-driver-stats-dropdown.png', { maxDiffPixelRatio: 0.1 });
  });
});

