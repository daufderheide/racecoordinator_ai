package com.antigravity.race.states;

public class NotStarted implements IRaceState {

	@Override
	public void enter(com.antigravity.race.Race race) {
		System.out.println("NotStarted state entered.");
		race.setMainPower(false);
		race.setLanePower(true, -1);
		// Broadcast 0 time to reset client
		com.antigravity.proto.RaceTime raceTimeMsg = com.antigravity.proto.RaceTime.newBuilder()
				.setTime(0.0f)
				.build();

		com.antigravity.proto.RaceData raceDataMsg = com.antigravity.proto.RaceData.newBuilder()
				.setRaceTime(raceTimeMsg)
				.build();

		race.broadcast(raceDataMsg);
	}

	@Override
	public void exit(com.antigravity.race.Race race) {
		System.out.println("NotStarted state exited.");
	}

	@Override
	public void nextHeat(com.antigravity.race.Race race) {
		throw new IllegalStateException("Cannot move to next heat from state: " + this.getClass().getSimpleName());
	}

	@Override
	public void start(com.antigravity.race.Race race) {
		System.out.println("NotStarted.start() called. Starting new race.");
		race.resetRaceTime();
		race.changeState(new com.antigravity.race.states.Starting());
	}

	@Override
	public void pause(com.antigravity.race.Race race) {
		throw new IllegalStateException("Cannot pause race: Race is not in Starting or Racing state.");
	}

	@Override
	public void restartHeat(com.antigravity.race.Race race) {
		throw new IllegalStateException("Cannot restart heat from state: " + this.getClass().getSimpleName());
	}

	@Override
	public void skipHeat(com.antigravity.race.Race race) {
		throw new IllegalStateException("Cannot skip heat from state: " + this.getClass().getSimpleName());
	}

	@Override
	public void deferHeat(com.antigravity.race.Race race) {
		System.out.println("NotStarted.deferHeat() called.");
		java.util.List<com.antigravity.race.Heat> heats = race.getHeats();
		if (heats == null || heats.size() <= 1) {
			System.out.println("NotStarted.deferHeat(): Not enough heats to defer.");
			return;
		}

		com.antigravity.race.Heat currentHeat = race.getCurrentHeat();
		int currentIndex = heats.indexOf(currentHeat);

		// Move current heat to the end
		heats.remove(currentIndex);
		heats.add(currentHeat);

		// Update current heat to the one that was immediately after
		// Since we removed it, the next one is now at currentIndex (if it wasn't
		// already at the end)
		// Actually, the prompt says "The current heat should be updated to the heat
		// that was immediately after the current heat"
		// If we move heat N to the end, heat N+1 becomes the new current heat.
		race.setCurrentHeat(heats.get(currentIndex));

		// Update heat numbers for all heats to reflect their new order
		for (int i = 0; i < heats.size(); i++) {
			heats.get(i).setHeatNumber(i + 1);
		}

		// Broadcast partial update
		java.util.Set<String> sentObjectIds = new java.util.HashSet<>();
		com.antigravity.proto.Race raceUpdate = com.antigravity.proto.Race.newBuilder()
				.addAllHeats(heats.stream()
						.map(h -> com.antigravity.converters.HeatConverter.toProto(h, sentObjectIds))
						.collect(java.util.stream.Collectors.toList()))
				.setCurrentHeat(com.antigravity.converters.HeatConverter.toProto(race.getCurrentHeat(), sentObjectIds))
				.build();

		com.antigravity.proto.RaceData raceDataMsg = com.antigravity.proto.RaceData.newBuilder()
				.setRace(raceUpdate)
				.build();

		race.broadcast(raceDataMsg);
	}

	@Override
	public void onLap(int lane, double lapTime, int interfaceId) {
		System.out.println("NotStarted: Ignored onLap - Race not in progress");
	}

	@Override
	public void onCarData(com.antigravity.protocols.CarData carData) {
		System.out.println("NotStarted: Ignored onCarData - Race not in progress");
	}
}
