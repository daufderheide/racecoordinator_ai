import pymongo
import random
import json
import os
import time
from bson.objectid import ObjectId

# Configuration
CONFIG_PATH = "data/server_config.json"

def get_active_db():
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, 'r') as f:
            config = json.load(f)
            return config.get("lastActiveDatabase", "RaceCoordinator_AI_DB")
    return "RaceCoordinator_AI_DB"

DATABASE_NAME = get_active_db()
print(f"Connecting to database: {DATABASE_NAME}")

client = pymongo.MongoClient("mongodb://127.0.0.1:27017")
db = client[DATABASE_NAME]

# Fetch all available drivers
drivers = list(db.drivers.find({}))
print(f"Found {len(drivers)} drivers in database.")

if not drivers:
    print("No drivers found. Please run generate_test_races.py first.")
    exit(1)

# Fetch some races to use as models
races = list(db.races.find({}))
if not races:
    print("No races found. Please run generate_test_races.py first.")
    exit(1)

def generate_history_record(index):
    race_model = random.choice(races)
    # Select random drivers for this race
    num_participants = random.randint(4, min(12, len(drivers)))
    selected_drivers = random.sample(drivers, num_participants)
    
    participants = []
    for i, driver in enumerate(selected_drivers):
        laps = random.randint(50, 200)
        total_time = laps * random.uniform(5.0, 10.0)
        best_lap = random.uniform(4.5, 6.0)
        participants.append({
            "driver": driver,
            "rank": i + 1,
            "totalLaps": laps,
            "totalTime": total_time,
            "bestLapTime": best_lap,
            "averageLapTime": total_time / laps if laps > 0 else 0,
            "rankValue": random.randint(0, 25), # Points
            "objectId": str(ObjectId())
        })
    
    # Sort by laps descending for "rank"
    participants.sort(key=lambda x: x["totalLaps"], reverse=True)
    for i, p in enumerate(participants):
        p["rank"] = i + 1

    start_time = int(time.time() * 1000) - (index * 86400000) # One race per day back in time
    
    return {
        "original_entity_id": race_model.get("entity_id", "1"),
        "model": race_model,
        "track": {
            "entity_id": "1",
            "name": "Test Track",
            "laneCount": 4
        },
        "drivers": participants,
        "heats": [],
        "accumulatedRaceTime": sum(p["totalTime"] for p in participants) / len(participants),
        "statistics": {
            "startTime": time.ctime(start_time / 1000),
            "endTime": time.ctime((start_time + 3600000) / 1000),
            "startMillis": start_time,
            "durationMillis": 3600000,
            "totalPausedTimeMillis": 0,
            "yellowFlagCount": random.randint(0, 5),
            "restartCount": 0
        }
    }

history_records = [generate_history_record(i) for i in range(10)]
result = db.race_history.insert_many(history_records)
print(f"Successfully inserted {len(result.inserted_ids)} history records.")
