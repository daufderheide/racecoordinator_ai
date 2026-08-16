import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BehaviorSubject } from "rxjs";
import { TranslationService } from "@app/services/translation.service";

import { RacedaySeasonNameComponent } from "./raceday-season-name.component";

describe("RacedaySeasonNameComponent", () => {
  let component: RacedaySeasonNameComponent;
  let fixture: ComponentFixture<RacedaySeasonNameComponent>;

  beforeEach(async () => {
    const mockTranslationService = {
      translations$: new BehaviorSubject<{ [key: string]: string }>({}),
      translate: (key: string) => key,
    };

    await TestBed.configureTestingModule({
      imports: [RacedaySeasonNameComponent],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedaySeasonNameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
