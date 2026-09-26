import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { TranslationService } from "@app/services/translation.service";

import { RacedayCameraQrComponent } from "./raceday-camera-qr.component";
import { RacedayCameraQrHarness } from "./testing/raceday-camera-qr.harness";

describe("RacedayCameraQrComponent", () => {
  let component: RacedayCameraQrComponent;
  let fixture: ComponentFixture<RacedayCameraQrComponent>;
  let harness: RacedayCameraQrHarness;

  const mockTranslationService = {
    translate: (key: string) => key,
    currentLang: () => "en",
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RacedayCameraQrComponent, TranslatePipe],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedayCameraQrComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      RacedayCameraQrHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should conditionalize QR code visibility via harness", async () => {
    expect(await harness.getQrCodeSrc()).toBeNull();

    fixture.componentRef.setInput(
      "qrCodeUrl",
      "data:image/png;base64,mock-camera-qr",
    );
    fixture.detectChanges();

    expect(await harness.getQrCodeSrc()).toBe(
      "data:image/png;base64,mock-camera-qr",
    );
  });

  it("should not open modal on card click if pairingUrl is not provided", async () => {
    fixture.componentRef.setInput(
      "qrCodeUrl",
      "data:image/png;base64,mock-camera-qr",
    );
    fixture.detectChanges();

    await harness.clickCard();
    fixture.detectChanges();

    expect(await harness.isModalOpen()).toBeFalse();
  });

  it("should open modal when pairingUrl is set and card is clicked, and close on close click", async () => {
    fixture.componentRef.setInput(
      "qrCodeUrl",
      "data:image/png;base64,mock-camera-qr",
    );
    fixture.componentRef.setInput(
      "pairingUrl",
      "http://192.168.1.188:4200/camera_interface?interface=0",
    );
    fixture.detectChanges();

    await harness.clickCard();
    fixture.detectChanges();

    expect(await harness.isModalOpen()).toBeTrue();
    expect(await harness.getModalInputUrl()).toBe(
      "http://192.168.1.188:4200/camera_interface?interface=0",
    );

    // Verify ignore autofill attributes per agent rule
    const inputEl = fixture.nativeElement.querySelector(".modal-link-input");
    expect(inputEl?.getAttribute("data-dashlane-ignore")).toBe("true");
    expect(inputEl?.getAttribute("autocomplete")).toBe("off");
    expect(inputEl?.getAttribute("data-1p-ignore")).toBe("true");
    expect(inputEl?.getAttribute("data-lpignore")).toBe("true");
    expect(inputEl?.getAttribute("data-bwignore")).toBe("true");

    await harness.clickClose();
    fixture.detectChanges();

    expect(await harness.isModalOpen()).toBeFalse();
  });

  it("should copy pairing URL to clipboard on copy click", async () => {
    const clipboardSpy = spyOn(
      navigator.clipboard,
      "writeText",
    ).and.returnValue(Promise.resolve());

    fixture.componentRef.setInput(
      "qrCodeUrl",
      "data:image/png;base64,mock-camera-qr",
    );
    fixture.componentRef.setInput(
      "pairingUrl",
      "http://192.168.1.188:4200/camera_interface?interface=0",
    );
    fixture.detectChanges();

    component.openModal();
    fixture.detectChanges();

    await component.copyLink();
    fixture.detectChanges();

    expect(clipboardSpy).toHaveBeenCalledWith(
      "http://192.168.1.188:4200/camera_interface?interface=0",
    );
    expect(component.copied()).toBeTrue();
  });

  it("should trigger copyLink when copy button is clicked in modal via harness", async () => {
    const copySpy = spyOn(component, "copyLink");

    fixture.componentRef.setInput(
      "qrCodeUrl",
      "data:image/png;base64,mock-camera-qr",
    );
    fixture.componentRef.setInput(
      "pairingUrl",
      "http://192.168.1.188:4200/camera_interface?interface=0",
    );
    fixture.detectChanges();

    component.openModal();
    fixture.detectChanges();

    await harness.clickCopy();
    expect(copySpy).toHaveBeenCalled();
  });

  it("should open test window on test button click", async () => {
    const openSpy = spyOn(window, "open");

    fixture.componentRef.setInput(
      "qrCodeUrl",
      "data:image/png;base64,mock-camera-qr",
    );
    fixture.componentRef.setInput(
      "pairingUrl",
      "http://192.168.1.188:4200/camera_interface?interface=0",
    );
    fixture.detectChanges();

    component.openModal();
    fixture.detectChanges();

    await harness.clickTest();

    expect(openSpy).toHaveBeenCalledWith(
      "http://192.168.1.188:4200/camera_interface?interface=0",
      "_blank",
    );
  });
});
