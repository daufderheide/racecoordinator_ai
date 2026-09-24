import {
  ExpanderStateManager,
  getNextSelectionAfterDelete,
  isEntityNameUnique,
  mapToSelectItems,
  NamedEntity,
} from "./editor-utils";

describe("editor-utils", () => {
  describe("isEntityNameUnique", () => {
    const entities: NamedEntity[] = [
      { entity_id: "track-1", name: "Grand Prix Circuit" },
      { entity_id: "track-2", name: "Daytona Oval" },
      { id: "track-3", name: "Monza Speed" },
    ];

    it("should return false for null, undefined, empty, or whitespace names", () => {
      expect(isEntityNameUnique(null, "track-1", entities)).toBeFalse();
      expect(isEntityNameUnique(undefined, "track-1", entities)).toBeFalse();
      expect(isEntityNameUnique("", "track-1", entities)).toBeFalse();
      expect(isEntityNameUnique("   ", "track-1", entities)).toBeFalse();
    });

    it("should return true when collection is null or empty", () => {
      expect(isEntityNameUnique("Silverstone", undefined, null)).toBeTrue();
      expect(isEntityNameUnique("Silverstone", undefined, [])).toBeTrue();
    });

    it("should return true when name is unique in collection", () => {
      expect(
        isEntityNameUnique("Spa-Francorchamps", "track-4", entities),
      ).toBeTrue();
    });

    it("should return false when name matches existing entity (case-insensitive)", () => {
      expect(
        isEntityNameUnique("daytona oval", "track-4", entities),
      ).toBeFalse();
      expect(
        isEntityNameUnique("  GRAND PRIX CIRCUIT  ", "track-4", entities),
      ).toBeFalse();
    });

    it("should allow same name when editing self (excludeSelf is true)", () => {
      expect(
        isEntityNameUnique("Grand Prix Circuit", "track-1", entities, true),
      ).toBeTrue();
      expect(
        isEntityNameUnique("monza speed", "track-3", entities, true),
      ).toBeTrue();
    });

    it("should reject same name when excludeSelf is false", () => {
      expect(
        isEntityNameUnique("Grand Prix Circuit", "track-1", entities, false),
      ).toBeFalse();
    });

    it("should match entities using either id or entity_id", () => {
      expect(
        isEntityNameUnique("Monza Speed", "track-3", entities, true),
      ).toBeTrue();
      expect(
        isEntityNameUnique("Monza Speed", "track-99", entities, true),
      ).toBeFalse();
    });
  });

  describe("mapToSelectItems", () => {
    it("should return empty array for null, undefined, or empty collection", () => {
      expect(mapToSelectItems(null)).toEqual([]);
      expect(mapToSelectItems(undefined)).toEqual([]);
      expect(mapToSelectItems([])).toEqual([]);
    });

    it("should map entity_id and id into SelectItems and sort alphabetically", () => {
      const items: NamedEntity[] = [
        { entity_id: "2", name: "Sebring" },
        { id: "3", name: "Austin" },
        { entity_id: "1", name: "Watkins Glen" },
      ];

      const result = mapToSelectItems(items);
      expect(result).toEqual([
        { id: "3", name: "Austin" },
        { id: "2", name: "Sebring" },
        { id: "1", name: "Watkins Glen" },
      ]);
    });

    it("should fallback to empty string when id or name are missing", () => {
      const items: any[] = [
        { id: undefined, entity_id: undefined, name: undefined },
      ];
      const result = mapToSelectItems(items);
      expect(result).toEqual([{ id: "", name: "" }]);
    });
  });

  describe("getNextSelectionAfterDelete", () => {
    it("should return null for null, undefined, empty, or single-item collection", () => {
      expect(getNextSelectionAfterDelete(null, "1")).toBeNull();
      expect(getNextSelectionAfterDelete(undefined, "1")).toBeNull();
      expect(getNextSelectionAfterDelete([], "1")).toBeNull();
      expect(
        getNextSelectionAfterDelete([{ entity_id: "1", name: "Solo" }], "1"),
      ).toBeNull();
    });

    it("should select the next item in alphabetical order when deleting a middle item", () => {
      const drivers: NamedEntity[] = [
        { entity_id: "1", name: "Driver A" },
        { entity_id: "2", name: "Driver B" },
        { entity_id: "3", name: "Driver C" },
      ];
      // User example: Driver A, B and C. If B is deleted, C is selected.
      const selected = getNextSelectionAfterDelete(drivers, "2");
      expect(selected).toEqual({ entity_id: "3", name: "Driver C" });
    });

    it("should select the previous item if the deleted item was the last in alphabetical order", () => {
      const drivers: NamedEntity[] = [
        { entity_id: "1", name: "Driver A" },
        { entity_id: "3", name: "Driver C" },
      ];
      // User example: If C is then deleted, A would be selected.
      const selected = getNextSelectionAfterDelete(drivers, "3");
      expect(selected).toEqual({ entity_id: "1", name: "Driver A" });
    });

    it("should select the next item when the first item is deleted", () => {
      const items: NamedEntity[] = [
        { entity_id: "1", name: "Driver A" },
        { entity_id: "2", name: "Driver B" },
        { entity_id: "3", name: "Driver C" },
      ];
      const selected = getNextSelectionAfterDelete(items, "1");
      expect(selected).toEqual({ entity_id: "2", name: "Driver B" });
    });

    it("should correctly sort unsorted input before computing next selection", () => {
      const unsorted: NamedEntity[] = [
        { entity_id: "3", name: "Driver C" },
        { entity_id: "1", name: "Driver A" },
        { entity_id: "2", name: "Driver B" },
      ];
      // B deleted: alphabetical order is A, B, C -> next is C
      const selected = getNextSelectionAfterDelete(unsorted, "2");
      expect(selected).toEqual({ entity_id: "3", name: "Driver C" });
    });

    it("should use natural alphanumeric sorting for numbered names", () => {
      const tracks: NamedEntity[] = [
        { entity_id: "t1", name: "Track 1" },
        { entity_id: "t2", name: "Track 2" },
        { entity_id: "t10", name: "Track 10" },
      ];
      // Track 2 deleted: next in natural sort is Track 10
      const nextAfter2 = getNextSelectionAfterDelete(tracks, "t2");
      expect(nextAfter2).toEqual({ entity_id: "t10", name: "Track 10" });

      // Track 10 deleted: it was the last in natural sort -> previous is Track 2
      const nextAfter10 = getNextSelectionAfterDelete(tracks, "t10");
      expect(nextAfter10).toEqual({ entity_id: "t2", name: "Track 2" });
    });

    it("should support entities using 'id' property instead of 'entity_id'", () => {
      const items: NamedEntity[] = [
        { id: "x1", name: "Alpha" },
        { id: "x2", name: "Beta" },
        { id: "x3", name: "Gamma" },
      ];
      const selected = getNextSelectionAfterDelete(items, "x2");
      expect(selected).toEqual({ id: "x3", name: "Gamma" });
    });

    it("should fall back to first item if deletedId is not found", () => {
      const items: NamedEntity[] = [
        { entity_id: "1", name: "Alpha" },
        { entity_id: "2", name: "Beta" },
      ];
      const selected = getNextSelectionAfterDelete(items, "non-existent");
      expect(selected).toEqual({ entity_id: "1", name: "Alpha" });
    });

    it("should break ties with entity ID if names are identical", () => {
      const items: NamedEntity[] = [
        { entity_id: "id-b", name: "Same Name" },
        { entity_id: "id-a", name: "Same Name" },
        { entity_id: "id-c", name: "Same Name" },
      ];
      // Sorted order by id: id-a, id-b, id-c
      const selected = getNextSelectionAfterDelete(items, "id-b");
      expect(selected).toEqual({ entity_id: "id-c", name: "Same Name" });
    });
  });

  describe("ExpanderStateManager", () => {
    const storageKey = "test_expander_storage_key";
    const defaultState = {
      general: true,
      audio: false,
      advanced: true,
    };
    let mockLogger: { error: jasmine.Spy };
    let manager: ExpanderStateManager<typeof defaultState>;

    beforeEach(() => {
      localStorage.removeItem(storageKey);
      mockLogger = { error: jasmine.createSpy("logger.error") };
      manager = new ExpanderStateManager(storageKey, defaultState, mockLogger);
    });

    afterEach(() => {
      localStorage.removeItem(storageKey);
    });

    it("should load defaultState when nothing is saved", () => {
      const loaded = manager.load();
      expect(loaded).toEqual(defaultState);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it("should load saved state merged with defaultState", () => {
      localStorage.setItem(storageKey, JSON.stringify({ audio: true }));
      const loaded = manager.load();
      expect(loaded).toEqual({
        general: true,
        audio: true,
        advanced: true,
      });
    });

    it("should handle JSON parse errors gracefully and return defaultState", () => {
      localStorage.setItem(storageKey, "{bad_json");
      const loaded = manager.load();
      expect(loaded).toEqual(defaultState);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it("should save state to localStorage", () => {
      const newState = { general: false, audio: true, advanced: false };
      manager.save(newState);
      expect(localStorage.getItem(storageKey)).toBe(JSON.stringify(newState));
    });

    it("should handle save errors gracefully", () => {
      spyOn(localStorage, "setItem").and.throwError("QuotaExceeded");
      manager.save(defaultState);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it("should toggle a section and persist the updated state", () => {
      const state = { ...defaultState };
      const res1 = manager.toggle(state, "audio");
      expect(res1).toBeTrue();
      expect(state.audio).toBeTrue();
      expect(JSON.parse(localStorage.getItem(storageKey)!)).toEqual(state);

      const res2 = manager.toggle(state, "audio");
      expect(res2).toBeFalse();
      expect(state.audio).toBeFalse();
      expect(JSON.parse(localStorage.getItem(storageKey)!)).toEqual(state);
    });
  });
});
