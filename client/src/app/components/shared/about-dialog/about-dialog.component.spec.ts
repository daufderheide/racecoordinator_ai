import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { of } from "rxjs";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { TranslationService } from "@app/services/translation.service";

import { AboutDialogComponent } from "./about-dialog.component";
import { AboutDialogHarness } from "./testing/about-dialog.harness";

describe("AboutDialogComponent", () => {
  let component: AboutDialogComponent;
  let fixture: ComponentFixture<AboutDialogComponent>;
  let harness: AboutDialogHarness;
  let translationServiceSpy: jasmine.SpyObj<TranslationService>;

  beforeEach(async () => {
    translationServiceSpy = jasmine.createSpyObj("TranslationService", [
      "translate",
      "getTranslationsLoaded",
    ]);
    translationServiceSpy.translate.and.callFake(
      (key: string, params?: any) => {
        if (params && params.version) return `${key}: ${params.version}`;
        if (params && params.speed) return `${key}: ${params.speed}x`;
        return key;
      },
    );
    translationServiceSpy.getTranslationsLoaded.and.returnValue(of(true));

    await TestBed.configureTestingModule({
      imports: [AboutDialogComponent, TranslatePipe],
      providers: [
        { provide: TranslationService, useValue: translationServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AboutDialogComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      AboutDialogHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display versions when visible on the Info tab", async () => {
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("clientVersion", "TEST-CLIENT-VERSION");
    fixture.componentRef.setInput("serverVersion", "TEST-SERVER-VERSION");
    fixture.detectChanges();

    expect(await harness.isVisible()).toBeTrue();
    const versionInfo = await harness.getVersionInfoText();
    expect(versionInfo).toContain("TEST-CLIENT-VERSION");
    expect(versionInfo).toContain("TEST-SERVER-VERSION");
  });

  it("should switch tabs to Charity & Mission and verify donate link", async () => {
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    await harness.clickTab(1);
    fixture.detectChanges();

    expect(component.activeTab()).toBe("charity");
    expect(await harness.isCharityTabVisible()).toBeTrue();

    const expectedDonateUrl =
      "https://www.paypal.com/donate/?business=daufderh@hotmail.com&currency_code=USD";
    expect(component.donateUrl).toBe(expectedDonateUrl);
    expect(await harness.getDonateLinkHref()).toBe(expectedDonateUrl);
  });

  it("should switch tabs to Credits and list all contributors", async () => {
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    await harness.clickTab(2);
    fixture.detectChanges();

    expect(component.activeTab()).toBe("credits");
    expect(await harness.isCreditsTabVisible()).toBeTrue();

    const creditNames = await harness.getCreditNames();
    expect(creditNames).toContain("AV-Git-Account");
    expect(creditNames).toContain("BigBadBuzz");
    expect(creditNames).toContain("crxed9");
    expect(creditNames).toContain("Dopamine");
    expect(creditNames).toContain("luizvaldetaro");
    expect(creditNames).toContain("mark h");
    expect(creditNames).toContain("Rinkrat99");
    expect(creditNames).toContain("Slot'n 77");
  });

  it("should toggle play/pause, speed, and rewind for credits", fakeAsync(() => {
    component.selectTab("credits");
    tick(20);
    expect(component.isCreditsPlaying()).toBeTrue();

    component.togglePlayPause();
    expect(component.isCreditsPlaying()).toBeFalse();

    expect(component.creditSpeed()).toBe(2);
    component.toggleSpeed();
    expect(component.creditSpeed()).toBe(4);
    component.toggleSpeed();
    expect(component.creditSpeed()).toBe(1);
    component.toggleSpeed();
    expect(component.creditSpeed()).toBe(2);

    expect(component.isRewinding()).toBeFalse();
    component.toggleRewind();
    expect(component.isRewinding()).toBeTrue();
    expect(component.isCreditsPlaying()).toBeTrue();
    component.toggleRewind();
    expect(component.isRewinding()).toBeFalse();
  }));

  it("should not be visible when visible is false", async () => {
    fixture.componentRef.setInput("visible", false);
    fixture.detectChanges();

    expect(await harness.isVisible()).toBeFalse();
  });

  it("should emit close event when close button is clicked", async () => {
    spyOn(component.close, "emit");
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    await harness.clickClose();

    expect(component.close.emit).toHaveBeenCalled();
  });
});
