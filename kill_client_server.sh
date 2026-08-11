lsof -ti :4200 | xargs kill 2>/dev/null || true
lsof -ti :7070 | xargs kill 2>/dev/null || true

