import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../../testing/test-setup_helper';
import { AcknowledgementModalHarnessE2e } from './acknowledgement-modal.harness.e2e';
import { com } from '../../../proto/message';
import InterfaceStatus = com.antigravity.InterfaceStatus;

test.describe('Acknowledgement Modal Visuals', () => {
  // Helper to dispatch an InterfaceEvent to all interface-data sockets
  const sendInterfaceEvent = async (page: any, status: any) => {
    const event = com.antigravity.InterfaceEvent.create({ status: { status } });
    const data = Array.from(com.antigravity.InterfaceEvent.encode(event).finish());
    await page.evaluate((data: any) => {
      // @ts-ignore
      const sockets = (window.allMockSockets || []).filter((s: any) => s.url && s.url.includes('interface-data'));
      sockets.forEach((socket: any) => {
        const ev = new MessageEvent('message', { data: new Uint8Array(data).buffer });
        socket.dispatchEvent(ev);
        if (socket.onmessage) socket.onmessage(ev);
      });
    }, data);
  };

  test.beforeEach(async ({ page }) => {
    // Disable mock heartbeat to control interface status manually
    // Scale watchdog timeouts down to 500ms so tests don't hit global timeouts
    await page.addInitScript(() => {
      // @ts-ignore
      window.disableMockHeartbeat = true;
      (window as any).WATCHDOG_TIMEOUT = 500;
    });
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await TestSetupHelper.setupRaceMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
  });

  test('should display NO_DATA modal', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/raceday'));
    await TestSetupHelper.waitForText(page, 'RACE COORDINATOR');

    // sendInterfaceEvent helper available from describe scope

    // DIAGNOSTICS: Check socket readiness
    const sockDiag = await page.evaluate(() => {
      const sockets = (window as any).allMockSockets || [];
      const iface = sockets.filter((s: any) => s.url && s.url.includes('interface-data'));
      return { count: sockets.length, ifaceCount: iface.length, states: iface.map((s: any) => s.readyState) };
    });
    console.log('[DIAG] Socket state:', JSON.stringify(sockDiag));

    // Prime with CONNECTED first — sets hasInitiallyConnected=true and lastInterfaceStatus=CONNECTED
    // This means the subsequent NO_DATA event triggers showInterfaceError() *immediately*
    // instead of going through the 500ms scheduleDisconnectedError(), avoiding the watchdog race.
    await sendInterfaceEvent(page, InterfaceStatus.CONNECTED);
    // Now send NO_DATA — will call showInterfaceError() immediately since hasInitiallyConnected=true
    await sendInterfaceEvent(page, InterfaceStatus.NO_DATA);

    const modalHost = page.locator('app-acknowledgement-modal');
    const harness = new AcknowledgementModalHarnessE2e(modalHost);

    await harness.waitForVisible(10000);

    await expect(async () => {
      expect(await harness.getTitle()).toContain('No Data Received');
    }).toPass();

    // Use modalHost for screenshot to ensure it captures the component area correctly
    await expect(modalHost).toHaveScreenshot('ack-modal-no-data.png');
  });

  test('should display DISCONNECTED modal after timeout', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/raceday'));
    await TestSetupHelper.waitForText(page, 'RACE COORDINATOR');

    // Priming CONNECTED pulse to reset ngOnInit timers
    await sendInterfaceEvent(page, InterfaceStatus.CONNECTED);

    // Simulate DISCONNECTED
    await sendInterfaceEvent(page, InterfaceStatus.DISCONNECTED);

    const modalHost = page.locator('app-acknowledgement-modal');
    const harness = new AcknowledgementModalHarnessE2e(modalHost);

    // waitForVisible leverages Playwright's native auto-waiting
    await harness.waitForVisible(10000);

    await expect(async () => {
      expect(await harness.getTitle()).toContain('Interface Disconnected');
    }).toPass();

    await expect(modalHost).toHaveScreenshot('ack-modal-disconnected.png');
  });

  test('should display CONNECTED modal on recovery', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/raceday'));
    await TestSetupHelper.waitForText(page, 'RACE COORDINATOR');

    // Priming CONNECTED pulse
    await sendInterfaceEvent(page, InterfaceStatus.CONNECTED);

    // 1. Simulate DISCONNECTED and wait for modal
    await sendInterfaceEvent(page, InterfaceStatus.DISCONNECTED);

    // Wait past the first 500ms timeout so the modal appears
    await page.waitForTimeout(700);

    // Test the duplicate event resilience
    await sendInterfaceEvent(page, InterfaceStatus.DISCONNECTED);

    const modalHost = page.locator('app-acknowledgement-modal');
    const harness = new AcknowledgementModalHarnessE2e(modalHost);

    await harness.waitForVisible(10000);

    await expect(async () => {
      expect(await harness.getTitle()).toContain('Interface Disconnected');
    }).toPass();

    // 2. Simulate CONNECTED (recovery)
    await sendInterfaceEvent(page, InterfaceStatus.CONNECTED);

    // Ensure CONNECTED modal is instantly visible
    await harness.waitForVisible(10000);

    await expect(async () => {
      expect(await harness.getTitle()).toContain('Interface Connected');
    }).toPass();

    await expect(modalHost).toHaveScreenshot('ack-modal-recovered.png');
  });
});
