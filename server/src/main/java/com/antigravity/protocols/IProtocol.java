package com.antigravity.protocols;

public interface IProtocol {
    boolean open();

    void setListener(ProtocolListener listener);

    void startTimer();

    void stopTimer();
}
