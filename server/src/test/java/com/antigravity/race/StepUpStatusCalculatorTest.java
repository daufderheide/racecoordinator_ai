package com.antigravity.race;

import static org.junit.Assert.assertEquals;

import com.antigravity.models.Driver;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.OverallScoring;
import com.antigravity.race.states.HeatOver;
import com.antigravity.race.states.NotStarted;
import com.antigravity.race.states.RaceOver;
import com.antigravity.race.states.Racing;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.junit.Before;
import org.junit.Test;

public class StepUpStatusCalculatorTest {

  private Driver d1;
  private Driver d2;
  private Driver d3;
  private RaceParticipant p1;
  private RaceParticipant p2;
  private RaceParticipant p3;
  private HeatScoring heatScoring;
  private OverallScoring overallScoring;

  @Before
  public void setUp() {
    d1 = new Driver("Alice", "A", "d1", "1");
    d2 = new Driver("Bob", "B", "d2", "2");
    d3 = new Driver("Charlie", "C", "d3", "3");

    p1 = new RaceParticipant(d1, "p1");
    p2 = new RaceParticipant(d2, "p2");
    p3 = new RaceParticipant(d3, "p3");

    heatScoring = new HeatScoring();
    overallScoring = new OverallScoring();
  }

  @Test
  public void testNonStepUpRace_ReturnsEmptyStatus() {
    Heat h1 =
        new Heat(
            1,
            Arrays.asList(new DriverHeatData(p1), new DriverHeatData(p2)),
            0,
            heatScoring,
            overallScoring,
            false);
    h1.setStep(1);

    List<RaceParticipant> drivers = Arrays.asList(p1, p2);
    StepUpStatusCalculator.calculateStepUpStatuses(
        drivers, Collections.singletonList(h1), h1, new Racing(), 0, heatScoring, overallScoring);

    assertEquals("", p1.getStepUpStatus());
    assertEquals("", p2.getStepUpStatus());
  }

  @Test
  public void testNullOrEmptyDrivers_HandledGracefully() {
    StepUpStatusCalculator.calculateStepUpStatuses(
        null, Collections.emptyList(), null, null, 1, heatScoring, overallScoring);
    StepUpStatusCalculator.calculateStepUpStatuses(
        Collections.emptyList(),
        Collections.emptyList(),
        null,
        null,
        1,
        heatScoring,
        overallScoring);
  }

  @Test
  public void testStep1NotStarted_Step1ParticipantsAreActive_HigherStepDriverPending() {
    // Before race starts (NotStarted state), drivers in step 1 are Active, drivers in higher steps
    // are Pending
    DriverHeatData dhd1 = new DriverHeatData(p1);
    DriverHeatData dhd2 = new DriverHeatData(p2);
    Heat h1 = new Heat(1, Arrays.asList(dhd1, dhd2), 0, heatScoring, overallScoring, false);
    h1.setStep(1);

    RaceParticipant stepUpPlaceholder = RaceParticipant.createStepUpParticipant(0);
    DriverHeatData dhdStepUp = new DriverHeatData(stepUpPlaceholder);
    dhdStepUp.setStepUpLaneIndex(1);
    Heat h2 =
        new Heat(
            2,
            Arrays.asList(new DriverHeatData(p3), dhdStepUp),
            0,
            heatScoring,
            overallScoring,
            false);
    h2.setStep(2);

    List<Heat> heats = Arrays.asList(h1, h2);
    List<RaceParticipant> drivers = Arrays.asList(p1, p2, p3);

    StepUpStatusCalculator.calculateStepUpStatuses(
        drivers, heats, h1, new NotStarted(), 1, heatScoring, overallScoring);

    assertEquals(StepUpStatusCalculator.STATUS_ACTIVE, p1.getStepUpStatus());
    assertEquals(StepUpStatusCalculator.STATUS_ACTIVE, p2.getStepUpStatus());
    assertEquals(StepUpStatusCalculator.STATUS_PENDING, p3.getStepUpStatus());
    assertEquals("", stepUpPlaceholder.getStepUpStatus());
  }

  @Test
  public void testStep1Running_ParticipantsAreActive_HigherStepDriverPending() {
    // p1 and p2 in step 1. p3 is seeded in step 2.
    DriverHeatData dhd1 = new DriverHeatData(p1);
    DriverHeatData dhd2 = new DriverHeatData(p2);
    Heat h1 = new Heat(1, Arrays.asList(dhd1, dhd2), 0, heatScoring, overallScoring, false);
    h1.setStep(1);
    h1.setStepUpBoundary(false);

    Heat h2 =
        new Heat(
            2,
            Arrays.asList(new DriverHeatData(p1), new DriverHeatData(p2)),
            0,
            heatScoring,
            overallScoring,
            false);
    h2.setStep(1);
    h2.setStepUpBoundary(true);

    RaceParticipant stepUpPlaceholder = RaceParticipant.createStepUpParticipant(0);
    DriverHeatData dhdStepUp = new DriverHeatData(stepUpPlaceholder);
    dhdStepUp.setStepUpLaneIndex(1);
    Heat h3 =
        new Heat(
            3,
            Arrays.asList(new DriverHeatData(p3), dhdStepUp),
            0,
            heatScoring,
            overallScoring,
            false);
    h3.setStep(2);

    List<Heat> heats = Arrays.asList(h1, h2, h3);
    List<RaceParticipant> drivers = Arrays.asList(p1, p2, p3);

    // Heat 1 is current and racing
    StepUpStatusCalculator.calculateStepUpStatuses(
        drivers, heats, h1, new Racing(), 1, heatScoring, overallScoring);

    assertEquals(StepUpStatusCalculator.STATUS_ACTIVE, p1.getStepUpStatus());
    assertEquals(StepUpStatusCalculator.STATUS_ACTIVE, p2.getStepUpStatus());
    assertEquals(
        StepUpStatusCalculator.STATUS_PENDING, p3.getStepUpStatus()); // Seeded in unstarted step 2
    assertEquals("", stepUpPlaceholder.getStepUpStatus());

    // Heat drivers also populated
    assertEquals(StepUpStatusCalculator.STATUS_ACTIVE, dhd1.getDriver().getStepUpStatus());
    assertEquals(StepUpStatusCalculator.STATUS_ACTIVE, dhd2.getDriver().getStepUpStatus());
  }

  @Test
  public void testStep1LastHeatOver_TopAdvancingIsSteppingUp_OtherEliminated() {
    Heat h1 =
        new Heat(
            1,
            Arrays.asList(new DriverHeatData(p1), new DriverHeatData(p2)),
            0,
            heatScoring,
            overallScoring,
            false);
    h1.setStep(1);
    h1.setStepUpBoundary(true);

    RaceParticipant stepUpPlaceholder = RaceParticipant.createStepUpParticipant(0);
    DriverHeatData dhdStepUp = new DriverHeatData(stepUpPlaceholder);
    dhdStepUp.setStepUpLaneIndex(1);
    Heat h2 =
        new Heat(
            2,
            Arrays.asList(new DriverHeatData(p3), dhdStepUp),
            0,
            heatScoring,
            overallScoring,
            false);
    h2.setStep(2);

    // p1 scored 20 laps, p2 scored 15 laps
    p1.setTotalLaps(20.0);
    p1.setTotalTime(100.0);
    p2.setTotalLaps(15.0);
    p2.setTotalTime(100.0);

    List<Heat> heats = Arrays.asList(h1, h2);
    List<RaceParticipant> drivers = Arrays.asList(p1, p2, p3);

    // Current heat is h1, state is HeatOver
    StepUpStatusCalculator.calculateStepUpStatuses(
        drivers, heats, h1, new HeatOver(), 1, heatScoring, overallScoring);

    // p1 advances -> Stepping up; p2 does not advance -> Eliminated; p3 -> Pending (step 2 not
    // started)
    assertEquals(StepUpStatusCalculator.STATUS_STEPPING_UP, p1.getStepUpStatus());
    assertEquals(StepUpStatusCalculator.STATUS_ELIMINATED, p2.getStepUpStatus());
    assertEquals(StepUpStatusCalculator.STATUS_PENDING, p3.getStepUpStatus());
  }

  @Test
  public void testStep2RunningAfterAdvancement_AdvancingDriverActive_EliminatedRemainsEliminated() {
    DriverHeatData dhd1 = new DriverHeatData(p1);
    dhd1.setFinished(true);
    DriverHeatData dhd2 = new DriverHeatData(p2);
    dhd2.setFinished(true);
    Heat h1 = new Heat(1, Arrays.asList(dhd1, dhd2), 0, heatScoring, overallScoring, false);
    h1.setStep(1);
    h1.setStepUpBoundary(true);

    // p1 advanced into heat 2 (Step 2)
    Heat h2 =
        new Heat(
            2,
            Arrays.asList(new DriverHeatData(p3), new DriverHeatData(p1)),
            0,
            heatScoring,
            overallScoring,
            false);
    h2.setStep(2);

    List<Heat> heats = Arrays.asList(h1, h2);
    List<RaceParticipant> drivers = Arrays.asList(p1, p2, p3);

    // Current heat is h2 (Step 2), racing
    StepUpStatusCalculator.calculateStepUpStatuses(
        drivers, heats, h2, new Racing(), 1, heatScoring, overallScoring);

    // Both p1 and p3 are in Step 2 -> Active; p2 was eliminated in Step 1 -> Eliminated
    assertEquals(StepUpStatusCalculator.STATUS_ACTIVE, p1.getStepUpStatus());
    assertEquals(StepUpStatusCalculator.STATUS_ACTIVE, p3.getStepUpStatus());
    assertEquals(StepUpStatusCalculator.STATUS_ELIMINATED, p2.getStepUpStatus());
  }

  @Test
  public void testRaceOver_FinalStepDriversActive_EarlierEliminatedDriversEliminated() {
    DriverHeatData dhd1 = new DriverHeatData(p1);
    dhd1.setFinished(true);
    DriverHeatData dhd2 = new DriverHeatData(p2);
    dhd2.setFinished(true);
    Heat h1 = new Heat(1, Arrays.asList(dhd1, dhd2), 0, heatScoring, overallScoring, false);
    h1.setStep(1);
    h1.setStepUpBoundary(true);

    DriverHeatData dhd3 = new DriverHeatData(p3);
    dhd3.setFinished(true);
    DriverHeatData dhd1_step2 = new DriverHeatData(p1);
    dhd1_step2.setFinished(true);
    Heat h2 = new Heat(2, Arrays.asList(dhd3, dhd1_step2), 0, heatScoring, overallScoring, false);
    h2.setStep(2);

    List<Heat> heats = Arrays.asList(h1, h2);
    List<RaceParticipant> drivers = Arrays.asList(p1, p2, p3);

    StepUpStatusCalculator.calculateStepUpStatuses(
        drivers, heats, h2, new RaceOver(), 1, heatScoring, overallScoring);

    // Drivers in final step (Step 2: p1, p3) are Active; p2 in step 1 is Eliminated
    assertEquals(StepUpStatusCalculator.STATUS_ACTIVE, p1.getStepUpStatus());
    assertEquals(StepUpStatusCalculator.STATUS_ACTIVE, p3.getStepUpStatus());
    assertEquals(StepUpStatusCalculator.STATUS_ELIMINATED, p2.getStepUpStatus());
  }

  @Test
  public void testFinalStepLastHeat_DriversAreActive() {
    // When currentStep == maxStepInGroup, even if last heat is over, drivers are Active
    Heat h1 =
        new Heat(
            1,
            Arrays.asList(new DriverHeatData(p1), new DriverHeatData(p2)),
            0,
            heatScoring,
            overallScoring,
            false);
    h1.setStep(1);
    h1.setStepUpBoundary(false);

    List<Heat> heats = Collections.singletonList(h1);
    List<RaceParticipant> drivers = Arrays.asList(p1, p2);

    StepUpStatusCalculator.calculateStepUpStatuses(
        drivers, heats, h1, new HeatOver(), 1, heatScoring, overallScoring);

    assertEquals(StepUpStatusCalculator.STATUS_ACTIVE, p1.getStepUpStatus());
    assertEquals(StepUpStatusCalculator.STATUS_ACTIVE, p2.getStepUpStatus());
  }

  @Test
  public void testLastHeatInStep_BeforeFinished_ShowsActiveNotSteppingUpOrEliminated() {
    // Step 1 has two heats: h1 and h2 (h2 is the last heat in step 1, step-up boundary)
    DriverHeatData dhd1_h1 = new DriverHeatData(p1);
    dhd1_h1.setFinished(true);
    DriverHeatData dhd2_h1 = new DriverHeatData(p2);
    dhd2_h1.setFinished(true);
    Heat h1 = new Heat(1, Arrays.asList(dhd1_h1, dhd2_h1), 0, heatScoring, overallScoring, false);
    h1.setStep(1);
    h1.setStarted(true);

    // h2 is the last heat in Step 1
    DriverHeatData dhd1_h2 = new DriverHeatData(p1);
    DriverHeatData dhd2_h2 = new DriverHeatData(p2);
    Heat h2 = new Heat(2, Arrays.asList(dhd1_h2, dhd2_h2), 0, heatScoring, overallScoring, false);
    h2.setStep(1);
    h2.setStepUpBoundary(true);

    RaceParticipant stepUpPlaceholder = RaceParticipant.createStepUpParticipant(0);
    DriverHeatData dhdStepUp = new DriverHeatData(stepUpPlaceholder);
    dhdStepUp.setStepUpLaneIndex(1);
    Heat h3 =
        new Heat(
            3,
            Arrays.asList(new DriverHeatData(p3), dhdStepUp),
            0,
            heatScoring,
            overallScoring,
            false);
    h3.setStep(2);

    List<Heat> heats = Arrays.asList(h1, h2, h3);
    List<RaceParticipant> drivers = Arrays.asList(p1, p2, p3);

    // 1. At start of last heat (h2) in Step 1, before it starts (NotStarted state):
    // Drivers in step 1 MUST show Active, NOT Stepping up or Eliminated!
    StepUpStatusCalculator.calculateStepUpStatuses(
        drivers, heats, h2, new NotStarted(), 1, heatScoring, overallScoring);

    assertEquals(StepUpStatusCalculator.STATUS_ACTIVE, p1.getStepUpStatus());
    assertEquals(StepUpStatusCalculator.STATUS_ACTIVE, p2.getStepUpStatus());
    assertEquals(StepUpStatusCalculator.STATUS_PENDING, p3.getStepUpStatus());

    // 2. While h2 is actively racing (Racing state):
    StepUpStatusCalculator.calculateStepUpStatuses(
        drivers, heats, h2, new Racing(), 1, heatScoring, overallScoring);

    assertEquals(StepUpStatusCalculator.STATUS_ACTIVE, p1.getStepUpStatus());
    assertEquals(StepUpStatusCalculator.STATUS_ACTIVE, p2.getStepUpStatus());
    assertEquals(StepUpStatusCalculator.STATUS_PENDING, p3.getStepUpStatus());

    // 3. Only once h2 finishes (HeatOver state):
    p1.setTotalLaps(30.0);
    p1.setTotalTime(120.0);
    p2.setTotalLaps(20.0);
    p2.setTotalTime(120.0);
    dhd1_h2.setFinished(true);
    dhd2_h2.setFinished(true);
    h2.setStarted(true);

    StepUpStatusCalculator.calculateStepUpStatuses(
        drivers, heats, h2, new HeatOver(), 1, heatScoring, overallScoring);

    assertEquals(StepUpStatusCalculator.STATUS_STEPPING_UP, p1.getStepUpStatus());
    assertEquals(StepUpStatusCalculator.STATUS_ELIMINATED, p2.getStepUpStatus());
    assertEquals(StepUpStatusCalculator.STATUS_PENDING, p3.getStepUpStatus());
  }
}
