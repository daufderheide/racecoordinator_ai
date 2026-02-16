import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TeamManagerComponent } from './team-manager.component';
import { DataService } from 'src/app/data.service';
import { TranslationService } from 'src/app/services/translation.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { ConnectionMonitorService, ConnectionState } from '../../services/connection-monitor.service';
import { of, BehaviorSubject } from 'rxjs';
import { Team } from 'src/app/models/team';
import { Driver } from 'src/app/models/driver';
import { SharedModule } from 'src/app/components/shared/shared.module';
import { AvatarUrlPipe } from 'src/app/pipes/avatar-url.pipe';

describe('TeamManagerComponent', () => {
  let component: TeamManagerComponent;
  let fixture: ComponentFixture<TeamManagerComponent>;
  let mockDataService: jasmine.SpyObj<DataService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockConnectionMonitor: jasmine.SpyObj<ConnectionMonitorService>;
  let connectionStateSubject: BehaviorSubject<ConnectionState>;
  let mockActivatedRoute: any;

  const mockDrivers = [
    new Driver('d1', 'Alice', 'Rocket', 'assets/images/default_avatar.svg'),
    new Driver('d2', 'Bob', 'Drifter', 'assets/images/default_avatar.svg')
  ];

  const mockTeams = [
    new Team('t1', 'Team Alpha', 'assets/images/default_avatar.svg', ['d1']),
    new Team('t2', 'Team Beta', 'assets/images/default_avatar.svg', ['d2'])
  ];

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj('DataService', ['getTeams', 'getDrivers', 'deleteTeam']);
    mockTranslationService = jasmine.createSpyObj('TranslationService', ['translate']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockConnectionMonitor = jasmine.createSpyObj('ConnectionMonitorService', ['startMonitoring', 'stopMonitoring']);
    connectionStateSubject = new BehaviorSubject<ConnectionState>(ConnectionState.CONNECTED);
    Object.defineProperty(mockConnectionMonitor, 'connectionState$', { get: () => connectionStateSubject.asObservable() });

    mockActivatedRoute = {
      snapshot: {
        queryParamMap: {
          get: jasmine.createSpy('get').and.returnValue(null)
        }
      }
    };

    mockDataService.getTeams.and.returnValue(of(mockTeams));
    mockDataService.getDrivers.and.returnValue(of(mockDrivers));
    mockTranslationService.translate.and.callFake((key) => key);

    await TestBed.configureTestingModule({
      declarations: [TeamManagerComponent, AvatarUrlPipe],
      imports: [SharedModule],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ConnectionMonitorService, useValue: mockConnectionMonitor },
        ChangeDetectorRef
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TeamManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load teams and drivers on init', () => {
      expect(mockDataService.getTeams).toHaveBeenCalled();
      expect(mockDataService.getDrivers).toHaveBeenCalled();
      expect(component.teams.length).toBe(2);
      expect(component.filteredTeams.length).toBe(2);
    });

    it('should select first team by default if no query param', () => {
      expect(component.selectedTeam?.entity_id).toEqual('t1');
      expect(component.editingTeam).toBeDefined();
      expect(component.editingTeam?.name).toBe('Team Alpha');
    });

    it('should select team from query param', () => {
      // Need to recreate component to inject different route
      TestBed.resetTestingModule();
      mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue('t2');

      TestBed.configureTestingModule({
        declarations: [TeamManagerComponent, AvatarUrlPipe],
        imports: [SharedModule],
        providers: [
          { provide: DataService, useValue: mockDataService },
          { provide: TranslationService, useValue: mockTranslationService },
          { provide: Router, useValue: mockRouter },
          { provide: ActivatedRoute, useValue: mockActivatedRoute },
          { provide: ConnectionMonitorService, useValue: mockConnectionMonitor },
          ChangeDetectorRef
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(TeamManagerComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.selectedTeam?.entity_id).toBe('t2');
    });
  });

  describe('Filtering', () => {
    it('should filter teams by name', () => {
      component.searchQuery = 'alpha';
      expect(component.filteredTeams.length).toBe(1);
      expect(component.filteredTeams[0].name).toBe('Team Alpha');
    });
  });

  describe('Navigation', () => {
    it('should navigate to editor on edit', () => {
      component.selectTeam(mockTeams[0]);
      component.updateTeam();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/team-editor'], {
        queryParams: { id: 't1' }
      });
    });

    it('should navigate to editor for new team', () => {
      component.createNewTeam();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/team-editor'], {
        queryParams: { id: 'new' }
      });
    });
  });

  describe('Deletion', () => {
    it('should show confirmation modal', () => {
      component.selectTeam(mockTeams[0]);
      component.deleteTeam();
      expect(component.showDeleteConfirmation).toBeTrue();
    });

    it('should delete team if confirmed', () => {
      mockDataService.deleteTeam.and.returnValue(of({}));
      component.selectTeam(mockTeams[0]);
      component.deleteTeam();
      component.onConfirmDelete();

      expect(component.showDeleteConfirmation).toBeFalse();
      expect(mockDataService.deleteTeam).toHaveBeenCalledWith('t1');
      expect(mockDataService.getTeams).toHaveBeenCalledTimes(2);
    });
  });
});
