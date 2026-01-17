package com.antigravity.models;

public class Lane extends Model {
    private String background_color;
    private String foreground_color;
    private int length;

    public Lane() {
    }

    public Lane(String background_color, String foreground_color, int length) {
        this.background_color = background_color;
        this.foreground_color = foreground_color;
        this.length = length;
    }

    public String getBackground_color() {
        return background_color;
    }

    public void setBackground_color(String background_color) {
        this.background_color = background_color;
    }

    public String getForeground_color() {
        return foreground_color;
    }

    public void setForeground_color(String foreground_color) {
        this.foreground_color = foreground_color;
    }

    public int getLength() {
        return length;
    }

    public void setLength(int length) {
        this.length = length;
    }
}
