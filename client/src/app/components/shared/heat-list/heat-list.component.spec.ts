import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HeatListComponent } from './heat-list.component';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { TranslationService } from '../../../services/translation.service';
import { HeatListHarness } from './testing/heat-list.harness';

describe('HeatListComponent', () => {
  let component: HeatListComponent;
  let fixture: ComponentFixture<HeatListComponent>;
  let harness: HeatListHarness;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;

  beforeEach(async () => {
    mockTranslationService = jasmine.createSpyObj('TranslationService', ['translate']);
    mockTranslationService.translate.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      declarations: [HeatListComponent, TranslatePipe],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(HeatListComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, HeatListHarness);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not display heat list when heats array is empty', async () => {
    component.heats = [];
    fixture.detectChanges();
    
    // We expect an error if it doesn't exist, wait no, getHeatCount() returns 0.
    // Let's assert heat count is 0
    expect(await harness.getHeatCount()).toBe(0);
  });

  it('should display heats when heats array has data', async () => {
    component.heats = [
      {
        heatNumber: 1,
        lanes: [
          { laneNumber: 1, driverNumber: 5, backgroundColor: '#FF0000', foregroundColor: '#FFFFFF' },
          { laneNumber: 2, driverNumber: 3, backgroundColor: '#00FF00', foregroundColor: '#000000' }
        ]
      }
    ];
    fixture.detectChanges();
    expect(await harness.getHeatCount()).toBe(1);
    expect(await harness.getHeatNumberLabel(0)).toContain('RM_LABEL_HEAT_NUMBER');
  });

  it('should render correct number of heat items', async () => {
    component.heats = [
      { heatNumber: 1, lanes: [] },
      { heatNumber: 2, lanes: [] },
      { heatNumber: 3, lanes: [] }
    ];
    fixture.detectChanges();
    const count = await harness.getHeatCount();
    expect(count).toBe(3);
  });

  it('should apply lane colors correctly', async () => {
    component.heats = [
      {
        heatNumber: 1,
        lanes: [
          { laneNumber: 1, driverNumber: 5, backgroundColor: 'rgb(255, 0, 0)', foregroundColor: 'rgb(255, 255, 255)' }
        ]
      }
    ];
    fixture.detectChanges();
    const lanes = await harness.getLanesForHeat(0);
    expect(lanes.length).toBe(1);
    expect(lanes[0].bgColor).toBe('rgb(255, 0, 0)');
    expect(lanes[0].fgColor).toBe('rgb(255, 255, 255)');
  });

  it('should show header when showHeader is true', async () => {
    component.heats = [{ heatNumber: 1, lanes: [] }];
    component.showHeader = true;
    fixture.detectChanges();
    expect(await harness.hasHeader()).toBeTrue();
  });

  it('should hide header when showHeader is false', async () => {
    component.heats = [{ heatNumber: 1, lanes: [] }];
    component.showHeader = false;
    fixture.detectChanges();
    expect(await harness.hasHeader()).toBeFalse();
  });
});
