package com.antigravity.handlers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.auth.Role;
import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Car;
import com.antigravity.models.CarField;
import com.antigravity.repository.SqliteRepository;
import io.javalin.Javalin;
import io.javalin.http.Context;
import java.io.File;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;
import org.mockito.ArgumentCaptor;

public class CarFieldTaskHandlerTest {

  @Rule public TemporaryFolder tempFolder = new TemporaryFolder();

  private DatabaseContext databaseContext;
  private SqliteRepository<CarField> fieldRepository;
  private SqliteRepository<Car> carRepository;
  private Javalin app;
  private CarFieldTaskHandler handler;
  private Context ctx;

  @Before
  public void setUp() throws Exception {
    String rootDir = tempFolder.newFolder("db_root").getAbsolutePath() + File.separator;
    databaseContext = new DatabaseContext("test_db", null, rootDir);
    fieldRepository = new SqliteRepository<>(databaseContext, "car_fields", CarField.class);
    carRepository = new SqliteRepository<>(databaseContext, "cars", Car.class);
    app = mock(Javalin.class);
    ctx = mock(Context.class);
    when(ctx.status(anyInt())).thenReturn(ctx);
    handler = new CarFieldTaskHandler(databaseContext, app);
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

  private CarField add(String name, String type, String... options) {
    return handler.createField(
        new CarField.Builder()
            .withName(name)
            .withType(type)
            .withOptions(Arrays.asList(options))
            .build());
  }

  @Test
  public void testRoutesAndRoles() {
    verify(app).get(eq("/api/car-fields"), any(), eq(Role.VIEWER));
    verify(app).post(eq("/api/car-fields"), any(), eq(Role.DIRECTOR));
    verify(app).put(eq("/api/car-fields/{id}"), any(), eq(Role.DIRECTOR));
    verify(app).delete(eq("/api/car-fields/{id}"), any(), eq(Role.DIRECTOR));
  }

  @Test
  public void testCreate_AddsAtTheEndWithANewId() {
    CarField a = add("Weight", "number");
    CarField b = add("Compound", "choice", "Soft", "Hard");

    assertNotNull(a.getEntityId());
    assertFalse(a.getEntityId().equals(b.getEntityId()));
    assertEquals(0, a.getPosition());
    assertEquals(1, b.getPosition());
    assertEquals(Arrays.asList("Soft", "Hard"), b.getOptions());
    assertEquals(2, fieldRepository.findAll().size());
  }

  @Test
  public void testCreate_TrimsNameAndCleansChoices() {
    CarField f = add("  Compound ", "choice", " Soft ", "", "soft", "Hard", null);
    assertEquals("Compound", f.getName());
    assertEquals(Arrays.asList("Soft", "Hard"), f.getOptions());
  }

  @Test
  public void testCreate_DropsChoicesOfOtherTypes() {
    assertTrue(add("Notes 2", "text", "x").getOptions().isEmpty());
  }

  @Test
  public void testCreate_OverHttp() {
    when(ctx.body()).thenReturn("{\"name\":\"Weight\",\"type\":\"number\",\"entity_id\":\"new\"}");
    handler.createField(ctx);
    verify(ctx).status(201);
    assertEquals("Weight", fieldRepository.findAll().get(0).getName());
  }

  @Test
  public void testCreate_EmptyNameIs400() {
    when(ctx.body()).thenReturn("{\"name\":\" \",\"type\":\"text\"}");
    handler.createField(ctx);
    verify(ctx).status(400);
    verify(ctx).result(CarFieldTaskHandler.NAME_REQUIRED);
  }

  @Test
  public void testCreate_UnknownTypeIs400() {
    when(ctx.body()).thenReturn("{\"name\":\"Colour\",\"type\":\"color\"}");
    handler.createField(ctx);
    verify(ctx).status(400);
    verify(ctx).result(CarFieldTaskHandler.TYPE_INVALID);
    assertTrue(fieldRepository.findAll().isEmpty());
  }

  @Test
  public void testCreate_MissingTypeIs400() {
    when(ctx.body()).thenReturn("{\"name\":\"Colour\"}");
    handler.createField(ctx);
    verify(ctx).status(400);
  }

  @Test
  public void testCreate_ChoiceWithoutChoicesIs400() {
    when(ctx.body()).thenReturn("{\"name\":\"Compound\",\"type\":\"choice\",\"options\":[\" \"]}");
    handler.createField(ctx);
    verify(ctx).status(400);
    verify(ctx).result(CarFieldTaskHandler.CHOICES_REQUIRED);
  }

  @Test
  public void testCreate_DuplicateNameIs409() {
    add("Weight", "number");
    when(ctx.body()).thenReturn("{\"name\":\"weight\",\"type\":\"text\"}");
    handler.createField(ctx);
    verify(ctx).status(409);
    verify(ctx).result(CarFieldTaskHandler.NAME_EXISTS);
  }

  @Test
  public void testCreate_BadJsonIs500() {
    when(ctx.body()).thenReturn("{nope");
    handler.createField(ctx);
    verify(ctx).status(500);
  }

  @Test
  public void testGetFields_SortedByPosition() {
    CarField a = add("A", "text");
    add("B", "text");
    handler.updateField(a.getEntityId(), CarField.Builder.from(a).withPosition(5).build());

    handler.getFields(ctx);

    ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
    verify(ctx).json(captor.capture());
    @SuppressWarnings("unchecked")
    List<CarField> result = (List<CarField>) captor.getValue();
    assertEquals("B", result.get(0).getName());
    assertEquals("A", result.get(1).getName());
  }

  @Test
  public void testUpdate_RenamesAndChangesChoices() {
    CarField f = add("Compound", "choice", "Soft");
    when(ctx.pathParam("id")).thenReturn(f.getEntityId());
    when(ctx.body())
        .thenReturn(
            "{\"name\":\"Tyre compound\",\"type\":\"choice\",\"options\":[\"Soft\",\"Hard\"],"
                + "\"position\":0}");

    handler.updateField(ctx);

    CarField saved = fieldRepository.findByEntityId(f.getEntityId());
    assertEquals("Tyre compound", saved.getName());
    assertEquals(Arrays.asList("Soft", "Hard"), saved.getOptions());
    assertEquals("choice", saved.getType());
  }

  @Test
  public void testUpdate_KeepsTheTypeWhenLeftOut() {
    CarField f = add("Weight", "number");
    CarField saved =
        handler.updateField(f.getEntityId(), new CarField.Builder().withName("Mass").build());
    assertEquals("number", saved.getType());
    assertEquals("Mass", saved.getName());
  }

  @Test
  public void testUpdate_ChangingTheTypeIs400() {
    CarField f = add("Weight", "number");
    when(ctx.pathParam("id")).thenReturn(f.getEntityId());
    when(ctx.body()).thenReturn("{\"name\":\"Weight\",\"type\":\"text\"}");

    handler.updateField(ctx);

    verify(ctx).status(400);
    verify(ctx).result(CarFieldTaskHandler.TYPE_FIXED);
    assertEquals("number", fieldRepository.findByEntityId(f.getEntityId()).getType());
  }

  @Test
  public void testUpdate_NameOfAnotherFieldIs409() {
    add("Weight", "number");
    CarField b = add("Pinion", "text");
    when(ctx.pathParam("id")).thenReturn(b.getEntityId());
    when(ctx.body()).thenReturn("{\"name\":\"WEIGHT\"}");

    handler.updateField(ctx);

    verify(ctx).status(409);
  }

  @Test
  public void testUpdate_SameNameOnItselfIsAllowed() {
    CarField f = add("Weight", "number");
    CarField saved =
        handler.updateField(f.getEntityId(), new CarField.Builder().withName("weight").build());
    assertEquals("weight", saved.getName());
  }

  @Test
  public void testUpdate_UnknownFieldIs404() {
    when(ctx.pathParam("id")).thenReturn("missing");
    when(ctx.body()).thenReturn("{\"name\":\"X\"}");
    handler.updateField(ctx);
    verify(ctx).status(404);
    verify(ctx).result(CarFieldTaskHandler.NOT_FOUND);
  }

  @Test
  public void testUpdate_BadJsonIs500() {
    when(ctx.pathParam("id")).thenReturn("x");
    when(ctx.body()).thenReturn("{nope");
    handler.updateField(ctx);
    verify(ctx).status(500);
  }

  @Test
  public void testDelete_RemovesTheValueFromEveryCar() {
    CarField weight = add("Weight", "number");
    CarField pinion = add("Pinion", "text");
    Map<String, String> values = new LinkedHashMap<>();
    values.put(weight.getEntityId(), "82");
    values.put(pinion.getEntityId(), "9");
    carRepository.insert(
        new Car.Builder().withName("Porsche").withCustomValues(values).withEntityId("1").build());
    carRepository.insert(new Car.Builder().withName("Ferrari").withEntityId("2").build());
    when(ctx.pathParam("id")).thenReturn(weight.getEntityId());

    handler.deleteField(ctx);

    verify(ctx).status(204);
    assertNull(fieldRepository.findByEntityId(weight.getEntityId()));
    Car porsche = carRepository.findByEntityId("1");
    assertFalse(porsche.getCustomValues().containsKey(weight.getEntityId()));
    assertEquals("9", porsche.getCustomValues().get(pinion.getEntityId()));
    assertEquals("Porsche", porsche.getName());
    assertNotNull(carRepository.findByEntityId("2"));
  }

  @Test
  public void testDelete_ErrorIs500() {
    when(ctx.pathParam("id")).thenThrow(new RuntimeException("boom"));
    handler.deleteField(ctx);
    verify(ctx).status(500);
  }
}
