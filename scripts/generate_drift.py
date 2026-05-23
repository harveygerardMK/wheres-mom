#!/usr/bin/env python3
"""Generate estimated drift GeoJSON paths for each drop in data/drops.json."""

from __future__ import annotations

import json
import math
from datetime import date, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DROPS_FILE = ROOT / "public" / "data" / "drops.json"
PATHS_DIR = ROOT / "public" / "data" / "paths"

EARTH_RADIUS_KM = 6371.0


def parse_date(value: str) -> date:
    return datetime.strptime(value, "%Y-%m-%d").date()


def destination_point(lat: float, lng: float, bearing_deg: float, distance_km: float) -> tuple[float, float]:
    """Return new lat/lng after moving along a great-circle bearing."""
    bearing = math.radians(bearing_deg)
    lat1 = math.radians(lat)
    lng1 = math.radians(lng)
    angular = distance_km / EARTH_RADIUS_KM

    lat2 = math.asin(
        math.sin(lat1) * math.cos(angular)
        + math.cos(lat1) * math.sin(angular) * math.cos(bearing)
    )
    lng2 = lng1 + math.atan2(
        math.sin(bearing) * math.sin(angular) * math.cos(lat1),
        math.cos(angular) - math.sin(lat1) * math.sin(lat2),
    )

    return math.degrees(lat2), math.degrees(lng2)


def describe_region(lat: float, lng: float) -> str:
    """Plain-language Adriatic/Mediterranean region labels for accessibility."""
    if 44.0 <= lat <= 45.8 and 13.0 <= lng <= 16.5:
        return "the northern Adriatic, along the Istrian and Dalmatian coast"
    if 43.5 <= lat <= 44.2 and 15.0 <= lng <= 17.0:
        return "northwest of Split, along the Dalmatian coast"
    if 43.0 <= lat <= 44.0 and 15.5 <= lng <= 17.5:
        if lng > 16.5:
            return "the central Adriatic, east of the Croatian islands"
        return "the waters near Blue Lagoon and Drvenik Veli"
    if 42.0 <= lat <= 43.5 and 14.0 <= lng <= 19.0:
        return "the southern Adriatic"
    if 40.0 <= lat <= 42.5 and 12.0 <= lng <= 16.0:
        return "the Tyrrhenian Sea off western Italy"
    if 39.0 <= lat <= 42.0 and 16.0 <= lng <= 20.0:
        return "the Ionian Sea"
    if lat > 45.0 and lng < 14.0:
        return "the Gulf of Trieste and northern Adriatic"
    if lat > 45.0:
        return "northern Adriatic waters"
    if lat < 39.0 and lng < 10.0:
        return "the western Mediterranean"
    return "open Mediterranean waters"


def build_path(drop: dict, end: date) -> dict:
    start = parse_date(drop["date"])
    if end < start:
        end = start

    meta = drop.get("driftMeta", {})
    bearing = float(meta.get("bearingDeg", 315))
    speed = float(meta.get("speedKmDay", 2.0))

    lat = float(drop["lat"])
    lng = float(drop["lng"])
    coordinates: list[list[float]] = [[lng, lat]]

    current = start
    while current <= end:
        lat, lng = destination_point(lat, lng, bearing, speed)
        coordinates.append([round(lng, 5), round(lat, 5)])
        current = date.fromordinal(current.toordinal() + 1)

    region = describe_region(lat, lng)
    days = (end - start).days

    return {
        "type": "Feature",
        "properties": {
            "dropId": drop["id"],
            "label": drop["label"],
            "startDate": drop["date"],
            "endDate": end.isoformat(),
            "daysElapsed": days,
            "estimatedRegion": region,
            "currentName": meta.get("currentName", "Surface current"),
            "direction": meta.get("direction", "NW"),
            "speedKmDay": speed,
            "lastLat": round(lat, 4),
            "lastLng": round(lng, 4),
        },
        "geometry": {
            "type": "LineString",
            "coordinates": coordinates,
        },
    }


def main() -> None:
    PATHS_DIR.mkdir(parents=True, exist_ok=True)
    payload = json.loads(DROPS_FILE.read_text(encoding="utf-8"))
    today = date.today()

    for drop in payload["drops"]:
        feature = build_path(drop, today)
        path_file = drop.get("pathFile", f"paths/{drop['id']}.geojson")
        out_path = ROOT / "public" / "data" / path_file
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(feature, indent=2) + "\n", encoding="utf-8")
        region = feature["properties"]["estimatedRegion"]
        print(f"Wrote {out_path.relative_to(ROOT)} -> {region}")

    payload["site"]["lastUpdated"] = today.isoformat()
    DROPS_FILE.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Updated {DROPS_FILE.relative_to(ROOT)} lastUpdated={today.isoformat()}")


if __name__ == "__main__":
    main()
