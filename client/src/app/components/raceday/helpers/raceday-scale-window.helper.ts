import { RacedayLayoutUtils } from "@app/components/raceday/utils/raceday-layout.utils";

export class RacedayScaleWindowHelper {
  static toggleLayoutEditorMinimize(host: any, event: Event): void {
    event.stopPropagation();
    host.isLayoutEditorMinimized = !host.isLayoutEditorMinimized;

    const settings =
      host.editingSettings() || host.settingsService.getSettings();
    settings.layoutEditorMinimized = host.isLayoutEditorMinimized;

    const globalSettings = host.settingsService.getSettings();
    globalSettings.layoutEditorMinimized = host.isLayoutEditorMinimized;
    host.settingsService.saveSettings(globalSettings);
  }

  static ensureToolboxVisible(host: any): void {
    host.isLayoutEditorMinimized = false;
    host.layoutEditorPosition = host.clampLayoutEditorPosition(
      host.layoutEditorPosition,
    );
    host.cdr.markForCheck();
  }

  static resetLayoutEditorPosition(host: any, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    host.isLayoutEditorMinimized = false;
    host.layoutEditorPosition = { x: 0, y: 0 };
    const settings =
      host.editingSettings() || host.settingsService.getSettings();
    settings.layoutEditorPositionX = 0;
    settings.layoutEditorPositionY = 0;
    settings.layoutEditorMinimized = false;
    const globalSettings = host.settingsService.getSettings();
    globalSettings.layoutEditorPositionX = 0;
    globalSettings.layoutEditorPositionY = 0;
    globalSettings.layoutEditorMinimized = false;
    host.settingsService.saveSettings(globalSettings);
    host.cdr.markForCheck();
  }

  static onLayoutEditorDragEnded(host: any, event: any): void {
    const pos = event.source.getFreeDragPosition();
    host.layoutEditorPosition = pos;

    const settings =
      host.editingSettings() || host.settingsService.getSettings();
    settings.layoutEditorPositionX = pos.x;
    settings.layoutEditorPositionY = pos.y;

    const globalSettings = host.settingsService.getSettings();
    globalSettings.layoutEditorPositionX = pos.x;
    globalSettings.layoutEditorPositionY = pos.y;
    host.settingsService.saveSettings(globalSettings);
  }

  static isPortraitLayout(host: any): boolean {
    return RacedayLayoutUtils.isPortraitLayout(
      host.layout,
      host.dashboardWidth,
      host.dashboardHeight,
    );
  }

  static onResize(host: any): void {
    host.updateScale();
  }

  static onDocumentClick(host: any, event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const isInsideMenu =
      target &&
      typeof target.closest === "function" &&
      (target.closest(".menu-wrapper") || target.closest(".teammate-select"));
    if (!isInsideMenu) {
      host.isMenuOpen = false;
      host.isFileMenuOpen = false;
      host.isDriversStationOpen = false;
      host.isWindowsMenuOpen = false;
      host.isOptionsMenuOpen = false;
    }
  }

  static updateScale(host: any): void {
    const layout = host.layout;
    const targetWidth = layout?.baseWidth || 1920;
    const targetHeight = layout?.baseHeight || 1080;

    if (host.isUIEditorMode()) {
      host.scale = 1;
      host.displayContentWidth = targetWidth;
      host.displayContentHeight = targetHeight;
      host.scaleTransform = "none";
      host.contentLeft = 0;
      host.contentTop = 0;
    } else {
      const windowWidth =
        typeof window !== "undefined"
          ? window.visualViewport?.width || window.innerWidth
          : 1920;
      const windowHeight =
        typeof window !== "undefined"
          ? window.visualViewport?.height || window.innerHeight
          : 1080;

      if (host.isLetterboxMode) {
        const scaleX = windowWidth / targetWidth;
        const scaleY = windowHeight / targetHeight;
        const scale = Math.min(scaleX, scaleY);
        host.scale = scale;
        host.displayContentWidth = Math.round(targetWidth * scale);
        host.displayContentHeight = Math.round(targetHeight * scale);
        host.contentLeft = Math.round(
          (windowWidth - host.displayContentWidth) / 2,
        );
        host.contentTop = Math.round(
          (windowHeight - host.displayContentHeight) / 2,
        );
        host.scaleTransform = `scale(${scale})`;
      } else {
        const scaleX = windowWidth / targetWidth;
        const scaleY = windowHeight / targetHeight;
        host.scale = 1;
        host.displayContentWidth = Math.round(windowWidth);
        host.displayContentHeight = Math.round(windowHeight);
        host.contentLeft = 0;
        host.contentTop = 0;
        host.scaleTransform = `scale(${scaleX}, ${scaleY})`;
      }
    }

    if (
      host.dashboardWidth !== targetWidth ||
      host.dashboardHeight !== targetHeight
    ) {
      host.dashboardWidth = targetWidth;
      host.dashboardHeight = targetHeight;
      host.loadColumns();
    }

    host.layoutEditorPosition = host.clampLayoutEditorPosition(
      host.layoutEditorPosition,
    );
  }

  static clampLayoutEditorPosition(
    host: any,
    pos: { x: number; y: number },
  ): {
    x: number;
    y: number;
  } {
    let { x, y } = pos;
    const toolboxWidth = host.isLayoutEditorMinimized ? 160 : 260;
    const toolboxHeight = host.isLayoutEditorMinimized ? 40 : 400;

    if (host.isUIEditorMode()) {
      if (x >= 9000 || y >= 9000) {
        return pos;
      }
      let boundaryWidth = 0;
      let boundaryHeight = 0;
      if (typeof document !== "undefined") {
        const boundaryEl = document.querySelector(
          ".raceday-layout-section",
        ) as HTMLElement;
        if (boundaryEl && boundaryEl.clientWidth > 0) {
          boundaryWidth = boundaryEl.clientWidth;
          boundaryHeight = boundaryEl.clientHeight;
        }
      }
      if (!boundaryWidth && typeof window !== "undefined") {
        boundaryWidth = window.innerWidth;
        boundaryHeight = window.innerHeight;
      }
      if (boundaryWidth > 0 && boundaryHeight > 0) {
        const maxX = Math.max(0, boundaryWidth - toolboxWidth);
        const maxY = Math.max(0, boundaryHeight - toolboxHeight);
        if (x > maxX) x = maxX;
        if (x < 0) x = 0;
        if (y > maxY) y = maxY;
        if (y < 0) y = 0;
        return { x, y };
      }
      return {
        x: Math.max(0, x),
        y: Math.max(0, y),
      };
    }

    const scale = 1;
    const maxX = Math.max(
      0,
      (host.dashboardWidth - toolboxWidth * scale) / scale,
    );
    const maxY = Math.max(
      0,
      (host.dashboardHeight - toolboxHeight * scale) / scale,
    );

    if (x > maxX) x = maxX;
    if (x < 0) x = 0;
    if (y > maxY) y = maxY;
    if (y < 0) y = 0;

    return { x, y };
  }
}
