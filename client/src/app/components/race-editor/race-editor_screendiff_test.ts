import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';
import { RaceEditorHarnessE2e } from './testing/race-editor.harness.e2e';

test.describe('Race Editor Visuals', () => {
  test.beforeEach(async ({ page }) => {
    // Setup standard mocks
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceMocks(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForLoadState('networkidle');


    // Mock Heat Preview API
    await page.route('**/api/heats/preview', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          heats: [
            {
              heatNumber: 1,
              lanes: [
                { laneNumber: 1, driverNumber: 1, backgroundColor: '#ff0000', foregroundColor: '#ffffff' },
                { laneNumber: 2, driverNumber: 2, backgroundColor: '#00ff00', foregroundColor: '#000000' }
              ]
            }
          ]
        }),
      });
    });
  });

  test('should display race editor for existing race', async ({ page }) => {
    // Navigate to Race Editor
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/race-editor?id=r1&driverCount=4'));
    const harness = new RaceEditorHarnessE2e(page.locator('body'));

    // Verify Editor Form is attached
    await page.waitForTimeout(2000);
    await expect(page.locator('.editor-panel')).toBeAttached({ timeout: 10000 });
    await expect(page.locator('app-heat-list')).toBeAttached({ timeout: 10000 });

    // Disable animations
    await TestSetupHelper.disableAnimations(page);

    // Screenshot the entire editor
    await expect(page).toHaveScreenshot('race-editor.png', { timeout: 15000, maxDiffPixelRatio: 0.05 });
  });

  test('should display validation error for duplicate name', async ({ page }) => {
    // Navigate to Race Editor
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/race-editor?id=r1&driverCount=4'));
    const harness = new RaceEditorHarnessE2e(page.locator('body'));

    // Change name to a duplicate
    await harness.setName('Time Trial');

    // With auto-saving, duplicate name triggers an 'invalid' class highlighting
    await page.waitForTimeout(2000);

    // Disable animations
    await TestSetupHelper.disableAnimations(page);

    // Screenshot the name input area showing the potential error style if any
    await expect(page).toHaveScreenshot('race-editor-duplicate-name.png', { timeout: 15000, maxDiffPixelRatio: 0.05 });
  });

  test('should show error modal on duplication failure', async ({ page }) => {
    // Navigate to Race Editor
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/race-editor?id=r1&driverCount=4'));
    const harness = new RaceEditorHarnessE2e(page.locator('body'));

    // Mock save failure (create race)
    await page.route('**/api/races', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify('Internal Server Error')
        });
      } else {
        await route.continue();
      }
    });

    // Wait for Editor Form to fully load before triggering actions
    await page.waitForSelector('.editor-panel', { state: 'visible', timeout: 10000 });

    // Click details - Duplication
    await harness.clickDuplicate();
    await page.waitForTimeout(1000);

    // Wait for Error Modal (app-acknowledgement-modal .modal-backdrop)
    await page.waitForSelector('app-acknowledgement-modal .modal-backdrop', { state: 'visible', timeout: 10000 });
    const backdrop = page.locator('app-acknowledgement-modal .modal-backdrop');

    // Disable animations
    await TestSetupHelper.disableAnimations(page);

    // Screenshot the error modal
    await expect(backdrop).toHaveScreenshot('race-editor-save-error.png', { timeout: 15000, maxDiffPixelRatio: 0.05 });
  });

  test('should display fuel options when enabled', async ({ page }) => {
    // Navigate to Race Editor
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/race-editor?id=r1&driverCount=4'));

    // Verify Editor Form is attached
    await page.waitForTimeout(2000);
    await expect(page.locator('.editor-panel')).toBeAttached({ timeout: 10000 });

    // Toggle fuel enabled checkbox programmatically to avoid UI click flakiness
    const enableCheckbox = page.locator('input[type="checkbox"]').first();
    await enableCheckbox.evaluate((node: HTMLInputElement) => {
      node.checked = true;
      node.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForTimeout(500);

    // Wait for charts to render before screenshotting
    await page.waitForSelector('.fuel-graphs-container', { state: 'visible', timeout: 10000 });

    // Disable animations
    await TestSetupHelper.disableAnimations(page);

    // Scroll down to ensure fuel section is fully visible
    await page.locator('.preview-panel').evaluate((node) => node.scrollTop = node.scrollHeight);
    await page.waitForTimeout(500);

    // Screenshot the fuel configuration section
    await expect(page).toHaveScreenshot('race-editor-fuel-options.png', { fullPage: true, timeout: 15000, maxDiffPixelRatio: 0.05 });
  });

  test('should hide fuel graphs when analog fuel is disabled', async ({ page }) => {
    // Navigate to Race Editor
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/race-editor?id=r1&driverCount=4'));

    // Verify Editor Form is attached
    await page.waitForTimeout(2000);
    await expect(page.locator('.editor-panel')).toBeAttached({ timeout: 10000 });

    // Wait for loading to complete
    await page.waitForTimeout(1000);

    // Disable animations
    await TestSetupHelper.disableAnimations(page);

    // Scroll down to ensure fuel section is fully visible
    await page.locator('.preview-panel').evaluate((node) => node.scrollTop = node.scrollHeight);
    await page.waitForTimeout(500);

    // Screenshot the fuel configuration section
    await expect(page).toHaveScreenshot('race-editor-fuel-options-disabled.png', { fullPage: true, timeout: 15000, maxDiffPixelRatio: 0.05 });
  });

  test('should display digital fuel options for digital track', async ({ page }) => {
    // Setup digital track mocks
    await TestSetupHelper.setupDigitalTrackMocks(page);

    // Navigate to Race Editor for a new race with the digital track
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/race-editor?id=new&driverCount=4'));
    const harness = new RaceEditorHarnessE2e(page.locator('body'));

    // Wait for the track options to load in the select
    await page.waitForSelector('#track-select option:has-text("Digital Haven")', { state: 'attached', timeout: 10000 });

    // Select the digital track using the harness
    await harness.setTrack('t_digital');

    // Wait for the UI to update and the digital fuel section to appear
    await page.waitForSelector('#digital-fuel-section', { state: 'visible', timeout: 10000 });

    // Scroll down to ensure digital fuel section is visible in the panel
    await page.locator('.preview-panel').evaluate((node) => node.scrollTop = node.scrollHeight);
    await page.waitForTimeout(500);

    // Enable digital fuel - click the label since the native checkbox is hidden (0x0)
    await page.locator('#digital-fuel-enabled-label').click();
    await page.waitForTimeout(500);

    // Wait for digital charts to render
    await page.waitForSelector('.fuel-graphs-container', { state: 'visible', timeout: 10000 });

    // Disable animations
    await TestSetupHelper.disableAnimations(page);

    // Last scroll to bottom to capture everything
    await page.locator('.preview-panel').evaluate((node) => node.scrollTop = node.scrollHeight);
    await page.waitForTimeout(1000);

    // Screenshot the digital fuel configuration section
    await expect(page).toHaveScreenshot('race-editor-digital-fuel-options.png', { fullPage: true, timeout: 15000, maxDiffPixelRatio: 0.05 });
  });
});
