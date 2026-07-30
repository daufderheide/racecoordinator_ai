import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";

import { DefaultPredictionResultsComponent } from "./default-prediction-results.component";

@Component({
  standalone: true,
  selector: "app-prediction-results",
  templateUrl: "./prediction-results.component.html",
  styleUrls: ["./prediction-results.component.css"],
  imports: [CommonModule, DefaultPredictionResultsComponent],
})
export class PredictionResultsComponent {}
