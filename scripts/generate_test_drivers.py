import pymongo
import random
from bson.objectid import ObjectId

def generate_drivers():
    client = pymongo.MongoClient("mongodb://localhost:27017")
    import json
    import os
    
    config_path = os.path.join("data", "server_config.json")
    db_name = "RaceCoordinator_AI_DB" # Default
    if os.path.exists(config_path):
        with open(config_path, "r") as f:
            config = json.load(f)
            db_name = config.get("lastActiveDatabase", db_name)
    
    print(f"Connecting to database: {db_name}")
    db = client[db_name]
    drivers_col = db["drivers"]
    counters_col = db["counters"]

    # Lists of names
    male_names = [
        "James", "Robert", "John", "Michael", "David", "William", "Richard", "Joseph", "Thomas", "Christopher",
        "Charles", "Daniel", "Matthew", "Anthony", "Mark", "Donald", "Steven", "Paul", "Andrew", "Joshua",
        "Kenneth", "Kevin", "Brian", "George", "Timothy", "Ronald", "Edward", "Jason", "Jeffrey", "Ryan"
    ]
    
    female_names = [
        "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen",
        "Lisa", "Nancy", "Betty", "Margaret", "Sandra", "Ashley", "Kimberly", "Emily", "Donna", "Michelle",
        "Carol", "Amanda", "Dorothy", "Melissa", "Deborah", "Stephanie", "Rebecca", "Sharon", "Laura", "Cynthia"
    ]

    nicknames = [
        "The Flash", "Speed Demon", "Turbo", "Nitro", "Rocket", "Burnout", "Skidmark", "Lead Foot", "Gearhead", "Piston",
        "Crankshaft", "Sparky", "Bolt", "Lightning", "Thunder", "Storm", "Cyclone", "Vortex", "Phantom", "Ghost",
        "Shadow", "Reaper", "Slayer", "Crusher", "Mauler", "Bruiser", "Tank", "Dozer", "Beast", "Monster"
    ]

    young_names = ["Bobby", "Timmy", "Billy", "Susie", "Annie", "Joey", "Danny", "Katie", "Lilly", "Maddy"]
    young_nicknames = [
        "Kid Speed", "Tiny Turbo", "Little Lightning", "Junior", "Rookie", "Prodigy", "Young Gun", "Sonic", "Dash", "Zoom"
    ]

    # Helmet assets
    helmets = [
        "091eca1f-7966-4c17-a51a-5f4c6e23c9ba_Helmet_White-Blue",
        "09d3fd54-0c03-4653-ac58-a47d4a338c40_Helmet_Silver-Red",
        "0cc75988-79b9-4746-a0e5-d3988f55bda3_Helmet_Futuristic_1",
        "2041e138-e09b-4629-bee7-fa4452145bb9_Helmet_Black-White",
        "246be482-4cd2-42c4-b08e-091519a118b4_Helmet_Grey-Red-White",
        "43c84d29-f2c0-4549-b327-e195452a0449_Helmet_Silver-Green",
        "4d00718c-d030-46d5-b7ce-4b818e79123c_Helmet_Black",
        "6487853f-8083-4de5-bde7-55a476869971_Helmet_Black-Grey",
        "7491ff16-2472-4496-866e-6ddeabafe2f0_Helmet_Red-Gold-Blue",
        "79bad58e-99ca-4696-99ac-4092cf784861_Helmet_White-Blue-Yellow",
        "8f865245-0cdd-4813-8056-ed5127b6fc30_Helmet_Grey-Black-Gold",
        "960956ce-450e-45b1-9cda-91487f8792c2_Helmet_Green-White",
        "964af31b-7fd6-41ee-9340-52b642d14fae_Helmet_Red-Yellow",
        "969c76f0-ede9-4bee-aa23-4ed4d8f08c6f_Helmet_Black-White2",
        "b5f0b32e-ab8e-47a6-908b-4cc8206183f9_Helmet_Futuristic_2",
        "e16e6f79-2caa-4e73-8245-30e0df3a4a10_Helmet_White-Red-Yellow",
        "ecb467b9-4c57-451e-9ab3-8b770a7faddb_Helmet_Orange-Blue",
        "f9c7a2b6-a4d9-45ef-909b-a4ba634a6227_Helmet_Red-Orange"
    ]

    new_drivers = []
    
    # Get starting sequence
    counter = counters_col.find_one_and_update(
        {"_id": "drivers"},
        {"$inc": {"seq": 30}},
        upsert=True,
        return_document=pymongo.ReturnDocument.AFTER
    )
    start_seq = counter["seq"] - 30 + 1

    for i in range(30):
        is_young = (i < 6) # 20% young
        is_female = (i >= 6 and i < 18) or (i < 3 and is_young) # Half female roughly
        # Let's be more precise
        if i < 15:
            is_female = True
        else:
            is_female = False
            
        if is_young:
            name = random.choice(young_names)
            nickname = random.choice(young_nicknames)
        else:
            if is_female:
                name = random.choice(female_names)
            else:
                name = random.choice(male_names)
            nickname = random.choice(nicknames)
            
        # Ensure name uniqueness within this batch
        name = f"{name} {start_seq + i}"
        
        avatar_url = f"/assets/{random.choice(helmets)}"
        
        driver = {
            "name": name,
            "nickname": nickname,
            "avatarUrl": avatar_url,
            "lapAudio": {"type": "preset", "url": "/assets/d7dd8e24-c3f5-4abb-84d4-83f40fc7fe97_Lap_Beep"},
            "bestLapAudio": {"type": "preset", "url": "/assets/cb4c3a1c-45b8-461c-8ca4-d32d4fb572fb_Lap_Driveby"},
            "entity_id": str(start_seq + i)
        }
        new_drivers.append(driver)

    drivers_col.insert_many(new_drivers)
    print(f"Successfully inserted 30 drivers starting from sequence {start_seq}.")

if __name__ == "__main__":
    try:
        generate_drivers()
    except Exception as e:
        print(f"Error: {e}")
