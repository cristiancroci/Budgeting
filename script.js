var budgets = {};
var income = 0;
var pie = null;

function getRows() {
  return Array.prototype.slice.call(
    document.querySelectorAll("#categories .row")
  );
}

function updatePercentSum() {
  var sum = 0;
  var rows = getRows();
  for (var i = 0; i < rows.length; i++) {
    var p = parseFloat(rows[i].querySelector(".cat-percent").value) || 0;
    sum += p;
  }
  var info = document.getElementById("sumInfo");
  info.textContent = "Somma percentuali: " + sum + "%";
  info.style.color = sum !== 100 ? "#ff3b30" : "#00ff9d";
}

document.getElementById("categories").addEventListener("input", function () {
  updatePercentSum();
});
updatePercentSum();

document.getElementById("calcBtn").onclick = function () {
  income = parseFloat(document.getElementById("income").value);
  if (!income) {
    alert("Inserisci un reddito valido");
    return;
  }

  budgets = {};
  var results = document.getElementById("results");
  results.innerHTML = "<h2>Budget calcolato</h2>";

  var html = "";
  var select = document.getElementById("expenseCat");
  select.innerHTML = "";

  var rows = getRows();
  for (var i = 0; i < rows.length; i++) {
    var name = rows[i].querySelector(".cat-name").value;
    var p = parseFloat(rows[i].querySelector(".cat-percent").value) || 0;
    var max = income * (p / 100);

    budgets[name] = { max: max, spent: 0, items: [] };

    html += '<div style="margin-bottom:15px">' +
      "<strong>" + name + "</strong> — " + p + "%<br>" +
      "Budget: " + max.toFixed(2) + " €<br>" +
      'Speso: <span id="spent-' + name + '">0.00</span> €<br>' +
      'Rimanente: <span id="left-' + name + '">' + max.toFixed(2) + "</span> €" +
      '<div class="bar"><div class="bar-fill" id="bar-' + name + '"></div></div>' +
      '<div id="list-' + name + '"></div>' +
      "</div>";

    var opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  }

  results.innerHTML += html;
  drawChart();
};

document.getElementById("addExpense").onclick = function () {
  var cat = document.getElementById("expenseCat").value;
  var name = document.getElementById("expenseName").value.replace(/^\s+|\s+$/g, "");
  var amount = parseFloat(document.getElementById("expenseAmount").value);

  if (!name) {
    alert("Inserisci il nome della spesa");
    return;
  }
  if (!amount || amount <= 0) {
    alert("Inserisci un importo valido");
    return;
  }
  if (!budgets[cat]) {
    alert("Prima calcola il budget");
    return;
  }

  budgets[cat].items.push({ name: name, amount: amount });
  budgets[cat].spent += amount;

  updateCategoryUI(cat);
  drawChart();

  document.getElementById("expenseName").value = "";
  document.getElementById("expenseAmount").value = "";
};

function updateCategoryUI(cat) {
  var left = budgets[cat].max - budgets[cat].spent;

  document.getElementById("spent-" + cat).textContent =
    budgets[cat].spent.toFixed(2);
  document.getElementById("left-" + cat).textContent =
    left.toFixed(2);

  var perc = Math.min(100, (budgets[cat].spent / budgets[cat].max) * 100);
  document.getElementById("bar-" + cat).style.width = perc + "%";

  var list = document.getElementById("list-" + cat);
  list.innerHTML = "";

  for (var i = 0; i < budgets[cat].items.length; i++) {
    var item = budgets[cat].items[i];
    var div = document.createElement("div");
    div.className = "expense-item";
    div.innerHTML =
      item.name + " — " + item.amount + "€ " +
      '<button onclick="deleteExpense(\'' + cat + '\',' + i + ')">×</button>';
    list.appendChild(div);
  }
}

function deleteExpense(cat, index) {
  var amount = budgets[cat].items[index].amount;
  budgets[cat].spent -= amount;
  budgets[cat].items.splice(index, 1);

  updateCategoryUI(cat);
  drawChart();
}

function drawChart() {
  var ctx = document.getElementById("pieChart").getContext("2d");
  var labels = [];
  var values = [];
  for (var k in budgets) {
    if (budgets.hasOwnProperty(k)) {
      labels.push(k);
      values.push(budgets[k].max);
    }
  }

  if (pie) {
    pie.destroy();
  }

  pie = new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: ["#00c6ff", "#00ff9d", "#00e0ff"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });
}
