package com.antigravity.protocols;

import java.util.List;

public class ProtocolDelegate {
    private List<IProtocol> protocols;

    public ProtocolDelegate(List<IProtocol> protocols) {
        this.protocols = protocols;
    }

    public void setListener(ProtocolListener listener) {
        for (IProtocol protocol : protocols) {
            protocol.setListener(listener);
        }
    }

    public void startTimer() {
        for (IProtocol protocol : protocols) {
            protocol.startTimer();
        }
    }

    public java.util.List<PartialTime> stopTimer() {
        java.util.List<PartialTime> allPartialTimes = new java.util.ArrayList<>();
        for (IProtocol protocol : protocols) {
            allPartialTimes.addAll(protocol.stopTimer());
        }
        return allPartialTimes;
    }
}
