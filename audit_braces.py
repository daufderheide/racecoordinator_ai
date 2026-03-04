
import re

with open('/Users/dave/dev/Slot Cars/racecoordinator/racecoordinator_ai/client/src/app/components/race-editor/race-editor.component.spec.ts', 'r') as f:
    lines = f.readlines()

depth = 0
for i, line in enumerate(lines):
    opens = line.count('{')
    closes = line.count('}')
    old_depth = depth
    depth += opens - closes
    if depth < 0:
        print(f"ERROR: Depth became negative at line {i+1}: {line.strip()}")
        break
    if 'describe' in line or 'it(' in line:
        print(f"L{i+1}: {line.strip()} (Depth: {old_depth} -> {depth})")
    elif '});' in line or '}));' in line:
        print(f"L{i+1}: {line.strip()} (Depth: {old_depth} -> {depth})")

print(f"Final depth: {depth}")
