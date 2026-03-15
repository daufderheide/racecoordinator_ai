import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';
import { DefaultRacedaySetupHarnessE2e } from './testing/default-raceday-setup.harness.e2e';

test.describe('Raceday Setup Menu Exclusivity', () => {
  const lang = 'en';
  test.use({ locale: lang });

  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);

    await TestSetupHelper.setupLocalStorage(page, {
      recentRaceIds: ['r1', 'r2'],
      selectedDriverIds: ['d1', 'd2'],
      racedaySetupWalkthroughSeen: true,
      language: lang
    });

    await TestSetupHelper.waitForLocalization(page, lang, page.goto('/'));

    await expect(page.locator('.setup-container')).toBeVisible({ timeout: 15000 });

    const splashScreen = page.locator('.splash-screen');
    if (await splashScreen.count() > 0) {
      await expect(splashScreen).not.toBeVisible({ timeout: 10000 });
    }

    await page.evaluate(() => document.fonts.ready);
    await TestSetupHelper.disableAnimations(page);

    await expect(page.getByText('Alice')).toBeVisible();
    await page.waitForTimeout(1000);
  });

  test('opening Config menu should close File menu', async ({ page }) => {
    const container = page.locator('.setup-container');
    const harness = new DefaultRacedaySetupHarnessE2e(container);

    await harness.openFileMenu();
    expect(await harness.isMenuDropdownVisible('file-menu-container')).toBe(true);

    await harness.openConfigMenu();

    expect(await harness.isMenuDropdownVisible('file-menu-container')).toBe(false);
    expect(await harness.isMenuDropdownVisible('config-menu-container')).toBe(true);

    await expect(page).toHaveScreenshot('config-closes-file.png');
  });

  test('opening Options menu should close Config menu', async ({ page }) => {
    const container = page.locator('.setup-container');
    const harness = new DefaultRacedaySetupHarnessE2e(container);

    await harness.openConfigMenu();
    expect(await harness.isMenuDropdownVisible('config-menu-container')).toBe(true);

    await harness.openOptionsMenu();

    expect(await harness.isMenuDropdownVisible('config-menu-container')).toBe(false);
    expect(await harness.isMenuDropdownVisible('options-menu-container')).toBe(true);

    await expect(page).toHaveScreenshot('options-closes-config.png');
  });

  test('opening Race selection should close Options menu', async ({ page }) => {
    const container = page.locator('.setup-container');
    const harness = new DefaultRacedaySetupHarnessE2e(container);

    await harness.openOptionsMenu();
    expect(await harness.isMenuDropdownVisible('options-menu-container')).toBe(true);

    await harness.clickRaceDropdown();

    expect(await harness.isMenuDropdownVisible('options-menu-container')).toBe(false);
    await expect(page.locator('.dropdown-menu')).toBeVisible();

    await expect(page).toHaveScreenshot('race-closes-options.png');
  });

  test('opening Race selection should close Localization sub-menu', async ({ page }) => {
    const container = page.locator('.setup-container');
    const harness = new DefaultRacedaySetupHarnessE2e(container);

    await harness.openOptionsMenu();
    await harness.clickOptionsMenuOptionByText('Localization');
    await expect(page.locator('.menu-dropdown.submenu')).toBeVisible();

    await harness.clickRaceDropdown();

    await page.waitForTimeout(500);

    expect(await harness.isMenuDropdownVisible('options-menu-container')).toBe(false);
    await expect(page.locator('.menu-dropdown.submenu')).not.toBeVisible();
    await expect(page.locator('.dropdown-menu')).toBeVisible();

    await expect(page).toHaveScreenshot('race-closes-localization.png');
  });
});

