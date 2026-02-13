import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-heat-list',
  templateUrl: './heat-list.component.html',
  styleUrls: ['./heat-list.component.css'],
  standalone: false
})
export class HeatListComponent implements OnChanges {
  @Input() heats: any[] = [];
  @Input() showHeader: boolean = true;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['heats']) {
      console.log('HeatListComponent received new heats:', this.heats?.length, 'heats');
      console.log('Heats data:', this.heats);
    }
  }

  trackByHeatNumber(index: number, heat: any): number {
    return heat.heatNumber || index;
  }

  trackByLaneNumber(index: number, lane: any): number {
    return lane.laneNumber || index;
  }
}
