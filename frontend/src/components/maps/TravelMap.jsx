import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default marker icons when used with Vite/React.
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function TravelMap({
  latitude,
  longitude,
  zoom = 13,
  name = "Location",
  height = "400px",
}) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  // Don't render Leaflet if coordinates are missing/invalid.
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return (
      <div
        style={{
          height,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "8px",
          background: "#f3f4f6",
          color: "#6b7280",
        }}
      >
        Location is not available
      </div>
    );
  }

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={zoom}
      scrollWheelZoom={true}
      style={{
        height,
        width: "100%",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={[lat, lng]}>
        <Popup>
          <strong>{name}</strong>
          <br />
          {lat.toFixed(6)}, {lng.toFixed(6)}
        </Popup>
      </Marker>
    </MapContainer>
  );
}