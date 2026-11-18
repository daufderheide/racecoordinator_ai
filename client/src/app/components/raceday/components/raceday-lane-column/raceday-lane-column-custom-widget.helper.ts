import { AbsoluteWidgetNode } from "@app/models/settings";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { CustomWidgetService } from "@app/services/custom-widget.service";

import {
  resolveCachedSyntheticInsetInputs,
  resolveCachedSyntheticMainInputs,
} from "./raceday-lane-column-interaction.helper";

export class LaneColumnCustomWidgetHelper {
  private insetCustomInputs = new Map<string, any>();
  private mainCustomInputsRef: { current?: any } = {};

  constructor(private customWidgetService?: CustomWidgetService | null) {}

  getCustomWidgetComponent(key: string | undefined): any {
    if (!key) return null;
    return this.customWidgetService?.getWidgetComponent(key) || null;
  }

  getCustomWidgetInputsForInset(
    anchor: string,
    insetKey: string | undefined,
    widget: AbsoluteWidgetNode | null,
    bindingMode: string,
    targetIndex: number,
    fontSize: number,
    parent: any,
    isUIEditorMode: boolean,
    targetDriver: DriverHeatData | undefined,
    textColor: string,
    backgroundColor: string,
  ) {
    return resolveCachedSyntheticInsetInputs(
      this.insetCustomInputs,
      anchor,
      insetKey,
      widget,
      bindingMode,
      targetIndex,
      fontSize,
      parent,
      isUIEditorMode,
      targetDriver,
      textColor,
      backgroundColor,
    );
  }

  getCustomWidgetInputsForMain(
    columnKey: string,
    widget: AbsoluteWidgetNode | null,
    bindingMode: string,
    targetIndex: number,
    parent: any,
    isUIEditorMode: boolean,
    targetDriver: DriverHeatData | undefined,
    textColor: string,
    backgroundColor: string,
  ) {
    return resolveCachedSyntheticMainInputs(
      this.mainCustomInputsRef,
      columnKey,
      widget,
      bindingMode,
      targetIndex,
      parent,
      isUIEditorMode,
      targetDriver,
      textColor,
      backgroundColor,
    );
  }
}
