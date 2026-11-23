package com.antigravity.handlers;

import com.antigravity.auth.Role;
import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Car;
import com.antigravity.repository.SqliteRepository;
import io.javalin.Javalin;
import io.javalin.http.Context;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** REST endpoints for the Slotcar database (table "cars"). */
public class CarTaskHandler {
  private static final Logger logger = LoggerFactory.getLogger(CarTaskHandler.class);

  static final String NAME_REQUIRED = "Car name cannot be empty";
  static final String NAME_EXISTS = "Car name already exists";

  private final SqliteRepository<Car> carRepository;

  public CarTaskHandler(DatabaseContext databaseContext, Javalin app) {
    this.carRepository = new SqliteRepository<>(databaseContext, "cars", Car.class);

    app.get("/api/cars", this::getCars, Role.VIEWER);
    app.post("/api/cars", this::createCar, Role.DIRECTOR);
    app.put("/api/cars/{id}", this::updateCar, Role.DIRECTOR);
    app.delete("/api/cars/{id}", this::deleteCar, Role.DIRECTOR);
  }

  public void getCars(Context ctx) {
    ctx.json(carRepository.findAll());
  }

  public void createCar(Context ctx) {
    try {
      Car car = DatabaseHandlerUtils.bodyAsClassWithId(ctx.body(), Car.class);
      ctx.status(201).json(createCar(car));
    } catch (IllegalStateException e) {
      ctx.status(400).result(e.getMessage());
    } catch (IllegalArgumentException e) {
      ctx.status(409).result(e.getMessage());
    } catch (Exception e) {
      logger.error("Error creating car", e);
      ctx.status(500).result("Error creating car: " + e.getMessage());
    }
  }

  /** Inserts a car; assigns the next id when it has none (or "new"). */
  public Car createCar(Car car) {
    checkName(car, null);
    if (car.getEntityId() == null
        || car.getEntityId().isEmpty()
        || "new".equals(car.getEntityId())) {
      car =
          Car.Builder.from(car).withEntityId(carRepository.getNextSequence()).withId(null).build();
    }
    carRepository.insert(car);
    return car;
  }

  public void updateCar(Context ctx) {
    try {
      String id = ctx.pathParam("id");
      Car car = DatabaseHandlerUtils.bodyAsClassWithId(ctx.body(), Car.class);
      ctx.json(updateCar(id, car));
    } catch (IllegalStateException e) {
      ctx.status(400).result(e.getMessage());
    } catch (IllegalArgumentException e) {
      ctx.status(409).result(e.getMessage());
    } catch (Exception e) {
      logger.error("Error updating car", e);
      ctx.status(500).result("Error updating car: " + e.getMessage());
    }
  }

  public Car updateCar(String id, Car car) {
    checkName(car, id);
    car = Car.Builder.from(car).withEntityId(id).withId(null).build();
    carRepository.replace(id, car);
    return car;
  }

  public void deleteCar(Context ctx) {
    try {
      carRepository.delete(ctx.pathParam("id"));
      ctx.status(204);
    } catch (Exception e) {
      logger.error("Error deleting car", e);
      ctx.status(500).result("Error deleting car: " + e.getMessage());
    }
  }

  /**
   * The name must be set and unique (trimmed, ignoring case), not counting the car with {@code
   * ownId} itself.
   *
   * @throws IllegalStateException when the name is empty (400)
   * @throws IllegalArgumentException when another car has the name (409)
   */
  private void checkName(Car car, String ownId) {
    String name = car.getName() == null ? "" : car.getName().trim();
    if (name.isEmpty()) {
      throw new IllegalStateException(NAME_REQUIRED);
    }
    boolean taken =
        carRepository.findAll().stream()
            .anyMatch(
                c ->
                    (ownId == null || !ownId.equals(c.getEntityId()))
                        && c.getName() != null
                        && c.getName().trim().equalsIgnoreCase(name));
    if (taken) {
      throw new IllegalArgumentException(NAME_EXISTS);
    }
  }
}
