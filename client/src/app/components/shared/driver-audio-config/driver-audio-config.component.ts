import { Component, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  DriverAudioSlot,
  getAudioSlotFallbackName,
  getAudioSlotInfo,
} from "@app/components/driver-editor/driver-editor.helper";
import { AudioSelectorComponent } from "@app/components/shared/audio-selector/audio-selector.component";
import { AudioConfig } from "@app/models/driver";
import { TranslatePipe } from "@app/pipes/translate.pipe";

import {
  DRIVER_AUDIO_GROUPS,
  DriverAudioConfigGroup,
  DriverAudioConfigItem,
} from "./driver-audio-config.constants";

@Component({
  standalone: true,
  selector: "app-driver-audio-config",
  templateUrl: "./driver-audio-config.component.html",
  styleUrls: ["./driver-audio-config.component.css"],
  imports: [FormsModule, AudioSelectorComponent, TranslatePipe],
})
export class DriverAudioConfigComponent {
  driver = input<any>(undefined);
  overrides = input<{ [key: string]: AudioConfig }>({});
  isOverrideMode = input<boolean>(false);
  readonly = input<boolean>(false);
  assets = input<any[]>([]);
  ttsContext = input<any>(undefined);
  idPrefix = input<string>("");

  driverAudioChange = output<{
    key: string;
    field: "type" | "url" | "text";
    value: any;
  }>();
  overrideChange = output<{ key: string; config: AudioConfig | null }>();
  assetSelected = output<any>();
  resetAllOverrides = output<void>();

  readonly groups: readonly DriverAudioConfigGroup[] = DRIVER_AUDIO_GROUPS;

  getElementId(item: DriverAudioConfigItem): string {
    const prefix = this.idPrefix();
    return prefix ? `${prefix}-${item.elementId}` : item.elementId;
  }

  getGroupId(group: DriverAudioConfigGroup): string {
    const prefix = this.idPrefix();
    return prefix ? `${prefix}-${group.groupId}` : group.groupId;
  }

  getFallbackName(slot: DriverAudioSlot): string {
    return getAudioSlotFallbackName(slot);
  }

  isOverridden(key: string): boolean {
    const ov = this.overrides();
    return !!ov && ov[key] !== undefined && ov[key] !== null;
  }

  hasAnyOverrides(): boolean {
    const ov = this.overrides();
    return !!ov && Object.keys(ov).length > 0;
  }

  getConfig(item: DriverAudioConfigItem): AudioConfig {
    if (this.isOverrideMode()) {
      const ov = this.overrides();
      if (ov && ov[item.key]) {
        return ov[item.key];
      }
      const info = getAudioSlotInfo(item.slot);
      const defaultType = item.mode === "set" ? "audio_set" : "preset";
      return { type: defaultType, url: info.defaultUrl, text: "" };
    }
    const d = this.driver();
    return d && d[item.key]
      ? d[item.key]
      : {
          type: item.mode === "set" ? "audio_set" : "preset",
          url: "",
          text: "",
        };
  }

  onToggleOverride(item: DriverAudioConfigItem, enabled: boolean): void {
    if (this.readonly()) return;
    if (enabled) {
      const current = this.getConfig(item);
      const info = getAudioSlotInfo(item.slot);
      const defaultType = item.mode === "set" ? "audio_set" : "preset";
      const config: AudioConfig = {
        type: current.type || defaultType,
        url: current.url || info.defaultUrl,
        text: current.text || "",
      };
      const ov = this.overrides();
      if (ov) {
        ov[item.key] = config;
      }
      this.overrideChange.emit({ key: item.key, config });
    } else {
      const ov = this.overrides();
      if (ov) {
        delete ov[item.key];
      }
      this.overrideChange.emit({ key: item.key, config: null });
    }
  }

  onTypeChange(item: DriverAudioConfigItem, type: any): void {
    if (this.isOverrideMode()) {
      const current = this.getConfig(item);
      const updated: AudioConfig = { ...current, type };
      const ov = this.overrides();
      if (ov) {
        ov[item.key] = updated;
      }
      this.overrideChange.emit({ key: item.key, config: updated });
    } else {
      const d = this.driver();
      if (d && d[item.key]) {
        d[item.key].type = type;
      }
      this.driverAudioChange.emit({
        key: item.key,
        field: "type",
        value: type,
      });
    }
  }

  onUrlChange(item: DriverAudioConfigItem, url: string | undefined): void {
    if (this.isOverrideMode()) {
      const current = this.getConfig(item);
      const updated: AudioConfig = { ...current, url };
      const ov = this.overrides();
      if (ov) {
        ov[item.key] = updated;
      }
      this.overrideChange.emit({ key: item.key, config: updated });
    } else {
      const d = this.driver();
      if (d && d[item.key]) {
        d[item.key].url = url;
      }
      this.driverAudioChange.emit({ key: item.key, field: "url", value: url });
    }
  }

  onTextChange(item: DriverAudioConfigItem, text: string | undefined): void {
    if (this.isOverrideMode()) {
      const current = this.getConfig(item);
      const updated: AudioConfig = { ...current, text };
      const ov = this.overrides();
      if (ov) {
        ov[item.key] = updated;
      }
      this.overrideChange.emit({ key: item.key, config: updated });
    } else {
      const d = this.driver();
      if (d && d[item.key]) {
        d[item.key].text = text;
      }
      this.driverAudioChange.emit({
        key: item.key,
        field: "text",
        value: text,
      });
    }
  }

  onResetAll(): void {
    if (this.readonly()) return;
    this.resetAllOverrides.emit();
  }
}
