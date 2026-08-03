package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;

import com.antigravity.models.Event;
import com.antigravity.models.Event.EventRaceItem;
import java.util.ArrayList;
import java.util.List;
import org.junit.Test;

public class EventExecutionManagerTest {

  @Test
  public void testEventExecutionManagerSingletonAndStatus() {
    EventExecutionManager manager = EventExecutionManager.getInstance();
    assertNotNull(manager);
    assertFalse(manager.isEventActive());
    assertEquals(0.0, manager.getAutoAdvanceRemainingSeconds(), 0.001);
  }

  @Test
  public void testEventDriverQualificationLogic() {
    List<EventRaceItem> raceItems = new ArrayList<>();
    raceItems.add(new EventRaceItem("race_1", 0)); // Unlimited
    raceItems.add(new EventRaceItem("race_2", 2)); // Top 2 qualify

    Event event = new Event("Championship", "Test Event", 5.0, raceItems, "e1", null);
    assertEquals(2, event.getRaces().size());
    assertEquals(0, event.getRaces().get(0).getMaxDrivers());
    assertEquals(2, event.getRaces().get(1).getMaxDrivers());
  }
}
