import { Page } from "@playwright/test";
import { Season } from "@app/models/season";

/**
 * Shared test helper for SeasonResults component.
 * Provides standard mock data structures for unit and screendiff tests.
 */
export class SeasonResultsHelper {
  /**
   * Mock season data with finished races and driver results.
   */
  static createMockSeason(): Season {
    return {
      entity_id: "season_screendiff_1",
      name: "2026 World Championship",
      drops: 1,
      races: [
        {
          race_id: "r1",
          race_name: "Monaco Grand Prix",
          timestamp: 1700000000000,
          is_demo: false,
          driver_results: [
            {
              driver_id: "d1",
              driver_name: "Alice Sprint",
              overall_rank: 1,
              overall_points: 25,
              heat_points: 5,
              total_points: 30,
            },
            {
              driver_id: "d2",
              driver_name: "Bob Turbo",
              overall_rank: 2,
              overall_points: 18,
              heat_points: 3,
              total_points: 21,
            },
            {
              driver_id: "d3",
              driver_name: "Charlie Apex",
              overall_rank: 3,
              overall_points: 15,
              heat_points: 1,
              total_points: 16,
            },
          ],
        },
        {
          race_id: "r2",
          race_name: "Silverstone Grand Prix",
          timestamp: 1700600000000,
          is_demo: true,
          driver_results: [
            {
              driver_id: "d2",
              driver_name: "Bob Turbo",
              overall_rank: 1,
              overall_points: 25,
              heat_points: 4,
              total_points: 29,
            },
            {
              driver_id: "d1",
              driver_name: "Alice Sprint",
              overall_rank: 2,
              overall_points: 18,
              heat_points: 2,
              total_points: 20,
            },
            {
              driver_id: "d3",
              driver_name: "Charlie Apex",
              overall_rank: 3,
              overall_points: 15,
              heat_points: 0,
              total_points: 15,
            },
          ],
        },
      ],
    };
  }

  /**
   * Mock season data with no races run yet.
   */
  static createEmptyMockSeason(): Season {
    return {
      entity_id: "season_empty",
      name: "2026 Pre-Season",
      drops: 0,
      races: [],
    };
  }

  /**
   * Inject mock season data into Playwright API route interception.
   */
  static async injectMockSeasonsData(page: Page, seasons: Season[]) {
    await page.route("**/api/seasons**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(seasons),
      });
    });
  }
}
