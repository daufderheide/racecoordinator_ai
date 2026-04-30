import pymongo
import random
import json
import os

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

client = pymongo.MongoClient("mongodb://localhost:27017")
db = client[DATABASE_NAME]

race_prefixes = ["Championship", "Grand Prix", "Sprint", "Endurance", "Classic", "Night", "Desert", "City", "Mountain", "Coastal"]
race_suffixes = ["Series", "Cup", "Trophy", "Challenge", "Open", "Invitational", "Showdown", "Derby", "Classic", "Masters"]

def generate_random_race_name():
    return f"{random.choice(race_prefixes)} {random.choice(race_suffixes)} {random.randint(1, 100)}"

# Fetch all available drivers
all_drivers = list(db.drivers.find({}, {"entity_id": 1}))
all_driver_ids = [d["entity_id"] for d in all_drivers]
print(f"Found {len(all_driver_ids)} drivers in database.")

def create_race(name, entity_id, rotation="RoundRobin", method="Timed", value=60, allow="None", driver_ids=None):
    return {
        "name": name,
        "track_entity_id": "1",
        "heat_rotation_type": rotation,
        "heat_scoring": {
            "allow_finish": allow,
            "finish_method": method,
            "finish_value": value,
            "heat_ranking": "LAP_COUNT",
            "heat_ranking_tiebreaker": "AVERAGE_LAP_TIME"
        },
        "overall_scoring": {
            "dropped_heats": 0,
            "ranking_method": "LAP_COUNT",
            "tiebreaker": "AVERAGE_LAP_TIME"
        },
        "min_lap_time": 3.0,
        "fuel_options": {
            "capacity": 100.0,
            "enabled": False,
            "end_heat_on_out_of_fuel": False,
            "pit_stop_delay": 2.0,
            "reference_time": 6.0,
            "refuel_rate": 10.0,
            "reset_fuel_at_heat_start": False,
            "start_level": 100.0,
            "usage_rate": 4.0,
            "usage_type": "LINEAR"
        },
        "digital_fuel_options": {
            "capacity": 100.0,
            "enabled": False,
            "end_heat_on_out_of_fuel": False,
            "pit_stop_delay": 2.0,
            "refuel_rate": 10.0,
            "reset_fuel_at_heat_start": False,
            "start_level": 100.0,
            "usage_rate": 4.0,
            "usage_type": "LINEAR"
        },
        "team_options": {
            "heat_lap_limit": 0,
            "heat_time_limit": 0.0,
            "overall_lap_limit": 0,
            "overall_time_limit": 0.0,
            "require_pit_stop_change_driver": False
        },
        "auto_advance_time": 0.0,
        "auto_start_time": 0.0,
        "auto_advance_warmup_time": 0.0,
        "auto_start_warmup_time": 0.0,
        "drift_time": 0.5,
        "start_time": 5.0,
        "restartTime": 5.0,
        "start_delay": 0.0,
        "restart_delay": 0.0,
        "solo_lane_index": 0,
        "entity_id": str(entity_id),
        "objectId": str(entity_id),
        "driver_ids": driver_ids or []
    }

def get_random_drivers(count=None):
    if not all_driver_ids:
        return []
    if count is None:
        count = random.randint(4, min(12, len(all_driver_ids)))
    return random.sample(all_driver_ids, min(count, len(all_driver_ids)))

# Start with defaults
races_to_create = [
    create_race("Time Based", 1, "RoundRobin", "Timed", 60, "None", get_random_drivers()),
    create_race("Lap Based", 2, "RoundRobin", "Lap", 10, "None", get_random_drivers())
]

next_id = 3
for i in range(30):
    name = generate_random_race_name()
    rotation = random.choice(["RoundRobin", "FriendlyRoundRobin", "EuropeanRoundRobin", "SingleHeat"])
    method = random.choice(["Lap", "Timed"])
    allow = random.choice(["None", "Allow", "SingleLap"])
    races_to_create.append(create_race(name, next_id, rotation, method, random.randint(10, 100), allow, get_random_drivers()))
    next_id += 1

result = db.races.insert_many(races_to_create)
print(f"Successfully inserted {len(result.inserted_ids)} races (2 defaults + 30 random).")
