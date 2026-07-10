import { expect, test } from "@playwright/test";
import { InterfaceEvent, InterfaceStatus } from "@app/proto/antigravity";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { AcknowledgementModalHarnessE2e } from "./testing/acknowledgement-modal.harness.e2e";

test.describe("Acknowledgement Modal Visuals", () => {
  // Helper to dispatch an InterfaceEvent to all interface-data sockets
  const sendInterfaceEvent = async (page: any, status: any) => {
    const event = InterfaceEvent.create({ status: { status } });
    const data = Array.from(InterfaceEvent.encode(event).finish());
    await page.evaluate((data: any) => {
      // @ts-ignore
      const sockets = (window.allMockSockets || []).filter(
        (s: any) => s.url && s.url.includes("interface-data"),
      );
      sockets.forEach((socket: any) => {
        const ev = new MessageEvent("message", {
          data: new Uint8Array(data).buffer,
        });
        socket.dispatchEvent(ev);
        if (socket.onmessage) socket.onmessage(ev);
      });
    }, data);
  };

  test.beforeEach(async ({ page }) => {
    test.slow();
    // Disable mock heartbeat to control interface status manually
    // Scale watchdog timeouts down to 500ms so tests don't hit global timeouts
    await page.addInitScript(() => {
      // @ts-ignore
      window.disableMockHeartbeat = true;
      (window as any).WATCHDOG_TIMEOUT = 2000;
      (window as any).INITIAL_WATCHDOG_TIMEOUT = 2000;
    });
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
  });

  test("should display NO_DATA modal", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/raceday"),
    );
    await page.locator(".scalable-content").waitFor({ state: "visible" });

    // Prime with CONNECTED first
    await sendInterfaceEvent(page, InterfaceStatus.CONNECTED);

    // Increase timeout to prevent watchdog overwriting NO_DATA modal title while asserting
    await page.evaluate(() => {
      (window as any).WATCHDOG_TIMEOUT = 100000;
      (window as any).INITIAL_WATCHDOG_TIMEOUT = 100000;
    });

    // Now send NO_DATA — calls showInterfaceError() immediately
    await sendInterfaceEvent(page, InterfaceStatus.NO_DATA);

    const modalHost = page.locator("app-acknowledgement-modal");
    const harness = new AcknowledgementModalHarnessE2e(modalHost);

    // Wait for the modal to be visible before screenshot
    await harness.waitForVisible(10000);

    // Use modal-content for screenshot to avoid transparent background flakiness
    await expect(modalHost.locator(".modal-content")).toHaveScreenshot(
      "ack-modal-no-data.png",
    );
  });

  test("should display DISCONNECTED modal after timeout", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/raceday"),
    );
    await page.locator(".scalable-content").waitFor({ state: "visible" });

    // Priming CONNECTED pulse to reset ngOnInit timers
    await sendInterfaceEvent(page, InterfaceStatus.CONNECTED);

    const modalHost = page.locator("app-acknowledgement-modal");
    const harness = new AcknowledgementModalHarnessE2e(modalHost);

    // Initial page load watchdog will have fired and shown Disconnected modal,
    // and sending CONNECTED turns it to "Interface Connected" modal.
    // We must acknowledge (hide) it first to make sure we have a clean background state.
    await harness.waitForVisible(10000);
    await harness.clickAcknowledge();

    // Wait for it to become invisible
    await page.waitForFunction((host: string) => {
      const el = document.querySelector(host);
      return !el || el.querySelector(".modal-backdrop") === null;
    }, "app-acknowledgement-modal");

    // Simulate DISCONNECTED with 1000ms delay threshold
    await page.evaluate(() => {
      (window as any).WATCHDOG_TIMEOUT = 1000;
      (window as any).INITIAL_WATCHDOG_TIMEOUT = 1000;
    });
    await sendInterfaceEvent(page, InterfaceStatus.DISCONNECTED);

    // Wait for the modal to be visible and stable
    await harness.waitForVisible(10000);
    await page.waitForTimeout(200); // Allow re-render to settle without checking text

    await expect(modalHost.locator(".modal-content")).toHaveScreenshot(
      "ack-modal-disconnected.png",
    );
  });

  test("should display CONNECTED modal on recovery", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/raceday"),
    );
    await page.locator(".scalable-content").waitFor({ state: "visible" });

    // Priming CONNECTED pulse
    await sendInterfaceEvent(page, InterfaceStatus.CONNECTED);

    // 1. Simulate DISCONNECTED and wait for modal
    await page.evaluate(() => {
      (window as any).WATCHDOG_TIMEOUT = 1000;
      (window as any).INITIAL_WATCHDOG_TIMEOUT = 1000;
    });
    await sendInterfaceEvent(page, InterfaceStatus.DISCONNECTED);

    // Wait past the first 1000ms timeout so the modal appears
    await page.waitForTimeout(1200);

    // Test the duplicate event resilience
    await sendInterfaceEvent(page, InterfaceStatus.DISCONNECTED);

    const modalHost = page.locator("app-acknowledgement-modal");
    const harness = new AcknowledgementModalHarnessE2e(modalHost);

    // Wait for the Disconnected modal to be visible
    await harness.waitForVisible(10000);
    await page.waitForTimeout(200);

    // 2. Simulate CONNECTED (recovery) - disable watchdog overwrite asserting
    await page.evaluate(() => {
      (window as any).WATCHDOG_TIMEOUT = 100000;
      (window as any).INITIAL_WATCHDOG_TIMEOUT = 100000;
    });
    await sendInterfaceEvent(page, InterfaceStatus.CONNECTED);

    // Wait for the Connected (recovery) modal to be visible
    await harness.waitForVisible(10000);
    await page.waitForTimeout(200);

    await expect(modalHost.locator(".modal-content")).toHaveScreenshot(
      "ack-modal-recovered.png",
    );
  });
});
