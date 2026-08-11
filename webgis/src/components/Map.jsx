import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Dummy data for Tuban Posyandu locations
const posyanduData = [
  { id: 1, name: 'Posyandu Mawar', position: [-6.8953, 112.0645], hotspot: true },
  { id: 2, name: 'Posyandu Melati', position: [-6.9012, 112.0511], hotspot: false },
  { id: 3, name: 'Posyandu Flamboyan', position: [-6.8877, 112.0422], hotspot: true }
];

export default function Map() {
  return (
    <div style={{ height: '500px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ccc' }}>
      <MapContainer center={[-6.8953, 112.0645]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {posyanduData.map(posyandu => (
          <React.Fragment key={posyandu.id}>
            <Marker position={posyandu.position}>
              <Popup>
                <strong>{posyandu.name}</strong><br/>
                {posyandu.hotspot ? 'Stunting Hotspot (Alert)' : 'Status: Normal'}
              </Popup>
            </Marker>
            
            {/* Draw 2KM buffer zone for hotspot analysis as specified in arsitektur_web_dashboard_gis_genting.md */}
            {posyandu.hotspot && (
              <Circle 
                center={posyandu.position} 
                radius={2000} 
                pathOptions={{ color: 'red', fillColor: '#ff0000', fillOpacity: 0.2 }}
              />
            )}
          </React.Fragment>
        ))}
      </MapContainer>
    </div>
  );
}
