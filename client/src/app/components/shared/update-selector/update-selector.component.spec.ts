import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { of, throwError } from "rxjs";
import { Role } from "@app/models/role";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { AuthService } from "@app/services/auth.service";
import { LoggerService } from "@app/services/logger.service";
import { TranslationService } from "@app/services/translation.service";
import { UpdateChannel, UpdateService } from "@app/services/update.service";

import { UpdateSelectorComponent } from "./update-selector.component";

describe("UpdateSelectorComponent", () => {
  let component: UpdateSelectorComponent;
  let fixture: ComponentFixture<UpdateSelectorComponent>;
  let mockUpdateService: jasmine.SpyObj<UpdateService>;
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
        channel: "ALPHA" as UpdateChannel,
      }),
    );
    mockUpdateService.setUpdateChannel.and.returnValue(of("OK"));

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
    expect(component.currentChannel).toBe("ALPHA");
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

    component.selectChannel("BETA", event);

    expect(component.currentChannel).toBe("ALPHA"); // Unchanged
    expect(component.channelSelected.emit).not.toHaveBeenCalled();
    expect(mockUpdateService.setUpdateChannel).not.toHaveBeenCalled();
  });

  it("should allow admin to select a channel if isChannelSelectionEnabled is true", () => {
    mockAuthService.currentRole = Role.ADMIN;
    component.isUpdateDropdownOpen = true;
    spyOn(component.channelSelected, "emit");

    const event = new MouseEvent("click");
    spyOn(event, "stopPropagation");

    component.selectChannel("BETA", event);

    expect(component.currentChannel).toBe("BETA");
    expect(component.isUpdateDropdownOpen).toBeFalse();
    expect(component.channelSelected.emit).toHaveBeenCalledWith("BETA");
    expect(mockUpdateService.setUpdateChannel).toHaveBeenCalledWith("BETA");
  });

  it("should NOT allow non-admin (VIEWER) to select a channel even if isChannelSelectionEnabled is true", () => {
    mockAuthService.currentRole = Role.VIEWER;
    component.isUpdateDropdownOpen = true;
    spyOn(component.channelSelected, "emit");

    const event = new MouseEvent("click");
    spyOn(event, "stopPropagation");

    component.selectChannel("BETA", event);

    expect(component.currentChannel).toBe("ALPHA"); // Unchanged
    expect(component.channelSelected.emit).not.toHaveBeenCalled();
    expect(mockUpdateService.setUpdateChannel).not.toHaveBeenCalled();
  });

  it("should NOT allow DIRECTOR role to select a channel even if isChannelSelectionEnabled is true", () => {
    mockAuthService.currentRole = Role.DIRECTOR;
    component.isUpdateDropdownOpen = true;
    spyOn(component.channelSelected, "emit");

    const event = new MouseEvent("click");
    spyOn(event, "stopPropagation");

    component.selectChannel("BETA", event);

    expect(component.currentChannel).toBe("ALPHA"); // Unchanged
    expect(component.channelSelected.emit).not.toHaveBeenCalled();
    expect(mockUpdateService.setUpdateChannel).not.toHaveBeenCalled();
  });

  it("should log error when setUpdateChannel fails on server", () => {
    mockAuthService.currentRole = Role.ADMIN;
    mockUpdateService.setUpdateChannel.and.returnValue(
      throwError(() => new Error("Server error")),
    );

    const event = new MouseEvent("click");
    component.selectChannel("BETA", event);

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
});
