import { Type } from "@angular/core";

export type CustomWidgetFieldType =
  | "boolean"
  | "number"
  | "string"
  | "color"
  | "select";

export interface CustomWidgetSelectOption {
  label: string;
  value: string | number;
}

export interface CustomWidgetSettingField {
  key: string;
  label: string;
  type: CustomWidgetFieldType;
  default?: any;
  min?: number;
  max?: number;
  step?: number;
  options?: CustomWidgetSelectOption[];
  description?: string;
}

export interface CustomWidgetManifest {
  id: string;
  name: string;
  description?: string;
  author?: string;
  version?: string;
  category?: string;
  icon?: string;
  defaultWidth?: number;
  defaultHeight?: number;
  fullscreenCapable?: boolean;
  defaultSettings?: Record<string, any>;
  settingsSchema?: CustomWidgetSettingField[];
}

export interface CustomWidgetDefinition {
  folderName: string;
  manifest: CustomWidgetManifest;
  componentType?: Type<any>;
  error?: string;
  html?: string;
  css?: string;
  tsCode?: string;
}
