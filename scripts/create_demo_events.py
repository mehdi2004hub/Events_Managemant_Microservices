import requests
import datetime
import uuid

# Configuration
API_URL = "http://localhost:8090/api/events/"
# We simulate a token for an ORGANIZER to bypass the auth temporarily, or we just insert it into the SQLite DB directly.
# Since we have the SQLite DB for event-service accessible locally via the volume, we can just edit the DB directly!
import sqlite3
import os

DB_PATH = "mnt/user-data/outputs/billetix-django-v2/services/event-service/db.sqlite3"

def create_demo_events():
    if not os.path.exists(DB_PATH):
        print(f"DB not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Dates
    today = datetime.datetime.now()
    
    # Next Wednesday
    days_until_wed = (2 - today.weekday()) % 7
    if days_until_wed == 0: days_until_wed = 7
    next_wed = today + datetime.timedelta(days=days_until_wed)
    
    # Next Saturday
    days_until_sat = (5 - today.weekday()) % 7
    if days_until_sat == 0: days_until_sat = 7
    next_sat = today + datetime.timedelta(days=days_until_sat)

    # Some mock Organizer UUID
    organizer_id = str(uuid.uuid4()).replace("-", "")

    events = [
        (str(uuid.uuid4()).replace("-", ""), "Live Event: Dj Snake", "Concert exceptionnel aujourd'hui !", today.strftime("%Y-%m-%d %H:%M:%S"), "Alger", 50, 50, 4500, "Musique", "PUBLISHED", organizer_id, today.strftime("%Y-%m-%d %H:%M:%S"), today.strftime("%Y-%m-%d %H:%M:%S")),
        (str(uuid.uuid4()).replace("-", ""), "Conférence Tech AI", "L'avenir de l'intelligence artificielle.", next_wed.strftime("%Y-%m-%d %H:%M:%S"), "Oran", 200, 200, 1500, "Conférence", "PUBLISHED", organizer_id, next_wed.strftime("%Y-%m-%d %H:%M:%S"), next_wed.strftime("%Y-%m-%d %H:%M:%S")),
        (str(uuid.uuid4()).replace("-", ""), "Tournoi E-Sport", "Compétition nationale de jeux vidéo.", next_sat.strftime("%Y-%m-%d %H:%M:%S"), "Constantine", 100, 100, 2000, "Sport", "PUBLISHED", organizer_id, next_sat.strftime("%Y-%m-%d %H:%M:%S"), next_sat.strftime("%Y-%m-%d %H:%M:%S"))
    ]

    cursor.executemany("""
        INSERT INTO events_event (id, title, description, date, location, capacity, available_seats, price, category, status, organizer_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, events)

    conn.commit()
    conn.close()
    print("3 Demo events created successfully!")

if __name__ == "__main__":
    create_demo_events()
