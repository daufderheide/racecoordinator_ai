---
description: Migrating RC AI from MongoDB to SQLite for low memory usage and cross-platform compatibility
---

# Migrate Database from MongoDB to SQLite

Refer to the detailed design and implementation roadmap in [docs/sqlite_migration_proposal.md](file:///Users/dave/dev/racecoordinator_ai/docs/sqlite_migration_proposal.md).

## Step-by-Step Implementation Guide

1. **Review Proposal & Requirements**:
   * Read [docs/sqlite_migration_proposal.md](file:///Users/dave/dev/racecoordinator_ai/docs/sqlite_migration_proposal.md) to understand the SQLite JSON Document Store design.

2. **Update Dependencies (`server/pom.xml`)**:
   * Remove `mongodb-driver-sync` and `de.flapdoodle.embed.mongo`.
   * Add `org.xerial:sqlite-jdbc`.

3. **Create Persistence Abstractions**:
   * Create `SqliteRepository<T>` replacing `MongoRepository<T>`.
   * Update `DatabaseContext` to handle `.db` connection management, copying, listing, export, and import.

4. **Refactor Services & App Entrypoint**:
   * Update `DatabaseService`, `AssetService`, and handlers to use `SqliteRepository`.
   * Clean up `App.java` to remove Flapdoodle process setup and Mongo port parameters.

5. **Auto-Migration & Legacy Conversion**:
   * Implement `MongoToSqliteMigrator` in `App.java` to automatically convert legacy `app_data/data/` Mongo collections into `app_data/databases/default.db` on initial startup.

6. **Testing & Verification**:
   * Run server unit tests: `./run_server_tests.sh`.
   * Verify server launches cleanly: `./run_server.sh`.
