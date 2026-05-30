# Race Coordinator AI — Client

Angular front-end for Race Coordinator AI.

For setup, dev-server, test, lint, debug, and packaging instructions,
see **[../docs/DEVELOPING.md](../docs/DEVELOPING.md)**.

The bare Angular CLI commands (`ng serve`, `ng test`, `ng build`) do **not**
run the protobuf generation, isolated-test setup, or Playwright snapshot
wiring this project needs — use the wrapper scripts under `../scripts/`
instead (`./scripts/run_client.sh`, `./scripts/run_client_unit_tests.sh`,
`./scripts/run_client_screendiff_tests.sh`).
