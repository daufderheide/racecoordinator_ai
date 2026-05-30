# Race Coordinator Analytics Architecture

This document describes how Google Analytics 4 (GA4) is integrated into Race Coordinator AI across both the Angular frontend (Client) and Java Javelin backend (Server). This also covers how events are tracked and how to view them on the Google Analytics dashboard.

# Why Tracking?
RaceCoordinator AI tracks page views, basic user interaction with the software, and some configuration data.  This data is only used to improve the software itself and help steer very limited support resources where they will make the biggest impact.  This data will never be sold, or used beyond the betterment of RaceCoordinator AI by it's developers.  Google Analytics handles privacy and the most specific data tracked is the country the data is coming from.

While this data is very important, we understand if you want to opt out of it.  Simply disable analytics from the toolbar in RaceCoordiator AI.

# Stalenss
While every effort will be made to keep this document up to date, ultimately the source code is the source of truth.  If something is being tracked and you do not find it in this document please let us know and we'll update it as soon as possible.

## 1. What Tracking Is Being Done?

The application separates tracking into Server-Side (Measurement Protocol) and Client-Side (standard web `gtag.js`). Both systems share the same Measurement ID and User Client ID to ensure unified data sessions.

### Client-Side Tracking (Angular UI)
The client focuses on UI engagement and navigation, only sending data if the user has analytics enabled within the active application.

1. **`page_view`**: Fired automatically every time the Angular Router navigates to a new route. Tracks standard page visit flow.
2. **`help_started`**: Fired when a user initiates a Guided Help walkthrough (via the lightbulb icon). Includes the `guide_name` being triggered.
3. **`help_completed`**: Fired when a user flips through all available steps in the guide and completes it fully. Includes the `guide_name`.
4. **`help_ended_early`**: Fired if the user closes/exits a guided walkthrough prematurely before reaching the last step. Includes:
   - `guide_name`: The descriptive name of the guide.
   - `step_index`: The actual numeric index they dropped off at.
   - `step_title`: The human-readable string title of the slide they closed.

### Server-Side Tracking (Java Backend)
The backend uses Google's specialized Measurement Protocol. Because it uses direct backend HTTP calls instead of browser DOM scripts, this tracking is extremely resilient perfectly suited for application-level lifecycle tracking.

1. **`backend_race_started`**: Triggers explicitly when the core `Race` object is initialized. Parameters captured:
   - `number_of_lanes`
   - `driver_count`
   - `is_demo` (true/false tracking)
   - `heat_rotation_type`
   - `heat_scoring_method`
   - `overall_scoring_method` (e.g., LAP_COUNT, TOTAL_TIME)
   - `fuel_system` (Analog, Digital, or None)
2. **`analytics_toggled`**: Fired exactly when the user clicks the option to enable or disable analytics routing on their local install. 
   - `analytics_enabled`: A boolean capturing whether they are actively enabling or disabling. 
   - *Note: This particular event intentionally bypasses the disabled check to reliably inform system metrics of uninstalls/opt-outs.*

---

## 2. How to Create and Send Analytics from Code

### Adding Client-Side Analytics (Angular)
In any Angular component or service, inject the core `AnalyticsService` and trigger the public `trackClick` API.

```typescript
import { AnalyticsService } from '../analytics.service';

constructor(private analyticsService: AnalyticsService) {}

triggerMyEvent() {
    this.analyticsService.trackClick('my_custom_event', {
        custom_param_1: 'value',
        my_metric: 10
    });
}
```

### Adding Server-Side Analytics (Java)
Inside `AnalyticsService.java`, create a new method similar to `trackRaceStart`. Instantiate a map of your new parameters, configure the event block with a name, and pass it immediately to `sendPayload()`.

```java
  public void trackMyBackendProcess(String status) {
    if (!enabled || !userEnabled) return;

    Map<String, Object> eventParams = new HashMap<>();
    eventParams.put("status", status);
    eventParams.put("engagement_time_msec", "1"); // Generally required for real-time aggregation!
    eventParams.put("session_id", String.valueOf(System.currentTimeMillis()));

    Map<String, Object> event = new HashMap<>();
    event.put("name", "my_backend_process");
    event.put("params", eventParams);

    Map<String, Object> payload = new HashMap<>();
    payload.put("client_id", getClientId()); // Persists the frontend's unique user
    payload.put("events", Collections.singletonList(event));

    sendPayload(payload);
  }
```

---

## 3. Viewing the Analytics in Google Analytics 4 (GA4)
You must have access to the GA4 account to view metrics and admin access to add new custom definitions and reports.

Whenever a completely "new" event name is deployed via either Client or Server, GA4 automatically collects it. However, to see **custom parameters** like `step_title` and `is_demo`, you must follow a one-time registration process in the Analytics Administrator panel.

### Step 1: Immediate Viewing (Realtime Reports)
1. In GA4, go to **Reports > Realtime**.
2. Scroll to the **"Event count by Event name"** card.
3. Click directly on any custom event name here (e.g. `help_ended_early` or `backend_race_started`) to view exactly what parameters have fired in the last 30 minutes!

### Step 2: Register Custom Dimensions (Required)
To retain custom strings and metrics into your timeline explorations, register them:
1. Navigate to **Admin** (gear icon on bottom left).
2. Under "Data display", click **Custom definitions**.
3. Select **Create custom dimensions** and map the internal variables to human-readable columns. 

*For example, to map the Guided Help parameters:*
- Dimension Name: `Guide Name`, Event parameter: `guide_name`
- Dimension Name: `Step Index`, Event parameter: `step_index`
- Dimension Name: `Step Title`, Event parameter: `step_title`

### Step 3: Explore and Trend
Once Dimensions are registered (they take ~24 hours to populate moving forward):
1. Navigate to the **Explore** tab from the main left toolbar.
2. Build a **Blank Free-form exploration**.
3. Import your new Custom Dimensions into the far-left Dimensions panel (like `Guide Name`).
4. Drop `Event name` and your new dimension into the **Rows** setup. Add `Event Count` into the **Values** panel. Feel free to use the Filter panel to isolate specifically to events like `help_ended_early`.

### Step 4: Viewing in Standard Reports
If you don't want to build a custom Exploration, you can view your registered custom dimensions directly in the standard GA4 reports:

1. Navigate to **Reports > Engagement > Events**.
2. In the data table, look for the **plus sign (+)** next to the "Event name" column header.
3. Search for your **Custom Dimension** (e.g., "Guide Name") and select it.
4. It will now appear as a **secondary dimension** in the table!

**Pro Tip:** You can also click on a specific event name (like `help_started`) within the Events report to see a detailed dashboard for that specific event, which includes cards for any registered custom parameters associated with it.

### Step 5: Viewing Page Views
To see which specific sections of the software users are visiting:

1. Navigate to **Reports > Engagement > Pages and screens**.
2. This report shows counts for each individual URL/Route (e.g., `/home`, `/track-editor`) visited by users.
3. You can change the primary dimension to **Page title and screen class** to see names instead of URLs, provided they are configured in the code.
4. Total "Page views" for the entire application can be found here under the **Views** column.
