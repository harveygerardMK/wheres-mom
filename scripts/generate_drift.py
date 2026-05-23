#!/usr/bin/env python3
"""Generate estimated drift GeoJSON paths for each drop in data/drops.json."""

from __future__ import annotations

import json
import math
from datetime import date, datetime
from pathlib import Path

from global_land_mask import globe

ROOT = Path(__file__).resolve().parents[1]
DROPS_FILE = ROOT / "public" / "data" / "drops.json"
PATHS_DIR = ROOT / "public" / "data" / "paths"

EARTH_RADIUS_KM = 6371.0
BEARING_CANDIDATES = [0, 45, 90, 135, 180, 225, 270, 315]


def parse_date(value: str) -> date:
    return datetime.strptime(value, "%Y-%m-%d").date()


def is_ocean(lat: float, lng: float) -> bool:
    return not globe.is_land(lat, lng)


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


def snap_to_ocean(lat: float, lng: float, preferred_bearing: float, speed_km: float) -> tuple[float, float, float]:
    """Move a point into open water, preferring the intended drift direction."""
    if is_ocean(lat, lng):
        return lat, lng, preferred_bearing

    search_distances = [speed_km * factor for factor in (0.25, 0.5, 1.0, 2.0, 4.0, 8.0, 16.0)]
    bearings = [preferred_bearing]
    bearings.extend((preferred_bearing + offset) % 360 for offset in (45, -45, 90, -90, 135, -135, 180))
    bearings.extend(float(b) for b in BEARING_CANDIDATES if b not in bearings)

    for distance in search_distances:
        for bearing in bearings:
            candidate_lat, candidate_lng = destination_point(lat, lng, bearing, distance)
            if is_ocean(candidate_lat, candidate_lng):
                return candidate_lat, candidate_lng, bearing

    return lat, lng, preferred_bearing


def advance_on_ocean(
    lat: float, lng: float, bearing: float, speed: float
) -> tuple[float, float, float]:
    """Advance one drift step, deflecting around land so Mom stays on the water."""
    lat, lng, bearing = snap_to_ocean(lat, lng, bearing, speed)

    next_lat, next_lng = destination_point(lat, lng, bearing, speed)
    if is_ocean(next_lat, next_lng):
        return next_lat, next_lng, bearing

    candidates: list[tuple[float, float, float, float]] = []
    for adjust in (45, -45, 90, -90, 135, -135, 180, 0):
        for scale in (1.0, 0.75, 0.5):
            trial_bearing = (bearing + adjust) % 360
            trial_lat, trial_lng = destination_point(lat, lng, trial_bearing, speed * scale)
            if is_ocean(trial_lat, trial_lng):
                score = abs(adjust) + (1 - scale) * 10
                candidates.append((score, trial_lat, trial_lng, trial_bearing))

    if candidates:
        _, best_lat, best_lng, best_bearing = min(candidates, key=lambda item: item[0])
        return best_lat, best_lng, best_bearing

    return snap_to_ocean(lat, lng, bearing, speed)


def describe_region(lat: float, lng: float) -> str:
    """Plain-language region labels for accessibility."""
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
    if lat > 45.0 and lng < 14.0:
        return "the Gulf of Trieste and northern Adriatic"
    if 35.0 <= lat <= 45.0 and -6.0 <= lng <= 20.0:
        return "the Mediterranean Sea"
    if 10.0 <= lat <= 28.0 and -85.0 <= lng <= -60.0:
        if lng > -68.0:
            return "the eastern Caribbean, near the Greater Antilles"
        if lat > 24.0:
            return "the northern Caribbean, toward the Bahamas"
        return "the central Caribbean"
    if 24.0 <= lat <= 36.0 and -82.0 <= lng <= -74.0:
        return "the Atlantic off the southeastern United States"
    if 24.0 <= lat <= 31.0 and -85.0 <= lng <= -79.0:
        return "the Gulf of Mexico or Florida Straits"
    if 18.0 <= lat <= 31.0 and -98.0 <= lng <= -85.0:
        return "the Gulf of Mexico"
    if 30.0 <= lat <= 42.0 and -130.0 <= lng <= -117.0:
        return "the Pacific off the California and Baja coast"
    if 10.0 <= lat <= 30.0 and -120.0 <= lng <= -90.0:
        return "the eastern tropical Pacific"
    if -5.0 <= lat <= 10.0 and 55.0 <= lng <= 80.0:
        return "the central Indian Ocean"
    if -5.0 <= lat <= 10.0 and 40.0 <= lng <= 55.0:
        return "the western Indian Ocean, off East Africa"
    if lat <= 5.0 and lng >= 70.0:
        return "the waters near the Maldives and Laccadive Sea"
    if 35.0 <= lat <= 45.0 and -80.0 <= lng <= -50.0:
        return "the North Atlantic, along the Gulf Stream"
    if 0.0 <= lat <= 40.0 and -70.0 <= lng <= -20.0:
        return "the open Atlantic Ocean"
    if lat >= 40.0 and -60.0 <= lng <= -10.0:
        return "the North Atlantic"
    if lat >= 0.0 and lng <= -120.0:
        return "the North Pacific"
    if lat < 0.0 and lng <= -100.0:
        return "the South Pacific"
    return "open ocean waters"


def build_path(drop: dict, end: date) -> dict:
    start = parse_date(drop["date"])
    if end < start:
        end = start

    meta = drop.get("driftMeta", {})
    bearing = float(meta.get("bearingDeg", 315))
    speed = float(meta.get("speedKmDay", 2.0))

    lat = float(drop["lat"])
    lng = float(drop["lng"])
    lat, lng, bearing = snap_to_ocean(lat, lng, bearing, speed)
    coordinates: list[list[float]] = [[round(lng, 5), round(lat, 5)]]

    current = start
    total_days = (end - start).days
    step = 1 if total_days <= 120 else 7

    while current <= end:
        days_to_advance = min(step, (end - current).days + 1)
        for _ in range(days_to_advance):
            lat, lng, bearing = advance_on_ocean(lat, lng, bearing, speed)
        coordinates.append([round(lng, 5), round(lat, 5)])
        current = date.fromordinal(current.toordinal() + days_to_advance)

    if not is_ocean(lat, lng):
        lat, lng, _ = snap_to_ocean(lat, lng, bearing, speed)
        coordinates[-1] = [round(lng, 5), round(lat, 5)]

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
            "onOcean": is_ocean(lat, lng),
        },
        "geometry": {
            "type": "LineString",
            "coordinates": coordinates,
        },
    }


def validate_paths(payload: dict) -> None:
    for drop in payload["drops"]:
        path_file = ROOT / "public" / "data" / drop.get("pathFile", f"paths/{drop['id']}.geojson")
        feature = json.loads(path_file.read_text(encoding="utf-8"))
        for lng, lat in feature["geometry"]["coordinates"]:
            if not is_ocean(lat, lng):
                raise RuntimeError(f"{drop['id']} path crosses land at {lat}, {lng}")


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
        ocean = "ocean" if feature["properties"]["onOcean"] else "LAND"
        print(f"Wrote {out_path.relative_to(ROOT)} -> {region} ({ocean})")

    validate_paths(payload)
    payload["site"]["lastUpdated"] = today.isoformat()
    DROPS_FILE.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Updated {DROPS_FILE.relative_to(ROOT)} lastUpdated={today.isoformat()}")


if __name__ == "__main__":
    main()
