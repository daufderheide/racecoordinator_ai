import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ArduinoSummaryComponent } from './arduino-summary.component';
import { TranslationService } from '../../../services/translation.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { TranslationServiceMock } from '../../../testing/translation-service.mock';
import { Track, ArduinoConfig } from '../../../models/track';
import { com } from '../../../proto/message';

describe('ArduinoSummaryComponent', () => {
  let component: ArduinoSummaryComponent;
  let fixture: ComponentFixture<ArduinoSummaryComponent>;
  let translationService: TranslationServiceMock;

  beforeEach(async () => {
    translationService = new TranslationServiceMock();

    await TestBed.configureTestingModule({
      declarations: [ArduinoSummaryComponent, TranslatePipe],
      providers: [
        { provide: TranslationService, useValue: translationService }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ArduinoSummaryComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getBoardName', () => {
    it('should return empty string if no track', () => {
      component.track = undefined;
      expect(component.getBoardName()).toBe('');
    });

    it('should return AS_BOARD_MEGA for hardware type 1', () => {
      component.track = new Track('t1', 'Track 1', [], { hardwareType: 1 } as any);
      expect(component.getBoardName()).toBe('AS_BOARD_MEGA');
    });

    it('should return AS_BOARD_UNO for hardware type 0', () => {
      component.track = new Track('t1', 'Track 1', [], { hardwareType: 0 } as any);
      expect(component.getBoardName()).toBe('AS_BOARD_UNO');
    });
  });

  describe('getConfiguredPinCount', () => {
    it('should return 0 if no config', () => {
      component.track = undefined;
      expect(component.getConfiguredPinCount()).toBe(0);
    });

    it('should count configured pins excluding unused and reserved', () => {
      const digitalIds = [
        com.antigravity.PinBehavior.BEHAVIOR_UNUSED, // 0
        com.antigravity.PinBehavior.BEHAVIOR_RESERVED, // 1
        com.antigravity.PinBehavior.BEHAVIOR_CALL_BUTTON, // 2 (Counted)
        -1, // Not counted
        1000 // Counted
      ];
      const analogIds = [
        com.antigravity.PinBehavior.BEHAVIOR_UNUSED, // 0
        2000 // Counted
      ];

      component.track = new Track('t1', 'Track 1', [], { digitalIds, analogIds } as any);
      expect(component.getConfiguredPinCount()).toBe(3);
    });
  });

  describe('hasBehavior', () => {
    it('should detect laps', () => {
      const digitalIds = [com.antigravity.PinBehavior.BEHAVIOR_LAP_BASE]; // 1000
      component.track = new Track('t1', 'Track 1', [], { digitalIds } as any);
      expect(component.hasBehavior('lap')).toBeTrue();
    });

    it('should detect segments', () => {
      const digitalIds = [com.antigravity.PinBehavior.BEHAVIOR_SEGMENT_BASE]; // 2000
      component.track = new Track('t1', 'Track 1', [], { digitalIds } as any);
      expect(component.hasBehavior('segment')).toBeTrue();
    });

    it('should detect call buttons', () => {
      let digitalIds = [com.antigravity.PinBehavior.BEHAVIOR_CALL_BUTTON]; // 2
      component.track = new Track('t1', 'Track 1', [], { digitalIds } as any);
      expect(component.hasBehavior('call')).toBeTrue();

      digitalIds = [com.antigravity.PinBehavior.BEHAVIOR_CALL_BUTTON_BASE]; // 3000
      component.track = new Track('t1', 'Track 1', [], { digitalIds } as any);
      expect(component.hasBehavior('call')).toBeTrue();
    });

    it('should detect relays', () => {
      let digitalIds = [com.antigravity.PinBehavior.BEHAVIOR_RELAY]; // 3
      component.track = new Track('t1', 'Track 1', [], { digitalIds } as any);
      expect(component.hasBehavior('relay')).toBeTrue();

      digitalIds = [com.antigravity.PinBehavior.BEHAVIOR_RELAY_BASE]; // 4000
      component.track = new Track('t1', 'Track 1', [], { digitalIds } as any);
      expect(component.hasBehavior('relay')).toBeTrue();
    });

    it('should return false if behavior absent', () => {
      component.track = new Track('t1', 'Track 1', [], { digitalIds: [], analogIds: [] } as any);
      expect(component.hasBehavior('lap')).toBeFalse();
      expect(component.hasBehavior('segment')).toBeFalse();
      expect(component.hasBehavior('call')).toBeFalse();
      expect(component.hasBehavior('relay')).toBeFalse();
    });
  });
});
