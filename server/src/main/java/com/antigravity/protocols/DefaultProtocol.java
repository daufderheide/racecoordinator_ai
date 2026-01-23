package com.antigravity.protocols;

public abstract class DefaultProtocol implements IProtocol {
    private int numLanes;
    protected ProtocolListener listener;

    public DefaultProtocol(int numLanes) {
        this.numLanes = numLanes;
    }

    @Override
    public void setListener(ProtocolListener listener) {
        this.listener = listener;
    }

    @Override
    public void startTimer() {
    }

    @Override
    public void stopTimer() {
    }
}
