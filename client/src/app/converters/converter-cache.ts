/**
 * A generic cache for converters to store and retrieve models.
 */
export class ConverterCache<T> {
  private cache = new Map<string, T>();

  /**
   * Clears all items from the cache.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Gets an item from the cache by its ID.
   * @param id The entity ID.
   */
  get(id: string): T | undefined {
    return this.cache.get(id);
  }

  /**
   * Check if the cache has the given ID.
   */
  has(id: string): boolean {
    return this.cache.has(id);
  }

  /**
   * Retrieves an item from the cache if available and isReference is true.
   * Otherwise, creates a new item using the creator function, caches it, and returns it.
   * 
   * @param id The entity ID (can be null/undefined)
   * @param isReference Boolean indicating if the proto is a reference (missing full data)
   * @param create Function to create the model instance
   * @param validate Create validation function (optional). Called before create() if we are going to create.
   */
  process(
    id: string | undefined | null,
    isReference: boolean,
    create: () => T,
    validate?: () => void
  ): T {
    if (id && this.cache.has(id)) {
      if (isReference) {
        return this.cache.get(id)!;
      }
    }

    if (validate) {
      validate();
    }

    const item = create();
    if (id) {
      this.cache.set(id, item);
    }
    return item;
  }
}
