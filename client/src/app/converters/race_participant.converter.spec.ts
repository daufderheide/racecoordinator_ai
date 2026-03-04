import { RaceParticipantConverter } from './race_participant.converter';
import { com } from '../proto/message';
import { DriverConverter } from './driver.converter';
import { TeamConverter } from './team.converter';

describe('RaceParticipantConverter', () => {
  beforeEach(() => {
    RaceParticipantConverter.clearCache();
    DriverConverter.clearCache();
    TeamConverter.clearCache();
  });

  it('should convert proto with team to RaceParticipant', () => {
    const proto: com.antigravity.IRaceParticipant = {
      objectId: 'p1',
      driver: {
        model: { entityId: 'd1' },
        name: 'Alice'
      },
      team: {
        model: { entityId: 't1' },
        name: 'Team Alpha'
      }
    };

    const participant = RaceParticipantConverter.fromProto(proto);
    expect(participant.objectId).toBe('p1');
    expect(participant.driver.name).toBe('Alice');
    expect(participant.team).toBeDefined();
    expect(participant.team?.name).toBe('Team Alpha');
  });

  it('should handle absence of team', () => {
    const proto: com.antigravity.IRaceParticipant = {
      objectId: 'p1',
      driver: {
        model: { entityId: 'd1' },
        name: 'Alice'
      }
    };

    const participant = RaceParticipantConverter.fromProto(proto);
    expect(participant.team).toBeUndefined();
  });

  it('should update existing participant in place', () => {
    const proto1: com.antigravity.IRaceParticipant = {
      objectId: 'p1',
      driver: { model: { entityId: 'd1' }, name: 'Alice' },
      fuelLevel: 100
    };

    const p1 = RaceParticipantConverter.fromProto(proto1);
    expect(p1.fuelLevel).toBe(100);

    const proto2: com.antigravity.IRaceParticipant = {
      objectId: 'p1',
      driver: { model: { entityId: 'd1' }, name: 'Alice' },
      fuelLevel: 80
    };

    const p2 = RaceParticipantConverter.fromProto(proto2);
    expect(p2).toBe(p1); // Reference must be identical
    expect(p1.fuelLevel).toBe(80);
    expect(p2.fuelLevel).toBe(80);
  });
});
