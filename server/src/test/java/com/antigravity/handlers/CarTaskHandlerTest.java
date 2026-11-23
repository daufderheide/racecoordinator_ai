package com.antigravity.handlers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.auth.Role;
import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Car;
import com.antigravity.repository.SqliteRepository;
import io.javalin.Javalin;
import io.javalin.http.Context;
import java.io.File;
import java.util.List;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;
import org.mockito.ArgumentCaptor;

public class CarTaskHandlerTest {

  @Rule public TemporaryFolder tempFolder = new TemporaryFolder();

  private DatabaseContext databaseContext;
  private SqliteRepository<Car> carRepository;
  private Javalin app;
  private CarTaskHandler handler;
  private Context ctx;

  @Before
  public void setUp() throws Exception {
    String rootDir = tempFolder.newFolder("db_root").getAbsolutePath() + File.separator;
    databaseContext = new DatabaseContext("test_db", null, rootDir);
    carRepository = new SqliteRepository<>(databaseContext, "cars", Car.class);
    app = mock(Javalin.class);
    ctx = mock(Context.class);
    when(ctx.status(anyInt())).thenReturn(ctx);
    handler = new CarTaskHandler(databaseContext, app);
  }

  @After
  public void tearDown() {
    if (databaseContext != null && databaseContext.getConnection() != null) {
      try {
        databaseContext.getConnection().close();
      } catch (Exception ignored) {
      }
    }
  }

  private static Car car(String name, String entityId) {
    return new Car.Builder().withName(name).withCarClass("GT3").withEntityId(entityId).build();
  }

  @Test
  public void testRoutesAndRoles() {
    verify(app).get(eq("/api/cars"), any(), eq(Role.VIEWER));
    verify(app).post(eq("/api/cars"), any(), eq(Role.DIRECTOR));
    verify(app).put(eq("/api/cars/{id}"), any(), eq(Role.DIRECTOR));
    verify(app).delete(eq("/api/cars/{id}"), any(), eq(Role.DIRECTOR));
  }

  @Test
  public void testGetCars() {
    carRepository.insert(car("Porsche", "1"));
    carRepository.insert(car("Ferrari", "2"));

    handler.getCars(ctx);

    ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
    verify(ctx).json(captor.capture());
    @SuppressWarnings("unchecked")
    List<Car> result = (List<Car>) captor.getValue();
    assertEquals(2, result.size());
  }

  @Test
  public void testCreateCar_AssignsSequenceIdAndStoresFields() {
    when(ctx.body())
        .thenReturn(
            "{\"name\":\"Porsche\",\"carClass\":\"GT3\",\"scale\":\"1/32\","
                + "\"tyres\":\"Urethane\",\"modified\":true,\"entity_id\":\"new\"}");

    handler.createCar(ctx);

    verify(ctx).status(201);
    List<Car> all = carRepository.findAll();
    assertEquals(1, all.size());
    Car saved = all.get(0);
    assertEquals("Porsche", saved.getName());
    assertEquals("GT3", saved.getCarClass());
    assertEquals("1/32", saved.getScale());
    assertEquals("Urethane", saved.getTyres());
    assertTrue(saved.isModified());
    assertNotNull(saved.getEntityId());
    assertNotEquals("new", saved.getEntityId());
  }

  @Test
  public void testCreateCar_GivesEachCarItsOwnId() {
    Car a = handler.createCar(car("A", null));
    Car b = handler.createCar(car("B", ""));
    assertNotNull(a.getEntityId());
    assertNotEquals(a.getEntityId(), b.getEntityId());
  }

  @Test
  public void testCreateCar_KeepsAGivenId() {
    Car created = handler.createCar(car("Kept", "custom-7"));
    assertEquals("custom-7", created.getEntityId());
    assertNotNull(carRepository.findByEntityId("custom-7"));
  }

  @Test
  public void testCreateCar_EmptyNameIs400() {
    when(ctx.body()).thenReturn("{\"name\":\"   \"}");

    handler.createCar(ctx);

    verify(ctx).status(400);
    verify(ctx).result(CarTaskHandler.NAME_REQUIRED);
    assertTrue(carRepository.findAll().isEmpty());
  }

  @Test
  public void testCreateCar_MissingNameIs400() {
    when(ctx.body()).thenReturn("{\"brand\":\"NSR\"}");

    handler.createCar(ctx);

    verify(ctx).status(400);
    assertTrue(carRepository.findAll().isEmpty());
  }

  @Test
  public void testCreateCar_DuplicateNameIs409IgnoringCaseAndSpaces() {
    carRepository.insert(car("Porsche", "1"));
    when(ctx.body()).thenReturn("{\"name\":\"  porsche \"}");

    handler.createCar(ctx);

    verify(ctx).status(409);
    verify(ctx).result(CarTaskHandler.NAME_EXISTS);
    assertEquals(1, carRepository.findAll().size());
  }

  @Test
  public void testCreateCar_BadJsonIs500() {
    when(ctx.body()).thenReturn("{not json");

    handler.createCar(ctx);

    verify(ctx).status(500);
  }

  @Test
  public void testUpdateCar_ReplacesFields() {
    carRepository.insert(car("Porsche", "1"));
    when(ctx.pathParam("id")).thenReturn("1");
    when(ctx.body()).thenReturn("{\"name\":\"Porsche RSR\",\"motor\":\"21.5k\"}");

    handler.updateCar(ctx);

    verify(ctx, never()).status(anyInt());
    Car saved = carRepository.findByEntityId("1");
    assertEquals("Porsche RSR", saved.getName());
    assertEquals("21.5k", saved.getMotor());
    assertNull(saved.getCarClass());
  }

  @Test
  public void testUpdateCar_StoresCustomValues() {
    carRepository.insert(car("Porsche", "1"));
    when(ctx.pathParam("id")).thenReturn("1");
    when(ctx.body())
        .thenReturn(
            "{\"name\":\"Porsche\",\"customValues\":[{\"fieldId\":\"f1\",\"value\":\"82\"}]}");

    handler.updateCar(ctx);

    assertEquals("82", carRepository.findByEntityId("1").getCustomValues().get("f1"));
  }

  @Test
  public void testUpdateCar_ARemovedValueStaysRemoved() {
    java.util.Map<String, String> values = new java.util.LinkedHashMap<>();
    values.put("f1", "82");
    values.put("f2", "9/27");
    carRepository.insert(
        new Car.Builder().withName("Porsche").withCustomValues(values).withEntityId("1").build());
    values.remove("f1");

    handler.updateCar("1", new Car.Builder().withName("Porsche").withCustomValues(values).build());

    java.util.Map<String, String> saved = carRepository.findByEntityId("1").getCustomValues();
    assertNull(saved.get("f1"));
    assertEquals("9/27", saved.get("f2"));
  }

  @Test
  public void testUpdateCar_SameNameOnItselfIsAllowed() {
    carRepository.insert(car("Porsche", "1"));
    Car updated = handler.updateCar("1", car("PORSCHE", "ignored"));
    assertEquals("1", updated.getEntityId());
    assertEquals("PORSCHE", carRepository.findByEntityId("1").getName());
  }

  @Test
  public void testUpdateCar_NameOfAnotherCarIs409() {
    carRepository.insert(car("Porsche", "1"));
    carRepository.insert(car("Ferrari", "2"));
    when(ctx.pathParam("id")).thenReturn("2");
    when(ctx.body()).thenReturn("{\"name\":\"Porsche\"}");

    handler.updateCar(ctx);

    verify(ctx).status(409);
    assertEquals("Ferrari", carRepository.findByEntityId("2").getName());
  }

  @Test
  public void testUpdateCar_EmptyNameIs400() {
    carRepository.insert(car("Porsche", "1"));
    when(ctx.pathParam("id")).thenReturn("1");
    when(ctx.body()).thenReturn("{\"name\":\"\"}");

    handler.updateCar(ctx);

    verify(ctx).status(400);
    assertEquals("Porsche", carRepository.findByEntityId("1").getName());
  }

  @Test
  public void testUpdateCar_BadJsonIs500() {
    when(ctx.pathParam("id")).thenReturn("1");
    when(ctx.body()).thenReturn("{not json");

    handler.updateCar(ctx);

    verify(ctx).status(500);
  }

  @Test
  public void testDeleteCar() {
    carRepository.insert(car("Porsche", "1"));
    carRepository.insert(car("Ferrari", "2"));
    when(ctx.pathParam("id")).thenReturn("1");

    handler.deleteCar(ctx);

    verify(ctx).status(204);
    assertNull(carRepository.findByEntityId("1"));
    assertNotNull(carRepository.findByEntityId("2"));
  }

  @Test
  public void testDeleteCar_ErrorIs500() {
    when(ctx.pathParam("id")).thenThrow(new RuntimeException("boom"));

    handler.deleteCar(ctx);

    verify(ctx).status(500);
  }
}
