import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, Input, Output, EventEmitter, Pipe, PipeTransform } from '@angular/core';
import { DriverStationComponent } from './driver-station.component';
import { DataService } from 'src/app/data.service';
import { FinishMethod } from 'src/app/models/heat_scoring';
import { com } from 'src/app/proto/message';

import { RaceService } from 'src/app/services/race.service';
import { TranslationService } from 'src/app/services/translation.service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';

@Pipe({
  name: 'translate',
  standalone: false
})
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe('DriverStationComponent', () => {
  let component: DriverStationComponent;
  let fixture: ComponentFixture<DriverStationComponent>;
  let mockDataService: any;
  let mockRaceService: any;

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj('DataService', [
      'updateRaceSubscription', 'getRaceUpdate', 'getRaceTime', 'getLaps',
      'getCarData', 'getStandingsUpdate', 'connectToInterfaceDataSocket', 'disconnectFromInterfaceDataSocket'
    ]);
    mockDataService.getRaceUpdate.and.returnValue(of({}));
    mockDataService.getRaceTime.and.returnValue(of(0));
    mockDataService.getLaps.and.returnValue(of(null));
    mockDataService.getCarData.and.returnValue(of({}));
    mockDataService.getStandingsUpdate.and.returnValue(of({}));
    mockDataService.serverUrl = 'http://localhost';

    mockRaceService = jasmine.createSpyObj('RaceService', [
      'getRace', 'getCurrentHeat', 'setRace', 'setParticipants', 'setHeats', 'setCurrentHeat'
    ]);
    mockRaceService.getRace.and.returnValue({
      name: 'Mock Race',
      track: { lanes: [{ objectId: 'l1', backgroundColor: '#550000', foregroundColor: '#ffffff' }] }
    });

    const mockActivatedRoute = {
      params: of({ lane: '0' })
    };

    const mockTranslationService = {
      translate: (key: string) => key
    };

    await TestBed.configureTestingModule({
      declarations: [DriverStationComponent, MockTranslatePipe],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: RaceService, useValue: mockRaceService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: TranslationService, useValue: mockTranslationService },
        ChangeDetectorRef
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DriverStationComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should calculate progress percentage correctly for lap-based race', () => {
    component['race'] = {
      heat_scoring: { finishMethod: FinishMethod.Lap, finishValue: 10 }
    } as any;
    component['driverData'] = { lapCount: 4 } as any;

    expect(component.progressPercentage).toBe(40);
  });

  it('should calculate progress percentage correctly for timed race', () => {
    component['race'] = {
      heat_scoring: { finishMethod: FinishMethod.Timed, finishValue: 200 }
    } as any;
    component['time'] = 100;

    expect(component.progressPercentage).toBe(50);
  });

});
