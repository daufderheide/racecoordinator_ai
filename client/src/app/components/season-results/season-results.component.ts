import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";

import { DefaultSeasonResultsComponent } from "./default-season-results.component";

@Component({
  standalone: true,
  selector: "app-season-results",
  templateUrl: "./season-results.component.html",
  styleUrls: ["./season-results.component.css"],
  imports: [CommonModule, DefaultSeasonResultsComponent],
})
export class SeasonResultsComponent {}
