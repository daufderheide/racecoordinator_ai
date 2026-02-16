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
});
