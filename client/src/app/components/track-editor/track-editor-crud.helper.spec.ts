import { Lane } from "@app/models/lane";
import { Track } from "@app/models/track";

import { TrackEditorCrudHelper } from "./track-editor-crud.helper";

describe("TrackEditorCrudHelper", () => {
  describe("generateUniqueTrackName", () => {
    it("should return base name if unique", () => {
      const allTracks = [
        new Track({ entity_id: "t1", name: "Circuit A", lanes: [] }),
      ];
      expect(
        TrackEditorCrudHelper.generateUniqueTrackName("Circuit B", allTracks),
      ).toBe("Circuit B");
    });

    it("should append suffix if base name exists", () => {
      const allTracks = [
        new Track({ entity_id: "t1", name: "Circuit A", lanes: [] }),
        new Track({ entity_id: "t2", name: "Circuit A_1", lanes: [] }),
      ];
      expect(
        TrackEditorCrudHelper.generateUniqueTrackName("Circuit A", allTracks),
      ).toBe("Circuit A_2");
    });

    it("should force suffix when forceSuffix is true", () => {
      const allTracks: Track[] = [];
      expect(
        TrackEditorCrudHelper.generateUniqueTrackName(
          "Circuit",
          allTracks,
          true,
        ),
      ).toBe("Circuit_1");
    });
  });

  describe("buildTrackSavePayload", () => {
    it("should inject @id fields for Jackson identity resolution", () => {
      const track = new Track({
        entity_id: "t1",
        name: "Test",
        lanes: [new Lane("l1", "w", "b", 10), new Lane("l2", "w", "r", 10)],
      });
      const payload = TrackEditorCrudHelper.buildTrackSavePayload(track);
      expect(payload["@id"]).toBe(1);
      expect(payload.lanes[0]["@id"]).toBe(2);
      expect(payload.lanes[1]["@id"]).toBe(3);
    });
  });

  describe("createTrackFromFactory & createFallbackTrack", () => {
    it("should create track from factory data", () => {
      let counter = 0;
      const idGen = () => `id_${++counter}`;
      const factory = {
        num_track_sections: 80,
        track_scale: 0.03125,
        lanes: [{ foreground_color: "w", background_color: "b", length: 40 }],
      };
      const created = TrackEditorCrudHelper.createTrackFromFactory(
        factory,
        "New Name",
        idGen,
      );

      expect(created.name).toBe("New Name");
      expect(created.num_track_sections).toBe(80);
      expect(created.track_scale).toBe(0.03125);
      expect(created.lanes[0].entity_id).toBe("id_1");
    });

    it("should create fallback track when factory fails", () => {
      let counter = 0;
      const idGen = () => `fallback_${++counter}`;
      const fallback = TrackEditorCrudHelper.createFallbackTrack("FB", idGen);
      expect(fallback.name).toBe("FB");
      expect(fallback.lanes.length).toBe(2);
      expect(fallback.lanes[0].entity_id).toBe("fallback_1");
      expect(fallback.lanes[1].entity_id).toBe("fallback_2");
    });
  });

  describe("getUnsavedTrackReasons", () => {
    it("should return empty array if no editingTrack", () => {
      expect(
        TrackEditorCrudHelper.getUnsavedTrackReasons(
          undefined,
          "T",
          true,
          false,
          false,
        ),
      ).toEqual([]);
    });

    it("should detect empty track name", () => {
      const reasons = TrackEditorCrudHelper.getUnsavedTrackReasons(
        new Track({ entity_id: "t", name: "T", lanes: [] }),
        "   ",
        true,
        false,
        true,
      );
      expect(reasons).toContain("DISCARD_REASON_TRACK_NAME_EMPTY");
    });

    it("should detect duplicate track name", () => {
      const reasons = TrackEditorCrudHelper.getUnsavedTrackReasons(
        new Track({ entity_id: "t", name: "T", lanes: [] }),
        "T",
        false,
        false,
        true,
      );
      expect(reasons).toContain("DISCARD_REASON_TRACK_NAME_DUPLICATE");
    });

    it("should detect saving in progress", () => {
      const reasons = TrackEditorCrudHelper.getUnsavedTrackReasons(
        new Track({ entity_id: "t", name: "T", lanes: [] }),
        "T",
        true,
        true,
        true,
      );
      expect(reasons).toContain("DISCARD_REASON_SAVING");
    });

    it("should detect exit too quickly when dirty without other errors", () => {
      const reasons = TrackEditorCrudHelper.getUnsavedTrackReasons(
        new Track({ entity_id: "t", name: "T", lanes: [] }),
        "T",
        true,
        false,
        true,
      );
      expect(reasons).toContain("DISCARD_REASON_EXIT_TOO_QUICKLY");
    });
  });
});
