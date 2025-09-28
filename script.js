window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('splashScreen').style.display = 'none';
    document.getElementById('loginPage').style.display = 'flex';
  }, 4000); // 2 seconds
});

// ==================== Login Logic ====================
const loginPage = document.getElementById('loginPage');
const dashboard = document.getElementById('dashboard');
let loggedInUser = null;

// ==================== Navbar Section Switch ====================
const navLinks = document.querySelectorAll('.nav-links li');
const sections = {
  dashboardSection: document.getElementById('dashboardSection'),
  forecastSection: document.getElementById('forecastSection'),
  reportsSection: document.getElementById('reportsSection'),
  settingsSection: document.getElementById('settingsSection')
};

function showSection(name){
  Object.values(sections).forEach(sec => sec.style.display='none');
  sections[name].style.display='block';
}
navLinks.forEach(link => {
  link.addEventListener('click', () => showSection(link.dataset.section));
});

// ==================== Financial Data ====================
let financialData = { cash:100000, fixedCosts:20000, unitsSold:500, unitPrice:100, salaries:30000 };
let usageCountMain = 0;

// ==================== DOM Elements ====================
const hiringSlider = document.getElementById("hiring");
const marketingSlider = document.getElementById("marketing");
const priceSlider = document.getElementById("price");
const hiringValue = document.getElementById("hiringValue");
const marketingValue = document.getElementById("marketingValue");
const priceValue = document.getElementById("priceValue");

const revenueEl = document.getElementById("revenue");
const expensesEl = document.getElementById("expenses");
const profitEl = document.getElementById("profit");
const runwayEl = document.getElementById("runway");
const usageCountEl = document.getElementById("usageCount");

const simulateBtn = document.getElementById("simulateBtn");
const simulateBtnHero = document.getElementById("simulateBtnHero");
const exportPDFBtn = document.getElementById("exportPDFBtn");

let chart;

// ==================== Slider Updates ====================
hiringSlider.oninput = () => hiringValue.textContent = hiringSlider.value;
marketingSlider.oninput = () => marketingValue.textContent = marketingSlider.value;
priceSlider.oninput = () => priceValue.textContent = priceSlider.value;

// ==================== Reports History ====================
const historyLog = document.getElementById("historyLog");

async function addReportEntry(simulationType, hiring, marketing, priceIncrease, revenue, expenses, profit, runway) {
  const date = new Date().toLocaleString();
  const recommendBox = document.getElementById("recommendText");
  const suggestion = recommendBox ? recommendBox.textContent : "";

  const li = document.createElement("li");
  li.className = "history-item";
  li.innerHTML = `
    <strong>${simulationType} Simulation - ${date}</strong><br>
    Hiring: ${hiring}, Marketing: ₹${marketing}, Price Increase: ${priceIncrease}%<br>
    Revenue: ₹${revenue.toFixed(2)}, Expenses: ₹${expenses.toFixed(2)}, Profit: ₹${profit.toFixed(2)}, Runway: ${runway} months
    <br>Suggestion: ${suggestion}
  `;
  historyLog.prepend(li);

  // Save to backend if user is logged in
  if (loggedInUser) {
    try{
      const res = await fetch(`${API_BASE}/save-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loggedInUser,
          entry: {
            simulationType,
            hiring,
            marketing,
            priceIncrease,
            revenue,
            expenses,
            profit,
            runway,
            suggestion,
            date
          }
        })
      });
      if(!res.ok) console.warn('Failed to save history', res.status);
    }catch(e){
      console.warn('Could not save history to backend', e);
    }
  }
}

// ==================== Main Simulation ====================
function simulate(){
  const hiring = parseInt(hiringSlider.value);
  const marketing = parseFloat(marketingSlider.value);
  const priceIncrease = parseFloat(priceSlider.value);
  const newPrice = financialData.unitPrice * (1 + priceIncrease/100);

  const revenue = financialData.unitsSold * newPrice;
  const expenses = financialData.fixedCosts + marketing + financialData.salaries + (hiring*5000);
  const profit = revenue - expenses;
  const runwayMonths = expenses ? (financialData.cash / expenses).toFixed(1) : 0;

  revenueEl.textContent = `Revenue: ₹${revenue.toFixed(2)}`;
  expensesEl.textContent = `Expenses: ₹${expenses.toFixed(2)}`;
  profitEl.textContent = `Profit: ₹${profit.toFixed(2)}`;
  runwayEl.textContent = `Runway: ${runwayMonths} months`;

  const chartData = [revenue, expenses, profit];
  if(chart){
    chart.data.datasets[0].data = chartData;
    chart.update();
  } else {
    const ctx = document.getElementById('chart').getContext('2d');
    chart = new Chart(ctx, {
      type:'bar',
      data:{
        labels:["Revenue","Expenses","Profit"],
        datasets:[{ label:"Amount (₹)", data:chartData, backgroundColor:["#4ade80","#f87171","#60a5fa"] }]
      },
      options:{ responsive:true }
    });
  }

  usageCountMain++;
  usageCountEl.textContent = usageCountMain;

  // Recommendations
  const recommendBox = document.getElementById("recommendText");
  let rec = [];
  if(hiring>5) rec.push("High hiring might increase expenses.");
  if(marketing>40000) rec.push("Consider optimizing marketing spend.");
  if(priceIncrease>20) rec.push("High price increase might reduce sales.");
  recommendBox.textContent = rec.length ? rec.join(" ") : "All metrics are within safe range.";

  // Add to reports
  addReportEntry("Dashboard", hiring, marketing, priceIncrease, revenue, expenses, profit, runwayMonths);
}

// ==================== Event Listeners ====================
simulateBtn.addEventListener("click", simulate);
simulateBtnHero.addEventListener("click", simulate);

// ==================== PDF Export ====================
exportPDFBtn.addEventListener("click", async () => {
  const { jsPDF } = window.jspdf;
  const container = document.getElementById("forecastContainer");
  const canvas = await html2canvas(container,{scale:2});
  const imgData = canvas.toDataURL("image/png");
  const doc = new jsPDF();
  const pdfWidth = doc.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height*pdfWidth)/canvas.width;
  doc.addImage(imgData,"PNG",0,0,pdfWidth,pdfHeight);
  doc.save("CFO_Helper_Report.pdf");
});

// ==================== Settings ====================
const currencyInput = document.getElementById("currencySymbol");
const defaultUnitsInput = document.getElementById("defaultUnits");
const defaultPriceInput = document.getElementById("defaultPrice");
const fixedCostsInput = document.getElementById("fixedCosts");
const salariesInput = document.getElementById("salaries");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");

saveSettingsBtn.addEventListener("click", () => {
  financialData.unitsSold = parseInt(defaultUnitsInput.value) || 500;
  financialData.unitPrice = parseFloat(defaultPriceInput.value) || 100;
  financialData.fixedCosts = parseFloat(fixedCostsInput.value) || 20000;
  financialData.salaries = parseFloat(salariesInput.value) || 30000;
  alert(`Settings saved! Currency: ${currencyInput.value || "₹"}`);
});

// ==================== Forecast Panel ====================
const hiringForecast = document.getElementById("hiringForecast");
const marketingForecast = document.getElementById("marketingForecast");
const priceForecast = document.getElementById("priceForecast");

const hiringValueForecast = document.getElementById("hiringValueForecast");
const marketingValueForecast = document.getElementById("marketingValueForecast");
const priceValueForecast = document.getElementById("priceValueForecast");

const revenueForecast = document.getElementById("revenueForecast");
const expensesForecast = document.getElementById("expensesForecast");
const profitForecast = document.getElementById("profitForecast");
const runwayForecast = document.getElementById("runwayForecast");
const usageCountForecast = document.getElementById("usageCountForecast");

const simulateForecastBtn = document.getElementById("simulateForecastBtn");
const forecastChartElForecast = document.getElementById("forecastChartForecast");
const exportForecastBtnForecast = document.getElementById("exportForecastBtnForecast");

let forecastChartForecastObj;
let usageCountF = 0;

// ==================== Forecast Slider Updates ====================
hiringForecast.oninput = () => hiringValueForecast.textContent = hiringForecast.value;
marketingForecast.oninput = () => marketingValueForecast.textContent = marketingForecast.value;
priceForecast.oninput = () => priceValueForecast.textContent = priceForecast.value;

// ==================== Forecast Simulation ====================
function simulateForecast() {
  const hiring = parseInt(hiringForecast.value);
  const marketing = parseFloat(marketingForecast.value);
  const priceIncrease = parseFloat(priceForecast.value);
  const newPrice = financialData.unitPrice * (1 + priceIncrease/100);

  const revenue = financialData.unitsSold * newPrice;
  const expenses = financialData.fixedCosts + marketing + financialData.salaries + (hiring * 5000);
  const profit = revenue - expenses;
  const runwayMonths = expenses ? (financialData.cash / expenses).toFixed(1) : 0;

  revenueForecast.textContent = `Revenue: ₹${revenue.toFixed(2)}`;
  expensesForecast.textContent = `Expenses: ₹${expenses.toFixed(2)}`;
  profitForecast.textContent = `Profit: ₹${profit.toFixed(2)}`;
  runwayForecast.textContent = `Runway: ${runwayMonths} months`;

  const chartData = [revenue, expenses, profit];
  if(forecastChartForecastObj){
    forecastChartForecastObj.data.datasets[0].data = chartData;
    forecastChartForecastObj.update();
  } else {
    const ctx = forecastChartElForecast.getContext('2d');
    forecastChartForecastObj = new Chart(ctx, {
      type:'bar',
      data:{
        labels:["Revenue","Expenses","Profit"],
        datasets:[{ label:"Amount (₹)", data:chartData, backgroundColor:["#4ade80","#f87171","#60a5fa"] }]
      },
      options:{ responsive:true }
    });
  }

  usageCountF++;
  usageCountForecast.textContent = usageCountF;

  // Add to reports
  addReportEntry("Forecast", hiring, marketing, priceIncrease, revenue, expenses, profit, runwayMonths);
}

// ==================== Forecast PDF Export ====================
exportForecastBtnForecast.addEventListener("click", async () => {
  const { jsPDF } = window.jspdf;
  const canvas = await html2canvas(document.getElementById("forecastContainerForecast"), { scale:2 });
  const imgData = canvas.toDataURL("image/png");
  const doc = new jsPDF();
  const pdfWidth = doc.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  doc.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  doc.save("CFO_Helper_Forecast.pdf");
});

// ==================== Forecast Event Listener ====================
simulateForecastBtn.addEventListener("click", simulateForecast);

// ==================== Login API Integration ====================
// If you're using a static dev server (eg Live Server) on port 5501
// we need to forward API calls to the backend (usually running on :3001).
// When the frontend is served by the backend itself, API_BASE should be '' (same origin).
const API_BASE = (window.location.port === '5501') ? 'http://localhost:3001' : '';

// helper to safely parse JSON (avoids 'Unexpected end of JSON input')
async function safeParseJson(response){
  try{
    // if there's no body, res.json() will throw - handle that
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }catch(e){
    console.warn('Failed to parse JSON response', e);
    return null;
  }
}

document.getElementById('loginBtn').addEventListener('click', async () => {
  const user = document.getElementById('username').value;
  const pass = document.getElementById('password').value;
  if(user && pass){
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user, password: pass })
    });
    const data = await safeParseJson(res);
    if(res.ok){
      loggedInUser = user;
      loginPage.style.display = 'none';
      dashboard.style.display = 'block';

      // Fetch and display user history
      fetch(`${API_BASE}/get-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user })
      })
      .then(res => safeParseJson(res))
      .then(data => {
        if(data && data.history){
          historyLog.innerHTML = '';
          data.history.forEach(entry => {
            const li = document.createElement("li");
            li.className = "history-item";
            li.innerHTML = `
              <strong>${entry.simulationType} Simulation - ${entry.date}</strong><br>
              Hiring: ${entry.hiring}, Marketing: ₹${entry.marketing}, Price Increase: ${entry.priceIncrease}%<br>
              Revenue: ₹${entry.revenue.toFixed(2)}, Expenses: ₹${entry.expenses.toFixed(2)}, Profit: ₹${entry.profit.toFixed(2)}, Runway: ${entry.runway} months
              <br>Suggestion: ${entry.suggestion}
            `;
            historyLog.appendChild(li);
          });
        }
      });
    } else {
      alert(data.message);
    }
  } else {
    alert('Enter username and password');
  }
});

// ==================== Signup Logic ====================
{
  const showSignupBtn = document.getElementById('showSignupBtn');
  const signupForm = document.getElementById('signupForm');
  const signupBtn = document.getElementById('signupBtn');

  // Only attach handlers if the elements exist (keeps script robust)
  if(showSignupBtn && signupForm){
    showSignupBtn.addEventListener('click', () => {
      signupForm.style.display = signupForm.style.display === 'none' ? 'block' : 'none';
    });
  }

  if(signupBtn && signupForm){
    signupBtn.addEventListener('click', async () => {
      const usernameInput = document.getElementById('signupUsername');
      const passwordInput = document.getElementById('signupPassword');
      const username = usernameInput ? usernameInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';
      if(username && password){
        try{
          const res = await fetch(`${API_BASE}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
          });
          const data = await safeParseJson(res);
          if(res.ok){
            alert('Signup successful! Please login.');
            signupForm.style.display = 'none';
            // Optionally prefill login username
            const loginUser = document.getElementById('username');
            if(loginUser) loginUser.value = username;
          } else {
            alert(data.message || 'Signup failed');
          }
        } catch(err) {
          console.error('Signup error', err);
          alert('Could not reach signup server');
        }
      } else {
        alert('Enter username and password');
      }
    });
  }
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    loggedInUser = null;
    dashboard.style.display = 'none';
    loginPage.style.display = 'block';
    // Optionally clear fields or history
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    if (historyLog) historyLog.innerHTML = '';
  });
}