// Force refresh for unit tests
import { RaceConverter } from "./race.converter";
import { com } from "../proto/message";
import { Race } from "../models/race";

describe('RaceConverter', () => {
  beforeEach(() => {
    RaceConverter.clearCache();
  });

  it('should map fuel options from proto', () => {
    const mockProto: com.antigravity.IRaceModel = {
      model: { entityId: 'r1' },
      name: 'Test Race',
      track: { model: { entityId: 't1' }, name: 'Track', lanes: [] },
      fuelOptions: {
        enabled: true,
        capacity: 120
      }
    };

    const result = RaceConverter.fromProto(mockProto);
    expect(result.fuel_options).toBeDefined();
    expect(result.fuel_options.enabled).toBeTrue();
    expect(result.fuel_options.capacity).toBe(120);
  });

  it('should handle missing fuel options', () => {
    const mockProto: com.antigravity.IRaceModel = {
      model: { entityId: 'r2' },
      name: 'Test Race',
      track: { model: { entityId: 't1' }, name: 'Track', lanes: [] }
    };

    const result = RaceConverter.fromProto(mockProto);
    expect(result.fuel_options).toBeDefined();
    expect(result.fuel_options.enabled).toBeFalse();
  });
});
