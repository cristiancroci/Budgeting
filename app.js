/* ============================
   CONFIG
============================ */

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxQG6CxE_JjAjw9nd6AVo_j1zQlS7tePiFBwX8Dbq3VF_NmnEYCsoIQk5Ii5M9Q8cT3Fw/exec";

let data = {
  budget: 0,
  month: "Gennaio",
  year: 2026,
  expenses: []
};



let editIndex = null;
let isSaving = false;

/* ============================
   SEMAFORO (SOLO SALVATAGGIO)
============================ */

function setStatusSaving() {
  const s = document.getElementById("saveStatus");
  s.className = "statusIndicator saving";
  s.textContent = "🟡 Salvataggio...";
}

function setStatusOK() {
  const s = document.getElementById("saveStatus");
  s.className = "statusIndicator ok";
  s.textContent = "🟢 Salvato";
}

function setStatusError() {
  const s = document.getElementById("saveStatus");
  s.className = "statusIndicator error";
  s.textContent = "🔴 Errore salvataggio";
}


/* ============================
   LOAD DATA
============================ */

async function loadData() {
  try {
    setStatusSaving();
    const res = await fetch(SCRIPT_URL + "?action=get");
    const text = await res.text();
    data = JSON.parse(text);
    updateUI();
    setStatusOK();
  } catch {
    setStatusError();
  }
}

/* ============================
   SAVE DATA
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

    if (res.ok) setStatusOK();
    else setStatusError();
  } catch {
    setStatusError();
  }

  isSaving = false;
}

/* ============================
   GRUPPI 50‑30‑20
============================ */

const groupMap = {
  "Spesa": "necessita",
  "Bollette": "necessita",
  "Auto": "necessita",
  "Salute": "necessita",

  "Shopping": "desideri",
  "Tempo libero": "desideri",
  "Ristoranti": "desideri",
  "Hobby": "desideri",

  "Risparmio": "risparmio",
  "Investimenti": "risparmio"
};

/* ============================
   CALCOLI 50‑30‑20
============================ */

function calculateTotals() {
  const budget = data.budget || 0;

  const limits = {
    necessita: budget * 0.50,
    desideri: budget * 0.30,
    risparmio: budget * 0.20
  };

  const totals = { necessita: 0, desideri: 0, risparmio: 0 };

  data.expenses.forEach(e => {
    totals[e.group] += e.amount;
  });

  const residui = {
    necessita: limits.necessita - totals.necessita,
    desideri: limits.desideri - totals.desideri,
    risparmio: limits.risparmio - totals.risparmio
  };

  const totaleSpese = totals.necessita + totals.desideri + totals.risparmio;
  const residuoTotale = budget - totaleSpese;

  return { limits, totals, residui, totaleSpese, residuoTotale };
}

/* ============================
   UPDATE UI
============================ */

function updateUI() {
  document.getElementById("budgetInput").value = data.budget || "";
  document.getElementById("monthSelect").value = data.month;
  document.getElementById("yearSelect").value = data.year;

  renderList();
  updateSummary();
}

/* ============================
   UPDATE SUMMARY + BARRE
============================ */

function updateSummary() {
  const budget = data.budget || 0;

  const necLimitEl = document.getElementById("necLimit");
  const desLimitEl = document.getElementById("desLimit");
  const risLimitEl = document.getElementById("risLimit");

  const necUsedEl = document.getElementById("necUsed");
  const desUsedEl = document.getElementById("desUsed");
  const risUsedEl = document.getElementById("risUsed");

  const necLeftEl = document.getElementById("necLeft");
  const desLeftEl = document.getElementById("desLeft");
  const risLeftEl = document.getElementById("risLeft");

  const totaleSpeseEl = document.getElementById("totaleSpese");
  const residuoTotaleEl = document.getElementById("residuoTotale");

  const barNec = document.getElementById("barNec");
  const barDes = document.getElementById("barDes");
  const barRis = document.getElementById("barRis");

  if (budget <= 0) {
    necLimitEl.textContent = "0€";
    desLimitEl.textContent = "0€";
    risLimitEl.textContent = "0€";

    necUsedEl.textContent = "0€";
    desUsedEl.textContent = "0€";
    risUsedEl.textContent = "0€";

    necLeftEl.textContent = "0€";
    desLeftEl.textContent = "0€";
    risLeftEl.textContent = "0€";

    totaleSpeseEl.textContent = "0€";
    residuoTotaleEl.textContent = "0€";

    barNec.style.width = "0%";
    barDes.style.width = "0%";
    barRis.style.width = "0%";
    return;
  }

  const { limits, totals, residui, totaleSpese, residuoTotale } = calculateTotals();

  necLimitEl.textContent = limits.necessita.toFixed(2) + "€";
  desLimitEl.textContent = limits.desideri.toFixed(2) + "€";
  risLimitEl.textContent = limits.risparmio.toFixed(2) + "€";

  necUsedEl.textContent = totals.necessita.toFixed(2) + "€";
  desUsedEl.textContent = totals.desideri.toFixed(2) + "€";
  risUsedEl.textContent = totals.risparmio.toFixed(2) + "€";

  necLeftEl.textContent = residui.necessita.toFixed(2) + "€";
  desLeftEl.textContent = residui.desideri.toFixed(2) + "€";
  risLeftEl.textContent = residui.risparmio.toFixed(2) + "€";

  totaleSpeseEl.textContent = totaleSpese.toFixed(2) + "€";
  residuoTotaleEl.textContent = residuoTotale.toFixed(2) + "€";

  barNec.style.width = limits.necessita > 0
    ? Math.min((totals.necessita / limits.necessita) * 100, 100) + "%"
    : "0%";
  barDes.style.width = limits.desideri > 0
    ? Math.min((totals.desideri / limits.desideri) * 100, 100) + "%"
    : "0%";
  barRis.style.width = limits.risparmio > 0
    ? Math.min((totals.risparmio / limits.risparmio) * 100, 100) + "%"
    : "0%";
}

/* ============================
   ADD EXPENSE
============================ */

function addExpense() {
  const descInput = document.getElementById("descInput");
  const amountInput = document.getElementById("amountInput");
  const categoryInput = document.getElementById("categoryInput");
  const noteInput = document.getElementById("noteInput");
  const addBtn = document.getElementById("addBtn");

  const desc = descInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const category = categoryInput.value;
  const note = noteInput.value.trim();

  if (!desc || isNaN(amount)) return;
  if (!data.budget || data.budget <= 0) {
    alert("Inserisci prima un budget mensile.");
    return;
  }

  const group = groupMap[category];

  const entry = {
    desc,
    amount,
    category,
    group,
    note,
    date: new Date().toISOString().split("T")[0]
  };

  if (editIndex === null) {
    data.expenses.push(entry);
  } else {
    data.expenses[editIndex] = entry;
    editIndex = null;
    addBtn.textContent = "➕ Aggiungi spesa";
  }

  clearForm();
  renderList();
  updateSummary();
  saveData();
}

/* ============================
   EDIT
============================ */

function editExpense(i) {
  const e = data.expenses[i];

  document.getElementById("descInput").value = e.desc;
  document.getElementById("amountInput").value = e.amount;
  document.getElementById("categoryInput").value = e.category;
  document.getElementById("noteInput").value = e.note || "";

  editIndex = i;
  document.getElementById("addBtn").textContent = "💾 Salva modifica";
}

/* ============================
   DELETE
============================ */

function deleteExpense(i) {
  data.expenses.splice(i, 1);
  renderList();
  updateSummary();
  saveData();
}

/* ============================
   CLEAR FORM
============================ */

function clearForm() {
  document.getElementById("descInput").value = "";
  document.getElementById("amountInput").value = "";
  document.getElementById("noteInput").value = "";
  document.getElementById("categoryInput").value = "Spesa";
}

/* ============================
   RENDER LIST
============================ */

function renderList() {
  const list = document.getElementById("list");
  list.innerHTML = "";

  data.expenses.forEach((e, i) => {
    const div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      <div class="itemTitle">${e.desc} — ${e.amount.toFixed(2)}€</div>
      <div class="itemSub">${e.category} • ${e.date}</div>
      ${e.note ? `<div class="itemNote">${e.note}</div>` : ""}
      <div class="itemBtns">
        <button class="btn-orange" onclick="editExpense(${i})">✏️ Modifica</button>
        <button class="btn-red" onclick="deleteExpense(${i})">🗑️ Elimina</button>
      </div>
    `;

    list.appendChild(div);
  });
}

/* ============================
   LISTENERS
============================ */

document.getElementById("budgetInput").addEventListener("change", () => {
  const val = parseFloat(document.getElementById("budgetInput").value);
  data.budget = isNaN(val) ? 0 : val;
  updateSummary();
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

/* ============================
   START
============================ */

loadData();