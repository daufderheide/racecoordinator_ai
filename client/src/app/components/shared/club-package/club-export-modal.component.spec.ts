import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { DataService } from "@app/data.service";
import { TranslationService } from "@app/services/translation.service";

import { ClubExportModalComponent } from "./club-export-modal.component";

// https://github.com/daufderheide/racecoordinator_ai/issues/972
describe("ClubExportModalComponent", () => {
  let fixture: ComponentFixture<ClubExportModalComponent>;
  let component: ClubExportModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClubExportModalComponent],
      providers: [
        {
          provide: DataService,
          useValue: jasmine.createSpyObj("DataService", ["exportClubPackage"]),
        },
        {
          provide: TranslationService,
          useValue: {
            translate: (k: string) => k,
            getTranslationsLoaded: () => of(true),
            getCurrentLanguage: () => "en",
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ClubExportModalComponent);
    component = fixture.componentInstance;
  });

  it("should suggest the season name as the championship name", () => {
    fixture.componentRef.setInput("seasonId", "4");
    fixture.componentRef.setInput("seasonName", "Club 2026");
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    expect(component.championshipName).toBe("Club 2026");
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector("#club-export-name");
    expect(input).toBeTruthy();
  });

  it("should need a season and a name to export", () => {
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();
    expect(component.canExport).toBeFalse();

    fixture.componentRef.setInput("seasonId", "4");
    component.championshipName = "   ";
    expect(component.canExport).toBeFalse();

    component.championshipName = "Hobby Club 2026";
    expect(component.canExport).toBeTrue();
  });

  it("should emit close", () => {
    let closed = false;
    component.close.subscribe(() => (closed = true));
    component.onClose();
    expect(closed).toBeTrue();
  });
});
