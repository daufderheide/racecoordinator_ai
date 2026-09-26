import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of, Subject, throwError } from "rxjs";
import { DataService } from "@app/data.service";
import { CameraConfig } from "@app/models/camera_config";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { HelpLinkService } from "@app/services/help-link.service";
import { TranslationService } from "@app/services/translation.service";

import { CameraEditorComponent } from "./camera-editor.component";

describe("CameraEditorComponent", () => {
  let component: CameraEditorComponent;
  let fixture: ComponentFixture<CameraEditorComponent>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;
  let mockDataService: jasmine.SpyObj<DataService>;
  let mockHelpLinkService: jasmine.SpyObj<HelpLinkService>;
  let interfaceEventsSubject: Subject<any>;

  const initialConfig: CameraConfig = {
    name: "Camera 1",
    interfaceIndex: 0,
    targetFps: 60,
    autoDetectLanes: false,
    gates: [],
  };

  beforeEach(async () => {
    interfaceEventsSubject = new Subject<any>();
    mockHelpLinkService = jasmine.createSpyObj("HelpLinkService", ["openHelp"]);
    mockTranslationService = jasmine.createSpyObj("TranslationService", [
      "translate",
    ]);
    mockTranslationService.translate.and.callFake((key: string) => key);

    mockDataService = jasmine.createSpyObj(
      "DataService",
      [
        "getServerIp",
        "startCameraTunnel",
        "getCameraTunnelStatus",
        "getInterfaceEvents",
      ],
      {
        currentServerPort: 7070,
      },
    );
    mockDataService.getInterfaceEvents.and.returnValue(interfaceEventsSubject);
    mockDataService.getServerIp.and.returnValue(of("192.168.1.188"));
    mockDataService.startCameraTunnel.and.returnValue(
      of({
        active: true,
        url: "https://secure-tunnel.loca.lt",
        localIp: "192.168.1.188",
        port: 7070,
        provider: "localtunnel",
      }),
    );
    mockDataService.getCameraTunnelStatus.and.returnValue(
      of({
        active: true,
        url: "https://secure-tunnel.loca.lt",
        localIp: "192.168.1.188",
        port: 7070,
        provider: "localtunnel",
      }),
    );

    await TestBed.configureTestingModule({
      imports: [CameraEditorComponent, TranslatePipe],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: DataService, useValue: mockDataService },
        { provide: HelpLinkService, useValue: mockHelpLinkService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CameraEditorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("config", { ...initialConfig });
    fixture.componentRef.setInput("interfaceIndex", 0);
    fixture.componentRef.setInput("lanes", 4);
  });

  it("should create component and initialize gates with server IP and /camera_interface", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.config().gates.length).toBe(4);
    expect(component.pairingUrl()).toContain("192.168.1.188");
    expect(component.pairingUrl()).toContain("/camera_interface");
    expect(component.pairingUrl()).toContain(
      encodeURIComponent("ws://192.168.1.188:7070/api/interface-data"),
    );
    expect(component.pairingUrl()).toContain("interface=0");
    expect(component.pairingUrl()).toContain("lanes=4");
  });

  it("should fallback when getServerIp returns error or empty", () => {
    mockDataService.getServerIp.and.returnValue(
      throwError(() => new Error("Network error")),
    );
    component.ngOnInit();
    expect(component.pairingUrl()).toContain("/camera_interface");
    expect(component.pairingUrl()).toContain("interface=0");
    expect(component.pairingUrl()).toContain("lanes=4");
  });

  it("should ensure server IP during openQrModal if initially unset", async () => {
    fixture.detectChanges();
    component.useDirectWifi.set(true);
    mockDataService.getServerIp.and.returnValue(of("192.168.1.250"));
    (component as any).serverIp = "";
    await component.openQrModal();
    expect(component.pairingUrl()).toContain("192.168.1.250");
    expect(component.pairingUrl()).toContain("/camera_interface");
    expect(component.showQrModal()).toBe(true);
  });

  it("should include password manager ignore attributes on pairing link input", async () => {
    await component.openQrModal();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector(".link-input") as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.getAttribute("autocomplete")).toBe("off");
    expect(input.getAttribute("data-dashlane-ignore")).toBe("true");
    expect(input.getAttribute("data-1p-ignore")).toBe("true");
    expect(input.getAttribute("data-lpignore")).toBe("true");
    expect(input.getAttribute("data-bwignore")).toBe("true");
    expect(input.getAttribute("data-form-type")).toBe("other");
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

  it("should open local camera interface in modal overlay", () => {
    expect(component.showTestModal()).toBe(false);
    component.openLocalInterface();
    expect(component.showTestModal()).toBe(true);

    component.closeTestModal();
    expect(component.showTestModal()).toBe(false);
  });

  it("should generate local interface url and local ws url correctly", () => {
    expect(component.getLocalWsUrl()).toContain("/api/interface-data");
    expect(component.getLocalInterfaceUrl()).toContain("/camera_interface");
    expect(component.getLocalInterfaceUrl()).toContain(window.location.origin);
  });

  it("should update gates and emit change when modal gates change", () => {
    spyOn(component.change, "emit");
    const updatedGates = [
      {
        laneIndex: 0,
        gateType: 1,
        xPct: 0.2,
        yPct: 0.3,
        widthPct: 0.2,
        heightPct: 0.3,
        sensitivity: 0.7,
      },
    ];
    component.onGatesUpdatedFromModal(updatedGates);
    expect(component.config().gates[0].xPct).toBe(0.2);
    expect(component.change.emit).toHaveBeenCalled();
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

  it("should delegate to HelpLinkService when openHelp is called", () => {
    component.openHelp();
    expect(mockHelpLinkService.openHelp).toHaveBeenCalledWith("camera-setup");
  });

  it("should call openHelp when Learn More button is clicked in setup card", () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const learnMoreBtn = compiled.querySelector(
      "#cameraLocalHelpBtn",
    ) as HTMLButtonElement;
    expect(learnMoreBtn).toBeTruthy();
    learnMoreBtn.click();
    expect(mockHelpLinkService.openHelp).toHaveBeenCalledWith("camera-setup");
  });

  it("should switch connection mode between local and remote", () => {
    fixture.detectChanges();
    spyOn(component.change, "emit");

    component.setConnectionType("remote");
    fixture.detectChanges();
    expect(component.config().connectionType).toBe("remote");
    expect(component.change.emit).toHaveBeenCalled();

    const compiled = fixture.nativeElement as HTMLElement;
    const pairBtn = compiled.querySelector(
      "#pairCameraBtn",
    ) as HTMLButtonElement;
    expect(pairBtn).toBeTruthy();

    const localBtn = compiled.querySelector(
      "#btnModeLocal",
    ) as HTMLButtonElement;
    localBtn.click();
    fixture.detectChanges();
    expect(component.config().connectionType).toBe("local");
  });

  it("should open standalone window with local interface URL", () => {
    spyOn(window, "open");
    component.openStandaloneWindow();
    expect(window.open).toHaveBeenCalledWith(
      component.getLocalInterfaceUrl(),
      "_blank",
    );
  });

  it("should start tunnel and render secure QR code when openQrModal is called", async () => {
    fixture.detectChanges();
    await component.openQrModal();
    fixture.detectChanges();

    expect(mockDataService.startCameraTunnel).toHaveBeenCalled();
    expect(component.tunnelActive()).toBe(true);
    expect(component.tunnelUrl()).toBe("https://secure-tunnel.loca.lt");
    expect(component.pairingUrl()).toContain(
      "https://secure-tunnel.loca.lt/camera_interface",
    );
    expect(component.qrCodeDataUrl()).toBeTruthy();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector(".badge-success")).toBeTruthy();
  });

  it("should toggle tunnel mode between secure tunnel and direct local Wi-Fi", async () => {
    fixture.detectChanges();
    await component.openQrModal();
    expect(component.tunnelActive()).toBe(true);

    await component.toggleTunnelMode();
    expect(component.useDirectWifi()).toBe(true);
    expect(component.tunnelActive()).toBe(false);
    expect(component.pairingUrl()).toContain("192.168.1.188");

    await component.toggleTunnelMode();
    expect(component.useDirectWifi()).toBe(false);
    expect(component.tunnelActive()).toBe(true);
  });

  it("should call openHelp when help link is clicked in QR modal", async () => {
    fixture.detectChanges();
    await component.openQrModal();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const modalHelpLink = compiled.querySelector(
      "#cameraModalHelpLink",
    ) as HTMLAnchorElement;
    expect(modalHelpLink).toBeTruthy();
    modalHelpLink.click();
    expect(mockHelpLinkService.openHelp).toHaveBeenCalledWith("camera-setup");
  });

  it("should reactively update gates and pairingUrl when lanes input signal changes", () => {
    fixture.detectChanges();
    expect(component.config().gates.length).toBe(4);
    expect(component.pairingUrl()).toContain("lanes=4");

    fixture.componentRef.setInput("lanes", 2);
    fixture.detectChanges();

    expect(component.config().gates.length).toBe(2);
    expect(component.pairingUrl()).toContain("lanes=2");
    expect(component.getLocalInterfaceUrl()).toContain("lanes=2");
  });

  it("should synchronize gates from remote CameraGatesUpdateEvent", () => {
    fixture.detectChanges();
    let changeEmitted = false;
    component.change.subscribe(() => {
      changeEmitted = true;
    });

    const newGates = [
      {
        laneIndex: 0,
        xPct: 0.1,
        yPct: 0.2,
        widthPct: 0.3,
        heightPct: 0.4,
        sensitivity: 0.85,
        type: "lap",
      },
      {
        laneIndex: 1,
        xPct: 0.5,
        yPct: 0.2,
        widthPct: 0.3,
        heightPct: 0.4,
        sensitivity: 0.85,
        type: "lap",
      },
    ];

    interfaceEventsSubject.next({
      cameraGatesUpdate: {
        interfaceIndex: 0,
        gates: newGates,
      },
    });

    expect(component.syncedFromRemote()).toBe(true);
    expect(changeEmitted).toBe(true);
    expect(component.config().gates.length).toBe(2);
    expect(component.config().gates[0].xPct).toBe(0.1);
  });

  it("should ignore CameraGatesUpdateEvent for a different interfaceIndex", () => {
    fixture.detectChanges();
    const originalGates = component.config().gates;

    interfaceEventsSubject.next({
      cameraGatesUpdate: {
        interfaceIndex: 99,
        gates: [],
      },
    });

    expect(component.syncedFromRemote()).toBe(false);
    expect(component.config().gates).toBe(originalGates);
  });

  it("should include gates query param in pairing URL", () => {
    fixture.detectChanges();
    expect(component.pairingUrl()).toContain("&gates=");
    expect(component.getLocalInterfaceUrl()).toContain("&gates=");
  });

  it("should switch connection mode to remote, emit change, and update mode button active states", () => {
    fixture.detectChanges();
    let changeEmitted = false;
    component.change.subscribe(() => {
      changeEmitted = true;
    });

    const compiled = fixture.nativeElement as HTMLElement;
    const btnRemote = compiled.querySelector(
      "#btnModeRemote",
    ) as HTMLButtonElement;
    expect(btnRemote).toBeTruthy();
    btnRemote.click();
    fixture.detectChanges();

    expect(changeEmitted).toBe(true);
    expect(component.config().connectionType).toBe("remote");
    expect(btnRemote.classList.contains("active")).toBe(true);

    const btnLocal = compiled.querySelector(
      "#btnModeLocal",
    ) as HTMLButtonElement;
    expect(btnLocal.classList.contains("active")).toBe(false);
  });

  it("should switch connection mode back to local, emit change, and update active state", () => {
    fixture.componentRef.setInput("config", {
      ...initialConfig,
      connectionType: "remote",
    });
    fixture.detectChanges();

    let changeEmitted = false;
    component.change.subscribe(() => {
      changeEmitted = true;
    });

    const compiled = fixture.nativeElement as HTMLElement;
    const btnLocal = compiled.querySelector(
      "#btnModeLocal",
    ) as HTMLButtonElement;
    btnLocal.click();
    fixture.detectChanges();

    expect(changeEmitted).toBe(true);
    expect(component.config().connectionType).toBe("local");
    expect(btnLocal.classList.contains("active")).toBe(true);
  });

  it("should not emit change or mutate config when clicking already active connection mode", () => {
    fixture.detectChanges();
    let changeCount = 0;
    component.change.subscribe(() => {
      changeCount++;
    });

    component.setConnectionType("local");
    expect(changeCount).toBe(0);
  });
});
