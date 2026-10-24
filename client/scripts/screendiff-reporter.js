const path = require("path");

class ScreendiffReporter {
  onBegin(config, suite) {
    this.totalTests = suite.allTests().length;
    this.startTime = Date.now();
    this.completed = 0;
    this.passed = 0;
    this.skipped = 0;

    const dateStr = new Date().toLocaleTimeString();
    console.log(
      `\n⏱️  [${dateStr}] Starting visual screendiff run: ${this.totalTests} tests scheduled.`,
    );
    console.log(
      `--------------------------------------------------------------------------------`,
    );
  }

  onTestEnd(test, result) {
    this.completed++;

    // Duration formatting for the individual test
    const durationMs = result.duration;
    const durationStr =
      durationMs >= 1000
        ? `${(durationMs / 1000).toFixed(1)}s`
        : `${Math.round(durationMs)}ms`;

    // Elapsed total time and ETA calculation
    const elapsedMs = Date.now() - this.startTime;
    const elapsedStr = this.formatDuration(elapsedMs);

    let etaStr = "";
    if (this.completed >= 5 && this.completed < this.totalTests) {
      const avgMs = elapsedMs / this.completed;
      const remainingMs = avgMs * (this.totalTests - this.completed);
      etaStr = ` | ETA ~${this.formatDuration(remainingMs)}`;
    }

    const percent = Math.round((this.completed / this.totalTests) * 100);

    // Browser project and location
    const project = test.parent?.project()?.name || "";
    const projectTag = project ? `[${project}] ` : "";

    const filePath = test.location?.file
      ? path.relative(process.cwd(), test.location.file).replace(/\\/g, "/")
      : "";
    const fileLine = test.location?.line ? `:${test.location.line}` : "";
    const fullTestPath = `${filePath}${fileLine}`;

    // Status symbol
    let statusLabel = "✔";
    if (result.status === "passed") {
      if (result.retry > 0) {
        statusLabel = `⚠️  RETRY #${result.retry} PASSED`;
      } else {
        statusLabel = "✔";
        this.passed++;
      }
    } else if (result.status === "failed") {
      statusLabel =
        result.retry > 0 ? `✖ RETRY #${result.retry} FAILED` : "✖ FAILED";
    } else if (result.status === "timedOut") {
      statusLabel =
        result.retry > 0 ? `⏱ RETRY #${result.retry} TIMEOUT` : "⏱ TIMEOUT";
    } else if (result.status === "skipped") {
      statusLabel = "⏭ SKIPPED";
      this.skipped++;
    }

    // Single-line progress logging with per-test duration, elapsed time, and ETA
    console.log(
      `[${this.completed}/${this.totalTests} - ${percent}%] [${elapsedStr} elapsed${etaStr}] (${durationStr}) ${statusLabel} ${projectTag}${fullTestPath} › ${test.title}`,
    );

    // If failed, print snippet of error details immediately
    if (result.status === "failed" || result.status === "timedOut") {
      const errors = result.errors || [result.error].filter(Boolean);
      for (const err of errors) {
        const msg = err.message || err.value || String(err);
        const snippet = msg
          .split("\n")
          .slice(0, 5)
          .map((l) => `      ${l}`)
          .join("\n");
        console.log(`\n   ↳ ${statusLabel} DETAILS:\n${snippet}\n`);
      }
    }
  }

  onEnd(result) {
    const totalMs = Date.now() - this.startTime;
    const totalTimeStr = this.formatDuration(totalMs);

    console.log(
      `--------------------------------------------------------------------------------`,
    );
    console.log(
      `🏁 Visual screendiff run finished in ${totalTimeStr} (Status: ${result.status})`,
    );
    console.log(
      `   Total Tests: ${this.totalTests} | Completed: ${this.completed} | Passed: ${this.passed} | Skipped: ${this.skipped}`,
    );
    console.log(
      `--------------------------------------------------------------------------------\n`,
    );
  }

  formatDuration(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
  }
}

module.exports = ScreendiffReporter;
