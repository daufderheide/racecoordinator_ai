import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { Component, Input, Output, EventEmitter, Pipe, PipeTransform, Directive } from '@angular/core';

@Pipe({
  name: 'translate',
  standalone: false
})
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

@Directive({
  selector: '[appSvgTextScaler]',
  standalone: false
})
class MockSvgTextScalerDirective {
  @Input() maxWidth: number = 0;
  @Input() scaleToFit: boolean = false;
}
import { DefaultRacedayComponent } from './default-raceday.component';
import { DataService } from 'src/app/data.service';
import { TranslationService } from 'src/app/services/translation.service';
import { RaceService } from 'src/app/services/race.service';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { of, Subject } from 'rxjs';
import { com } from 'src/app/proto/message';

@Component({
  selector: 'app-acknowledgement-modal',
  template: '',
  standalone: false
})
class MockAcknowledgementModalComponent {
  @Input() visible: boolean = false;
  @Input() title: string = '';
  @Input() message: string = '';
  @Input() buttonText: string = '';
  @Output() acknowledge = new EventEmitter<void>();
}

@Component({
  selector: 'app-confirmation-modal',
  template: '',
  standalone: false
})
class MockConfirmationModalComponent {
  @Input() visible: boolean = false;
  @Input() titleKey: string = '';
  @Input() messageKey: string = '';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}

describe('DefaultRacedayComponent', () => {
  let component: DefaultRacedayComponent;
  let fixture: ComponentFixture<DefaultRacedayComponent>;
  let mockDataService: any;
  let interfaceEventsSubject: Subject<com.antigravity.IInterfaceEvent>;

  beforeEach(async () => {
    interfaceEventsSubject = new Subject<com.antigravity.IInterfaceEvent>();

    mockDataService = {
      updateRaceSubscription: jasmine.createSpy('updateRaceSubscription'),
      getRaceUpdate: () => of({}),
      getRaceTime: () => of(0),
      getLaps: () => of(null),
      getReactionTimes: () => of(null),
      getStandingsUpdate: () => of({}),
      getOverallStandingsUpdate: () => of({}),
      getInterfaceEvents: () => interfaceEventsSubject.asObservable(),
      getRaceState: () => of(com.antigravity.RaceState.NOT_STARTED),
      connectToInterfaceDataSocket: jasmine.createSpy('connectToInterfaceDataSocket'),
      disconnectFromInterfaceDataSocket: jasmine.createSpy('disconnectFromInterfaceDataSocket'),
      serverUrl: 'http://localhost'
    };

    const mockTranslationService = {
      get: (key: string) => of(key),
      translate: (key: string) => key
    };

    const mockRaceService = {
      setRace: jasmine.createSpy('setRace'),
      setParticipants: jasmine.createSpy('setParticipants'),
      setHeats: jasmine.createSpy('setHeats'),
      setCurrentHeat: jasmine.createSpy('setCurrentHeat')
    };

    const mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };

    await TestBed.configureTestingModule({
      declarations: [DefaultRacedayComponent, MockAcknowledgementModalComponent, MockConfirmationModalComponent, MockTranslatePipe, MockSvgTextScalerDirective],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: RaceService, useValue: mockRaceService },
        { provide: Router, useValue: mockRouter },
        ChangeDetectorRef
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DefaultRacedayComponent);
    component = fixture.componentInstance;
    // fixture.detectChanges(); // Removed to allow manual control in fakeAsync
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should update isInterfaceConnected when interface connects', () => {
    fixture.detectChanges();
    // Initial state
    expect((component as any).isInterfaceConnected).toBeFalse();

    // Emit connected event
    interfaceEventsSubject.next({
      status: { status: com.antigravity.InterfaceStatus.CONNECTED }
    });

    expect((component as any).isInterfaceConnected).toBeTrue();
  });

  it('should update isInterfaceConnected when interface disconnects', () => {
    fixture.detectChanges();
    // Set to connected first
    interfaceEventsSubject.next({
      status: { status: com.antigravity.InterfaceStatus.CONNECTED }
    });
    expect((component as any).isInterfaceConnected).toBeTrue();

    // Emit disconnected event
    interfaceEventsSubject.next({
      status: { status: com.antigravity.InterfaceStatus.DISCONNECTED }
    });

    expect((component as any).isInterfaceConnected).toBeFalse();
  });

  it('should show modal immediately on NO_DATA', () => {
    fixture.detectChanges();
    interfaceEventsSubject.next({
      status: { status: com.antigravity.InterfaceStatus.NO_DATA }
    });

    expect(component.showAckModal).toBeTrue();
    expect(component.ackModalTitle).toBe('ACK_MODAL_TITLE_NO_DATA');
  });

  it('should wait 5s before showing modal on DISCONNECTED', fakeAsync(() => {
    fixture.detectChanges();
    interfaceEventsSubject.next({
      status: { status: com.antigravity.InterfaceStatus.DISCONNECTED }
    });

    // Should not show immediately
    expect(component.showAckModal).toBeFalse();

    // Advance time by 2.5s
    tick(2500);
    expect(component.showAckModal).toBeFalse();

    // Emit same status to reset watchdog (but not disconnect timer)
    interfaceEventsSubject.next({
      status: { status: com.antigravity.InterfaceStatus.DISCONNECTED }
    });

    // Advance remaining 2.5s (total 5s for disconnect timer)
    tick(2500);
    expect(component.showAckModal).toBeTrue();
    expect(component.ackModalTitle).toBe('ACK_MODAL_TITLE_DISCONNECTED');

    // Clear pending timers
    flush();
  }));

  it('should not show DISCONNECTED modal if CONNECTED before timeout', fakeAsync(() => {
    fixture.detectChanges();
    interfaceEventsSubject.next({
      status: { status: com.antigravity.InterfaceStatus.DISCONNECTED }
    });

    tick(4000);
    expect(component.showAckModal).toBeFalse();

    // Reconnect
    interfaceEventsSubject.next({
      status: { status: com.antigravity.InterfaceStatus.CONNECTED }
    });

    tick(2000); // Pass the original 5s mark
    expect(component.showAckModal).toBeFalse();
    expect(component.ackModalTitle).not.toBe('ACK_MODAL_TITLE_DISCONNECTED');

    // Clear pending timers
    flush();
  }));

  it('should show CONNECTED modal if recovered after error shown', () => {
    fixture.detectChanges();
    // Force error state
    (component as any).wasInterfaceErrorShown = true;

    interfaceEventsSubject.next({
      status: { status: com.antigravity.InterfaceStatus.CONNECTED }
    });

    expect(component.showAckModal).toBeTrue();
    expect(component.ackModalTitle).toBe('ACK_MODAL_TITLE_CONNECTED');
  });

  it('should trigger watchdog on NO_STATUS after timeout', fakeAsync(() => {
    fixture.detectChanges(); // Starts the watchdog in the fakeAsync zone
    // Reset watchdog happens on init.
    // Advance time by 5s
    tick(5000);

    expect(component.showAckModal).toBeTrue();
    expect(component.ackModalTitle).toBe('ACK_MODAL_TITLE_NO_STATUS');

    // Clear pending timers
    flush();
  }));

  it('should ignore duplicate status updates', fakeAsync(() => {
    fixture.detectChanges();
    // First DISCONNECTED event
    interfaceEventsSubject.next({
      status: { status: com.antigravity.InterfaceStatus.DISCONNECTED }
    });

    // Advance partially
    tick(2000);

    // Second DISCONNECTED event (should be ignored, timer continues from first)
    interfaceEventsSubject.next({
      status: { status: com.antigravity.InterfaceStatus.DISCONNECTED }
    });

    tick(3100); // 2000 + 3100 = 5100 from start
    expect(component.showAckModal).toBeTrue();

    // If it WASN'T ignored, it might have reset the timer? 
    // Actually our implementation of scheduleDisconnectedError checks if timer exists.
    // But the `lastInterfaceStatus` check returns EARLY, effectively doing nothing.
    // So this test verifies that the logic doesn't crash or behave unexpectedly.
    // A better test for `lastInterfaceStatus` might be checking `showInterfaceError` calls count logic,
    // but verifying behavior is standard.

    flush();
  }));

  describe('isNextHeatDisabled', () => {
    it('should be disabled when state is STARTING', () => {
      fixture.detectChanges();
      component['raceState'] = com.antigravity.RaceState.STARTING;
      expect(component.isNextHeatDisabled).toBeTrue();
    });

    it('should be disabled when state is RACING', () => {
      fixture.detectChanges();
      component['raceState'] = com.antigravity.RaceState.RACING;
      expect(component.isNextHeatDisabled).toBeTrue();
    });

    it('should be enabled when state is HEAT_OVER', () => {
      fixture.detectChanges();
      component['raceState'] = com.antigravity.RaceState.HEAT_OVER;
      expect(component.isNextHeatDisabled).toBeFalse();
    });

    it('should be disabled when state is RACE_OVER', () => {
      fixture.detectChanges();
      component['raceState'] = com.antigravity.RaceState.RACE_OVER;
      expect(component.isNextHeatDisabled).toBeTrue();
    });

    it('should be enabled when state is NOT_STARTED', () => {
      fixture.detectChanges();
      component['raceState'] = com.antigravity.RaceState.NOT_STARTED;
      expect(component.isNextHeatDisabled).toBeFalse();
    });
  });
});
