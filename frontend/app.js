/**
 * TANZANIA PINCODES LOOKUP - FRONTEND CONTROLLER
 * Lightweight, Vanilla ES6 JavaScript application.
 */

(function () {
  'use strict';

  // State Management
  const state = {
    apiBaseUrl: window.location.origin.includes('http') ? window.location.origin : 'http://127.0.0.1:8000',
    isApiLive: false,
    latency: null,
    activeSnippetLang: 'curl',
    currentLocation: null,
    allPincodes: [],
    checkoutShippingRates: {
      'Dar es Salaam': 4500,
      'Zanzibar': 9500,
      'Arusha': 8000,
      'Kilimanjaro': 8000,
      'Mwanza': 9000,
      'Dodoma': 7500,
      'Mbeya': 9500,
      'Tanga': 7000,
      'DEFAULT': 11000
    }
  };

  // Offline Fallback Dataset (ensures UI works even without active server)
  const fallbackDb = {
    "123456": { pincode: "123456", region: "Dar es Salaam", city: "Dar es Salaam", district: "Ilala" },
    "654321": { pincode: "654321", region: "Mwanza", city: "Mwanza", district: "Mwanza" },
    "111111": { pincode: "111111", region: "Arusha", city: "Arusha", district: "Arusha" },
    "222222": { pincode: "222222", region: "Dodoma", city: "Dodoma", district: "Dodoma" },
    "333333": { pincode: "333333", region: "Mbeya", city: "Mbeya", district: "Mbeya" },
    "444444": { pincode: "444444", region: "Kilimanjaro", city: "Moshi", district: "Moshi" },
    "555555": { pincode: "555555", region: "Tanga", city: "Tanga", district: "Tanga" },
    "666666": { pincode: "666666", region: "Zanzibar", city: "Zanzibar City", district: "Zanzibar" },
    "111010": { pincode: "111010", region: "Dar es Salaam", city: "Dar es Salaam", district: "Kinondoni" },
    "111020": { pincode: "111020", region: "Dar es Salaam", city: "Dar es Salaam", district: "Temeke" },
    "111030": { pincode: "111030", region: "Dar es Salaam", city: "Dar es Salaam", district: "Ubungo" },
    "111040": { pincode: "111040", region: "Dar es Salaam", city: "Dar es Salaam", district: "Kigamboni" },
    "231010": { pincode: "231010", region: "Arusha", city: "Arusha", district: "Arusha Urban" },
    "251010": { pincode: "251010", region: "Kilimanjaro", city: "Moshi", district: "Moshi Urban" },
    "411010": { pincode: "411010", region: "Dodoma", city: "Dodoma", district: "Dodoma Urban" },
    "331010": { pincode: "331010", region: "Mwanza", city: "Mwanza", district: "Nyamagana" },
    "711010": { pincode: "711010", region: "Zanzibar", city: "Zanzibar City", district: "Mjini Magharibi" },
    "211010": { pincode: "211010", region: "Tanga", city: "Tanga", district: "Tanga City" },
    "531010": { pincode: "531010", region: "Mbeya", city: "Mbeya", district: "Mbeya City" },
    "611010": { pincode: "611010", region: "Morogoro", city: "Morogoro", district: "Morogoro Urban" }
  };

  // DOM Elements
  const els = {
    tabs: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    themeToggle: document.getElementById('themeToggle'),
    apiStatusBadge: document.getElementById('apiStatusBadge'),
    apiStatusText: document.getElementById('apiStatusText'),
    latencyPill: document.getElementById('latencyPill'),

    // Single Lookup
    pincodeInput: document.getElementById('pincodeInput'),
    digitCounter: document.getElementById('digitCounter'),
    clearInputBtn: document.getElementById('clearInputBtn'),
    lookupSubmitBtn: document.getElementById('lookupSubmitBtn'),
    lookupResultContainer: document.getElementById('lookupResultContainer'),
    sampleChips: document.getElementById('sampleChips'),
    codeSnippetsSection: document.getElementById('codeSnippetsSection'),
    codeSnippetBox: document.getElementById('codeSnippetBox'),
    copyCodeBtn: document.getElementById('copyCodeBtn'),
    codeTabBtns: document.querySelectorAll('.code-tab-btn'),

    // Checkout Demo
    checkoutPincode: document.getElementById('checkoutPincode'),
    checkoutRegion: document.getElementById('checkoutRegion'),
    checkoutCity: document.getElementById('checkoutCity'),
    checkoutDistrict: document.getElementById('checkoutDistrict'),
    checkoutPinStatus: document.getElementById('checkoutPinStatus'),
    summaryDest: document.getElementById('summaryDest'),
    summaryShipping: document.getElementById('summaryShipping'),
    summaryGrandTotal: document.getElementById('summaryGrandTotal'),
    deliveryPriceTag: document.getElementById('deliveryPriceTag'),
    placeOrderBtn: document.getElementById('placeOrderBtn'),
    orderSuccessModal: document.getElementById('orderSuccessModal'),
    orderModalDetails: document.getElementById('orderModalDetails'),

    // Bulk
    bulkInput: document.getElementById('bulkPincodesInput'),
    bulkCounter: document.getElementById('bulkCounter'),
    bulkSubmitBtn: document.getElementById('bulkSubmitBtn'),
    bulkClearBtn: document.getElementById('bulkClearBtn'),
    bulkResultsContainer: document.getElementById('bulkResultsContainer'),
    bulkFoundCount: document.getElementById('bulkFoundCount'),
    bulkMissingCount: document.getElementById('bulkMissingCount'),
    bulkTableBody: document.getElementById('bulkTableBody'),
    exportCsvBtn: document.getElementById('exportCsvBtn'),
    exportJsonBtn: document.getElementById('exportJsonBtn'),
    presetMajorCities: document.getElementById('presetMajorCities'),
    presetCoast: document.getElementById('presetCoast'),
    presetMixed: document.getElementById('presetMixed'),

    // Directory
    directorySearchInput: document.getElementById('directorySearchInput'),
    directoryClearSearch: document.getElementById('directoryClearSearch'),
    regionFiltersBar: document.getElementById('regionFiltersBar'),
    directoryGrid: document.getElementById('directoryGrid'),
    totalDirCount: document.getElementById('totalDirCount'),

    // API Playground
    consoleMethod: document.getElementById('consoleMethod'),
    consoleUrl: document.getElementById('consoleUrl'),
    consoleRequestBody: document.getElementById('consoleRequestBody'),
    requestBodyWrapper: document.getElementById('requestBodyWrapper'),
    consoleSendBtn: document.getElementById('consoleSendBtn'),
    responseStatusBadge: document.getElementById('responseStatusBadge'),
    consoleResponseBody: document.getElementById('consoleResponseBody'),
    pingDuration: document.getElementById('pingDuration'),

    toastContainer: document.getElementById('toastContainer')
  };

  /* ============================================================
     INITIALIZATION & HEALTH CHECK
     ============================================================ */
  async function init() {
    initTheme();
    setupNavigation();
    setupSingleLookup();
    setupCheckoutDemo();
    setupBulkLookup();
    setupDirectory();
    setupPlayground();

    // Perform initial API connectivity check
    await checkApiHealth();

    // Fetch all pincodes for directory
    loadDirectoryData();

    // Auto-search default sample code on page load
    searchPincode('123456');
  }

  /* ============================================================
     THEME TOGGLE
     ============================================================ */
  function initTheme() {
    const savedTheme = localStorage.getItem('tz_theme') || 'dark';
    if (savedTheme === 'light') {
      document.body.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
    }

    els.themeToggle.addEventListener('click', () => {
      const isLight = document.body.classList.toggle('theme-light');
      document.body.classList.toggle('theme-dark', !isLight);
      localStorage.setItem('tz_theme', isLight ? 'light' : 'dark');
      showToast(isLight ? '☀️ Light theme enabled' : '🌙 Dark theme enabled');
    });
  }

  /* ============================================================
     NAVIGATION TABS
     ============================================================ */
  function setupNavigation() {
    els.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab');
        switchTab(target);
      });
    });
  }

  function switchTab(tabId) {
    els.tabs.forEach(t => {
      const match = t.getAttribute('data-tab') === tabId;
      t.classList.toggle('active', match);
      t.setAttribute('aria-selected', match ? 'true' : 'false');
    });

    els.tabContents.forEach(c => {
      c.classList.toggle('active', c.id === `tab-${tabId}`);
    });
  }

  /* ============================================================
     HEALTH & API CONNECTIVITY
     ============================================================ */
  async function checkApiHealth() {
    const startTime = performance.now();
    try {
      const res = await fetch(`${state.apiBaseUrl}/api/health`, { method: 'GET' });
      const duration = Math.round(performance.now() - startTime);
      if (res.ok) {
        state.isApiLive = true;
        state.latency = duration;
        els.apiStatusBadge.classList.remove('offline');
        els.apiStatusText.textContent = 'API Live';
        els.latencyPill.textContent = `${duration}ms`;
        els.latencyPill.style.display = 'inline-block';
        if (els.pingDuration) els.pingDuration.textContent = `${duration} ms`;
        return true;
      }
    } catch (err) {
      // Local fallback mode
      state.isApiLive = false;
      els.apiStatusBadge.classList.add('offline');
      els.apiStatusText.textContent = 'Standalone Mock Mode';
      els.latencyPill.style.display = 'none';
      if (els.pingDuration) els.pingDuration.textContent = 'Offline';
      return false;
    }
  }

  /* ============================================================
     SINGLE LOOKUP
     ============================================================ */
  function setupSingleLookup() {
    // Input counter & clear button
    els.pincodeInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').slice(0, 6);
      e.target.value = val;
      els.digitCounter.textContent = `${val.length}/6`;
      els.clearInputBtn.style.display = val.length > 0 ? 'block' : 'none';

      if (val.length === 6) {
        searchPincode(val);
      }
    });

    els.clearInputBtn.addEventListener('click', () => {
      els.pincodeInput.value = '';
      els.digitCounter.textContent = '0/6';
      els.clearInputBtn.style.display = 'none';
      els.lookupResultContainer.style.display = 'none';
      els.codeSnippetsSection.style.display = 'none';
      els.pincodeInput.focus();
    });

    els.lookupSubmitBtn.addEventListener('click', () => {
      const val = els.pincodeInput.value.trim();
      if (val) searchPincode(val);
    });

    // Sample chip clicks
    els.sampleChips.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (chip) {
        const code = chip.getAttribute('data-code');
        els.pincodeInput.value = code;
        els.digitCounter.textContent = `${code.length}/6`;
        els.clearInputBtn.style.display = 'block';
        searchPincode(code);
      }
    });

    // Code Snippet language tabs
    els.codeTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        els.codeTabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.activeSnippetLang = btn.getAttribute('data-lang');
        updateCodeSnippet();
      });
    });

    els.copyCodeBtn.addEventListener('click', () => {
      const code = els.codeSnippetBox.textContent;
      navigator.clipboard.writeText(code);
      showToast('📋 Code snippet copied to clipboard!');
    });
  }

  async function searchPincode(code) {
    if (!code) return;

    setLoading(els.lookupSubmitBtn, true);
    els.lookupResultContainer.style.display = 'block';

    let locationData = null;
    let errorData = null;

    if (state.isApiLive) {
      try {
        const res = await fetch(`${state.apiBaseUrl}/pincode/${code}`);
        if (res.ok) {
          locationData = await res.json();
        } else {
          errorData = await res.json();
        }
      } catch (err) {
        // Fallback to local DB if fetch failed
        if (fallbackDb[code]) {
          locationData = fallbackDb[code];
        } else {
          errorData = { error: 'Connection Error', message: `Could not connect to API, and code ${code} is not in local fallback database.` };
        }
      }
    } else {
      // Offline fallback
      if (fallbackDb[code]) {
        locationData = fallbackDb[code];
      } else {
        errorData = { error: 'Pincode not found', message: `No location found for pincode ${code} in test database.` };
      }
    }

    setLoading(els.lookupSubmitBtn, false);

    if (locationData) {
      state.currentLocation = locationData;
      renderSuccessResult(locationData);
      updateCodeSnippet();
      els.codeSnippetsSection.style.display = 'block';
    } else {
      state.currentLocation = null;
      renderErrorResult(code, errorData);
      els.codeSnippetsSection.style.display = 'none';
    }
  }

  function renderSuccessResult(data) {
    els.lookupResultContainer.innerHTML = `
      <div class="location-result-card">
        <div class="result-header">
          <div class="result-tag">
            <span>🇹🇿 Verified Location</span>
          </div>
          <div class="result-pincode-badge"># ${escapeHtml(data.pincode)}</div>
        </div>

        <div class="location-grid">
          <div class="location-stat-card">
            <div class="stat-label">Region (Mkoa)</div>
            <div class="stat-value">${escapeHtml(data.region)}</div>
          </div>
          <div class="location-stat-card">
            <div class="stat-label">City / Municipality</div>
            <div class="stat-value">${escapeHtml(data.city)}</div>
          </div>
          <div class="location-stat-card">
            <div class="stat-label">District (Wilaya)</div>
            <div class="stat-value">${escapeHtml(data.district)}</div>
          </div>
        </div>

        <div class="result-actions">
          <button class="btn btn-outline btn-sm" onclick="window.copyFormattedAddress('${escapeHtml(data.district)}', '${escapeHtml(data.city)}', '${escapeHtml(data.region)}', '${escapeHtml(data.pincode)}')">
            <span>📋 Copy Address</span>
          </button>
          <button class="btn btn-outline btn-sm" onclick="window.copyJsonLocation()">
            <span>📋 Copy JSON</span>
          </button>
          <button class="btn btn-primary btn-sm" onclick="window.openInCheckout('${escapeHtml(data.pincode)}')">
            <span>🛒 Test in Checkout Demo →</span>
          </button>
        </div>
      </div>
    `;
  }

  function renderErrorResult(code, err) {
    const message = err?.message || `No location for specified pincode ${code} was found in the database.`;
    els.lookupResultContainer.innerHTML = `
      <div class="error-result-card">
        <div class="error-icon">🔍⚠️</div>
        <h4 class="error-title">Pincode "${escapeHtml(code)}" Not Found</h4>
        <p class="error-message">${escapeHtml(message)}</p>
        <div style="margin-top: 1rem;">
          <span style="font-size: 0.8rem; color: var(--text-muted);">Try one of our active sample postal codes: 
            <a href="javascript:void(0)" onclick="window.searchPincode('123456')">123456 (Dar es Salaam)</a>, 
            <a href="javascript:void(0)" onclick="window.searchPincode('111111')">111111 (Arusha)</a>, or 
            <a href="javascript:void(0)" onclick="window.searchPincode('666666')">666666 (Zanzibar)</a>.
          </span>
        </div>
      </div>
    `;
  }

  function updateCodeSnippet() {
    if (!state.currentLocation) return;
    const code = state.currentLocation.pincode;
    const url = `${state.apiBaseUrl}/pincode/${code}`;

    let snippet = '';
    if (state.activeSnippetLang === 'curl') {
      snippet = `curl -X GET "${url}" \\
  -H "Accept: application/json"`;
    } else if (state.activeSnippetLang === 'js') {
      snippet = `// JavaScript (Fetch API)
const response = await fetch("${url}");
const data = await response.json();
console.log("Region:", data.region);
console.log("District:", data.district);`;
    } else if (state.activeSnippetLang === 'python') {
      snippet = `# Python (requests)
import requests

response = requests.get("${url}")
if response.status_code == 200:
    data = response.json()
    print(f"Location: {data['district']}, {data['city']}, {data['region']}")
else:
    print("Error:", response.json())`;
    }

    els.codeSnippetBox.textContent = snippet;
  }

  /* ============================================================
     CHECKOUT AUTOFILL DEMO
     ============================================================ */
  function setupCheckoutDemo() {
    let debounceTimer;

    els.checkoutPincode.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').slice(0, 6);
      e.target.value = val;

      clearTimeout(debounceTimer);
      if (val.length === 6) {
        els.checkoutPinStatus.innerHTML = '<span style="color:var(--coral)">⚡ Resolving...</span>';
        debounceTimer = setTimeout(() => handleCheckoutPincodeAutofill(val), 250);
      } else {
        resetAutofillFields();
        if (val.length > 0) {
          els.checkoutPinStatus.innerHTML = `<span style="color:var(--text-muted)">${val.length}/6</span>`;
        } else {
          els.checkoutPinStatus.innerHTML = '';
        }
      }
    });

    els.placeOrderBtn.addEventListener('click', () => {
      const region = els.checkoutRegion.value.trim();
      const district = els.checkoutDistrict.value.trim();
      const pin = els.checkoutPincode.value.trim();

      if (!pin || pin.length !== 6 || !region) {
        showToast('⚠️ Please enter a valid 6-digit postal code to autofill destination first.');
        els.checkoutPincode.focus();
        return;
      }

      // Populate success modal
      const name = document.getElementById('custName').value;
      const phone = document.getElementById('custPhone').value;
      const street = document.getElementById('custStreet').value;

      els.orderModalDetails.innerHTML = `
        <p><strong>Customer:</strong> ${escapeHtml(name)} (${escapeHtml(phone)})</p>
        <p><strong>Delivery To:</strong> ${escapeHtml(street)}, ${escapeHtml(district)}, ${escapeHtml(region)} - Postal Code: <strong>${escapeHtml(pin)}</strong></p>
        <p><strong>Total Charged:</strong> <span style="color:var(--coral); font-weight:800;">${els.summaryGrandTotal.textContent}</span></p>
        <p style="margin-top:0.5rem; font-size:0.75rem; color:var(--text-muted);">Tracking: TZ-POST-${Math.floor(100000 + Math.random() * 900000)} • Dispatch Ready</p>
      `;

      els.orderSuccessModal.style.display = 'flex';
    });
  }

  async function handleCheckoutPincodeAutofill(code) {
    let data = null;

    if (state.isApiLive) {
      try {
        const res = await fetch(`${state.apiBaseUrl}/pincode/${code}`);
        if (res.ok) data = await res.json();
      } catch (e) {
        data = fallbackDb[code] || null;
      }
    } else {
      data = fallbackDb[code] || null;
    }

    if (data) {
      els.checkoutRegion.value = data.region;
      els.checkoutCity.value = data.city;
      els.checkoutDistrict.value = data.district;

      [els.checkoutRegion, els.checkoutCity, els.checkoutDistrict].forEach(f => {
        f.classList.add('populated');
      });

      els.checkoutPinStatus.innerHTML = '<span style="color:#22c55e">✅ Autofilled!</span>';

      // Update Shipping Rate
      const shippingFee = state.checkoutShippingRates[data.region] || state.checkoutShippingRates['DEFAULT'];
      const formattedShipping = `TZS ${shippingFee.toLocaleString()}`;
      const grandTotal = 68000 + shippingFee;

      els.summaryDest.textContent = data.region;
      els.summaryShipping.textContent = formattedShipping;
      els.deliveryPriceTag.textContent = formattedShipping;
      els.summaryGrandTotal.textContent = `TZS ${grandTotal.toLocaleString()}`;

      showToast(`✨ Address autofilled: ${data.district}, ${data.region}`);
    } else {
      resetAutofillFields();
      els.checkoutPinStatus.innerHTML = '<span style="color:#ef4444">❌ Unknown Pincode</span>';
      showToast(`⚠️ Pincode ${code} not found in database.`, 'error');
    }
  }

  function resetAutofillFields() {
    els.checkoutRegion.value = '';
    els.checkoutCity.value = '';
    els.checkoutDistrict.value = '';
    [els.checkoutRegion, els.checkoutCity, els.checkoutDistrict].forEach(f => {
      f.classList.remove('populated');
    });

    els.summaryDest.textContent = 'Dar es Salaam';
    els.summaryShipping.textContent = 'TZS 5,000';
    els.deliveryPriceTag.textContent = 'TZS 5,000';
    els.summaryGrandTotal.textContent = 'TZS 73,000';
  }

  /* ============================================================
     BULK LOOKUP
     ============================================================ */
  let bulkResultsCache = [];

  function setupBulkLookup() {
    els.bulkInput.addEventListener('input', () => {
      const codes = parseBulkInput(els.bulkInput.value);
      els.bulkCounter.textContent = `${codes.length} / 10 pincodes`;
      if (codes.length > 10) {
        els.bulkCounter.style.color = '#ef4444';
      } else {
        els.bulkCounter.style.color = 'var(--text-muted)';
      }
    });

    els.presetMajorCities.addEventListener('click', () => {
      els.bulkInput.value = '123456, 111111, 654321, 222222, 333333';
      els.bulkInput.dispatchEvent(new Event('input'));
    });

    els.presetCoast.addEventListener('click', () => {
      els.bulkInput.value = '123456, 111010, 666666, 555555';
      els.bulkInput.dispatchEvent(new Event('input'));
    });

    els.presetMixed.addEventListener('click', () => {
      els.bulkInput.value = '123456, 999999, 111111, 888888, 444444';
      els.bulkInput.dispatchEvent(new Event('input'));
    });

    els.bulkClearBtn.addEventListener('click', () => {
      els.bulkInput.value = '';
      els.bulkInput.dispatchEvent(new Event('input'));
      els.bulkResultsContainer.style.display = 'none';
      bulkResultsCache = [];
    });

    els.bulkSubmitBtn.addEventListener('click', runBulkLookup);

    els.exportCsvBtn.addEventListener('click', exportBulkCsv);
    els.exportJsonBtn.addEventListener('click', exportBulkJson);
  }

  function parseBulkInput(text) {
    if (!text) return [];
    return text
      .split(/[\n,;]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  async function runBulkLookup() {
    const rawCodes = parseBulkInput(els.bulkInput.value);
    if (rawCodes.length === 0) {
      showToast('⚠️ Please enter at least one pincode.');
      return;
    }
    if (rawCodes.length > 10) {
      showToast('⚠️ Maximum 10 pincodes allowed per batch request.');
      return;
    }

    setLoading(els.bulkSubmitBtn, true);
    els.bulkResultsContainer.style.display = 'block';

    let bulkData = null;

    if (state.isApiLive) {
      try {
        const res = await fetch(`${state.apiBaseUrl}/pincodes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pincodes: rawCodes })
        });
        if (res.ok) {
          bulkData = await res.json();
        }
      } catch (e) {
        // Fallback
      }
    }

    // Local fallback if API didn't return
    if (!bulkData) {
      const found = [];
      const missing = [];
      rawCodes.forEach(c => {
        if (fallbackDb[c]) found.push(fallbackDb[c]);
        else missing.push(c);
      });
      bulkData = {
        found: found.length,
        not_found: missing.length,
        results: found,
        missing: missing
      };
    }

    setLoading(els.bulkSubmitBtn, false);

    els.bulkFoundCount.textContent = bulkData.found;
    els.bulkMissingCount.textContent = bulkData.not_found;

    // Combine results for rendering and exporting
    bulkResultsCache = [];

    let tableHtml = '';

    bulkData.results.forEach(item => {
      bulkResultsCache.push({
        pincode: item.pincode,
        status: 'Found',
        region: item.region,
        city: item.city,
        district: item.district
      });

      tableHtml += `
        <tr>
          <td><strong>${escapeHtml(item.pincode)}</strong></td>
          <td><span class="status-pill success">Found</span></td>
          <td>${escapeHtml(item.region)}</td>
          <td>${escapeHtml(item.city)}</td>
          <td>${escapeHtml(item.district)}</td>
          <td>
            <button class="btn btn-sm btn-outline" onclick="window.testPincodeInSingle('${escapeHtml(item.pincode)}')">View</button>
          </td>
        </tr>
      `;
    });

    bulkData.missing.forEach(code => {
      bulkResultsCache.push({
        pincode: code,
        status: 'Missing',
        region: 'N/A',
        city: 'N/A',
        district: 'N/A'
      });

      tableHtml += `
        <tr>
          <td><strong>${escapeHtml(code)}</strong></td>
          <td><span class="status-pill error">Not Found</span></td>
          <td colspan="3" style="color:var(--text-muted); font-style:italic;">No mapped location</td>
          <td>
            <button class="btn btn-sm btn-outline" onclick="window.testPincodeInSingle('${escapeHtml(code)}')">Inspect</button>
          </td>
        </tr>
      `;
    });

    els.bulkTableBody.innerHTML = tableHtml;
    showToast(`📦 Batch processed: ${bulkData.found} found, ${bulkData.not_found} missing.`);
  }

  function exportBulkCsv() {
    if (!bulkResultsCache.length) return;
    let csv = 'Pincode,Status,Region,City,District\n';
    bulkResultsCache.forEach(r => {
      csv += `"${r.pincode}","${r.status}","${r.region}","${r.city}","${r.district}"\n`;
    });
    downloadBlob(csv, 'tanzania-pincodes-batch.csv', 'text/csv');
    showToast('📥 CSV export downloaded!');
  }

  function exportBulkJson() {
    if (!bulkResultsCache.length) return;
    const json = JSON.stringify(bulkResultsCache, null, 2);
    downloadBlob(json, 'tanzania-pincodes-batch.json', 'application/json');
    showToast('📥 JSON export downloaded!');
  }

  function downloadBlob(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ============================================================
     DIRECTORY EXPLORER
     ============================================================ */
  let activeRegionFilter = 'ALL';

  async function loadDirectoryData() {
    let list = [];

    if (state.isApiLive) {
      try {
        const res = await fetch(`${state.apiBaseUrl}/pincodes/all`);
        if (res.ok) list = await res.json();
      } catch (e) {
        // Fallback
      }
    }

    if (!list || list.length === 0) {
      list = Object.values(fallbackDb);
    }

    state.allPincodes = list;
    els.totalDirCount.textContent = list.length;

    buildRegionPills(list);
    renderDirectoryGrid(list);
  }

  function buildRegionPills(list) {
    const regions = Array.from(new Set(list.map(i => i.region))).sort();
    let pillsHtml = `<button class="filter-pill active" data-region="ALL">All Regions (${list.length})</button>`;

    regions.forEach(reg => {
      const count = list.filter(i => i.region === reg).length;
      pillsHtml += `<button class="filter-pill" data-region="${escapeHtml(reg)}">${escapeHtml(reg)} (${count})</button>`;
    });

    els.regionFiltersBar.innerHTML = pillsHtml;

    els.regionFiltersBar.querySelectorAll('.filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        els.regionFiltersBar.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeRegionFilter = btn.getAttribute('data-region');
        applyDirectoryFilters();
      });
    });
  }

  function setupDirectory() {
    els.directorySearchInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      els.directoryClearSearch.style.display = val.length > 0 ? 'block' : 'none';
      applyDirectoryFilters();
    });

    els.directoryClearSearch.addEventListener('click', () => {
      els.directorySearchInput.value = '';
      els.directoryClearSearch.style.display = 'none';
      applyDirectoryFilters();
    });
  }

  function applyDirectoryFilters() {
    const query = (els.directorySearchInput.value || '').toLowerCase();
    let filtered = state.allPincodes;

    if (activeRegionFilter !== 'ALL') {
      filtered = filtered.filter(i => i.region === activeRegionFilter);
    }

    if (query) {
      filtered = filtered.filter(i =>
        i.pincode.toLowerCase().includes(query) ||
        i.region.toLowerCase().includes(query) ||
        i.city.toLowerCase().includes(query) ||
        i.district.toLowerCase().includes(query)
      );
    }

    renderDirectoryGrid(filtered);
  }

  function renderDirectoryGrid(items) {
    if (!items.length) {
      els.directoryGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">
          <p style="font-size: 1.5rem; margin-bottom: 0.5rem;">🔍</p>
          <p>No matching Tanzanian postal codes found.</p>
        </div>
      `;
      return;
    }

    let html = '';
    items.forEach(item => {
      html += `
        <div class="dir-card">
          <div>
            <div class="dir-card-top">
              <span class="dir-pincode">${escapeHtml(item.pincode)}</span>
              <span class="dir-region-badge">${escapeHtml(item.region)}</span>
            </div>
            <div class="dir-location">
              <h4>${escapeHtml(item.district)}</h4>
              <p>${escapeHtml(item.city)}, ${escapeHtml(item.region)}</p>
            </div>
          </div>
          <div class="dir-card-bottom">
            <button class="btn btn-outline btn-sm" onclick="window.testPincodeInSingle('${escapeHtml(item.pincode)}')">
              <span>Test Pincode ⚡</span>
            </button>
          </div>
        </div>
      `;
    });

    els.directoryGrid.innerHTML = html;
  }

  /* ============================================================
     API PLAYGROUND
     ============================================================ */
  function setupPlayground() {
    els.consoleMethod.addEventListener('change', () => {
      els.requestBodyWrapper.style.display = els.consoleMethod.value === 'POST' ? 'block' : 'none';
    });

    els.consoleSendBtn.addEventListener('click', runPlaygroundRequest);
  }

  async function runPlaygroundRequest() {
    const method = els.consoleMethod.value;
    const path = els.consoleUrl.value.trim();
    const url = path.startsWith('http') ? path : `${state.apiBaseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
    const bodyText = els.consoleRequestBody.value.trim();

    setLoading(els.consoleSendBtn, true);
    els.responseStatusBadge.textContent = 'Executing...';
    els.consoleResponseBody.textContent = '// Sending request to ' + url + '...';

    const startTime = performance.now();
    try {
      const options = {
        method,
        headers: { 'Accept': 'application/json' }
      };

      if (method === 'POST') {
        options.headers['Content-Type'] = 'application/json';
        options.body = bodyText || '{}';
      }

      const res = await fetch(url, options);
      const duration = Math.round(performance.now() - startTime);
      const json = await res.json();

      setLoading(els.consoleSendBtn, false);
      els.responseStatusBadge.textContent = `Status: ${res.status} ${res.statusText} (${duration}ms)`;
      els.responseStatusBadge.style.color = res.ok ? 'var(--coral)' : '#ef4444';
      els.consoleResponseBody.textContent = JSON.stringify(json, null, 2);
    } catch (err) {
      setLoading(els.consoleSendBtn, false);
      els.responseStatusBadge.textContent = 'Connection Error';
      els.responseStatusBadge.style.color = '#ef4444';
      els.consoleResponseBody.textContent = `Error: ${err.message}\nMake sure the FastAPI server is running at http://127.0.0.1:8000.`;
    }
  }

  /* ============================================================
     GLOBAL HELPER HOOKS (Accessible from HTML attributes)
     ============================================================ */
  window.searchPincode = function (code) {
    switchTab('lookup');
    els.pincodeInput.value = code;
    els.digitCounter.textContent = `${code.length}/6`;
    els.clearInputBtn.style.display = 'block';
    searchPincode(code);
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  window.testPincodeInSingle = function (code) {
    window.searchPincode(code);
  };

  window.setCheckoutPin = function (code) {
    els.checkoutPincode.value = code;
    els.checkoutPincode.dispatchEvent(new Event('input'));
  };

  window.openInCheckout = function (code) {
    switchTab('checkout');
    window.setCheckoutPin(code);
    window.scrollTo({ top: 250, behavior: 'smooth' });
  };

  window.copyFormattedAddress = function (district, city, region, pin) {
    const text = `${district}, ${city}, ${region} - ${pin}, Tanzania`;
    navigator.clipboard.writeText(text);
    showToast(`📋 Copied: "${text}"`);
  };

  window.copyJsonLocation = function () {
    if (!state.currentLocation) return;
    const text = JSON.stringify(state.currentLocation, null, 2);
    navigator.clipboard.writeText(text);
    showToast('📋 Copied JSON to clipboard!');
  };

  window.loadPlaygroundEndpoint = function (method, path, body = '') {
    switchTab('api');
    els.consoleMethod.value = method;
    els.consoleUrl.value = path;
    els.requestBodyWrapper.style.display = method === 'POST' ? 'block' : 'none';
    if (body) els.consoleRequestBody.value = body;
    runPlaygroundRequest();
  };

  /* ============================================================
     UTILITIES
     ============================================================ */
  function setLoading(btn, isLoading) {
    const spinner = btn.querySelector('.btn-spinner');
    if (spinner) spinner.style.display = isLoading ? 'inline-block' : 'none';
    btn.disabled = isLoading;
  }

  function showToast(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    els.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Run on page load
  document.addEventListener('DOMContentLoaded', init);
})();
