import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { Component, input, output } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { of } from "rxjs";
import { TranslationService } from "@app/services/translation.service";

import { EditorTitleComponent } from "./editor-title.component";
import { EditorTitleHarness } from "./testing/editor-title.harness";

@Component({
  selector: "app-back-button",
  standalone: true,
  template: "",
})
class MockBackButtonComponent {
  route = input<string>("");
  queryParams = input<any>({});
  label = input<string>("");
  confirm = input<boolean>(false);
  confirmTitle = input<string>("");
  confirmMessage = input<string>("");
}

@Component({
  selector: "app-toolbar",
  standalone: true,
  template: '<button id="help-track-btn" (click)="help.emit()">Help</button>',
})
class MockToolbarComponent {
  showUndo = input<boolean>(true);
  showRedo = input<boolean>(true);
  showHelp = input<boolean>(true);
  showAdd = input<boolean>(false);
  showDelete = input<boolean>(false);
  showCopy = input<boolean>(false);
  isSaving = input<boolean>(false);
  undoManager = input<any>();
  helpSteps = input<any[]>([]);
  helpTitle = input<string>("");
  helpRecordName = input<string | undefined>();
  help = output<void>();
  add = output<void>();
  delete = output<void>();
  copy = output<void>();
}

import { Pipe, PipeTransform } from "@angular/core";
@Pipe({ standalone: true,name: "translate" })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe("EditorTitleComponent", () => {
  let component: EditorTitleComponent;
  let fixture: ComponentFixture<EditorTitleComponent>;
  let harness: EditorTitleHarness;
  let mockRouter: any;
  let mockTranslationService: any;

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj("Router", ["navigate"]);
    mockTranslationService = jasmine.createSpyObj("TranslationService", [
      "translate",
    ]);
    mockTranslationService.translate.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [
        EditorTitleComponent,
        MockBackButtonComponent,
        MockToolbarComponent,
        MockTranslatePipe,
      ],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: TranslationService, useValue: mockTranslationService },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({}),
            snapshot: {
              queryParamMap: {
                get: jasmine.createSpy("get").and.returnValue(null),
              },
            },
          },
        },
      ],
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(EditorTitleComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("titleKey", "TEST_TITLE");
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      EditorTitleHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display title", async () => {
    fixture.detectChanges();
    expect(await harness.getTitle()).toBe("TEST_TITLE");
  });

  it("should emit help event on click", async () => {
    spyOn(component.help, "emit");
    await harness.clickHelp();
    expect(component.help.emit).toHaveBeenCalled();
  });
});
