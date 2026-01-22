import { Component, OnInit } from '@angular/core';
import { RaceService } from 'src/app/services/race.service';
import { RaceParticipant } from 'src/app/models/race_participant';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DataService } from 'src/app/data.service';
import { Heat } from 'src/app/race/heat';

@Component({
  selector: 'app-leader-board',
  templateUrl: './leader_board.component.html',
  styleUrls: ['./leader_board.component.css'],
  standalone: false
})
export class LeaderBoardComponent implements OnInit {

  participants$: Observable<RaceParticipant[]>;
  currentHeat$: Observable<Heat | undefined>;
  leader$: Observable<RaceParticipant | undefined>;
  others$: Observable<RaceParticipant[]>;

  constructor(public raceService: RaceService, private dataService: DataService) {
    this.participants$ = this.raceService.participants$;
    this.currentHeat$ = this.raceService.currentHeat$;

    this.leader$ = this.participants$.pipe(
      map(participants => participants.length > 0 ? participants[0] : undefined)
    );

    this.others$ = this.participants$.pipe(
      map(participants => participants.length > 1 ? participants.slice(1) : [])
    );
  }

  ngOnInit(): void {
    // Ensure we have data
    this.dataService.updateRaceSubscription(true);
  }
}
