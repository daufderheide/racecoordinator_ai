package com.antigravity.protocols;

public interface IProtocol {
    void setListener(ProtocolListener listener);

    void startTimer();

    void stopTimer();
}
