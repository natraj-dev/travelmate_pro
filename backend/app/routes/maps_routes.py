"""
Location and map services for TravelMate Pro.

Uses open-source / free-to-use map services:

- OpenStreetMap + Nominatim -> geocoding
- OSRM -> routing and distance calculation
- Overpass API -> nearby attractions / places
"""

from typing import Any

import httpx
from fastapi import APIRouter, Query
from app.config import settings
from app.utils.exceptions import bad_request


router = APIRouter(
    prefix="/maps",
    tags=["OpenStreetMap & Location"],
)


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------


def _headers() -> dict[str, str]:
    """
    HTTP headers required when communicating with public map services.
    """
    return {
        "User-Agent": settings.MAP_USER_AGENT,
        "Accept": "application/json",
    }


async def _geocode_location(location: str) -> dict[str, Any]:
    """
    Convert a human-readable location into latitude/longitude
    using OpenStreetMap Nominatim.
    """

    if not location or not location.strip():
        raise bad_request("Location cannot be empty")

    params = {
        "q": location.strip(),
        "format": "json",
        "limit": 1,
    }

    async with httpx.AsyncClient(
        timeout=10,
        headers=_headers(),
    ) as client:
        response = await client.get(
            f"{settings.NOMINATIM_BASE_URL}/search",
            params=params,
        )

    if response.status_code != 200:
        raise bad_request("Unable to geocode the requested location")

    results = response.json()

    if not results:
        raise bad_request(
            f"Location could not be found: {location}"
        )

    result = results[0]

    return {
        "latitude": float(result["lat"]),
        "longitude": float(result["lon"]),
        "display_name": result.get("display_name", location),
        "place_id": result.get("place_id"),
        "type": result.get("type"),
        "class": result.get("class"),
    }


# ------------------------------------------------------------------
# Configuration
# ------------------------------------------------------------------


@router.get("/config")
def get_maps_config():
    """
    Returns the map provider configuration.

    Unlike Google Maps, OpenStreetMap does not require a browser API
    key for displaying the standard map tiles.
    """

    return {
        "provider": "OpenStreetMap",
        "tile_provider": "OpenStreetMap",
        "geocoding_provider": "Nominatim",
        "routing_provider": "OSRM",
        "nearby_provider": "Overpass",
        "requires_api_key": False,
    }


# ------------------------------------------------------------------
# Geocoding
# ------------------------------------------------------------------


@router.get("/geocode")
async def geocode(
    address: str = Query(
        ...,
        min_length=2,
        description="Address, city, landmark, or destination name",
    ),
):
    """
    Convert an address or place name into latitude/longitude.

    Example:

        GET /api/maps/geocode?address=Coimbatore
    """

    return await _geocode_location(address)


# ------------------------------------------------------------------
# Distance
# ------------------------------------------------------------------


@router.get("/distance")
async def distance(
    origin: str = Query(
        ...,
        min_length=2,
        description="Starting location",
    ),
    destination: str = Query(
        ...,
        min_length=2,
        description="Destination location",
    ),
    mode: str = Query(
        "driving",
        description="Routing mode",
    ),
):
    """
    Calculate distance and travel duration between two locations.

    The locations can be normal place names or addresses.

    Example:

        GET /api/maps/distance?origin=Trichy&destination=Madurai
    """

    supported_modes = {
        "driving": "driving",
        "car": "driving",
        "walking": "foot",
        "foot": "foot",
        "cycling": "bike",
        "bike": "bike",
    }

    profile = supported_modes.get(mode.lower())

    if not profile:
        raise bad_request(
            "Invalid mode. Supported modes: driving, walking, cycling"
        )

    origin_data = await _geocode_location(origin)
    destination_data = await _geocode_location(destination)

    coordinates = (
        f"{origin_data['longitude']},{origin_data['latitude']};"
        f"{destination_data['longitude']},{destination_data['latitude']}"
    )

    params = {
        "overview": "false",
        "steps": "false",
    }

    async with httpx.AsyncClient(
        timeout=15,
        headers=_headers(),
    ) as client:
        response = await client.get(
            f"{settings.OSRM_BASE_URL}/route/v1/{profile}/{coordinates}",
            params=params,
        )

    if response.status_code != 200:
        raise bad_request(
            "Unable to calculate the route"
        )

    data = response.json()

    if data.get("code") != "Ok":
        raise bad_request(
            "No route could be found between the selected locations"
        )

    route = data["routes"][0]

    return {
        "origin": {
            "name": origin_data["display_name"],
            "latitude": origin_data["latitude"],
            "longitude": origin_data["longitude"],
        },
        "destination": {
            "name": destination_data["display_name"],
            "latitude": destination_data["latitude"],
            "longitude": destination_data["longitude"],
        },
        "mode": mode,
        "distance_meters": route["distance"],
        "distance_km": round(route["distance"] / 1000, 2),
        "duration_seconds": route["duration"],
        "duration_minutes": round(route["duration"] / 60, 1),
    }


# ------------------------------------------------------------------
# Route
# ------------------------------------------------------------------


@router.get("/route")
async def route(
    origin_latitude: float,
    origin_longitude: float,
    destination_latitude: float,
    destination_longitude: float,
    mode: str = "driving",
):
    """
    Calculate a route using coordinates.

    This endpoint is useful when the frontend already has
    destination latitude/longitude.

    Example:

        GET /api/maps/route?
            origin_latitude=10.7905&
            origin_longitude=78.7047&
            destination_latitude=9.9252&
            destination_longitude=78.1198
    """

    supported_modes = {
        "driving": "driving",
        "car": "driving",
        "walking": "foot",
        "foot": "foot",
        "cycling": "bike",
        "bike": "bike",
    }

    profile = supported_modes.get(mode.lower())

    if not profile:
        raise bad_request(
            "Invalid mode. Supported modes: driving, walking, cycling"
        )

    coordinates = (
        f"{origin_longitude},{origin_latitude};"
        f"{destination_longitude},{destination_latitude}"
    )

    params = {
        "overview": "full",
        "geometries": "geojson",
        "steps": "false",
    }

    async with httpx.AsyncClient(
        timeout=15,
        headers=_headers(),
    ) as client:
        response = await client.get(
            f"{settings.OSRM_BASE_URL}/route/v1/{profile}/{coordinates}",
            params=params,
        )

    if response.status_code != 200:
        raise bad_request(
            "Unable to calculate the route"
        )

    data = response.json()

    if data.get("code") != "Ok":
        raise bad_request(
            "No route could be found"
        )

    route_data = data["routes"][0]

    return {
        "mode": mode,
        "distance_meters": route_data["distance"],
        "distance_km": round(
            route_data["distance"] / 1000,
            2,
        ),
        "duration_seconds": route_data["duration"],
        "duration_minutes": round(
            route_data["duration"] / 60,
            1,
        ),
        "geometry": route_data.get("geometry"),
    }


# ------------------------------------------------------------------
# Nearby attractions
# ------------------------------------------------------------------


@router.get("/nearby")
async def nearby_attractions(
    latitude: float,
    longitude: float,
    radius_meters: int = Query(
        3000,
        ge=100,
        le=10000,
    ),
    type: str = "tourist_attraction",
):
    """
    Find nearby attractions and places using the Overpass API.

    No Google Places API is required.

    Example:

        GET /api/maps/nearby?
            latitude=10.7905&
            longitude=78.7047
    """

    allowed_types = {
        "tourist_attraction": (
            '["tourism"="attraction"]'
        ),
        "museum": (
            '["tourism"="museum"]'
        ),
        "hotel": (
            '["tourism"="hotel"]'
        ),
        "restaurant": (
            '["amenity"="restaurant"]'
        ),
        "cafe": (
            '["amenity"="cafe"]'
        ),
        "park": (
            '["leisure"="park"]'
        ),
        "place_of_worship": (
            '["amenity"="place_of_worship"]'
        ),
    }

    osm_filter = allowed_types.get(type)

    if not osm_filter:
        raise bad_request(
            "Unsupported place type"
        )

    query = f"""
    [out:json][timeout:10];

    (
      node{osm_filter}(
        around:{radius_meters},
        {latitude},
        {longitude}
      );

      way{osm_filter}(
        around:{radius_meters},
        {latitude},
        {longitude}
      );

      relation{osm_filter}(
        around:{radius_meters},
        {latitude},
        {longitude}
      );
    );

    out center tags;
    """

    async with httpx.AsyncClient(
        timeout=20,
        headers=_headers(),
    ) as client:
        response = await client.post(
            settings.OVERPASS_BASE_URL,
            data=query,
        )

    if response.status_code != 200:
        raise bad_request(
            "Unable to retrieve nearby places"
        )

    data = response.json()

    places = []

    for element in data.get("elements", []):
        tags = element.get("tags", {})

        element_latitude = element.get("lat")
        element_longitude = element.get("lon")

        # Ways/relations normally return their coordinates
        # under "center".
        if element_latitude is None:
            center = element.get("center", {})
            element_latitude = center.get("lat")
            element_longitude = center.get("lon")

        if element_latitude is None or element_longitude is None:
            continue

        places.append(
            {
                "id": element.get("id"),
                "name": tags.get(
                    "name",
                    "Unnamed place",
                ),
                "latitude": element_latitude,
                "longitude": element_longitude,
                "type": type,
                "address": tags.get("addr:street"),
                "city": tags.get("addr:city"),
                "phone": tags.get("phone"),
                "website": tags.get("website"),
            }
        )

    return {
        "latitude": latitude,
        "longitude": longitude,
        "radius_meters": radius_meters,
        "type": type,
        "count": len(places),
        "places": places,
    }
