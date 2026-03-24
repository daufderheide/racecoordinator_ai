package com.antigravity.util;

import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.junit.Test;

import com.antigravity.models.Driver;
import com.antigravity.models.Track;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Heat;
import com.antigravity.race.Race;
import com.antigravity.race.RaceParticipant;

public class CsvExporterTest {

    @Test
    public void testExport_WithHistoricalAndCurrentSegments() {
        Race mockRace = mock(Race.class);
        com.antigravity.models.Race mockModel = mock(com.antigravity.models.Race.class);
        Track mockTrack = mock(Track.class);
        
        when(mockRace.getRaceModel()).thenReturn(mockModel);
        when(mockRace.getTrack()).thenReturn(mockTrack);
        when(mockModel.getName()).thenReturn("Mock Race");
        when(mockTrack.getName()).thenReturn("Mock Track");
        
        // Setup heats
        Heat mockHeat = mock(Heat.class);
        List<Heat> heats = Collections.singletonList(mockHeat);
        when(mockRace.getHeats()).thenReturn(heats);
        when(mockHeat.getHeatNumber()).thenReturn(1);
        
        // Setup DriverHeatData
        DriverHeatData dhd = mock(DriverHeatData.class);
        List<DriverHeatData> drivers = Collections.singletonList(dhd);
        when(mockHeat.getDrivers()).thenReturn(drivers);
        
        RaceParticipant mockPart = mock(RaceParticipant.class);
        Driver mockDriver = mock(Driver.class);
        when(dhd.getDriver()).thenReturn(mockPart);
        when(mockPart.getDriver()).thenReturn(mockDriver);
        when(mockDriver.getName()).thenReturn("Driver 1");
        when(dhd.getLapCount()).thenReturn(1);
        
        // Setup historical laps data
        List<DriverHeatData.LapData> laps = new ArrayList<>();
        DriverHeatData.LapData lap1 = mock(DriverHeatData.LapData.class);
        when(lap1.getLapTime()).thenReturn(5.5);
        when(lap1.getSegments()).thenReturn(java.util.Arrays.asList(1.2, 2.3));
        laps.add(lap1);
        
        when(dhd.getLaps()).thenReturn(laps);
        
        // Setup Current Lap (uncompleted segments)
        when(dhd.getSegments()).thenReturn(java.util.Arrays.asList(1.5, 1.8, 2.0));
        
        String csv = CsvExporter.export(mockRace);
        
        assertTrue("Csv output should contain Section Title for Track", csv.contains("#Section,Track Information"));
        assertTrue("Csv output should contain Track Name", csv.contains("Name,Mock Track"));
        
        // Verify Lap data contains historical segments columns (max is 3 from current)
        assertTrue("Csv output should contain Lap header with Segment titles", csv.contains("#Lap,Lap Time,Segment 1,Segment 2,Segment 3"));
        // Verify first lap row data includes its own historical segment values (size 2) and empty padding
        assertTrue("Csv output should render completed lap values with historical segments", csv.contains("1,5.5,1.2,2.3,"));
        
        // Verify Current Lap isolated sub-section
        assertTrue("Csv output should contains isolated Current Lap header", csv.contains("#Current Lap"));
        assertTrue("Csv output should contains Current Lap labels with spaces", csv.contains("#Segment 1, Segment 2, Segment 3"));
        assertTrue("Csv output should render current segment values list", csv.contains("1.5,1.8,2.0"));
    }
}
