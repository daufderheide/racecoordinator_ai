import {
  ExpanderStateManager,
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
