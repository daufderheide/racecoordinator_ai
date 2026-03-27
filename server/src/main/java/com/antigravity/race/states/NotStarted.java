package com.antigravity.race.states;

public class NotStarted implements IRaceState {
	private java.util.concurrent.ScheduledExecutorService scheduler;
	private java.util.concurrent.ScheduledFuture<?> timerHandle;

	@Override
	public void enter(com.antigravity.race.Race race) {
		System.out.println("NotStarted state entered.");
		race.setMainPower(false);
		race.setLanePower(true, -1);
		race.setHasRacedInCurrentHeat(false);

		double autoStartTime = race.getRaceModel().getAutoStartTime();
		if (autoStartTime > 0 && !race.isAutoStartFired()) {
			race.setAutoStartRemaining(autoStartTime);
			startAutoStartTimer(race);
		} else {
			race.setAutoStartRemaining(0);
			broadcastTime(race);
		}
	}

	@Override
	public void exit(com.antigravity.race.Race race) {
		System.out.println("NotStarted state exited.");
		stopTimer();
	}

	@Override
	public void nextHeat(com.antigravity.race.Race race) {
		throw new IllegalStateException("Cannot move to next heat from state: " + this.getClass().getSimpleName());
	}

	@Override
	public void start(com.antigravity.race.Race race) {
		System.out.println("NotStarted.start() called. Starting new race.");
		stopTimer();
		race.resetRaceTime();
		race.changeState(new com.antigravity.race.states.Starting());
	}

	@Override
	public void pause(com.antigravity.race.Race race) {
		System.out.println("NotStarted.pause() called. Terminating auto-start.");
		stopTimer();
		race.setAutoStartFired(true);
		race.clearAutoTimers();
	}

	@Override
	public void restartHeat(com.antigravity.race.Race race) {
		throw new IllegalStateException("Cannot restart heat from state: " + this.getClass().getSimpleName());
	}

	@Override
	public void skipHeat(com.antigravity.race.Race race) {
		System.out.println("NotStarted.skipHeat() called. Advancing to HeatOver.");
		race.changeState(new com.antigravity.race.states.HeatOver());
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
		// Cannot receive laps in NotStarted state
	}

	@Override
	public void onSegment(int lane, double segmentTime, int interfaceId) {
		// Cannot receive segments in NotStarted state
	}

	@Override
	public void onCarData(com.antigravity.protocols.CarData carData) {
	}

	private void startAutoStartTimer(final com.antigravity.race.Race race) {
		scheduler = java.util.concurrent.Executors.newScheduledThreadPool(1);
		final Runnable ticker = new Runnable() {
			long lastTime = 0;

			public void run() {
				try {
					long now = System.nanoTime();
					if (lastTime == 0) {
						lastTime = now;
						return;
					}

					double delta = (now - lastTime) / 1_000_000_000.0;
					lastTime = now;

					double remaining = race.getAutoStartRemaining() - delta;
					if (remaining <= 0) {
						remaining = 0;
						race.setAutoStartRemaining(0);
						broadcastTime(race);
						stopTimer();
						race.setAutoStartFired(true);
						race.startRace();
					} else {
						race.setAutoStartRemaining(remaining);
						broadcastTime(race);
					}
				} catch (Exception e) {
					e.printStackTrace();
				}
			}
		};
		timerHandle = scheduler.scheduleAtFixedRate(ticker, 0, 100, java.util.concurrent.TimeUnit.MILLISECONDS);
	}

	private void stopTimer() {
		if (timerHandle != null) {
			timerHandle.cancel(true);
		}
		if (scheduler != null) {
			scheduler.shutdown();
		}
	}

	private void broadcastTime(com.antigravity.race.Race race) {
		race.broadcastTime();
	}

	@Override
	public void onCallbutton(com.antigravity.race.Race race, int lane) {
		System.out.println("NotStarted.onCallbutton() called. Starting race.");
		start(race);
	}
}
