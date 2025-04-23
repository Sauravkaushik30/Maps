let map, userLocation, routingControl;
let currentBookingSpot = null; // Stores marker data for booking
let addingListing = false; // For owner listing mode
let listingModal, bookingModal;

// Dummy arrays to simulate data storage (replace with backend APIs)
const bookings = []; // For user bookings
const listings = []; // For owner parking listings

// Initialize common Bootstrap modals and attach event handlers on DOMContentLoaded.
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById('listingModal')) {
    listingModal = new bootstrap.Modal(document.getElementById('listingModal'));
    document.getElementById("listingForm").addEventListener("submit", function(e) {
      e.preventDefault();
      addListing();
    });
  }
  if (document.getElementById('bookingModal')) {
    bookingModal = new bootstrap.Modal(document.getElementById('bookingModal'));
    document.getElementById("bookingForm").addEventListener("submit", function(e) {
      e.preventDefault();
      confirmBooking();
    });
  }

  // If on login page, attach login handler.
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function(e) {
      e.preventDefault();
      performLogin();
    });
  }
});

// ---------------- LOGIN LOGIC ---------------- //
// ---------------- LOGIN LOGIC ---------------- //
function performLogin() {
    const loginId = document.getElementById("loginId").value.trim();
    const loginPassword = document.getElementById("loginPassword").value.trim();
    const role = document.querySelector('input[name="role"]:checked').value;  
    const errorDiv = document.getElementById("loginError");
  
    // For Owner: Hardcoded credentials admin/admin are required.
    if (role === "owner") {
      if (loginId === "admin" && loginPassword === "admin") {
        errorDiv.classList.add("d-none");
        // Redirect to owner dashboard.
        window.location.href = "owner.html";
      } else {
        errorDiv.classList.remove("d-none");
      }
    }
    // For User: Any non-empty credentials are accepted.
    else if (role === "user") {
      if (loginId && loginPassword) {
        errorDiv.classList.add("d-none");
        // Redirect to user dashboard.
        window.location.href = "user.html";
      } else {
        errorDiv.classList.remove("d-none");
      }
    }
  }
  
  // Attach login form handler on DOMContentLoaded.
  document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", function (e) {
        e.preventDefault();
        performLogin();
      });
    }
  });
  
// ---------------- MAP INITIALIZATION ---------------- //
function initMap() {
  map = L.map('map').setView([0, 0], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Add geocoder control.
  L.Control.geocoder({
    defaultMarkGeocode: false
  })
  .on('markgeocode', function(e) {
    const center = e.geocode.center;
    map.setView(center, 15);
    L.marker(center).addTo(map)
      .bindPopup(e.geocode.name)
      .openPopup();
  })
  .addTo(map);

  // Add custom "My Location" control.
  const myLocationControl = L.control({ position: 'topleft' });
  myLocationControl.onAdd = function(map) {
    const div = L.DomUtil.create('div', 'my-location-control btn btn-outline-primary');
    div.innerHTML = 'My Location';
    div.onclick = goToMyLocation;
    return div;
  };
  myLocationControl.addTo(map);

  // Obtain user location.
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      userLocation = [position.coords.latitude, position.coords.longitude];
      map.setView(userLocation, 15);
      L.marker(userLocation, {
        title: "Your Location",
        icon: L.icon({
          iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          iconSize: [32, 32]
        })
      }).addTo(map);
      searchParkingSpots(userLocation);
    }, () => {
      alert("Geolocation failed.");
    });
  } else {
    alert("Your browser doesn't support geolocation.");
  }

  // Map click listener: if owner and in listing mode, open listing modal.
  map.on('click', function(e) {
    if (addingListing && window.userRole === 'owner') {
      openListingModal(e.latlng);
    }
  });
}

function goToMyLocation() {
  if (userLocation) {
    map.setView(userLocation, 15);
  } else {
    alert("User location not available.");
  }
}

// ---------------- PARKING SPOT SEARCH ---------------- //
function searchParkingSpots(center) {
  // For demonstration, create 5 dummy parking spots.
  for (let i = 0; i < 5; i++) {
    const randomLat = center[0] + (Math.random() - 0.5) * 0.02;
    const randomLng = center[1] + (Math.random() - 0.5) * 0.02;
    const markerPos = [randomLat, randomLng];
    const isAvailable = Math.random() > 0.5;
    const status = isAvailable ? "Available" : "Occupied";

    const marker = L.marker(markerPos, { title: "Parking Spot" }).addTo(map);
    marker.bindPopup(`
      <div>
        <strong>Parking Spot ${i+1}</strong><br>
        Status: ${status}<br>
        Total Spaces: ${Math.floor(Math.random()*50)+10}<br>
        Available: ${Math.floor(Math.random()*10)+1}<br>
        Type: Car<br>
        Price: ₹${(Math.random()*100+50).toFixed(2)}<br>
        <button class="btn btn-sm btn-outline-primary mt-2" onclick="getDirections(${randomLat}, ${randomLng})">Get Directions</button>
        <button class="btn btn-sm btn-outline-success mt-2" onclick="initBooking(${randomLat}, ${randomLng}, ${i+1})">Book Now</button>
        <button class="btn btn-sm btn-outline-secondary mt-2" onclick="showDetails(${i+1})">Show Details</button>
      </div>
    `);
  }
}

// ---------------- DIRECTIONS ---------------- //
function getDirections(destLat, destLng) {
  if (!userLocation) {
    alert("User location not determined.");
    return;
  }
  if (routingControl) {
    map.removeControl(routingControl);
  }
  routingControl = L.Routing.control({
    waypoints: [
      L.latLng(userLocation[0], userLocation[1]),
      L.latLng(destLat, destLng)
    ],
    routeWhileDragging: false,
    showAlternatives: false,
    lineOptions: {
      styles: [{ color: 'blue', opacity: 0.6, weight: 4 }]
    },
    createMarker: function(i, waypoint) {
      return L.marker(waypoint.latLng);
    }
  }).addTo(map);

  routingControl.on('routesfound', function(e) {
    const route = e.routes[0].summary;
    document.getElementById('panel').innerHTML = `
      <strong>Route Summary:</strong><br>
      Distance: ${(route.totalDistance / 1000).toFixed(2)} km<br>
      Duration: ${Math.floor(route.totalTime / 60)} minutes
    `;
  });
}

// ---------------- BOOKING SYSTEM ---------------- //
function initBooking(lat, lng, spotId) {
  currentBookingSpot = { lat, lng, spotId };
  document.getElementById("bookingDetails").innerHTML = `
    <strong>Parking Spot ${spotId}</strong><br>
    Location: (${lat.toFixed(6)}, ${lng.toFixed(6)})<br>
    Price: ₹${(Math.random()*100+50).toFixed(2)}
  `;
  bookingModal.show();
}

function confirmBooking() {
  const bookingTime = document.getElementById("bookingTime").value;
  const bookingDuration = document.getElementById("bookingDuration").value;
  if (!bookingTime || !bookingDuration) {
    alert("Please fill all booking details.");
    return;
  }
  const booking = {
    spot: currentBookingSpot,
    time: bookingTime,
    duration: bookingDuration
  };
  bookings.push(booking);
  bookingModal.hide();
  alert("Booking confirmed!");
}

function cancelBooking() {
  bookingModal.hide();
  currentBookingSpot = null;
}

// ---------------- OWNER LISTING SYSTEM ---------------- //
function startListing() {
  addingListing = true;
  alert("Click on the map to select a location for your parking space.");
}

function openListingModal(latlng) {
  document.getElementById("listingLat").value = latlng.lat.toFixed(6);
  document.getElementById("listingLng").value = latlng.lng.toFixed(6);
  listingModal.show();
  addingListing = false;
}

function addListing() {
  const name = document.getElementById("listingName").value;
  const lat = parseFloat(document.getElementById("listingLat").value);
  const lng = parseFloat(document.getElementById("listingLng").value);
  const capacity = document.getElementById("listingCapacity").value;
  const available = document.getElementById("listingAvailable").value;
  const type = document.getElementById("listingType").value;
  const price = document.getElementById("listingPrice").value;
  const desc = document.getElementById("listingDesc").value;

  const listing = { name, lat, lng, capacity, available, type, price, desc };
  listings.push(listing);

  // Add marker for new listing.
  const marker = L.marker([lat, lng], { title: name }).addTo(map);
  marker.bindPopup(`
    <div>
      <strong>${name}</strong><br>
      Capacity: ${capacity}<br>
      Available: ${available}<br>
      Type: ${type}<br>
      Price: ₹${price}<br>
      ${desc ? "<em>" + desc + "</em><br>" : ""}
      <button class="btn btn-sm btn-outline-primary mt-2" onclick="getDirections(${lat}, ${lng})">Get Directions</button>
    </div>
  `);

  listingModal.hide();
  document.getElementById("listingForm").reset();
}

function cancelListing() {
  listingModal.hide();
  addingListing = false;
}
