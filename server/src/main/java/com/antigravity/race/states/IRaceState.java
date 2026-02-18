package com.antigravity.race.states;

import com.antigravity.protocols.CarData;
import com.antigravity.race.Race;

public interface IRaceState {
	void enter(Race race);

	void exit(Race race);

	void start(Race race);

	void pause(Race race);

	void nextHeat(Race race);

	void restartHeat(Race race);

	void skipHeat(Race race);

	void deferHeat(Race race);

	// From the protocol listener
	void onLap(int lane, double lapTime, int interfaceId);

	void onCarData(CarData carData);
}
