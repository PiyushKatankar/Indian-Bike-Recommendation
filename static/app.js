// Gear Glide Frontend Application Engine

let bikesList = [];
let selectedBike = null;
let currentAutocompleteIndex = -1;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  // Load autocomplete database
  try {
    const res = await fetch('/api/bikes');
    bikesList = await res.json();
  } catch (err) {
    console.error("Failed to load bike database: ", err);
  }

  // Set up event listeners
  setupSearchInput();
  setupCriteriaToggles();
  setupTagButtons();
  setupModal();
}

// 1. Search and Autocomplete Logic
function setupSearchInput() {
  const searchInput = document.getElementById('bike-search-input');
  const autocompleteList = document.getElementById('autocomplete-list');
  const clearBtn = document.getElementById('clear-search-btn');

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    currentAutocompleteIndex = -1;
    
    if (!query) {
      hideAutocomplete();
      clearBtn.style.display = 'none';
      return;
    }
    
    clearBtn.style.display = 'flex';
    
    // Filter bikes (matching model name or brand name)
    const matches = bikesList.filter(bike => 
      bike.name.toLowerCase().includes(query) || 
      bike.brand.toLowerCase().includes(query)
    ).slice(0, 10); // cap suggestions at 10

    renderAutocomplete(matches);
  });

  // Keyboard navigation on autocomplete
  searchInput.addEventListener('keydown', (e) => {
    const items = autocompleteList.getElementsByClassName('autocomplete-item');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      currentAutocompleteIndex = (currentAutocompleteIndex + 1) % items.length;
      setActiveAutocompleteItem(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      currentAutocompleteIndex = (currentAutocompleteIndex - 1 + items.length) % items.length;
      setActiveAutocompleteItem(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (currentAutocompleteIndex > -1) {
        items[currentAutocompleteIndex].click();
      } else {
        // click the first suggestion if nothing is active
        items[0].click();
      }
    } else if (e.key === 'Escape') {
      hideAutocomplete();
    }
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    hideAutocomplete();
    clearBtn.style.display = 'none';
    resetToEmptyState();
  });

  // Hide dropdown on click outside
  document.addEventListener('click', (e) => {
    if (e.target !== searchInput && e.target !== autocompleteList) {
      hideAutocomplete();
    }
  });
}

function renderAutocomplete(matches) {
  const autocompleteList = document.getElementById('autocomplete-list');
  autocompleteList.innerHTML = '';
  
  if (matches.length === 0) {
    const emptyItem = document.createElement('div');
    emptyItem.className = 'autocomplete-item';
    emptyItem.style.cursor = 'default';
    emptyItem.style.color = 'var(--text-muted)';
    emptyItem.innerText = 'No matching bikes found';
    autocompleteList.appendChild(emptyItem);
    autocompleteList.style.display = 'block';
    return;
  }

  matches.forEach((bike) => {
    const div = document.createElement('div');
    div.className = 'autocomplete-item';
    div.innerHTML = `
      <span class="autocomplete-name">${bike.name}</span>
      <span class="autocomplete-brand">${bike.brand}</span>
    `;
    div.addEventListener('click', () => {
      selectBike(bike);
    });
    autocompleteList.appendChild(div);
  });

  autocompleteList.style.display = 'block';
}

function setActiveAutocompleteItem(items) {
  for (let i = 0; i < items.length; i++) {
    items[i].classList.remove('active');
  }
  if (currentAutocompleteIndex > -1) {
    items[currentAutocompleteIndex].classList.add('active');
    // Scroll item into view if needed
    items[currentAutocompleteIndex].scrollIntoView({ block: 'nearest' });
  }
}

function hideAutocomplete() {
  document.getElementById('autocomplete-list').style.display = 'none';
}

// 2. Select Bike
function selectBike(bike) {
  document.getElementById('bike-search-input').value = bike.name;
  document.getElementById('clear-search-btn').style.display = 'flex';
  hideAutocomplete();
  
  fetchBikeDetails(bike.id);
}

async function fetchBikeDetails(id) {
  try {
    const res = await fetch(`/api/bike/${id}`);
    selectedBike = await res.json();
    
    // Hide empty state and show results layout
    document.getElementById('empty-state').style.display = 'none';
    document.getElementById('results-section').style.display = 'block';
    
    // Fetch and show recommendations
    fetchRecommendations();
  } catch (err) {
    console.error("Error fetching bike details: ", err);
  }
}

// 3. Similarity Criteria and Realtime Updates
function setupCriteriaToggles() {
  const items = document.querySelectorAll('.criteria-item');
  items.forEach(item => {
    const checkbox = item.querySelector('input[type="checkbox"]');
    
    // Sync UI with click
    item.addEventListener('click', (e) => {
      if (e.target !== checkbox) {
        e.preventDefault();
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change'));
      }
    });

    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
      
      // Update recommendations dynamically
      if (selectedBike) {
        fetchRecommendations();
      }
    });
  });

  // Same Brand Bias
  document.getElementById('brand-boost').addEventListener('change', () => {
    if (selectedBike) {
      fetchRecommendations();
    }
  });
}

function setupTagButtons() {
  const tags = document.querySelectorAll('.tag-btn');
  tags.forEach(tag => {
    tag.addEventListener('click', () => {
      const name = tag.innerText;
      // Search for matching bike
      const match = bikesList.find(b => b.name.toLowerCase().includes(name.toLowerCase()));
      if (match) {
        selectBike(match);
      }
    });
  });
}

// 4. API recommendation fetch
async function fetchRecommendations() {
  if (!selectedBike) return;

  // Gather active criteria
  const activeCriteria = [];
  const criteriaKeys = ['price', 'displacement', 'power', 'mileage', 'weight', 'seat_height'];
  
  criteriaKeys.forEach(key => {
    let checkboxId = `criteria-${key}`;
    if (key === 'seat_height') checkboxId = 'criteria-seat';
    const checkbox = document.getElementById(checkboxId);
    if (checkbox && checkbox.checked) {
      activeCriteria.push(key);
    }
  });

  const brandBoost = document.getElementById('brand-boost').checked;

  try {
    const res = await fetch('/api/recommend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bike_id: selectedBike.id,
        criteria: activeCriteria,
        brand_boost: brandBoost
      })
    });

    const data = await res.json();
    renderSelectedBikeCard(data.target_bike);
    renderRecommendations(data.recommendations);
  } catch (err) {
    console.error("Error loading recommendations: ", err);
  }
}

// Helper spec formatters
function formatPrice(price) {
  if (!price) return 'N/A';
  if (price >= 100000) {
    return `₹ ${(price / 100000).toFixed(2)} Lakh`;
  }
  return `₹ ${price.toLocaleString('en-IN')}`;
}

function formatVal(val, unit, fallback = 'N/A') {
  if (val === null || val === undefined) return fallback;
  return `${val} ${unit}`;
}

// 5. Bike Silhouette SVG Generator
function getBikeSilhouette(bike) {
  const displacement = bike.displacement || 0;
  const brand = (bike.brand || '').toLowerCase();
  const transType = (bike.transmission_type || '').toLowerCase();
  
  let bikeClass = 'standard';
  let pathStr = '';
  
  // Detect scooter
  if (transType === 'cvt' || transType === 'automatic' || brand === 'aprilia' || 
      bike.name.toLowerCase().includes('scooty') || bike.name.toLowerCase().includes('activa') || 
      bike.name.toLowerCase().includes('jupiter') || bike.name.toLowerCase().includes('dio') || 
      bike.name.toLowerCase().includes('grazia') || bike.name.toLowerCase().includes('access') || 
      bike.name.toLowerCase().includes('burgman') || bike.name.toLowerCase().includes('fascino') || 
      bike.name.toLowerCase().includes('ray zr') || bike.name.toLowerCase().includes('pleasure')) {
    bikeClass = 'scooter';
    pathStr = `
      <!-- Scooter design path -->
      <circle cx="24" cy="42" r="9" stroke="currentColor" stroke-width="2.5" fill="none" />
      <circle cx="24" cy="42" r="3.5" fill="currentColor" />
      <circle cx="76" cy="42" r="9" stroke="currentColor" stroke-width="2.5" fill="none" />
      <circle cx="76" cy="42" r="3.5" fill="currentColor" />
      <path d="M24,42 L34,32 L44,42 L66,42 L72,20 L82,20" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <path d="M24,32 Q30,16 44,18 L34,32" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none" />
      <path d="M66,42 L70,24 L60,18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none" />
      <path d="M72,20 L70,10 L64,10" stroke="currentColor" stroke-width="3" stroke-linecap="round" fill="none" />
    `;
  } 
  // Detect cruiser
  else if (brand === 'royal enfield' || brand === 'jawa' || brand === 'benelli' || 
           bike.name.toLowerCase().includes('cruiser') || bike.name.toLowerCase().includes('avenger') || 
           bike.name.toLowerCase().includes('vulcan') || bike.name.toLowerCase().includes('classic') || 
           bike.name.toLowerCase().includes('bullet') || bike.name.toLowerCase().includes('meteor')) {
    bikeClass = 'cruiser';
    pathStr = `
      <!-- Cruiser design path -->
      <circle cx="22" cy="42" r="10" stroke="currentColor" stroke-width="2.5" fill="none" />
      <circle cx="22" cy="42" r="4" fill="currentColor" />
      <circle cx="78" cy="41" r="10" stroke="currentColor" stroke-width="2.5" fill="none" />
      <circle cx="78" cy="41" r="4" fill="currentColor" />
      <path d="M22,42 L38,40 L44,26 Q54,16 66,20 L74,26 L78,41" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <path d="M28,32 Q38,30 44,36" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none" />
      <path d="M78,41 L66,12 L58,10 L52,14" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <path d="M28,45 L58,45" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none" />
    `;
  } 
  // Detect sports/superbike
  else if (brand === 'ducati' || brand === 'kawasaki' || brand === 'ktm' || 
           displacement > 200 || bike.name.toLowerCase().includes('ninja') || 
           bike.name.toLowerCase().includes('apache') || bike.name.toLowerCase().includes('r15') || 
           bike.name.toLowerCase().includes('mt 15') || bike.name.toLowerCase().includes('gixxer') || 
           bike.name.toLowerCase().includes('cbr') || bike.name.toLowerCase().includes('panigale') ||
           bike.name.toLowerCase().includes('duke') || bike.name.toLowerCase().includes('xtreme')) {
    bikeClass = 'sports';
    pathStr = `
      <!-- Sports design path -->
      <circle cx="24" cy="42" r="9.5" stroke="currentColor" stroke-width="2.5" fill="none" />
      <circle cx="24" cy="42" r="3.5" fill="currentColor" />
      <circle cx="76" cy="42" r="9.5" stroke="currentColor" stroke-width="2.5" fill="none" />
      <circle cx="76" cy="42" r="3.5" fill="currentColor" />
      <path d="M24,42 L34,24 L48,22 Q58,15 66,22 L72,30 L76,42" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <path d="M26,24 Q34,26 42,22 L50,12 L34,14 Z" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" fill="none" />
      <path d="M76,42 L64,14 L58,16" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <path d="M12,40 Q18,30 28,34" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none" />
    `;
  } 
  // Standard commuter/street
  else {
    bikeClass = 'standard';
    pathStr = `
      <!-- Standard street design path -->
      <circle cx="24" cy="42" r="10" stroke="currentColor" stroke-width="2.5" fill="none" />
      <circle cx="24" cy="42" r="4" fill="currentColor" />
      <circle cx="76" cy="42" r="10" stroke="currentColor" stroke-width="2.5" fill="none" />
      <circle cx="76" cy="42" r="4" fill="currentColor" />
      <path d="M24,42 L38,36 L52,24 Q60,20 68,24 L76,42" stroke="currentColor" stroke-width="3" stroke-linecap="round" fill="none" />
      <path d="M30,30 L54,30" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none" />
      <path d="M76,42 L66,14 L60,14" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <rect x="42" y="32" width="14" height="10" rx="2" stroke="currentColor" stroke-width="2" fill="none" />
    `;
  }
  
  return `
    <svg class="bike-silhouette-svg ${bikeClass}" viewBox="0 0 100 56">
      ${pathStr}
    </svg>
  `;
}

// 6. Render Target Bike
function renderSelectedBikeCard(bike) {
  const container = document.getElementById('selected-bike-card-container');
  
  container.innerHTML = `
    <div class="selected-bike-card">
      <div class="bike-card-hero">
        <div class="bike-brand">${bike.brand}</div>
        <h3 class="bike-name">${bike.name}</h3>
        <div class="bike-price-badge">
          <span class="price-val">${formatPrice(bike.price)}</span>
          <span class="price-lbl">Ex-Showroom Price</span>
        </div>
      </div>
      <div class="bike-graphic-area">
        ${getBikeSilhouette(bike)}
      </div>
      <div class="bike-specs-list">
        <div class="spec-row">
          <div class="spec-name-wrapper">
            <svg class="spec-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>
            <span>Displacement</span>
          </div>
          <span class="spec-value">${formatVal(bike.displacement, 'cc')}</span>
        </div>
        <div class="spec-row">
          <div class="spec-name-wrapper">
            <svg class="spec-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
            <span>Max Power</span>
          </div>
          <span class="spec-value">${formatVal(bike.power, 'PS')}</span>
        </div>
        <div class="spec-row">
          <div class="spec-name-wrapper">
            <svg class="spec-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            <span>Max Torque</span>
          </div>
          <span class="spec-value">${formatVal(bike.torque, 'Nm')}</span>
        </div>
        <div class="spec-row">
          <div class="spec-name-wrapper">
            <svg class="spec-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            <span>Mileage</span>
          </div>
          <span class="spec-value">${formatVal(bike.mileage, 'km/l')}</span>
        </div>
        <div class="spec-row">
          <div class="spec-name-wrapper">
            <svg class="spec-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"></path></svg>
            <span>Kerb Weight</span>
          </div>
          <span class="spec-value">${formatVal(bike.weight, 'kg')}</span>
        </div>
        <div class="spec-row">
          <div class="spec-name-wrapper">
            <svg class="spec-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <span>Seat Height</span>
          </div>
          <span class="spec-value">${formatVal(bike.seat_height, 'mm')}</span>
        </div>
        <div class="spec-row">
          <div class="spec-name-wrapper">
            <svg class="spec-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="M12 6v6l4 2"></path></svg>
            <span>Top Speed</span>
          </div>
          <span class="spec-value">${formatVal(bike.top_speed, 'km/h')}</span>
        </div>
        <div class="spec-row">
          <div class="spec-name-wrapper">
            <svg class="spec-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path></svg>
            <span>Braking ABS</span>
          </div>
          <span class="spec-value" style="font-size: 0.8rem; text-transform: uppercase;">${bike.braking || 'Standard'}</span>
        </div>
        <div class="spec-row">
          <div class="spec-name-wrapper">
            <svg class="spec-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
            <span>Transmission</span>
          </div>
          <span class="spec-value">${bike.transmission || 'N/A'}</span>
        </div>
      </div>
    </div>
  `;
}

// 7. Render Recommendations
function renderRecommendations(recos) {
  const container = document.getElementById('recommendations-container');
  container.innerHTML = '';

  if (recos.length === 0) {
    container.innerHTML = '<div class="empty-state">No similar bikes found. Try selecting more criteria!</div>';
    return;
  }

  recos.forEach((bike) => {
    // Generate Match Gauge (SVG Stroke Calculations)
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const strokeOffset = circumference - (bike.similarity / 100) * circumference;

    const div = document.createElement('div');
    div.className = 'reco-card';
    div.innerHTML = `
      <!-- SVG Circular Match Ring -->
      <div class="score-circle-wrapper">
        <svg class="score-svg">
          <circle class="score-bg" cx="32" cy="32" r="${radius}"></circle>
          <circle class="score-fill" cx="32" cy="32" r="${radius}" 
                  stroke-dasharray="${circumference}" 
                  stroke-dashoffset="${strokeOffset}"></circle>
        </svg>
        <div class="score-text">
          ${Math.round(bike.similarity)}<span style="font-size:0.6rem">%</span>
          <span class="score-lbl">match</span>
        </div>
      </div>
      
      <!-- Recommended Bike Silhouette -->
      <div class="reco-graphic-area">
        ${getBikeSilhouette(bike)}
      </div>
      
      <!-- Recommended Bike Details -->
      <div class="reco-details">
        <div class="reco-brand">${bike.brand}</div>
        <h4 class="reco-name">${bike.name}</h4>
        <div class="reco-specs-pills">
          <div class="reco-pill">Price: <span>${formatPrice(bike.price)}</span></div>
          <div class="reco-pill">Engine: <span>${formatVal(bike.displacement, 'cc', 'N/A')}</span></div>
          <div class="reco-pill">Mileage: <span>${formatVal(bike.mileage, 'km/l', 'N/A')}</span></div>
        </div>
      </div>
      
      <!-- Compare Action -->
      <div class="reco-actions">
        <button class="compare-btn" onclick="compareBikes(${bike.id})">
          <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M16 3h5v5M8 21H3v-5M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0M21 3L14.5 9.5M3 21l6.5-6.5"></path></svg>
          Compare
        </button>
      </div>
    `;
    container.appendChild(div);
  });
}

// Reset UI back to welcome screen
function resetToEmptyState() {
  selectedBike = null;
  document.getElementById('results-section').style.display = 'none';
  document.getElementById('empty-state').style.display = 'flex';
}

// 7. Side-by-Side Comparison Modal
function setupModal() {
  const modal = document.getElementById('compare-modal');
  const closeBtn = document.getElementById('close-modal-btn');
  
  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
}

async function compareBikes(candidateId) {
  if (!selectedBike) return;

  try {
    const res = await fetch(`/api/bike/${candidateId}`);
    const candidate = await res.json();
    
    // Update headers
    document.getElementById('compare-target-header').innerText = selectedBike.name;
    document.getElementById('compare-candidate-header').innerText = candidate.name;
    
    const tbody = document.getElementById('comparison-table-body');
    tbody.innerHTML = '';
    
    // Helper comparison rules
    const specComparisonConfig = [
      { label: 'Ex-Showroom Price', key: 'price', unit: '₹', format: formatPrice, lowerIsBetter: true },
      { label: 'Displacement', key: 'displacement', unit: 'cc', format: (val) => formatVal(val, 'cc'), lowerIsBetter: false },
      { label: 'Max Power', key: 'power', unit: 'PS', format: (val) => formatVal(val, 'PS'), lowerIsBetter: false },
      { label: 'Max Torque', key: 'torque', unit: 'Nm', format: (val) => formatVal(val, 'Nm'), lowerIsBetter: false },
      { label: 'Mileage (Owner/ARAI)', key: 'mileage', unit: 'km/l', format: (val) => formatVal(val, 'km/l'), lowerIsBetter: false },
      { label: 'Kerb Weight', key: 'weight', unit: 'kg', format: (val) => formatVal(val, 'kg'), lowerIsBetter: true },
      { label: 'Seat Height', key: 'seat_height', unit: 'mm', format: (val) => formatVal(val, 'mm'), lowerIsBetter: null },
      { label: 'Fuel Capacity', key: 'tank_capacity', unit: 'L', format: (val) => formatVal(val, 'L'), lowerIsBetter: false },
      { label: 'Top Speed', key: 'top_speed', unit: 'km/h', format: (val) => formatVal(val, 'km/h'), lowerIsBetter: false },
      { label: 'Cooling System', key: 'cooling', unit: '', format: (val) => val || 'N/A', lowerIsBetter: null },
      { label: 'Braking ABS', key: 'braking', unit: '', format: (val) => val || 'N/A', lowerIsBetter: null }
    ];

    specComparisonConfig.forEach(spec => {
      const tVal = selectedBike[spec.key];
      const cVal = candidate[spec.key];
      
      const tText = spec.format ? spec.format(tVal) : (tVal !== null ? `${tVal} ${spec.unit}` : 'N/A');
      const cText = spec.format ? spec.format(cVal) : (cVal !== null ? `${cVal} ${spec.unit}` : 'N/A');
      
      let badgeHTML = '';
      
      if (tVal !== null && cVal !== null && typeof tVal === 'number' && typeof cVal === 'number') {
        const diff = cVal - tVal;
        const diffText = Math.abs(diff).toFixed(1).replace('.0', '');
        
        if (diff === 0) {
          badgeHTML = `<span class="comp-badge equal">Equal</span>`;
        } else if (spec.lowerIsBetter === null) {
          // just show simple difference
          badgeHTML = `<span class="comp-badge equal">${diff > 0 ? '+' : ''}${diffText} ${spec.unit}</span>`;
        } else {
          const candidateIsBetter = spec.lowerIsBetter ? (cVal < tVal) : (cVal > tVal);
          if (candidateIsBetter) {
            badgeHTML = `<span class="comp-badge better">+${diffText} ${spec.unit} (Better)</span>`;
          } else {
            badgeHTML = `<span class="comp-badge worse">${diff > 0 ? '+' : ''}${diff.toFixed(1).replace('.0', '')} ${spec.unit} (Worse)</span>`;
          }
        }
      } else {
        badgeHTML = `<span class="comp-badge equal">No match specs</span>`;
      }

      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="comp-spec-title">${spec.label}</td>
        <td class="comp-value-target">${tText}</td>
        <td class="comp-value-candidate">${cText}</td>
        <td>${badgeHTML}</td>
      `;
      tbody.appendChild(row);
    });

    document.getElementById('compare-modal').style.display = 'flex';
  } catch (err) {
    console.error("Error setting up comparison: ", err);
  }
}
// Attach to global window scope so HTML onclick attribute can execute it
window.compareBikes = compareBikes;
