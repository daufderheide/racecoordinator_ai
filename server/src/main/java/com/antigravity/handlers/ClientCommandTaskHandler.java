package com.antigravity.handlers;

import com.antigravity.auth.Role;
import com.antigravity.context.DatabaseContext;
import com.antigravity.proto.InitializeRaceRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.javalin.Javalin;
import io.javalin.http.Context;
import java.util.Map;

public class ClientCommandTaskHandler implements AnalyticsHelper {

  private final RaceControlHandler raceControlHandler;
  private final InterfaceHardwareHandler interfaceHardwareHandler;
  private final DriverLaneHeatHandler driverLaneHeatHandler;
  private final RaceExportSaveHandler raceExportSaveHandler;
  private final AnalyticsHandler analyticsHandler;

  public ClientCommandTaskHandler(DatabaseContext databaseContext, Javalin app) {
    this.raceControlHandler = new RaceControlHandler(databaseContext);
    this.interfaceHardwareHandler = new InterfaceHardwareHandler();
    this.driverLaneHeatHandler = new DriverLaneHeatHandler(databaseContext);
    this.raceExportSaveHandler = new RaceExportSaveHandler(databaseContext);
    this.analyticsHandler = new AnalyticsHandler();

    // Race Control Endpoints
    app.post("/api/initialize-race", raceControlHandler::initializeRace, Role.DIRECTOR);
    app.post("/api/start-race", raceControlHandler::startRace, Role.DIRECTOR);
    app.post("/api/pause-race", raceControlHandler::pauseRace, Role.DIRECTOR);
    app.post("/api/end-race", raceControlHandler::endRace, Role.DIRECTOR);
    app.post("/api/next-heat", raceControlHandler::nextHeat, Role.DIRECTOR);
    app.post("/api/restart-heat", raceControlHandler::restartHeat, Role.DIRECTOR);
    app.post("/api/skip-heat", raceControlHandler::skipHeat, Role.DIRECTOR);
    app.post("/api/skip-race", raceControlHandler::skipRace, Role.DIRECTOR);
    app.post("/api/defer-heat", raceControlHandler::deferHeat, Role.DIRECTOR);
    app.post("/api/abort-timers", raceControlHandler::abortTimers, Role.DIRECTOR);
    app.post("/api/modify-heats", raceControlHandler::modifyHeats, Role.DIRECTOR);
    app.post("/api/regenerate-heats", raceControlHandler::regenerateHeats, Role.DIRECTOR);
    app.post("/api/finalize-modify-heats", raceControlHandler::finalizeModifyHeats, Role.DIRECTOR);

    // Interface Hardware & Power Endpoints
    app.post(
        "/api/update-interface-config",
        interfaceHardwareHandler::updateInterfaceConfig,
        Role.DIRECTOR);
    app.post(
        "/api/initialize-interface", interfaceHardwareHandler::initializeInterface, Role.DIRECTOR);
    app.post(
        "/api/set-interface-pin-state",
        interfaceHardwareHandler::setInterfacePinState,
        Role.DIRECTOR);
    app.post(
        "/api/set-interface-rgb-led-state",
        interfaceHardwareHandler::setInterfaceRgbLedState,
        Role.DIRECTOR);
    app.post("/api/close-interface", interfaceHardwareHandler::closeInterface, Role.DIRECTOR);
    app.post("/api/track/power/main", interfaceHardwareHandler::setMainPower, Role.DIRECTOR);
    app.post("/api/track/power/lane/{lane}", interfaceHardwareHandler::setLanePower, Role.DIRECTOR);
    app.get("/api/serial-ports", interfaceHardwareHandler::getSerialPorts, Role.VIEWER);
    app.get("/api/ble-devices", interfaceHardwareHandler::getBleDevices, Role.VIEWER);
    app.get("/api/phidgets", interfaceHardwareHandler::getPhidgetDevices, Role.VIEWER);

    // Driver, Lane & Heat Endpoints
    app.post(
        "/api/races/current-heat/drivers/{lane}/actual-driver",
        driverLaneHeatHandler::changeActualDriver,
        Role.DIRECTOR);
    app.post(
        "/api/races/current-heat/drivers/{lane}/reset",
        driverLaneHeatHandler::resetLaneHeatData,
        Role.DIRECTOR);
    app.post(
        "/api/races/heats/{heatNumber}/drivers/{lane}/actual-driver",
        driverLaneHeatHandler::changeHeatActualDriver,
        Role.DIRECTOR);
    app.post(
        "/api/races/current-heat/drivers/{lane}/user-laps",
        driverLaneHeatHandler::updateUserLaps,
        Role.DIRECTOR);
    app.post(
        "/api/races/heats/{heatNumber}/drivers/{lane}/user-laps",
        driverLaneHeatHandler::updateHeatUserLaps,
        Role.DIRECTOR);
    app.post(
        "/api/races/heats/user-laps/batch",
        driverLaneHeatHandler::updateBatchUserLaps,
        Role.DIRECTOR);
    app.post(
        "/api/races/current-heat/drivers/{fromLane}/change-lane/{toLane}",
        driverLaneHeatHandler::changeLane,
        Role.DIRECTOR);

    // Export & Save/Load Endpoints
    app.get("/api/races/current/export-csv", raceExportSaveHandler::exportRaceCsv, Role.VIEWER);
    app.post("/api/races/current/export-xls", raceExportSaveHandler::exportRaceXls, Role.VIEWER);
    app.post("/api/save-race", raceExportSaveHandler::saveRace, Role.DIRECTOR);
    app.get("/api/saved-races", raceExportSaveHandler::getSavedRaces, Role.VIEWER);
    app.delete(
        "/api/saved-races/{filename}", raceExportSaveHandler::deleteSavedRace, Role.DIRECTOR);
    app.post(
        "/api/delete-saved-race/{filename}", raceExportSaveHandler::deleteSavedRace, Role.DIRECTOR);
    app.post("/api/rename-saved-race", raceExportSaveHandler::renameSavedRace, Role.DIRECTOR);
    app.put("/api/saved-races/{filename}", raceExportSaveHandler::renameSavedRace, Role.DIRECTOR);
    app.post("/api/load-race", raceExportSaveHandler::loadRace, Role.DIRECTOR);

    // Analytics Endpoints
    app.post("/api/analytics/toggle", this::toggleAnalytics, Role.ADMIN);
    app.get("/api/analytics/config", this::getAnalyticsConfig, Role.VIEWER);
  }

  // --- Forwarding Methods for Test and Backwards Compatibility ---

  public static class TaskResult {
    public int status = 200;
    public String contentType;
    public Object result;

    public static TaskResult success(byte[] data) {
      TaskResult r = new TaskResult();
      r.contentType = "application/octet-stream";
      r.result = data;
      return r;
    }

    public static TaskResult error(int status, String message) {
      TaskResult r = new TaskResult();
      r.status = status;
      r.result = message;
      return r;
    }
  }

  public TaskResult handleInitializeRace(InitializeRaceRequest request) throws Exception {
    return raceControlHandler.handleInitializeRace(request);
  }

  void endRace(Context ctx) {
    raceControlHandler.endRace(ctx);
  }

  void abortTimers(Context ctx) {
    raceControlHandler.abortTimers(ctx);
  }

  void saveRace(Context ctx) {
    raceExportSaveHandler.saveRace(ctx);
  }

  void getSavedRaces(Context ctx) {
    raceExportSaveHandler.getSavedRaces(ctx);
  }

  void deleteSavedRace(Context ctx) {
    raceExportSaveHandler.deleteSavedRace(ctx);
  }

  void exportRaceXls(Context ctx) {
    raceExportSaveHandler.exportRaceXls(ctx);
  }

  void updateUserLaps(Context ctx) {
    driverLaneHeatHandler.updateUserLaps(ctx);
  }

  void updateUserLaps(Context ctx, Map<String, String> pathParams, Map<String, Object> body) {
    driverLaneHeatHandler.updateUserLaps(ctx, pathParams, body);
  }

  private void updateHeatUserLaps(Context ctx) {
    driverLaneHeatHandler.updateHeatUserLaps(ctx);
  }

  private void updateBatchUserLaps(Context ctx) {
    driverLaneHeatHandler.updateBatchUserLaps(ctx);
  }

  private void resetLaneHeatData(Context ctx) {
    driverLaneHeatHandler.resetLaneHeatData(ctx);
  }

  private void changeHeatActualDriver(Context ctx) {
    driverLaneHeatHandler.changeHeatActualDriver(ctx);
  }

  private void getPhidgetDevices(Context ctx) {
    interfaceHardwareHandler.getPhidgetDevices(ctx);
  }

  private void getBleDevices(Context ctx) {
    interfaceHardwareHandler.getBleDevices(ctx);
  }

  private void setInterfacePinState(Context ctx) {
    interfaceHardwareHandler.setInterfacePinState(ctx);
  }

  void getAnalyticsConfig(Context ctx) {
    analyticsHandler.getAnalyticsConfig(ctx, this);
  }

  void toggleAnalytics(Context ctx) {
    analyticsHandler.toggleAnalytics(ctx, this);
  }

  @Override
  public String getRemoteAddr(Context ctx) {
    return analyticsHandler.getRemoteAddr(ctx);
  }

  @Override
  public String getRemoteHost(Context ctx) {
    return analyticsHandler.getRemoteHost(ctx);
  }

  @Override
  public void setStatus(Context ctx, int status) {
    analyticsHandler.setStatus(ctx, status);
  }

  @Override
  public void setResult(Context ctx, String result) {
    analyticsHandler.setResult(ctx, result);
  }

  @Override
  public void setJson(Context ctx, Object obj) {
    analyticsHandler.setJson(ctx, obj);
  }

  @Override
  public byte[] getBodyBytes(Context ctx) {
    return analyticsHandler.getBodyBytes(ctx);
  }

  @Override
  public ObjectMapper getObjectMapper() {
    return analyticsHandler.getObjectMapper();
  }

  @Override
  public Map<String, String> getPathParamMap(Context ctx) {
    return analyticsHandler.getPathParamMap(ctx);
  }

  @Override
  public Map<String, Object> getBody(Context ctx) {
    return analyticsHandler.getBody(ctx);
  }

  public static class ExportLapData extends RaceExportSaveHandler.ExportLapData {
    public ExportLapData(
        String driverName,
        String actualDriverName,
        int heatNumber,
        int laneNumber,
        double absoluteHeatLapTime,
        double absoluteLapTime,
        double lapTime,
        java.util.List<Double> segments) {
      super(
          driverName,
          actualDriverName,
          heatNumber,
          laneNumber,
          absoluteHeatLapTime,
          absoluteLapTime,
          lapTime,
          segments);
    }
  }
}
