import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CameraConfig } from "@app/models/camera_config";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { TranslationService } from "@app/services/translation.service";

import { CameraEditorComponent } from "./camera-editor.component";

describe("CameraEditorComponent", () => {
  let component: CameraEditorComponent;
  let fixture: ComponentFixture<CameraEditorComponent>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;

  const initialConfig: CameraConfig = {
    name: "Camera 1",
    interfaceIndex: 0,
    targetFps: 60,
    autoDetectLanes: false,
    gates: [],
  };

  beforeEach(async () => {
    mockTranslationService = jasmine.createSpyObj("TranslationService", [
      "translate",
    ]);
    mockTranslationService.translate.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [CameraEditorComponent, TranslatePipe],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CameraEditorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("config", { ...initialConfig });
    fixture.componentRef.setInput("interfaceIndex", 0);
    fixture.componentRef.setInput("lanes", 4);
  });

  it("should create component and initialize gates", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.config().gates.length).toBe(4);
    expect(component.pairingUrl()).toContain("interface=0");
    expect(component.pairingUrl()).toContain("lanes=4");
  });

  it("should reset gates to default matching lane count", () => {
    fixture.componentRef.setInput("lanes", 3);
    component.resetGatesToDefault();
    const gates = component.config().gates;
    expect(gates.length).toBe(3);
    expect(gates[0].laneIndex).toBe(0);
    expect(gates[1].laneIndex).toBe(1);
    expect(gates[2].laneIndex).toBe(2);
  });

  it("should generate QR code and open modal", async () => {
    await component.openQrModal();
    expect(component.qrCodeDataUrl()).toContain("data:image/png");
    expect(component.showQrModal()).toBe(true);

    component.closeQrModal();
    expect(component.showQrModal()).toBe(false);
  });

  it("should copy pairing URL to clipboard", async () => {
    const originalClipboard = Object.getOwnPropertyDescriptor(
      navigator,
      "clipboard",
    );
    const mockClipboard = {
      writeText: jasmine
        .createSpy("writeText")
        .and.returnValue(Promise.resolve()),
    };
    Object.defineProperty(navigator, "clipboard", {
      value: mockClipboard,
      configurable: true,
      writable: true,
    });

    try {
      component.copyPairingUrl();
      expect(mockClipboard.writeText).toHaveBeenCalledWith(
        component.pairingUrl(),
      );
    } finally {
      if (originalClipboard) {
        Object.defineProperty(navigator, "clipboard", originalClipboard);
      } else {
        delete (navigator as any).clipboard;
      }
    }
  });

  it("should open local camera interface in new tab", () => {
    spyOn(window, "open");
    component.openLocalInterface();
    expect(window.open).toHaveBeenCalledWith(component.pairingUrl(), "_blank");
  });

  it("should emit change output on config change", () => {
    spyOn(component.change, "emit");
    component.onConfigChange();
    expect(component.change.emit).toHaveBeenCalled();
  });

  it("should emit remove output on removal", () => {
    spyOn(component.remove, "emit");
    component.onRemove();
    expect(component.remove.emit).toHaveBeenCalled();
  });

  it("should toggle section and persist to localStorage", () => {
    spyOn(localStorage, "setItem");
    expect(component.sectionsExpanded.camera).toBe(true);

    component.toggleSection("camera");
    expect(component.sectionsExpanded.camera).toBe(false);
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "rc.camera-editor.sections.0",
      jasmine.any(String),
    );

    component.toggleSection("camera");
    expect(component.sectionsExpanded.camera).toBe(true);
  });

  it("should ensure all sections are expanded", () => {
    component.sectionsExpanded.camera = false;
    component.sectionsExpanded.main = false;
    component.sectionsExpanded.pairing = false;
    component.sectionsExpanded.gates = false;

    component.ensureSectionsExpanded();

    expect(component.sectionsExpanded.camera).toBe(true);
    expect(component.sectionsExpanded.main).toBe(true);
    expect(component.sectionsExpanded.pairing).toBe(true);
    expect(component.sectionsExpanded.gates).toBe(true);
  });

  it("should render camera configuration expander header and toolbar remove button", () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const headerTitle = compiled.querySelector(".camera-section-header h1");
    expect(headerTitle?.textContent?.trim()).toContain("CAMERA_HEADER");

    const removeBtn = compiled.querySelector(
      ".camera-section-header .action-btn.danger",
    ) as HTMLButtonElement;
    expect(removeBtn).toBeTruthy();
    spyOn(component, "onRemove");
    removeBtn.click();
    expect(component.onRemove).toHaveBeenCalled();
  });

  it("should load persisted section state from localStorage on init", () => {
    spyOn(localStorage, "getItem").and.returnValue(
      JSON.stringify({ camera: false, main: false }),
    );
    component.ngOnInit();
    expect(component.sectionsExpanded.camera).toBe(false);
    expect(component.sectionsExpanded.main).toBe(false);
    expect(component.sectionsExpanded.pairing).toBe(true);
  });

  it("should not emit change event when ensureGates initializes default gates during ngOnInit", () => {
    spyOn(component.change, "emit");
    fixture.componentRef.setInput("config", {
      ...initialConfig,
      gates: [],
    });
    component.ngOnInit();
    expect(component.config().gates.length).toBe(4);
    expect(component.change.emit).not.toHaveBeenCalled();
  });

  it("should render gate type custom select controls and update gateType", () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const gateTypeSelects = compiled.querySelectorAll(
      ".gate-type-cell app-custom-select",
    );
    expect(gateTypeSelects.length).toBe(4);

    // Initial default gateType is 0 (LAP)
    expect(component.config().gates[0].gateType).toBe(0);

    // Update gateType
    spyOn(component.change, "emit");
    component.config().gates[0].gateType = 2; // PIT_IN
    component.onConfigChange();
    fixture.detectChanges();

    expect(component.config().gates[0].gateType).toBe(2);
    expect(component.change.emit).toHaveBeenCalled();
  });
});
