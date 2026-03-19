#!/bin/bash
cd "$(dirname "$0")/client"
npx ng test --include src/app/components/raceday-setup/raceday-setup.component.spec.ts --watch=false
