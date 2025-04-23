// Initialize map with OSM tiles
const map = L.map('map').setView([51.505, -0.09], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Add geocoder control
L.Control.geocoder({
  defaultMarkGeocode: false
}).on('markgeocode', function(e) {
  const latlng = e.geocode.center;
  L.marker(latlng).addTo(map).bindPopup(e.geocode.name).openPopup();
  map.setView(latlng, 13);
}).addTo(map);

// Add custom "My Location" button
const myLocationControl = L.Control.extend({
  options: {
    position: 'topleft'
  },
  onAdd: function(map) {
    const container = L.DomUtil.create('div', 'my-location-control');
    const button = L.DomUtil.create('button', '', container);
    button.innerHTML = '📍 My Location';
    button.style.cursor = 'pointer';
    L.DomEvent.on(button, 'click', function() {
      map.locate({setView: true, maxZoom: 16});
    });
    return container;
  }
});
map.addControl(new myLocationControl());

// Handle geolocation
map.on('locationfound', function(e) {
  L.marker(e.latlng).addTo(map)
    .bindPopup('You are here').openPopup();
});

map.on('locationerror', function(e) {
  alert('Unable to find your location: ' + e.message);
});

// Simulated parking spots data
const parkingSpots = [
  { lat: 51.505, lng: -0.09, name: 'Parking Spot 1', available: 5, total: 10, price: '£5/hour' },
  { lat: 51.51, lng: -0.1, name: 'Parking Spot 2', available: 3, total: 8, price: '£4/hour' },
  { lat: 51.515, lng: -0.095, name: 'Parking Spot 3', available: 0, total: 6, price: '£6/hour' }
];

// Add parking spot markers
parkingSpots.forEach(spot => {
  const marker = L.marker([spot.lat, spot.lng], {
    icon: L.divIcon({
      className: 'parking-marker',
      html: spot.available
    })
  }).addTo(map);

  const popupContent = `
    <div class="parking-popup">
      <h3>${spot.name}</h3>
      <p>Available: ${spot.available}/${spot.total}</p>
      <p>Price: ${spot.price}</p>
      <button onclick="alert('Booking functionality coming soon!')">Book Now</button>
    </div>
  `;

  marker.bindPopup(popupContent);
}); 