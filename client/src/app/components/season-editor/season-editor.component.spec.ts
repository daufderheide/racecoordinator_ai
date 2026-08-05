import { Component, input, NO_ERRORS_SCHEMA, output } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { By } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import { of } from "rxjs";
import { DataService } from "@app/data.service";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { LoggerService } from "@app/services/logger.service";
import { TranslationService } from "@app/services/translation.service";
import {
  mockLoggerService,
  mockTranslationService,
} from "@app/testing/unit-test-mocks";

import { SeasonEditorComponent } from "./season-editor.component";

@Component({
  standalone: true,
  selector: "app-editor-title",
  template: "",
})
class MockEditorTitleComponent {}

@Component({
  standalone: true,
  selector: "app-confirmation-modal",
  template: `
    @if (visible()) {
      <button id="btn-confirm-test" (click)="confirm.emit()">Confirm</button>
      <button id="btn-cancel-test" (click)="cancel.emit()">Cancel</button>
    }
  `,
})
class MockConfirmationModalComponent {
  visible = input(false);
  title = input("");
  message = input("");
  confirmText = input("");
  cancelText = input("");
  confirm = output<void>();
  cancel = output<void>();
}

describe("SeasonEditorComponent", () => {
  let component: SeasonEditorComponent;
  let fixture: ComponentFixture<SeasonEditorComponent>;

  beforeEach(async () => {
    const mockDataService = {
      getSeasons: () => of([]),
      createSeason: (s: any) => of({ ...s, entity_id: "s1" }),
      updateSeason: (id: string, s: any) => of({ ...s, entity_id: id }),
    };

    await TestBed.configureTestingModule({
      imports: [SeasonEditorComponent, FormsModule, TranslatePipe],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: LoggerService, useValue: mockLoggerService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParams: {} } },
        },
        {
          provide: Router,
          useValue: { navigate: jasmine.createSpy("navigate") },
        },
      ],
    })
      .overrideComponent(SeasonEditorComponent, {
        set: {
          imports: [
            MockEditorTitleComponent,
            MockConfirmationModalComponent,
            TranslatePipe,
            FormsModule,
          ],
          schemas: [NO_ERRORS_SCHEMA],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(SeasonEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should auto-save season on state commit if valid and reset hasChanges() to false", () => {
    const dataService = TestBed.inject(DataService);
    spyOn(dataService, "createSeason").and.callThrough();

    component.editingSeason.name = "New Auto-Saved Season";
    component.editingSeason.drops = 2;
    component.captureState();

    expect(dataService.createSeason).toHaveBeenCalled();
    expect(component.hasChanges()).toBeFalse();
    expect(component.isDirty).toBeFalse();
  });

  it("should handle confirmDiscard modal confirm event via template binding", async () => {
    const promise = component.confirmDiscard();
    fixture.detectChanges();

    expect(component.showDiscardConfirm).toBeTrue();

    const confirmBtn = fixture.debugElement.query(By.css("#btn-confirm-test"));
    expect(confirmBtn).toBeTruthy();
    confirmBtn.nativeElement.click();
    fixture.detectChanges();

    const result = await promise;
    expect(result).toBeTrue();
    expect(component.showDiscardConfirm).toBeFalse();
    expect(component.isNavigationApproved).toBeTrue();
  });

  it("should handle confirmDiscard modal cancel event via template binding", async () => {
    const promise = component.confirmDiscard();
    fixture.detectChanges();

    expect(component.showDiscardConfirm).toBeTrue();

    const cancelBtn = fixture.debugElement.query(By.css("#btn-cancel-test"));
    expect(cancelBtn).toBeTruthy();
    cancelBtn.nativeElement.click();
    fixture.detectChanges();

    const result = await promise;
    expect(result).toBeFalse();
    expect(component.showDiscardConfirm).toBeFalse();
    expect(component.isNavigationApproved).toBeFalse();
  });

  it("should generate unique default name for new season", () => {
    expect(component.editingSeason.name).toBe("New Season");
  });
});
