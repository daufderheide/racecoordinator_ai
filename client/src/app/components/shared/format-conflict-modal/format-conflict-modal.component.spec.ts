import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslationService } from "@app/services/translation.service";

import {
  FormatConflictChoice,
  FormatConflictModalComponent,
} from "./format-conflict-modal.component";

describe("FormatConflictModalComponent", () => {
  let fixture: ComponentFixture<FormatConflictModalComponent>;
  let component: FormatConflictModalComponent;
  let chosen: FormatConflictChoice[];

  beforeEach(async () => {
    const translation = jasmine.createSpyObj("TranslationService", [
      "translate",
    ]);
    translation.translate.and.callFake((key: string, params?: any) =>
      params?.name !== undefined ? `${key}:${params.name}` : key,
    );

    await TestBed.configureTestingModule({
      imports: [FormatConflictModalComponent],
      providers: [{ provide: TranslationService, useValue: translation }],
    }).compileComponents();

    fixture = TestBed.createComponent(FormatConflictModalComponent);
    component = fixture.componentInstance;
    chosen = [];
    component.choose.subscribe((c) => chosen.push(c));
  });

  const show = (): void => {
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("existingName", "Club Sprint");
    fixture.componentRef.setInput("suggestedName", "Club Sprint (1)");
    fixture.detectChanges();
  };

  const click = (selector: string): void =>
    (fixture.nativeElement.querySelector(selector) as HTMLElement).click();

  it("should render nothing when not visible", () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".fcm-dialog")).toBeNull();
  });

  it("should name the existing format and the copy name", () => {
    show();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain("RPM_FORMAT_EXISTS:Club Sprint");
    expect(text).toContain("RE_IMPORT_SAVE_COPY_HINT:Club Sprint (1)");
    expect(text).not.toContain("CD_CANCEL");
  });

  it("should emit each of the three choices", () => {
    show();
    click("#fcm-use-mine");
    click("#fcm-save-copy");
    click("#fcm-replace-mine");
    expect(chosen).toEqual(["USE_MINE", "SAVE_COPY", "REPLACE_MINE"]);
  });

  it("should treat a click on the backdrop as Use mine", () => {
    show();
    click(".fcm-backdrop");
    expect(chosen).toEqual(["USE_MINE"]);
  });

  it("should not emit when clicking inside the dialog", () => {
    show();
    click(".fcm-dialog");
    expect(chosen).toEqual([]);
  });
});
