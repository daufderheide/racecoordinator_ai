import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../../testing/test-setup_helper';
import { com } from '../../../proto/message';
import InterfaceStatus = com.antigravity.InterfaceStatus;

test.describe('Acknowledgement Modal Visuals', () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
  });

  test('should display NO_DATA modal', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/raceday'));
    await TestSetupHelper.waitForText(page, 'RACE COORDINATOR');

    // Simulate NO_DATA
    await page.evaluate(() => {
      const statusEvent = {
        status: {
          status: 2 // NO_DATA
        }
      };
      // We need to encode it if the app expects binary, but DefaultRacedayComponent receives decoded object from DataService?
      // DataService uses protobufjs to decode.
      // Wait, TestSetupHelper mocks the WebSocket with BINARY data.
      // The app decodes it.
      // So I need to send binary data.

      // However, usually one would use the proto class to encode.
      // But I can't easily import the proto class inside page.evaluate.
      // I can encode it in Node context (here) and pass the buffer to page.evaluate.
    });

    // Wait 1s for sockets to be ready
    await page.waitForTimeout(1000);

    // Construct the message in Node
    const interfaceEvent = com.antigravity.InterfaceEvent.create({
      status: {
        status: InterfaceStatus.NO_DATA
      }
    });
    const buffer = com.antigravity.InterfaceEvent.encode(interfaceEvent).finish();
    const dataArray = Array.from(buffer);

    await page.evaluate((data) => {
      // @ts-ignore
      const sockets = (window.allMockSockets || []).filter(s => s.url && s.url.includes('interface-data'));
      sockets.forEach(socket => {
        const event = new MessageEvent('message', {
          data: new Uint8Array(data).buffer
        });
        socket.dispatchEvent(event);
        if (socket.onmessage) socket.onmessage(event);
      });
    }, dataArray);

    const modal = page.locator('app-acknowledgement-modal .modal-content');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('No Data Received');
    await expect(modal).toHaveScreenshot('ack-modal-no-data.png');
  });

  test('should display DISCONNECTED modal after timeout', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/raceday'));
    await TestSetupHelper.waitForText(page, 'RACE COORDINATOR');

    // Install fake clock
    await page.clock.install();

    // Priming CONNECTED pulse to reset ngOnInit timers
    const connectedPulse = com.antigravity.InterfaceEvent.create({
      status: { status: InterfaceStatus.CONNECTED }
    });
    const connectedPulseBuffer = com.antigravity.InterfaceEvent.encode(connectedPulse).finish();
    const connectedPulseArray = Array.from(connectedPulseBuffer);

    await page.evaluate((data) => {
      // @ts-ignore
      const sockets = (window.allMockSockets || []).filter(s => s.url && s.url.includes('interface-data'));
      sockets.forEach(socket => {
        const event = new MessageEvent('message', {
          data: new Uint8Array(data).buffer
        });
        socket.dispatchEvent(event);
        if (socket.onmessage) socket.onmessage(event);
      });
    }, connectedPulseArray);

    // Simulate DISCONNECTED
    const interfaceEvent = com.antigravity.InterfaceEvent.create({
      status: {
        status: InterfaceStatus.DISCONNECTED
      }
    });
    const buffer = com.antigravity.InterfaceEvent.encode(interfaceEvent).finish();
    const dataArray = Array.from(buffer);

    await page.evaluate((data) => {
      // @ts-ignore
      const sockets = (window.allMockSockets || []).filter(s => s.url && s.url.includes('interface-data'));
      sockets.forEach(socket => {
        const event = new MessageEvent('message', {
          data: new Uint8Array(data).buffer
        });
        socket.dispatchEvent(event);
        if (socket.onmessage) socket.onmessage(event);
      });
    }, dataArray);

    // Should NOT be visible immediately
    const modal = page.locator('app-acknowledgement-modal .modal-content');
    await expect(modal).not.toBeVisible();

    // Fast forward 3s
    await page.clock.fastForward(3000);
    await expect(modal).not.toBeVisible();

    // Emit same status to reset watchdog (but not disconnect timer)
    await page.evaluate((data) => {
      // @ts-ignore
      const sockets = (window.allMockSockets || []).filter(s => s.url && s.url.includes('interface-data'));
      sockets.forEach(socket => {
        const event = new MessageEvent('message', {
          data: new Uint8Array(data).buffer
        });
        socket.dispatchEvent(event);
        if (socket.onmessage) socket.onmessage(event);
      });
    }, dataArray);

    // Fast forward remaining 2.1s (total 5.1s)
    await page.clock.fastForward(2100);

    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Interface Disconnected');
    await expect(modal).toHaveScreenshot('ack-modal-disconnected.png');
  });

  test('should display CONNECTED modal on recovery', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/raceday'));
    await TestSetupHelper.waitForText(page, 'RACE COORDINATOR');

    await page.clock.install();

    // Priming CONNECTED pulse
    const connectedPulse = com.antigravity.InterfaceEvent.create({
      status: { status: InterfaceStatus.CONNECTED }
    });
    const connectedPulseBuffer = com.antigravity.InterfaceEvent.encode(connectedPulse).finish();
    await page.evaluate((data) => {
      // @ts-ignore
      const sockets = (window.allMockSockets || []).filter(s => s.url && s.url.includes('interface-data'));
      sockets.forEach(socket => {
        const event = new MessageEvent('message', { data: new Uint8Array(data).buffer });
        socket.dispatchEvent(event);
        if (socket.onmessage) socket.onmessage(event);
      });
    }, Array.from(connectedPulseBuffer));

    // 1. Simulate DISCONNECTED and wait for modal
    const disconnectedEvent = com.antigravity.InterfaceEvent.create({
      status: { status: InterfaceStatus.DISCONNECTED }
    });
    const disconnectedBuffer = com.antigravity.InterfaceEvent.encode(disconnectedEvent).finish();

    await page.evaluate((data) => {
      // @ts-ignore
      const sockets = (window.allMockSockets || []).filter(s => s.url && s.url.includes('interface-data'));
      sockets.forEach(socket => {
        const event = new MessageEvent('message', { data: new Uint8Array(data).buffer });
        socket.dispatchEvent(event);
        if (socket.onmessage) socket.onmessage(event);
      });
    }, Array.from(disconnectedBuffer));

    // Wait for DISCONNECTED modal with watchdog reset
    await page.clock.fastForward(3000);
    await page.evaluate((data) => {
      // @ts-ignore
      const sockets = (window.allMockSockets || []).filter(s => s.url && s.url.includes('interface-data'));
      sockets.forEach(socket => {
        const event = new MessageEvent('message', { data: new Uint8Array(data).buffer });
        socket.dispatchEvent(event);
        if (socket.onmessage) socket.onmessage(event);
      });
    }, Array.from(disconnectedBuffer));
    await page.clock.fastForward(2100);

    const modal = page.locator('app-acknowledgement-modal .modal-content');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Interface Disconnected');

    // 2. Simulate CONNECTED (recovery)
    const connectedEvent = com.antigravity.InterfaceEvent.create({
      status: { status: InterfaceStatus.CONNECTED }
    });
    const connectedBuffer = com.antigravity.InterfaceEvent.encode(connectedEvent).finish();

    await page.evaluate((data) => {
      // @ts-ignore
      const sockets = (window.allMockSockets || []).filter(s => s.url && s.url.includes('interface-data'));
      sockets.forEach(socket => {
        const event = new MessageEvent('message', { data: new Uint8Array(data).buffer });
        socket.dispatchEvent(event);
        if (socket.onmessage) socket.onmessage(event);
      });
    }, Array.from(connectedBuffer));

    // Modal should update to "Connected"
    await expect(modal).toContainText('Interface Connected');
    await expect(modal).toHaveScreenshot('ack-modal-recovered.png');
  });
});
