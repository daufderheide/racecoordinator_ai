import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { of, throwError } from "rxjs";
import { Role } from "@app/models/role";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { AuthService } from "@app/services/auth.service";
import { HelpLinkService } from "@app/services/help-link.service";
import { LoggerService } from "@app/services/logger.service";
import { TranslationService } from "@app/services/translation.service";
import { UpdateChannel, UpdateService } from "@app/services/update.service";

import { UpdateSelectorComponent } from "./update-selector.component";

describe("UpdateSelectorComponent", () => {
  let component: UpdateSelectorComponent;
  let fixture: ComponentFixture<UpdateSelectorComponent>;
  let mockUpdateService: jasmine.SpyObj<UpdateService>;
  let mockHelpLinkService: jasmine.SpyObj<HelpLinkService>;
  let mockAuthService: any;
  let mockLogger: jasmine.SpyObj<LoggerService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;

  beforeEach(async () => {
    mockUpdateService = jasmine.createSpyObj("UpdateService", [
      "getUpdateConfig",
      "setUpdateChannel",
    ]);
    mockUpdateService.getUpdateConfig.and.returnValue(
      of({
        channel: "BETA" as UpdateChannel,
      }),
    );
    mockUpdateService.setUpdateChannel.and.returnValue(of("OK"));

    mockHelpLinkService = jasmine.createSpyObj("HelpLinkService", ["openHelp"]);

    mockAuthService = {
      currentRole: Role.ADMIN,
    };

    mockLogger = jasmine.createSpyObj("LoggerService", [
      "info",
      "warn",
      "error",
    ]);
    mockTranslationService = jasmine.createSpyObj("TranslationService", [
      "translate",
    ]);
    mockTranslationService.translate.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [UpdateSelectorComponent, TranslatePipe],
      providers: [
        { provide: UpdateService, useValue: mockUpdateService },
        { provide: HelpLinkService, useValue: mockHelpLinkService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: LoggerService, useValue: mockLogger },
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create and load initial update channel config", () => {
    expect(component).toBeTruthy();
    expect(mockUpdateService.getUpdateConfig).toHaveBeenCalled();
    expect(component.currentChannel).toBe("BETA");
  });

  it("should toggle dropdown when clicking container", () => {
    expect(component.isUpdateDropdownOpen).toBeFalse();
    const event = new MouseEvent("click");
    spyOn(event, "stopPropagation");

    component.toggleDropdown(event);
    expect(component.isUpdateDropdownOpen).toBeTrue();
    expect(event.stopPropagation).toHaveBeenCalled();

    component.toggleDropdown(event);
    expect(component.isUpdateDropdownOpen).toBeFalse();
  });

  it("should close dropdown on outside click", () => {
    component.isUpdateDropdownOpen = true;
    const outsideTarget = document.createElement("div");
    component.onDocumentClick(
      new MouseEvent("click", { relatedTarget: outsideTarget }),
    );
    expect(component.isUpdateDropdownOpen).toBeFalse();
  });

  it("should emit checkForUpdatesRequested and close dropdown when clicking Check for Updates", () => {
    component.isUpdateDropdownOpen = true;
    spyOn(component.checkForUpdatesRequested, "emit");

    const event = new MouseEvent("click");
    spyOn(event, "stopPropagation");

    component.onCheckForUpdatesClick(event);

    expect(component.isUpdateDropdownOpen).toBeFalse();
    expect(component.checkForUpdatesRequested.emit).toHaveBeenCalled();
  });

  it("should ignore channel selection when isChannelSelectionEnabled is false", () => {
    (component as any).isChannelSelectionEnabled = false;
    mockAuthService.currentRole = Role.ADMIN;
    component.isUpdateDropdownOpen = true;
    spyOn(component.channelSelected, "emit");

    const event = new MouseEvent("click");
    spyOn(event, "stopPropagation");

    component.selectChannel("ALPHA", event);

    expect(component.currentChannel).toBe("BETA"); // Unchanged
    expect(component.channelSelected.emit).not.toHaveBeenCalled();
    expect(mockUpdateService.setUpdateChannel).not.toHaveBeenCalled();
  });

  it("should allow admin to select a channel if isChannelSelectionEnabled is true", () => {
    mockAuthService.currentRole = Role.ADMIN;
    component.isUpdateDropdownOpen = true;
    spyOn(component.channelSelected, "emit");

    const event = new MouseEvent("click");
    spyOn(event, "stopPropagation");

    component.selectChannel("ALPHA", event);

    expect(component.currentChannel).toBe("ALPHA");
    expect(component.isUpdateDropdownOpen).toBeFalse();
    expect(component.channelSelected.emit).toHaveBeenCalledWith("ALPHA");
    expect(mockUpdateService.setUpdateChannel).toHaveBeenCalledWith("ALPHA");
  });

  it("should NOT allow non-admin (VIEWER) to select a channel even if isChannelSelectionEnabled is true", () => {
    mockAuthService.currentRole = Role.VIEWER;
    component.isUpdateDropdownOpen = true;
    spyOn(component.channelSelected, "emit");

    const event = new MouseEvent("click");
    spyOn(event, "stopPropagation");

    component.selectChannel("ALPHA", event);

    expect(component.currentChannel).toBe("BETA"); // Unchanged
    expect(component.channelSelected.emit).not.toHaveBeenCalled();
    expect(mockUpdateService.setUpdateChannel).not.toHaveBeenCalled();
  });

  it("should NOT allow DIRECTOR role to select a channel even if isChannelSelectionEnabled is true", () => {
    mockAuthService.currentRole = Role.DIRECTOR;
    component.isUpdateDropdownOpen = true;
    spyOn(component.channelSelected, "emit");

    const event = new MouseEvent("click");
    spyOn(event, "stopPropagation");

    component.selectChannel("ALPHA", event);

    expect(component.currentChannel).toBe("BETA"); // Unchanged
    expect(component.channelSelected.emit).not.toHaveBeenCalled();
    expect(mockUpdateService.setUpdateChannel).not.toHaveBeenCalled();
  });

  it("should log error when setUpdateChannel fails on server", () => {
    mockAuthService.currentRole = Role.ADMIN;
    mockUpdateService.setUpdateChannel.and.returnValue(
      throwError(() => new Error("Server error")),
    );

    const event = new MouseEvent("click");
    component.selectChannel("ALPHA", event);

    expect(mockLogger.error).toHaveBeenCalled();
  });

  it("should display disabled styling and admin-required tooltip for non-admin (VIEWER)", () => {
    mockAuthService.currentRole = Role.VIEWER;
    component.isUpdateDropdownOpen = true;
    fixture.detectChanges();

    const betaItem = fixture.debugElement.query(
      By.css('[data-testid="channel-beta"]'),
    );
    expect(betaItem).toBeTruthy();
    expect(betaItem.nativeElement.classList.contains("disabled")).toBeTrue();
    expect(betaItem.nativeElement.getAttribute("title")).toBe(
      "RDS_UPDATE_ADMIN_REQUIRED",
    );
  });

  it("should display disabled styling and admin-required tooltip for non-admin (DIRECTOR)", () => {
    mockAuthService.currentRole = Role.DIRECTOR;
    component.isUpdateDropdownOpen = true;
    fixture.detectChanges();

    const betaItem = fixture.debugElement.query(
      By.css('[data-testid="channel-beta"]'),
    );
    expect(betaItem).toBeTruthy();
    expect(betaItem.nativeElement.classList.contains("disabled")).toBeTrue();
    expect(betaItem.nativeElement.getAttribute("title")).toBe(
      "RDS_UPDATE_ADMIN_REQUIRED",
    );
  });

  it("should display enabled styling and empty tooltip for admin", () => {
    mockAuthService.currentRole = Role.ADMIN;
    component.isUpdateDropdownOpen = true;
    fixture.detectChanges();

    const betaItem = fixture.debugElement.query(
      By.css('[data-testid="channel-beta"]'),
    );
    expect(betaItem).toBeTruthy();
    expect(betaItem.nativeElement.classList.contains("disabled")).toBeFalse();
    expect(betaItem.nativeElement.getAttribute("title")).toBe("");
  });

  it("should close dropdown when another submenu is opened", () => {
    component.isUpdateDropdownOpen = true;
    component.onOtherSubmenuOpened(
      new CustomEvent("rc-submenu-opened", { detail: {} }),
    );
    expect(component.isUpdateDropdownOpen).toBeFalse();
  });

  it("should not close dropdown when this component opened event fires", () => {
    component.isUpdateDropdownOpen = true;
    component.onOtherSubmenuOpened(
      new CustomEvent("rc-submenu-opened", { detail: component }),
    );
    expect(component.isUpdateDropdownOpen).toBeTrue();
  });

  it("should show channel tooltip on hover and hide on leave after debounce", fakeAsync(() => {
    component.isUpdateDropdownOpen = true;
    fixture.detectChanges();

    component.onChannelHover("BETA");
    fixture.detectChanges();

    expect(component.activeTooltipChannel).toBe("BETA");
    const tooltipEl = fixture.debugElement.query(
      By.css('[data-testid="channel-tooltip"]'),
    );
    expect(tooltipEl).toBeTruthy();

    const titleEl = tooltipEl.query(By.css(".channel-tooltip-title"));
    expect(titleEl.nativeElement.textContent).toContain(
      "RDS_UPDATE_CHANNEL_BETA",
    );

    const bodyEl = tooltipEl.query(By.css(".channel-tooltip-body"));
    expect(bodyEl.nativeElement.textContent).toContain(
      "RDS_UPDATE_TOOLTIP_BETA",
    );

    // Leave channel
    component.onChannelLeave("BETA");
    expect(component.activeTooltipChannel).toBe("BETA"); // Still visible during debounce

    tick(150);
    fixture.detectChanges();
    expect(component.activeTooltipChannel).toBeNull();
    expect(
      fixture.debugElement.query(By.css('[data-testid="channel-tooltip"]')),
    ).toBeNull();
  }));

  it("should keep tooltip open when hovering over the tooltip itself", fakeAsync(() => {
    component.isUpdateDropdownOpen = true;
    component.onChannelHover("PRODUCTION");
    fixture.detectChanges();

    expect(component.activeTooltipChannel).toBe("PRODUCTION");

    // Enter tooltip element
    component.onTooltipEnter("PRODUCTION");
    tick(200);
    fixture.detectChanges();
    expect(component.activeTooltipChannel).toBe("PRODUCTION");

    // Leave tooltip
    component.onTooltipLeave("PRODUCTION");
    tick(150);
    fixture.detectChanges();
    expect(component.activeTooltipChannel).toBeNull();
  }));

  it("should display admin warning in tooltip when user is not an admin", () => {
    mockAuthService.currentRole = Role.VIEWER;
    component.isUpdateDropdownOpen = true;
    component.onChannelHover("BETA");
    fixture.detectChanges();

    const warningEl = fixture.debugElement.query(
      By.css(".channel-tooltip-admin-warning"),
    );
    expect(warningEl).toBeTruthy();
    expect(warningEl.nativeElement.textContent).toContain(
      "RDS_UPDATE_ADMIN_REQUIRED",
    );
  });

  it("should call helpLinkService.openHelp with downloads and release-channels when clicking Learn More link", () => {
    component.isUpdateDropdownOpen = true;
    component.onChannelHover("BETA");
    fixture.detectChanges();

    const learnMoreLink = fixture.debugElement.query(
      By.css('[data-testid="channel-learn-more-link"]'),
    );
    expect(learnMoreLink).toBeTruthy();

    const event = new MouseEvent("click");
    spyOn(event, "stopPropagation");
    spyOn(event, "preventDefault");

    component.openLearnMore(event);

    expect(mockHelpLinkService.openHelp).toHaveBeenCalledWith(
      "downloads",
      "release-channels",
    );
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("should call helpLinkService.openHelp when clicking info icon and not select channel", () => {
    component.isUpdateDropdownOpen = true;
    fixture.detectChanges();

    const infoIcon = fixture.debugElement.query(
      By.css('[data-testid="channel-beta"] [data-testid="channel-info-icon"]'),
    );
    expect(infoIcon).toBeTruthy();

    const event = new MouseEvent("click");
    spyOn(event, "stopPropagation");
    spyOn(event, "preventDefault");

    infoIcon.triggerEventHandler("click", event);

    expect(mockHelpLinkService.openHelp).toHaveBeenCalledWith(
      "downloads",
      "release-channels",
    );
    expect(mockUpdateService.setUpdateChannel).not.toHaveBeenCalled();
  });
});
