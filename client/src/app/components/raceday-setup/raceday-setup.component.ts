import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DataService } from '../../data.service';
import { Driver } from '../../models/driver';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-raceday-setup',
  templateUrl: './raceday-setup.component.html',
  styleUrl: './raceday-setup.component.css',
  standalone: false
})
export class RacedaySetupComponent implements OnInit {
  availableDrivers: Driver[] = [];
  racingDrivers: Driver[] = [];

  raceType: string = 'single';
  raceSelection: string = 'Round Robin';
  seasonSelection: string = 'None';
  demoMode: boolean = false;

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadDrivers();
  }

  loadDrivers() {
    this.dataService.getDrivers().subscribe({
      next: (data) => {
        this.availableDrivers = data
          .map(d => new Driver(d.name, d.nickname || ''))
          .sort((a, b) => a.name.localeCompare(b.name));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading drivers', err)
    });
  }

  addAll() {
    this.racingDrivers = [...this.racingDrivers, ...this.availableDrivers];
    this.availableDrivers = [];
  }

  removeAll() {
    this.availableDrivers = [...this.availableDrivers, ...this.racingDrivers].sort((a, b) => a.name.localeCompare(b.name));
    this.racingDrivers = [];
  }

  randomize() {
    // Only shuffle the drivers already in the racing list
    this.racingDrivers = [...this.racingDrivers].sort(() => Math.random() - 0.5);
  }

  toggleDriver(driver: Driver, from: 'available' | 'racing') {
    if (from === 'available') {
      // Guard: Don't add if already in racing list
      if (this.racingDrivers.find(d => d.name === driver.name)) return;

      this.availableDrivers = this.availableDrivers.filter(d => d.name !== driver.name);
      this.racingDrivers = [...this.racingDrivers, driver];
    } else {
      // Guard: Don't add if already in available list
      if (this.availableDrivers.find(d => d.name === driver.name)) return;

      this.racingDrivers = this.racingDrivers.filter(d => d.name !== driver.name);
      this.availableDrivers = [...this.availableDrivers, driver]
        .sort((a, b) => a.name.localeCompare(b.name));
      this.cdr.detectChanges();
    }
  }

  drop(event: CdkDragDrop<Driver[]>) {
    // If moving within the same container
    if (event.previousContainer === event.container) {
      // Only allow reordering in the racing list
      if (event.container.id === 'racing-list') {
        moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      }
      // If it's the available list, do nothing (retain alphabetical)
    } else {
      // Moving between containers
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      // Always sort available drivers if they were moved back
      if (event.container.id === 'available-list') {
        this.availableDrivers.sort((a, b) => a.name.localeCompare(b.name));
      }
      this.cdr.detectChanges();
    }
  }

  startRace() {
    console.log('Starting race with:', this.racingDrivers);
    // Future implementation: navigate to race or trigger backend
  }
}
