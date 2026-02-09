import { Component, Input } from '@angular/core';
import { Track } from '../../../models/track';
import { TranslationService } from '../../../services/translation.service';
import { com } from '../../../proto/message';

@Component({
  selector: 'app-arduino-summary',
  templateUrl: './arduino-summary.component.html',
  styleUrls: ['./arduino-summary.component.css'],
  standalone: false
})
export class ArduinoSummaryComponent {
  @Input() track?: Track;

  constructor(public translationService: TranslationService) { }

  getBoardName(): string {
    if (!this.track || !this.track.arduino_config) return '';
    return this.track.arduino_config.hardwareType === 1 ? 'AS_BOARD_MEGA' : 'AS_BOARD_UNO';
  }

  getConfiguredPinCount(): number {
    if (!this.track || !this.track.arduino_config) return 0;
    const isConfigured = (id: number) => {
      // 0 = BEHAVIOR_UNUSED, 1 = BEHAVIOR_RESERVED
      return id !== com.antigravity.PinBehavior.BEHAVIOR_UNUSED &&
        id !== com.antigravity.PinBehavior.BEHAVIOR_RESERVED &&
        id !== -1;
    };
    const digitalCount = (this.track.arduino_config.digitalIds || []).filter(isConfigured).length;
    const analogCount = (this.track.arduino_config.analogIds || []).filter(isConfigured).length;
    return digitalCount + analogCount;
  }

  hasBehavior(behaviorType: 'lap' | 'segment' | 'call' | 'relay'): boolean {
    if (!this.track || !this.track.arduino_config) return false;
    const digitalIds = this.track.arduino_config.digitalIds || [];
    const analogIds = this.track.arduino_config.analogIds || [];
    const allPins = [...digitalIds, ...analogIds];

    const PB = com.antigravity.PinBehavior;

    switch (behaviorType) {
      case 'lap':
        return allPins.some(id => id >= PB.BEHAVIOR_LAP_BASE && id < PB.BEHAVIOR_SEGMENT_BASE);
      case 'segment':
        return allPins.some(id => id >= PB.BEHAVIOR_SEGMENT_BASE && id < PB.BEHAVIOR_CALL_BUTTON_BASE);
      case 'call':
        return allPins.some(id => id === PB.BEHAVIOR_CALL_BUTTON || (id >= PB.BEHAVIOR_CALL_BUTTON_BASE && id < PB.BEHAVIOR_RELAY_BASE));
      case 'relay':
        return allPins.some(id => id === PB.BEHAVIOR_RELAY || (id >= PB.BEHAVIOR_RELAY_BASE && id < PB.BEHAVIOR_RELAY_BASE + 1000));
      default:
        return false;
    }
  }
}
