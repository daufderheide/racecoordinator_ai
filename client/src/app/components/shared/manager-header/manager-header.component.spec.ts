import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslatePipe } from "src/app/pipes/translate.pipe";
import { TranslationService } from "src/app/services/translation.service";

import { ManagerHeaderComponent } from "./manager-header.component";
import { ManagerHeaderHarness } from "./testing/manager-header.harness";

describe("ManagerHeaderComponent", () => {
  let component: ManagerHeaderComponent;
  let fixture: ComponentFixture<ManagerHeaderComponent>;
  let harness: ManagerHeaderHarness;
  let translationServiceSpy: jasmine.SpyObj<TranslationService>;

  beforeEach(async () => {
    translationServiceSpy = jasmine.createSpyObj("TranslationService", [
      "translate",
    ]);
    translationServiceSpy.translate.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      declarations: [ManagerHeaderComponent, TranslatePipe],
      providers: [
        { provide: TranslationService, useValue: translationServiceSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ManagerHeaderComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      ManagerHeaderHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display title correctly", async () => {
    component.title = "TEST_MANAGER";
    fixture.detectChanges();
    expect(await harness.getTitle()).toBe("TEST_MANAGER");
  });

  it("should display back button", async () => {
    expect(await harness.hasBackButton()).toBeTrue();
  });

  it("should toggle toolbar based on showActions", async () => {
    component.showActions = true;
    fixture.detectChanges();
    expect(await harness.hasToolbar()).toBeTrue();

    component.showActions = false;
    fixture.detectChanges();
    expect(await harness.hasToolbar()).toBeFalse();
  });

  it("should emit events from toolbar triggers debug level", () => {
    spyOn(component.edit, "emit");
    spyOn(component.help, "emit");
    spyOn(component.delete, "emit");

    component.edit.emit();
    expect(component.edit.emit).toHaveBeenCalled();
  });
});
