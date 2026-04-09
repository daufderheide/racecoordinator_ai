import { Component, Input } from '@angular/core';

import { ArduinoConfig } from 'src/app/models/track';
import { com } from 'src/app/proto/message';
import { TranslationService } from 'src/app/services/translation.service';

@Component({
  selector: 'app-arduino-summary',
  templateUrl: './arduino-summary.component.html',
  styleUrls: ['./arduino-summary.component.css'],
  standalone: false
})
export class ArduinoSummaryComponent {
  @Input() config?: ArduinoConfig;
  @Input() index?: number;
  isExpanded = true;

  constructor(public translationService: TranslationService) { }

  toggleExpanded() {
    this.isExpanded = !this.isExpanded;
  }

  getBoardName(): string {
    if (!this.config) return '';
    return this.config.hardwareType === 1 ? 'AS_BOARD_MEGA' : 'AS_BOARD_UNO';
  }

  getConfiguredPinCount(): number {
    if (!this.config) return 0;
    const isConfigured = (id: number) => {
      // 0 = BEHAVIOR_UNUSED, 1 = BEHAVIOR_RESERVED
      return id !== com.antigravity.PinBehavior.BEHAVIOR_UNUSED &&
        id !== com.antigravity.PinBehavior.BEHAVIOR_RESERVED &&
        id !== -1;
    };
    const digitalCount = (this.config.digitalIds || []).filter(isConfigured).length;
    const analogCount = (this.config.analogIds || []).filter(isConfigured).length;
    return digitalCount + analogCount;
  }

  hasBehavior(behaviorType: 'lap' | 'segment' | 'call' | 'relay' | 'voltage'): boolean {
    if (!this.config) return false;
    const digitalIds = this.config.digitalIds || [];
    const analogIds = this.config.analogIds || [];
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
      case 'voltage':
        return allPins.some(id => id >= PB.BEHAVIOR_VOLTAGE_LEVEL_BASE && id < PB.BEHAVIOR_VOLTAGE_LEVEL_BASE + 1000);
      default:
        return false;
    }
  }
}