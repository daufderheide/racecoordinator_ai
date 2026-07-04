lsof -ti :4200 | xargs kill 2>/dev/null || true
lsof -ti :7070 | xargs kill 2>/dev/null || true
lsof -ti :8085 | xargs kill 2>/dev/null || true
lsof -ti :27017 | xargs kill 2>/dev/null || true

