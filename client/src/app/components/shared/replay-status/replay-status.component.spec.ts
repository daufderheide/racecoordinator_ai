import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { DataService } from "@app/data.service";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { SystemState } from "@app/proto/antigravity";

import { ReplayStatusComponent } from "./replay-status.component";

describe("ReplayStatusComponent", () => {
  let component: ReplayStatusComponent;
  let fixture: ComponentFixture<ReplayStatusComponent>;
  let mockDataService: jasmine.SpyObj<DataService>;

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj("DataService", ["getSystemState"], {
      systemState$: of(
        SystemState.create({
          logReplayStatus: {
            linesProcessed: 50,
            totalLines: 100,
            currentLogTime: "2026-07-19T18:31:17.121",
            isFinished: false,
          },
          isReplayMode: true,
        }),
      ),
    });

    mockDataService.getSystemState.and.returnValue(
      of(
        SystemState.create({
          logReplayStatus: {
            linesProcessed: 50,
            totalLines: 100,
            currentLogTime: "2026-07-19T18:31:17.121",
            isFinished: false,
          },
          isReplayMode: true,
        }),
      ),
    );

    await TestBed.configureTestingModule({
      imports: [ReplayStatusComponent, TranslatePipe],
      providers: [
        { provide: DataService, useValue: mockDataService },
        {
          provide: TranslatePipe,
          useClass: class {
            transform(key: string) {
              return key;
            }
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReplayStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display progress correctly", () => {
    expect(component.isReplayMode).toBeTrue();
    expect(component.linesProcessed).toBe(50);
    expect(component.totalLines).toBe(100);
    expect(component.progressPercent).toBe(50);
  });
});
