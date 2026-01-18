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

    public void stopTimer() {
        for (IProtocol protocol : protocols) {
            protocol.stopTimer();
        }
    }
}
