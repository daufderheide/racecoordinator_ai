import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../../testing/test-setup_helper';
import { ImageSetEditorHarnessE2e } from './testing/image-set-editor.harness.e2e';
import { AssetManagerHarnessE2e } from '../testing/asset-manager.harness.e2e';

test.describe('Image Set Editor Visuals', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER [${msg.type()}]: ${msg.text()}`));
    page.on('pageerror', err => console.error(`BROWSER ERROR: ${err.message}`));

    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  test('should display empty image set editor modal', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/asset-manager'));

    const container = page.locator('.am-container');
    const amHarness = new AssetManagerHarnessE2e(container);

    // Click "IMAGE SETS" filter
    await amHarness.setFilterType('image_set');

    // Click "New Image Set" button
    await page.getByRole('button', { name: 'New Image Set' }).click();

    const modalHost = page.locator('app-image-set-editor');
    const harness = new ImageSetEditorHarnessE2e(modalHost);

    expect(await harness.isVisible()).toBe(true);
    expect(await harness.getTitle()).toContain('New Image Set');

    await expect(modalHost.locator('.modal-content')).toHaveScreenshot('image-set-editor-new.png');
  });

  test('should display image set editor with entries', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/asset-manager'));

    const container = page.locator('.am-container');
    const amHarness = new AssetManagerHarnessE2e(container);

    // Wait for assets to load
    await expect(page.locator('.asset-card')).toHaveCount(4);

    // Click edit on the 'Custom Dash' image set card
    // We can use a helper or just locator for now if harness doesn't support "click edit by name"
    // Wait, AssetManagerHarness has clickEditAsset(index)
    // To find index of 'Custom Dash':
    const count = await amHarness.getAssetCardsCount();
    let editIndex = -1;
    for (let i = 0; i < count; i++) {
        if ((await amHarness.getAssetCardName(i)).includes('Custom Dash')) {
            editIndex = i;
            break;
        }
    }
    
    expect(editIndex).toBeGreaterThan(-1);
    
    // Click edit icon inside the card
    await page.locator('.asset-card').nth(editIndex).locator('.action-icon[title="Edit"]').click();

    const modalHost = page.locator('app-image-set-editor');
    const harness = new ImageSetEditorHarnessE2e(modalHost);

    expect(await harness.isVisible()).toBe(true);
    expect(await harness.getTitle()).toContain('Edit Image Set');

    // Custom Dash has 2 entries in setupAssetMocks
    expect(await harness.getEntryCount()).toBe(2);

    await expect(modalHost.locator('.modal-content')).toHaveScreenshot('image-set-editor-edit.png');
  });
});

