import { naturalSortCompare } from "@app/utils/sorting.utils";

/**
 * Shared utility functions and helpers for entity and hardware editors.
 */

export interface NamedEntity {
  entity_id?: string;
  id?: string;
  name: string;
}

export interface SelectItem {
  id: string;
  name: string;
}

/**
 * Checks whether an entity name is valid and unique within a given collection.
 *
 * @param name The proposed name to test.
 * @param currentId The ID of the entity currently being edited (to exclude self from duplicate check).
 * @param collection The collection of existing entities.
 * @param excludeSelf Whether to exclude the entity matching currentId. Defaults to true.
 * @returns true if the trimmed name is non-empty and does not conflict with another entity; otherwise false.
 */
export function isEntityNameUnique<T extends NamedEntity>(
  name: string | null | undefined,
  currentId: string | undefined,
  collection: T[] | null | undefined,
  excludeSelf: boolean = true,
): boolean {
  if (!name) return false;
  const trimmed = name.trim().toLowerCase();
  if (!trimmed) return false;
  if (!collection || collection.length === 0) return true;

  return !collection.some((item) => {
    const itemId = item.entity_id ?? item.id;
    if (excludeSelf && currentId && itemId === currentId) {
      return false;
    }
    return (item.name ?? "").trim().toLowerCase() === trimmed;
  });
}

/**
 * Converts a collection of entities into sorted dropdown items for `app-editor-title`.
 *
 * @param collection The entities to map.
 * @returns Array of `{ id: string, name: string }` sorted naturally by name.
 */
export function mapToSelectItems<T extends NamedEntity>(
  collection: T[] | null | undefined,
): SelectItem[] {
  if (!collection || collection.length === 0) {
    return [];
  }

  return collection
    .map((item) => ({
      id: item.entity_id ?? item.id ?? "",
      name: item.name ?? "",
    }))
    .sort((a, b) => naturalSortCompare(a.name, b.name));
}

/**
 * Manages expander section state persistence in localStorage with error resilience.
 */
export class ExpanderStateManager<T extends Record<string, boolean>> {
  constructor(
    private readonly storageKey: string,
    private readonly defaultState: T,
    private readonly logger?: { error(msg: string, ...args: any[]): void },
  ) {}

  /**
   * Loads the saved expander state from localStorage, falling back to defaultState.
   */
  load(): T {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          return { ...this.defaultState, ...parsed };
        }
      }
    } catch (e) {
      this.logger?.error(
        `Error loading expander state for ${this.storageKey}`,
        e,
      );
    }
    return { ...this.defaultState };
  }

  /**
   * Saves the expander state to localStorage.
   */
  save(state: T): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (e) {
      this.logger?.error(
        `Error saving expander state for ${this.storageKey}`,
        e,
      );
    }
  }

  /**
   * Toggles a single section boolean and persists the updated state.
   *
   * @param state The current state object (mutated in-place for convenience).
   * @param section The section key to toggle.
   * @returns The new boolean value of the section.
   */
  toggle(state: T, section: keyof T): boolean {
    state[section] = !state[section] as T[keyof T];
    this.save(state);
    return state[section];
  }
}
