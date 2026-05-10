/* ============================
   CONFIGURAZIONE
============================ */

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

/* ============================
   BLOCCO USCITA DURANTE SALVATAGGIO
============================ */

window.addEventListener("beforeunload", function (e) {
  if (isSaving) {
    e.preventDefault();
    e.returnValue = "";
  }
});

/* ============================
   SEMAFORO
============================ */

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
  s.className = "statusIndicator error";
  s.textContent = "🔴 Errore";
}

/* ============================
   CARICAMENTO DATI
============================ */

async function loadData() {
  try {
    setStatusSaving();
    const res = await fetch(SCRIPT_URL + "?action=get");
    const json = await res.json();

    data = json || data;

    updateUIFromData();
    setStatusOK();
  } catch (e) {
    console.error("Errore loadData:", e);
    setStatusError();
  }
}

/* ============================
   SALVATAGGIO DATI
============================ */

async function saveData() {
  if (isSaving) return;
  isSaving = true;
  setStatusSaving();

  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const json = await res.json();

    if (json && json.status === "ok") {
      setStatusOK();
    } else {
      console.error("Risposta non OK:", json);
      setStatusError();
    }
  } catch (e) {
    console.error("Errore saveData:", e);
    setStatusError();
  } finally {
    isSaving = false;
  }
}

/* ============================
   AGGIORNAMENTO UI
============================ */

function updateUIFromData() {
  document.getElementById("budgetInput").value = data.budget;
  document.getElementById("monthSelect").value = data.month;
  document.getElementById("yearSelect").value = data.year;

  renderExpenses();
  updateCharts();
}

/* ============================
   GESTIONE SPESE
============================ */

function addExpense() {
  const desc = document.getElementById("descInput").value.trim();
  const amount = parseFloat(document.getElementById("amountInput").value);
  const category = document.getElementById("categoryInput").value.trim();

  if (!desc || isNaN(amount) || amount <= 0) return;

  data.expenses.push({
    desc,
    amount,
    category,
    date: new Date().toISOString().split("T")[0]
  });

  renderExpenses();
  saveData();
}

function renderExpenses() {
  const list = document.getElementById("expenseList");
  list.innerHTML = "";

  data.expenses.forEach((exp, i) => {
    const li = document.createElement("li");
    li.className = "expenseItem";
    li.innerHTML = `
      <span>${exp.date} — ${exp.desc} (${exp.category})</span>
      <strong>${exp.amount.toFixed(2)} €</strong>
    `;
    list.appendChild(li);
  });
}

/* ============================
   CHARTS
============================ */

function updateCharts() {
  // Qui puoi reinserire i grafici se li usi
}

/* ============================
   EVENTI
============================ */

document.getElementById("budgetInput").addEventListener("change", () => {
  data.budget = parseFloat(document.getElementById("budgetInput").value) || 0;
  saveData();
});

document.getElementById("monthSelect").addEventListener("change", () => {
  data.month = document.getElementById("monthSelect").value;
  saveData();
});

document.getElementById("yearSelect").addEventListener("change", () => {
  data.year = parseInt(document.getElementById("yearSelect").value);
  saveData();
});

document.getElementById("addBtn").addEventListener("click", addExpense);

/* ============================
   AVVIO
============================ */

loadData();