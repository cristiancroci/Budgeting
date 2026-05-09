const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx48SC5rxyMwtcBYEuAtIEUTjEdJIJ3zF0ZaAZ8omRPNBu8vcokvw0kuRY1u2T4vmCRYw/exec";


let data = {
  budget: 0,
  month: "Gennaio",
  year: 2026,
  expenses: []
};

let editIndex = null;
let isSaving = false;

const months = [
  "Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno",
  "Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"
];

let dailyChart = null;
let categoryChart = null;

/* BLOCCO CHIUSURA PAGINA DURANTE SALVATAGGIO */
window.addEventListener("beforeunload", function (e) {
  if (isSaving) {
    e.preventDefault();
    e.returnValue = "";
  }
});

/* SEMAFORO */
function setStatusSaving() {
  const s = document.getElementById("saveStatus");
  if (!s) return;
  s.className = "statusIndicator saving";
  s.textContent = "🟡 Salvataggio...";
}

function setStatusOK() {
  const s = document.getElementById("saveStatus");
  if (!s) return;
  s.className = "statusIndicator ok";
  s.textContent = "🟢 Salvato";
}

function setStatusError() {
  const s = document.getElementById("saveStatus");
  if (!s) return;
  s.className = "statusIndicator err";
  s.textContent = "🔴 Errore";
}

/* INIT */
window.onload = () => {
  buildMonthSlider();
  initYearSelect();
  loadData();
};

function initYearSelect() {
  const yearSelect = document.getElementById("yearSelect");
  yearSelect.value = data.year;
  yearSelect.onchange = () => {
    data.year = parseInt(yearSelect.value);
    saveData();
    refreshAll();
  };
}

function buildMonthSlider() {
  const slider = document.getElementById("monthSlider");
  slider.innerHTML = "";
  months.forEach(m => {
    const div = document.createElement("div");
    div.textContent = m;
    if (m === data.month) div.classList.add("active");
    div.onclick = () => {
      data.month = m;
      buildMonthSlider();
      refreshAll();
      saveData();
    };
    slider.appendChild(div);
  });
}

/* BUDGET */
function setBudget() {
  const val = parseFloat(document.getElementById("budgetInput").value);
  if (!isNaN(val) && val >= 0) {
    data.budget = val;
    data.year = parseInt(document.getElementById("yearSelect").value);
    saveData();
    refreshAll();
  }
}

/* AGGIUNTA SPESA */
function addExpense() {
  const title = document.getElementById("titleInput").value.trim();
  const amount = parseFloat(document.getElementById("amountInput").value);
  const category = document.getElementById("categoryInput").value;
  const date = document.getElementById("dateInput").value;
  const note = document.getElementById("noteInput").value.trim();

  if (!title || isNaN(amount) || !category || !date) return;

  data.expenses.push({ title, amount, category, date, note });

  clearForm();
  saveData();
  refreshAll();
}

/* MODIFICA */
function startEdit(index) {
  editIndex = index;
  const e = data.expenses[index];

  document.getElementById("titleInput").value = e.title;
  document.getElementById("amountInput").value = e.amount;
  document.getElementById("categoryInput").value = e.category;
  document.getElementById("dateInput").value = e.date;
  document.getElementById("noteInput").value = e.note;

  document.getElementById("formTitle").textContent = "Modifica spesa";
  document.getElementById("saveBtn").style.display = "none";
  document.getElementById("editBtn").style.display = "block";
  document.getElementById("cancelEditBtn").style.display = "block";
}

function saveEdit() {
  if (editIndex === null) return;

  const title = document.getElementById("titleInput").value.trim();
  const amount = parseFloat(document.getElementById("amountInput").value);
  const category = document.getElementById("categoryInput").value;
  const date = document.getElementById("dateInput").value;
  const note = document.getElementById("noteInput").value.trim();

  data.expenses[editIndex] = { title, amount, category, date, note };

  editIndex = null;
  clearForm();
  saveData();
  refreshAll();
}

function cancelEdit() {
  editIndex = null;
  clearForm();
}

/* ELIMINA */
function deleteExpense(index) {
  const e = data.expenses[index];

  if (!confirm(`Vuoi eliminare questa spesa?\n\n${e.date} - ${e.title} (€${e.amount})`)) {
    return;
  }

  data.expenses.splice(index, 1);
  saveData();
  refreshAll();
}

/* FORM RESET */
function clearForm() {
  document.getElementById("titleInput").value = "";
  document.getElementById("amountInput").value = "";
  document.getElementById("categoryInput").selectedIndex = 0;
  document.getElementById("dateInput").value = "";
  document.getElementById("noteInput").value = "";

  document.getElementById("formTitle").textContent = "Aggiungi spesa";
  document.getElementById("saveBtn").style.display = "block";
  document.getElementById("editBtn").style.display = "none";
  document.getElementById("cancelEditBtn").style.display = "none";
}

/* DASHBOARD */
function refreshAll() {
  updateDashboard();
  drawCharts();
  updateHistory();
}

function updateDashboard() {
  const dash = document.getElementById("dashboardContent");
  const budget = data.budget || 0;

  const necessity = ["Casa","Spesa","Auto","Bollette","Salute"];
  const desires = ["Ristoranti","Tempo libero","Shopping","Hobby"];
  const savings = ["Risparmio","Investimenti"];

  let totalNec = 0, totalDes = 0, totalSav = 0, totalAll = 0;

  const currentMonthIndex = months.indexOf(data.month);
  const currentYear = data.year;

  data.expenses.forEach(e => {
    const d = new Date(e.date);
    if (d.getMonth() === currentMonthIndex && d.getFullYear() === currentYear) {
      totalAll += e.amount;
      if (necessity.includes(e.category)) totalNec += e.amount;
      if (desires.includes(e.category)) totalDes += e.amount;
      if (savings.includes(e.category)) totalSav += e.amount;
    }
  });

  const bNec = budget * 0.5;
  const bDes = budget * 0.3;
  const bSav = budget * 0.2;

  dash.innerHTML = `
    <div class="entryRow"><span class="label">Mese:</span> ${data.month} ${data.year}</div>
    <div class="entryRow"><span class="label">Budget:</span> €${budget.toFixed(2)}</div>
    <div class="entryRow"><span class="label">Spesa totale:</span> €${totalAll.toFixed(2)}</div>
    <div class="entryRow"><span class="label">Rimasto:</span> €${(budget - totalAll).toFixed(2)}</div>
    <div class="entryRow"><span class="label">Necessità (50%):</span> €${totalNec.toFixed(2)} / €${bNec.toFixed(2)}</div>
    <div class="entryRow"><span class="label">Desideri (30%):</span> €${totalDes.toFixed(2)} / €${bDes.toFixed(2)}</div>
    <div class="entryRow"><span class="label">Risparmio (20%):</span> €${totalSav.toFixed(2)} / €${bSav.toFixed(2)}</div>
  `;
}

/* GRAFICI */
function drawCharts() {
  const currentMonthIndex = months.indexOf(data.month);
  const currentYear = data.year;

  const daily = new Array(31).fill(0);
  const categories = {};

  data.expenses.forEach(e => {
    const d = new Date(e.date);
    if (d.getMonth() === currentMonthIndex && d.getFullYear() === currentYear) {
      const day = d.getDate();
      daily[day - 1] += e.amount;
      categories[e.category] = (categories[e.category] || 0) + e.amount;
    }
  });

  const ctx1 = document.getElementById("dailyChart").getContext("2d");
  if (dailyChart) dailyChart.destroy();
  dailyChart = new Chart(ctx1, {
    type: "bar",
    data: {
      labels: [...Array(31).keys()].map(i => i + 1),
      datasets: [{
        label: "Spesa giornaliera",
        data: daily,
        backgroundColor: "#4da6ff"
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: "#ffffff" } },
        y: { ticks: { color: "#ffffff" } }
      }
    }
  });

  const ctx2 = document.getElementById("categoryChart").getContext("2d");
  if (categoryChart) categoryChart.destroy();
  categoryChart = new Chart(ctx2, {
    type: "bar",
    data: {
      labels: Object.keys(categories),
      datasets: [{
        label: "Spesa per categoria",
        data: Object.values(categories),
        backgroundColor: "#66ff99"
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: "#ffffff" } },
        y: { ticks: { color: "#ffffff" } }
      }
    }
  });
}

/* STORICO */
function updateHistory() {
  const list = document.getElementById("historyList");
  list.innerHTML = "";

  const currentMonthIndex = months.indexOf(data.month);
  const currentYear = data.year;

  const filtered = data.expenses
    .map((e, i) => ({ ...e, index: i }))
    .filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonthIndex && d.getFullYear() === currentYear;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  filtered.forEach(e => {
    const div = document.createElement("div");
    div.className = "historyItem";

    div.innerHTML = `
      ${e.date} - ${e.title} (€${e.amount.toFixed(2)}) [${e.category}]
      <div class="historyButtons">
        <button class="btn-orange" onclick="startEdit(${e.index})">✏️ Modifica</button>
        <button class="btn-red" onclick="deleteExpense(${e.index})">🗑️ Elimina</button>
      </div>
    `;

    list.appendChild(div);
  });
}

/* SYNC CON DRIVE */
function loadData() {
  isSaving = true;
  setStatusSaving();

  fetch(SCRIPT_URL + '?action=get')
    .then(r => r.json())
    .then(res => {
      if (res && res.budget !== undefined) {
        data = res;
        document.getElementById("budgetInput").value = data.budget || "";
        document.getElementById("yearSelect").value = data.year || 2026;
      }
      buildMonthSlider();
      refreshAll();
      setStatusOK();
      isSaving = false;
    })
    .catch(() => {
      refreshAll();
      setStatusError();
      isSaving = false;
    });
}

function saveData() {
  isSaving = true;
  setStatusSaving();

  fetch(SCRIPT_URL + '?action=save', {
    method: 'POST',
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  })
  .then(r => r.json())
  .then(res => {
    if (res.status === "ok") {
      setStatusOK();
      isSaving = false;
    } else {
      setStatusError();
      isSaving = false;
    }
  })
  .catch(() => {
    setStatusError();
    isSaving = false;
  });
}