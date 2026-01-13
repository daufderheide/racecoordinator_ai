import { Component, OnInit } from '@angular/core';
import { DataService } from './data.service';

@Component({
  selector: 'app-home',
  template: `
    <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
      <h1>Hello World Home Page</h1>
      
      <div style="margin: 20px; padding: 20px; border: 1px solid #ddd; display: inline-block; border-radius: 8px;">
        <h3>Message from Java Server:</h3>
        <p style="font-weight: bold; color: #007acc;">{{ serverData }}</p>
      </div>

      <div style="margin-top: 30px;">
        <h3>Interactive SVG</h3>
        <p>Use buttons to change the circle size.</p>
        
        <svg width="300" height="300" style="border: 2px solid #333; background-color: #f9f9f9; border-radius: 4px;">
          <!-- Binding radius to the 'r' attribute via [attr.r] -->
          <circle cx="150" cy="150" [attr.r]="radius" fill="#ff5722" stroke="#bf360c" stroke-width="4" />
          
          <!-- Text centered in the circle -->
          <text x="150" y="155" font-size="24" text-anchor="middle" fill="white" font-weight="bold">
            {{ radius }}
          </text>
        </svg>

        <div style="margin-top: 20px;">
          <button (click)="decreaseRadius()" style="padding: 10px 20px; font-size: 16px; margin: 0 10px; cursor: pointer;">Shrink</button>
          <button (click)="increaseRadius()" style="padding: 10px 20px; font-size: 16px; margin: 0 10px; cursor: pointer;">Grow</button>
          <button (click)="reset()" style="padding: 10px 20px; font-size: 16px; margin: 0 10px; cursor: pointer; background-color: #eee;">Reset</button>
        </div>
      </div>
    </div>
  `,
  styles: [],
  standalone: false
})
export class HomeComponent implements OnInit {
  serverData: string = 'Loading...';
  radius: number = 50;

  constructor(private dataService: DataService) { }

  ngOnInit() {
    this.dataService.getData().subscribe({
      next: (data) => {
        this.serverData = data;
        console.log('Data received:', data);
      },
      error: (err) => {
        this.serverData = 'Failed to connect to server (Is it running?)';
        console.error('Error:', err);
      }
    });
  }

  increaseRadius() {
    if (this.radius < 140) {
      this.radius += 10;
    }
  }

  decreaseRadius() {
    if (this.radius > 20) {
      this.radius -= 10;
    }
  }

  reset() {
    this.radius = 50;
  }
}
