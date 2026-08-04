import { Component, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { of } from "rxjs";
import { SeasonEditorComponent } from "./season-editor.component";
import { DataService } from "@app/data.service";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { LoggerService } from "@app/services/logger.service";
import { TranslationService } from "@app/services/translation.service";
import {
  mockLoggerService,
  mockTranslationService,
} from "@app/testing/unit-test-mocks";

@Component({
  standalone: true,
  selector: "app-editor-title",
  template: "",
})
class MockEditorTitleComponent {}

describe("SeasonEditorComponent", () => {
  let component: SeasonEditorComponent;
  let fixture: ComponentFixture<SeasonEditorComponent>;

  beforeEach(async () => {
    const mockDataService = {
      getSeasons: () => of([]),
      createSeason: () => of({ entity_id: "s1", name: "Test Season", drops: 0 }),
      updateSeason: () => of({ entity_id: "s1", name: "Test Season", drops: 0 }),
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
        { provide: Router, useValue: { navigate: jasmine.createSpy("navigate") } },
      ],
    })
      .overrideComponent(SeasonEditorComponent, {
        set: {
          imports: [MockEditorTitleComponent, TranslatePipe, FormsModule],
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
});
