import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HeatListComponent } from './heat-list.component';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { TranslationService } from '../../../services/translation.service';

describe('HeatListComponent', () => {
  let component: HeatListComponent;
  let fixture: ComponentFixture<HeatListComponent>;
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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not display heat list when heats array is empty', () => {
    component.heats = [];
    fixture.detectChanges();
    const heatListElement = fixture.nativeElement.querySelector('.heat-list');
    expect(heatListElement).toBeNull();
  });

  it('should display heats when heats array has data', () => {
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
    const heatListElement = fixture.nativeElement.querySelector('.heat-list');
    expect(heatListElement).toBeTruthy();
  });

  it('should render correct number of heat items', () => {
    component.heats = [
      { heatNumber: 1, lanes: [] },
      { heatNumber: 2, lanes: [] },
      { heatNumber: 3, lanes: [] }
    ];
    fixture.detectChanges();
    const heatItems = fixture.nativeElement.querySelectorAll('.heat-item');
    expect(heatItems.length).toBe(3);
  });

  it('should apply lane colors correctly', () => {
    component.heats = [
      {
        heatNumber: 1,
        lanes: [
          { laneNumber: 1, driverNumber: 5, backgroundColor: 'rgb(255, 0, 0)', foregroundColor: 'rgb(255, 255, 255)' }
        ]
      }
    ];
    fixture.detectChanges();
    const laneItem = fixture.nativeElement.querySelector('.lane-item');
    expect(laneItem.style.backgroundColor).toBe('rgb(255, 0, 0)');
    expect(laneItem.style.color).toBe('rgb(255, 255, 255)');
  });

  it('should show header when showHeader is true', () => {
    component.heats = [{ heatNumber: 1, lanes: [] }];
    component.showHeader = true;
    fixture.detectChanges();
    const header = fixture.nativeElement.querySelector('.heat-list-header');
    expect(header).toBeTruthy();
  });

  it('should hide header when showHeader is false', () => {
    component.heats = [{ heatNumber: 1, lanes: [] }];
    component.showHeader = false;
    fixture.detectChanges();
    const header = fixture.nativeElement.querySelector('.heat-list-header');
    expect(header).toBeNull();
  });
});
