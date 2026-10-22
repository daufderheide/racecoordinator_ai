package com.antigravity.race;

import com.antigravity.models.FuelOptions;
import com.antigravity.proto.DemoConfig;
import com.antigravity.proto.RaceFlag;
import com.antigravity.protocols.HardwareProtocolFactory;
import com.antigravity.protocols.IProtocol;
import com.antigravity.protocols.ProtocolDelegate;
import com.antigravity.protocols.demo.Demo;
import com.antigravity.race.states.Racing;
import com.antigravity.race.states.Starting;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class RaceHardwareManager {

  private static final Logger logger = LoggerFactory.getLogger(RaceHardwareManager.class);

  private final Race race;
  private ProtocolDelegate protocols;

  public RaceHardwareManager(Race race) {
    this.race = race;
  }

  public ProtocolDelegate getProtocols() {
    return protocols;
  }

  public void setProtocols(ProtocolDelegate protocols) {
    this.protocols = protocols;
  }

  public void createProtocols(boolean isDemoMode, DemoConfig demoConfig) {
    List<IProtocol> protocols_list = new ArrayList<>();
    if (isDemoMode) {
      boolean isFuelRace =
          race.getRaceModel().getFuelOptions() != null
              && race.getRaceModel().getFuelOptions().isEnabled();
      boolean startBehindSensor = race.getRaceModel().isStartBehindSensor();
      Demo protocol =
          new Demo(race.getTrack().getLanes().size(), isFuelRace, demoConfig, startBehindSensor);
      protocol.setInterfaceIndex(0);
      protocols_list.add(protocol);
    } else {
      protocols_list = HardwareProtocolFactory.createProtocolsForTrack(race.getTrack(), race);
      if (protocols_list.isEmpty()) {
        throw new IllegalArgumentException(
            "Race created in Real Mode, but no hardware configs found for track: "
                + race.getTrack().getName());
      }
    }
    this.protocols = new ProtocolDelegate(protocols_list);
    this.protocols.setListener(race);
  }

  public void initializeHardwareState() {
    if (this.protocols == null) {
      return;
    }

    String stateName =
        race.getState() != null ? race.getState().getClass().getSimpleName() : "null";
    RaceFlag currentFlag =
        race.getState() != null ? race.getState().getFlagType(race) : RaceFlag.UNKNOWN_FLAG;
    logger.info("initializeHardwareState: state={}, flag={}", stateName, currentFlag);

    this.protocols.initializeHardwareState();

    // 1. Race State and Flag
    this.protocols.setRaceState(
        race.getProtoState(race.getState()),
        race.getState().getFlagType(race),
        race.getAutoStartRemaining());

    // 2. Heat Standings / Heat Leader
    if (race.getCurrentHeat() != null && race.getCurrentHeat().getHeatStandings() != null) {
      List<String> standingsIds = race.getCurrentHeat().getStandings();
      List<DriverHeatData> heatDrivers = race.getCurrentHeat().getDrivers();
      List<Integer> rankings = new ArrayList<>();
      for (String id : standingsIds) {
        for (int i = 0; i < heatDrivers.size(); i++) {
          DriverHeatData dhd = heatDrivers.get(i);
          if (dhd.getObjectId().equals(id)) {
            // Only add if not an empty driver
            if (dhd.getActualDriver() != null && !dhd.getActualDriver().isEmpty()) {
              rankings.add(i);
            }
            break;
          }
        }
      }
      this.protocols.setHeatStandings(rankings);
    }

    // 3. Fuel Levels
    FuelOptions fuelOptions = race.getFuelOptions();
    double capacity =
        (fuelOptions != null && fuelOptions.isEnabled()) ? fuelOptions.getCapacity() : 0.0;
    for (int i = 0; i < race.getDrivers().size(); i++) {
      double fuelLevel =
          (fuelOptions != null && fuelOptions.isEnabled())
              ? race.getDrivers().get(i).getFuelLevel()
              : 0.0;
      this.protocols.setFuelLevel(i, fuelLevel, capacity);
      this.protocols.setRefueling(i, false);
    }

    // 4. Heat Progress
    this.protocols.setHeatProgress(0);

    // 5. Power state
    updatePowerForFlag(currentFlag);
    forceMainPowerSync();
  }

  private boolean calculateBasePowerForFlag(RaceFlag flag) {
    if (race.getState() instanceof Racing) {
      if (flag == RaceFlag.GREEN || flag == RaceFlag.GREEN_YELLOW || flag == RaceFlag.WHITE) {
        return true;
      }
      return race.getHeatExecutionManager().isAllowFinishEnabled();
    }

    switch (flag) {
      case GREEN:
      case GREEN_YELLOW:
      case WHITE:
        return true;
      case CHECKERED:
        return race.getHeatExecutionManager().isAllowFinishEnabled();
      case YELLOW:
      case RED:
      default:
        return false;
    }
  }

  private boolean evaluateHotStartPower(boolean basePower, List<Integer> coldLanes) {
    boolean isStarting = race.getState() instanceof Starting;
    boolean isHot = race.getRaceModel() != null && race.getRaceModel().isHotStart();
    boolean hasRaced = race.hasRacedInCurrentHeat();

    if (!isStarting || !isHot || hasRaced) {
      return basePower;
    }

    logger.info(
        "evaluateHotStartPower: hot start active during Starting countdown (hasRacedInHeat=false)");
    boolean powerOn = true;

    if (race.getRaceModel().isStartAtCurrent() && race.getCurrentHeat() != null) {
      List<DriverHeatData> drivers = race.getCurrentHeat().getDrivers();
      for (int i = 0; i < drivers.size(); i++) {
        DriverHeatData dhd = drivers.get(i);
        if (dhd != null
            && dhd.getDriver() != null
            && dhd.getDriver().getStableId() != null
            && !race.isFirstHeatForDriver(dhd.getDriver().getStableId(), race.getCurrentHeat())) {
          coldLanes.add(i);
        }
      }

      boolean anyColdStartLanes = !coldLanes.isEmpty();
      logger.info(
          "evaluateHotStartPower: startAtCurrent=true, coldLanes={}, hasPerLaneRelays={}",
          coldLanes,
          hasPerLaneRelays());

      if (anyColdStartLanes && !hasPerLaneRelays()) {
        logger.warn(
            "evaluateHotStartPower: turning main power OFF because cold lanes exist {} and track lacks per-lane relays",
            coldLanes);
        powerOn = false;
      }
    }
    return powerOn;
  }

  public void updatePowerForFlag(RaceFlag flag) {
    boolean basePower = calculateBasePowerForFlag(flag);
    List<Integer> coldLanes = new ArrayList<>();
    boolean powerOn = evaluateHotStartPower(basePower, coldLanes);

    String stateName =
        race.getState() != null ? race.getState().getClass().getSimpleName() : "null";
    boolean isHot = race.getRaceModel() != null && race.getRaceModel().isHotStart();
    logger.info(
        "updatePowerForFlag: flag={}, state={}, isHotStart={}, hasRaced={}, powerOn={}, hasMainRelay={}, hasPerLaneRelays={}",
        flag,
        stateName,
        isHot,
        race.hasRacedInCurrentHeat(),
        powerOn,
        hasMainRelay(),
        hasPerLaneRelays());

    race.setMainPower(powerOn);

    if (protocols == null) return;
    protocols.setMainPower(powerOn);

    if (!coldLanes.isEmpty() && hasPerLaneRelays() && powerOn) {
      logger.info("updatePowerForFlag: disabling power for cold lanes: {}", coldLanes);
      for (int lane : coldLanes) {
        race.setLanePower(false, lane);
      }
    }
  }

  public void forceMainPowerSync() {
    if (protocols != null) {
      logger.debug(
          "forceMainPowerSync: syncing mainPower={} and lanes with protocols", race.isMainPower());
      protocols.setMainPower(race.isMainPower());
      race.syncLanePowerWithState(race.isMainPower());
    }
  }

  public void close() {
    if (protocols != null) {
      protocols.close();
    }
  }

  public boolean open() {
    return protocols != null && protocols.open();
  }

  public boolean hasPerLaneRelays() {
    return protocols != null && protocols.hasPerLaneRelays();
  }

  public boolean hasMainRelay() {
    return protocols != null && protocols.hasMainRelay();
  }
}
