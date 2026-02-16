
import { HeatConverter } from './heat.converter';
import { com } from '../proto/message';
import { DriverConverter } from './driver.converter';
import { RaceParticipantConverter } from './race_participant.converter';

describe('HeatConverter', () => {
  beforeEach(() => {
    HeatConverter.clearCache();
    DriverConverter.clearCache();
  });

  it('should populate actualDriver when present in proto', () => {
    const proto: com.antigravity.IHeat = {
      objectId: 'heat1',
      heatNumber: 1,
      heatDrivers: [{
        objectId: 'hd1',
        driver: {
          objectId: 'p1',
          driver: { name: 'Participant Driver' }
        },
        driverId: 'd1',
        actualDriver: {
          name: 'Actual Driver'
        }
      }]
    };

    const heat = HeatConverter.fromProto(proto);
    expect(heat.heatDrivers.length).toBe(1);
    const driverData = heat.heatDrivers[0];

    expect(driverData.actualDriver).toBeDefined();
    expect(driverData.actualDriver?.name).toBe('Actual Driver');
    expect(driverData.driver.name).toBe('Actual Driver');
  });

  it('should fallback to participant driver when actualDriver is missing', () => {
    const proto: com.antigravity.IHeat = {
      objectId: 'heat1',
      heatNumber: 1,
      heatDrivers: [{
        objectId: 'hd1',
        driver: {
          objectId: 'p1',
          driver: { name: 'Participant Driver' }
        },
        driverId: 'd1'
        // No actualDriver
      }]
    };

    const heat = HeatConverter.fromProto(proto);
    expect(heat.heatDrivers.length).toBe(1);
    const driverData = heat.heatDrivers[0];

    expect(driverData.actualDriver).toBeUndefined();
    expect(driverData.driver.name).toBe('Participant Driver');
  });
});
