import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TeamEditorComponent } from './team-editor.component';
import { DataService } from 'src/app/data.service';
import { TranslationService } from 'src/app/services/translation.service';
import { ConnectionMonitorService } from '../../services/connection-monitor.service';
import { Router, ActivatedRoute } from '@angular/router';
import { of, BehaviorSubject, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Component, Input, Output, EventEmitter, Pipe, PipeTransform } from '@angular/core';
import { Team } from 'src/app/models/team';
import { Driver } from 'src/app/models/driver';

// Mock Child Components
@Component({ selector: 'app-back-button', template: '', standalone: false })
class MockBackButtonComponent {
  @Input() route: string | null = null;
  @Input() queryParams: any = {};
  @Input() label: string = '';
}

@Component({ selector: 'app-image-selector', template: '', standalone: false })
class MockImageSelectorComponent {
  @Input() label?: string;
  @Input() imageUrl?: string;
  @Input() assets: any[] = [];
  @Output() imageUrlChange = new EventEmitter<string>();
  @Output() uploadStarted = new EventEmitter<void>();
  @Output() uploadFinished = new EventEmitter<void>();
}

@Component({ selector: 'app-item-selector', template: '', standalone: false })
class MockItemSelectorComponent {
  @Input() items: any[] = [];
  @Input() visible: boolean = false;
  @Input() backButtonRoute: string | null = null;
  @Input() backButtonQueryParams: any = {};
  @Input() title: string = '';
  @Input() itemType: string = 'image';
  @Output() select = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();
}

@Component({ selector: 'app-undo-redo-controls', template: '', standalone: false })
class MockUndoRedoControlsComponent {
  @Input() manager: any;
}

@Pipe({ name: 'translate', standalone: false })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string { return value; }
}

@Pipe({ name: 'avatarUrl', standalone: false })
class MockAvatarUrlPipe implements PipeTransform {
  transform(value: string): string { return value; }
}

describe('TeamEditorComponent', () => {
  let component: TeamEditorComponent;
  let fixture: ComponentFixture<TeamEditorComponent>;
  let mockDataService: any;
  let mockTranslationService: any;
  let mockConnectionMonitor: any;
  let mockRouter: any;
  let mockActivatedRoute: any;

  const mockDrivers = [
    new Driver('d1', 'Alice', 'Rocket', 'assets/images/default_avatar.svg'),
    new Driver('d2', 'Bob', 'Drifter', 'assets/images/default_avatar.svg')
  ];

  const mockTeams = [
    new Team('t1', 'Team Alpha', 'assets/images/default_avatar.svg', ['d1'])
  ];

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj('DataService', ['getDrivers', 'getTeams', 'listAssets', 'createTeam', 'updateTeam', 'uploadAsset']);
    mockTranslationService = jasmine.createSpyObj('TranslationService', ['translate']);
    mockConnectionMonitor = {
      connectionState$: new BehaviorSubject('CONNECTED'),
      startMonitoring: jasmine.createSpy('startMonitoring')
    };
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockActivatedRoute = {
      snapshot: {
        queryParamMap: {
          get: jasmine.createSpy('get').and.returnValue('new')
        }
      }
    };

    mockDataService.getDrivers.and.returnValue(of(mockDrivers));
    mockDataService.getTeams.and.returnValue(of(mockTeams));
    mockDataService.listAssets.and.returnValue(of([]));
    mockTranslationService.translate.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      declarations: [
        TeamEditorComponent,
        MockBackButtonComponent,
        MockItemSelectorComponent,
        MockImageSelectorComponent,
        MockUndoRedoControlsComponent,
        MockTranslatePipe,
        MockAvatarUrlPipe
      ],
      imports: [FormsModule],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: ConnectionMonitorService, useValue: mockConnectionMonitor },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TeamEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with new team when "new" ID provided', () => {
    mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue('new');
    component.loadData();
    expect(component.editingTeam?.entity_id).toBe('new');
    expect(component.hasChanges()).toBeFalse();
  });

  it('should load team when valid ID is provided', () => {
    mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue('t1');
    component.loadData();
    expect(component.editingTeam?.entity_id).toBe('t1');
    expect(component.editingTeam?.name).toBe('Team Alpha');
    expect(component.hasChanges()).toBeFalse();
  });

  it('should toggle driver membership', () => {
    mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue('t1');
    component.loadData();

    const driver2 = mockDrivers[1];
    expect(component.isDriverInTeam(driver2)).toBeFalse();

    component.toggleDriver(driver2);
    expect(component.isDriverInTeam(driver2)).toBeTrue();
    expect(component.hasChanges()).toBeTrue();

    component.toggleDriver(driver2);
    expect(component.isDriverInTeam(driver2)).toBeFalse();
  });

  it('should save existing team', () => {
    mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue('t1');
    component.loadData();

    component.editingTeam!.name = 'Updated Name';
    mockDataService.updateTeam.and.returnValue(of({ entity_id: 't1' }));
    mockDataService.getTeams.and.returnValue(of([new Team('t1', 'Updated Name', '', [])]));

    component.updateTeam();

    expect(mockDataService.updateTeam).toHaveBeenCalledWith('t1', jasmine.any(Object));
  });

  it('should save as new team', () => {
    mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue('t1');
    component.loadData();

    component.editingTeam!.name = 'Team Gamma';
    mockDataService.createTeam.and.returnValue(of({ entity_id: 't3' }));

    component.saveAsNew();

    expect(mockDataService.createTeam).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/team-editor'], { queryParams: { id: 't3' } });
  });

  it('should support undo/redo for name changes', () => {
    mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue('t1');
    component.loadData();

    component.onInputFocus();
    component.editingTeam!.name = 'Changed';
    component.onInputBlur();

    expect(component.editingTeam!.name).toBe('Changed');
    component.undo();
    expect(component.editingTeam!.name).toBe('Team Alpha');
    component.redo();
    expect(component.editingTeam!.name).toBe('Changed');
  });
});
