const geoApiKey = "9c734600c6ce4c169878f6e425dbef9c";
const tripApiKey = "5ae2e3f221c38a28845f05b62a73435c0acc85274f33c2b41d087383";


async function searchCity(input) {
  const placesDiv = document.getElementById("places");
  const detailsBox = document.getElementById("placeDetails");
  detailsBox.style.display = "none";
  placesDiv.innerHTML = ` Searching for "${input}"...`;

  try {
    const geoUrl = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(input)}&apiKey=${geoApiKey}`;
    const geoRes = await fetch(geoUrl);
    if (!geoRes.ok) throw `Geoapify API error (HTTP ${geoRes.status})`;

    const geoData = await geoRes.json();
    if (!geoData.features.length) throw " Location not found.";

    const [lon, lat] = geoData.features[0].geometry.coordinates;
    if (!lat || !lon) throw " Invalid coordinates retrieved.";

    const kinds = "interesting_places,natural,cultural,architecture,accomodations";
    const placesUrl = `https://api.opentripmap.com/0.1/en/places/radius?radius=10000&rate=2&lon=${lon}&lat=${lat}&kinds=${kinds}&limit=50&format=json&apikey=${tripApiKey}`;
    const placesRes = await fetch(placesUrl);
    if (!placesRes.ok) throw `OpenTripMap API error (HTTP ${placesRes.status})`;

    const placesData = await placesRes.json();
    if (!Array.isArray(placesData) || placesData.length === 0) {
      placesDiv.innerHTML = " No places found near this location.";
      return;
    }

        placesDiv.innerHTML = "";
for (const place of placesData) {
  try {
    const detailRes = await fetch(`https://api.opentripmap.com/0.1/en/places/xid/${place.xid}?apikey=${tripApiKey}`);
    if (!detailRes.ok) continue;
    const details = await detailRes.json();

    
    if (!details.preview?.source) continue;

    const card = document.createElement("div");
    card.className = "card";

    const imageUrl = details.preview.source;
    const placeName = details.name || "No Name";
    const placeType = formatKind(details.kinds);

    card.innerHTML = `
      <h3>${placeName}</h3>
      <img src="${imageUrl}" alt="${placeName}" loading="lazy" style="width:100%; height:130px; object-fit:cover; border-radius:6px;" />
      <p>Type: ${placeType}</p>
      <button onclick='showDetails(${JSON.stringify(details).replace(/'/g, "&apos;")})'>View More</button>
    `;

    placesDiv.appendChild(card);
  } catch (innerErr) {
    console.warn("Error fetching place details:", innerErr);
  }
}

  } catch (err) {
    console.error("Error in searchCity:", err);
    placesDiv.innerHTML = " Error: " + err;
  }
}

function showDetails(data) {
  document.getElementById("placeDetails").style.display = "block";
  document.getElementById("detailName").textContent = data.name || "No Name";
  document.getElementById("detailImg").src = data.preview?.source || "https://via.placeholder.com/300x130?text=No+Image";
  document.getElementById("detailDesc").textContent = data.wikipedia_extracts?.text || "No description available.";
  document.getElementById("detailMap").href = `https://www.google.com/maps/search/?api=1&query=${data.point.lat},${data.point.lon}`;

  document.getElementById("placeDetails").scrollIntoView({ behavior: "smooth" });
}

function formatKind(kinds) {
  if (!kinds) return "Unknown";
  const kind = kinds.split(",")[0];
  return kind.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}
