export abstract class HeatResultsHarnessBase {
  static readonly hostSelector = "app-heat-results, app-default-heat-results";

  static readonly selectors = {
    heatDriverExpander: "app-heat-driver-expander",
    twinGraphs: "app-twin-graphs",
    legendItem: ".legend-item",
    loaderOverlay: ".loader-overlay",
    trajectoryButton: "app-heat-driver-expander .trajectory-btn",
    trajectoryModal: "app-ghost-trajectory-dialog .trajectory-modal-container",
  };

  abstract hasHeatDriverExpander(): Promise<boolean>;
  abstract hasTwinGraphs(): Promise<boolean>;
  abstract getHeatDriverExpanderCount(): Promise<number>;
  abstract hasTrajectoryModal(): Promise<boolean>;
  abstract hasTrajectoryButton(): Promise<boolean>;
  abstract clickTrajectoryButton(index?: number): Promise<void>;
}
