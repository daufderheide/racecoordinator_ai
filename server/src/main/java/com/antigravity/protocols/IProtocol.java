package com.antigravity.protocols;

public interface IProtocol {
    boolean open();

    void setListener(ProtocolListener listener);

    void startTimer();

    java.util.List<PartialTime> stopTimer();
}
