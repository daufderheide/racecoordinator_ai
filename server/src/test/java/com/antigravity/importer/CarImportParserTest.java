package com.antigravity.importer;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.importer.CarImportParser.ParsedCar;
import com.antigravity.importer.CarImportParser.ParsedFile;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import org.junit.Test;

public class CarImportParserTest {

  private static ParsedFile csv(String text) throws Exception {
    return CarImportParser.parse(text.getBytes(StandardCharsets.UTF_8), "cars.csv", null);
  }

  @Test
  public void testHeadersAreMatchedLooselyAndOtherColumnsAreOwnFields() {
    assertEquals("carClass", CarImportParser.fixedKey("Class"));
    assertEquals("carClass", CarImportParser.fixedKey("car_class"));
    assertEquals("picture", CarImportParser.fixedKey("Avatar URL"));
    assertEquals("tyres", CarImportParser.fixedKey("Tires"));
    assertEquals("brand", CarImportParser.fixedKey("Brand / Maker"));
    assertNull(CarImportParser.fixedKey("Weight (g)"));
  }

  @Test
  public void testCsvWithQuotesCommasAndLineBreaks() throws Exception {
    ParsedFile file = csv("Name,Notes,Weight\r\n\"Ford \"\"GT\"\"\",\"a, b\nc\",91\r\n");
    assertEquals(1, file.cars.size());
    ParsedCar car = file.cars.get(0);
    assertEquals("Ford \"GT\"", car.values.get("name"));
    assertEquals("a, b\nc", car.values.get("notes"));
    assertEquals("91", car.customValues.get("Weight"));
  }

  @Test
  public void testSemicolonCsvAndEmptyCellsAreKept() throws Exception {
    ParsedFile file = csv("﻿Name;Brand;Scale\nMini;;1/32\n\n");
    ParsedCar car = file.cars.get(0);
    assertEquals("Mini", car.values.get("name"));
    assertEquals("", car.values.get("brand"));
    assertTrue(car.values.containsKey("brand"));
    assertEquals(1, file.cars.size());
  }

  @Test
  public void testJsonArrayAndObjectForms() throws Exception {
    String json =
        "{\"fields\":[{\"name\":\"Compound\",\"type\":\"choice\",\"options\":[\"Soft\"]}],"
            + "\"cars\":[{\"name\":\"A\",\"carClass\":\"GT3\",\"modified\":true,"
            + "\"entity_id\":\"99\",\"customValues\":{\"Compound\":\"Soft\"}}]}";
    ParsedFile file =
        CarImportParser.parse(json.getBytes(StandardCharsets.UTF_8), "cars.json", null);
    assertEquals("Compound", file.fields.get(0).getName());
    assertEquals("choice", file.fields.get(0).getType());
    ParsedCar car = file.cars.get(0);
    assertEquals("GT3", car.values.get("carClass"));
    assertEquals("Yes", car.values.get("modified"));
    assertEquals("Soft", car.customValues.get("Compound"));
    assertTrue("the id is ignored", !car.values.containsKey("entity_id"));

    ParsedFile plain =
        CarImportParser.parse(
            "[{\"name\":\"B\"}]".getBytes(StandardCharsets.UTF_8), "cars.json", null);
    assertEquals("B", plain.cars.get(0).values.get("name"));
  }

  @Test(expected = IllegalArgumentException.class)
  public void testOtherFilesAreRefused() throws Exception {
    CarImportParser.parse(new byte[] {1}, "cars.pdf", null);
  }

  @Test
  public void testReadCsvKeepsTrailingEmptyCells() {
    List<List<String>> rows = CarImportParser.readCsv("a,b,\n1,,\n");
    assertEquals(Arrays.asList("a", "b", ""), rows.get(0));
    assertEquals(Arrays.asList("1", "", ""), rows.get(1));
  }
}
