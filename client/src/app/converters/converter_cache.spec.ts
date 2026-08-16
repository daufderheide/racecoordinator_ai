import { ConverterCache } from "./converter_cache";

describe("ConverterCache", () => {
  let cache: ConverterCache<{ id: string; name: string }>;

  beforeEach(() => {
    cache = new ConverterCache<{ id: string; name: string }>();
  });

  it("should process new items and cache them", () => {
    const item = cache.process("1", false, () => ({ id: "1", name: "Item 1" }));
    expect(item).toEqual({ id: "1", name: "Item 1" });
    expect(cache.has("1")).toBeTrue();
    expect(cache.get("1")).toEqual({ id: "1", name: "Item 1" });
    expect(cache.getKeys()).toEqual(["1"]);
  });

  it("should return cached item on reference", () => {
    cache.process("1", false, () => ({ id: "1", name: "Item 1" }));
    const refItem = cache.process("1", true, () => ({
      id: "1",
      name: "Fallback",
    }));
    expect(refItem.name).toBe("Item 1");
  });

  it("should clear the cache", () => {
    cache.process("1", false, () => ({ id: "1", name: "Item 1" }));
    expect(cache.has("1")).toBeTrue();
    cache.clear();
    expect(cache.has("1")).toBeFalse();
    expect(cache.getKeys().length).toBe(0);
  });
});
