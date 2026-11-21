import { allFields } from "@app/components/ui-editor/inspector-kit/inspector-schema";

import { textPart } from "./common";
import { getInspectorSchema } from "./widget-schemas";

/** Alignment per part (phase 3c). */
describe("alignment per part", () => {
  const part = (type: string, id: string): any =>
    allFields(getInspectorSchema(type)!).find((f) => f.id === id);

  it("adds <prefix>Alignment with Auto (nothing stored) as its default", () => {
    const f = textPart("title", "T", "title", { aligned: true });
    expect(f.keys.align).toBe("titleAlignment");
    expect(f.keyDefaults?.align).toBe("");
    expect(textPart("title", "T", "title").keys.align).toBeUndefined();
  });

  it("is on titles, subtitles, the Records header and the Timer, not on table rows", () => {
    expect(part("next-heat", "title").keys.align).toBe("titleAlignment");
    expect(part("leaderboard", "title").keys.align).toBe("titleAlignment");
    expect(part("group-leaderboard", "subtitle").keys.align).toBe(
      "subtitleAlignment",
    );
    expect(part("heat-list", "title").keys.align).toBe("titleAlignment");
    expect(part("records", "header").keys.align).toBe("headerAlignment");
    expect(part("timer", "time").keys.align).toBe("timeAlignment");
    expect(part("timer", "status").keys.align).toBe("statusAlignment");
    // a name + time row, and table rows, keep their columns
    expect(part("records", "value").keys.align).toBeUndefined();
    expect(part("heat-list", "lanes").keys.align).toBeUndefined();
    expect(part("leaderboard", "rest").keys.align).toBeUndefined();
  });

  it("aligns the whole line of the name / info widgets", () => {
    for (const type of [
      "heat-info",
      "race-name",
      "event-name",
      "season-name",
      "track-name",
    ]) {
      const line = part(type, "lineAlignment");
      expect(line.key).withContext(type).toBe("lineAlignment");
      expect(line.options.map((o: any) => o.value)).toEqual([
        "",
        "left",
        "center",
        "right",
      ]);
      expect(part(type, "label").keys.align).toBeUndefined();
    }
  });
});
