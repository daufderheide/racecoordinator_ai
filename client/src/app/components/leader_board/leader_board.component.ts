import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { RaceService } from 'src/app/services/race.service';
import { RaceParticipant } from 'src/app/models/race_participant';
import { RaceParticipantConverter } from 'src/app/converters/race_participant.converter';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DataService } from 'src/app/data.service';
import { Heat } from 'src/app/race/heat';
import { RaceConverter } from 'src/app/converters/race.converter';

import { OverallRanking } from 'src/app/models/overall_scoring';

@Component({
  selector: 'app-leader-board',
  templateUrl: './leader_board.component.html',
  styleUrls: ['./leader_board.component.css'],
  standalone: false
})
export class LeaderBoardComponent implements OnInit, OnDestroy {

  participants$: Observable<RaceParticipant[]>;
  currentHeat$: Observable<Heat | undefined>;
  leader$: Observable<RaceParticipant | undefined>;
  others$: Observable<RaceParticipant[]>;
  isTimeBased$: Observable<boolean>;

  constructor(public raceService: RaceService, private dataService: DataService) {
    this.participants$ = this.raceService.participants$;
    this.currentHeat$ = this.raceService.currentHeat$;

    this.isTimeBased$ = this.raceService.selectedRace$.pipe(
      map(race => {
        if (!race || !race.overall_scoring) return false;
        const method = race.overall_scoring.rankingMethod;
        return method === OverallRanking.OR_FASTEST_LAP ||
          method === OverallRanking.OR_TOTAL_TIME ||
          method === OverallRanking.OR_AVERAGE_LAP;
      })
    );

    this.leader$ = this.participants$.pipe(
      map(participants => participants.length > 0 ? participants[0] : undefined)
    );

    this.others$ = this.participants$.pipe(
      map(participants => participants.length > 1 ? participants.slice(1) : [])
    );
  }

  ngOnInit(): void {
    // Subscribe to race data
    this.dataService.updateRaceSubscription(true);

    this.dataService.getOverallStandingsUpdate().subscribe(update => {
      console.log('LeaderBoardComponent: Received Overall Standings Update:', update);
      if (update.participants) {
        const participants = update.participants.map(p => RaceParticipantConverter.fromProto(p));
        this.raceService.setParticipants(participants);
      }
    });

    this.dataService.getRaceUpdate().subscribe(update => {
      console.log('LeaderBoardComponent: Received Race Update:', update);
      if (update.race) {
        this.raceService.setRace(RaceConverter.fromProto(update.race));
      }
      if (update.drivers && update.drivers.length > 0) {
        const participants = update.drivers.map(d => RaceParticipantConverter.fromProto(d));
        this.raceService.setParticipants(participants);
      }
    });
  }

  @HostListener('window:beforeunload')
  ngOnDestroy(): void {
    console.log('LeaderBoardComponent: Unsubscribing from race data');
    this.dataService.updateRaceSubscription(false);
  }
}
