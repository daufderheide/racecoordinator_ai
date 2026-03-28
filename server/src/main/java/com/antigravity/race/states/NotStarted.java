package com.antigravity.race.states;

import com.antigravity.race.HeatExecutionManager;

public class NotStarted implements IRaceState {
	private java.util.concurrent.ScheduledExecutorService scheduler;
	private java.util.concurrent.ScheduledFuture<?> timerHandle;
	private com.antigravity.race.Race race;
	private HeatExecutionManager executionManager;

	@Override
	public void enter(com.antigravity.race.Race race) {
		System.out.println("NotStarted state entered.");
		this.race = race;
		this.executionManager = race.getHeatExecutionManager();
		race.setHasRacedInCurrentHeat(false);

		double autoStartTime = race.getRaceModel().getAutoStartTime();
		double autoStartWarmupTime = race.getRaceModel().getAutoStartWarmupTime();

		if (autoStartTime > 0 && !race.isAutoStartFired()) {
			race.setAutoStartRemaining(autoStartTime);

			// Handle initial power state to avoid transient flicker
			if (autoStartWarmupTime > 0) {
				race.setMainPower(true);
			} else {
				race.setMainPower(false);
			}

			race.setLanePower(true, -1);
			startAutoStartTimer(race);
		} else {
			race.setAutoStartRemaining(0);
			race.setMainPower(false);
			race.setLanePower(true, -1);
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

		double autoStartTime = race.getRaceModel().getAutoStartTime();
		double autoStartWarmupTime = race.getRaceModel().getAutoStartWarmupTime();
		double elapsed = autoStartTime - race.getAutoStartRemaining();

		if (autoStartWarmupTime > 0 && elapsed <= autoStartWarmupTime) {
			System.out.println("NotStarted.pause(): Warmup was active, resetting heat.");
			race.resetCurrentHeat();
		}

		stopTimer();
		race.setAutoStartFired(true);
		race.clearAutoTimers();
		race.setMainPower(false);
	}

	@Override
	public void restartHeat(com.antigravity.race.Race race) {
		System.out.println("NotStarted.restartHeat() called. Resetting current heat.");
		race.resetCurrentHeat();
		// Re-enter NotStarted state to restart the auto-start timer if configured
		race.changeState(new com.antigravity.race.states.NotStarted());
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
		if (this.race == null)
			return;

		double autoStartTime = race.getRaceModel().getAutoStartTime();
		double autoStartWarmupTime = race.getRaceModel().getAutoStartWarmupTime();
		double elapsed = autoStartTime - race.getAutoStartRemaining();

		if (autoStartWarmupTime > 0 && elapsed <= autoStartWarmupTime) {
			System.out.println("NotStarted: Warmup lap detected, delegating to executor.");
			executionManager.onLap(lane, lapTime, interfaceId, true, false); // ignoreTeamLimits = true, checkFinish = false
		}
	}

	@Override
	public void onSegment(int lane, double segmentTime, int interfaceId) {
		if (this.race == null)
			return;

		double autoStartTime = race.getRaceModel().getAutoStartTime();
		double autoStartWarmupTime = race.getRaceModel().getAutoStartWarmupTime();
		double elapsed = autoStartTime - race.getAutoStartRemaining();

		if (autoStartWarmupTime > 0 && elapsed <= autoStartWarmupTime) {
			System.out.println("NotStarted: Warmup segment detected, delegating to executor.");
			executionManager.onSegment(lane, segmentTime, interfaceId);
		}
	}

	@Override
	public void onCarData(com.antigravity.protocols.CarData carData) {
		if (this.race == null)
			return;

		double autoStartTime = race.getRaceModel().getAutoStartTime();
		double autoStartWarmupTime = race.getRaceModel().getAutoStartWarmupTime();
		double elapsed = autoStartTime - race.getAutoStartRemaining();

		if (autoStartWarmupTime > 0 && elapsed <= autoStartWarmupTime) {
			executionManager.handlePitDetection(carData);
			if (executionManager.isDigitalFuelEnabled()) {
				executionManager.handleDigitalFuelCarData(carData);
			}

			int lane = carData.getLane();
			// Broadcast the CarData to clients
			com.antigravity.proto.CarData.Builder dataBuilder = com.antigravity.proto.CarData.newBuilder()
					.setLane(carData.getLane())
					.setControllerThrottlePct(carData.getControllerThrottlePCT())
					.setCarThrottlePct(carData.getCarThrottlePCT())
					.setLocation(carData.getLocation().getValue())
					.setLocationId(carData.getLocationId())
					.setIsRefueling(executionManager.getIsRefueling()[lane]);

			if (race.getCurrentHeat() != null && race.getCurrentHeat().getDrivers() != null) {
				if (lane >= 0 && lane < race.getCurrentHeat().getDrivers().size()) {
					com.antigravity.race.DriverHeatData driverData = race.getCurrentHeat().getDrivers().get(lane);
					if (driverData != null) {
						driverData.setCurrentLocation(carData.getLocation());
						if (driverData.getDriver() != null) {
							dataBuilder.setFuelLevel(driverData.getDriver().getFuelLevel());
						}
					}
				}
			}

			com.antigravity.proto.CarData protoCarData = dataBuilder.build();
			com.antigravity.proto.RaceData raceDataMsg = com.antigravity.proto.RaceData.newBuilder()
					.setCarData(protoCarData)
					.build();

			race.broadcast(raceDataMsg);
		}
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

					// Handle warmup time power logic and refueling
					double autoStartTime = race.getRaceModel().getAutoStartTime();
					double autoStartWarmupTime = race.getRaceModel().getAutoStartWarmupTime();
					double elapsed = autoStartTime - Math.max(0, remaining);

					if (autoStartWarmupTime > 0 && elapsed <= autoStartWarmupTime) {
						// During warmup, process refueling and fuel usage
						executionManager.processTicker((float) delta);
					}

					if (remaining <= 0) {
						remaining = 0;
						race.setAutoStartRemaining(0);
						broadcastTime(race);
						stopTimer();
						race.setAutoStartFired(true);
						race.startRace();
					} else {
						race.setAutoStartRemaining(remaining);

						if (autoStartWarmupTime > 0) {
							if (elapsed <= autoStartWarmupTime) {
								if (!race.isMainPower()) {
									race.setMainPower(true);
								}
							} else {
								if (race.isMainPower()) {
									// Warmup just ended
									System.out.println("NotStarted: Warmup ended. Turning off power and resetting heat.");
									race.setMainPower(false);
									race.resetCurrentHeat();
								}
							}
						}

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
