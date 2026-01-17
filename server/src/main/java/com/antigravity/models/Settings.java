package com.antigravity.models;

import java.util.List;
import java.util.ArrayList;

public class Settings extends Model {
    private String selectedRaceId;
    private List<String> selectedDriverIds;

    public Settings() {
        this.selectedDriverIds = new ArrayList<>();
    }

    public Settings(String selectedRaceId, List<String> selectedDriverIds) {
        this.selectedRaceId = selectedRaceId;
        this.selectedDriverIds = selectedDriverIds;
    }

    public String getSelectedRaceId() {
        return selectedRaceId;
    }

    public void setSelectedRaceId(String selectedRaceId) {
        this.selectedRaceId = selectedRaceId;
    }

    public List<String> getSelectedDriverIds() {
        return selectedDriverIds;
    }

    public void setSelectedDriverIds(List<String> selectedDriverIds) {
        this.selectedDriverIds = selectedDriverIds;
    }
}
