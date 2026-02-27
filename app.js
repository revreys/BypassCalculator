function roundTo(x, d) {
  const p = Math.pow(10, d);
  return Math.round(x * p) / p;
}

function parseRates(csv, n) {
  const parts = csv.split(",").map(s => s.trim()).filter(s => s.length > 0);
  if (parts.length !== n) return null;

  const rates = parts.map(v => Number(v));
  if (rates.some(r => !Number.isFinite(r) || r < 0)) return null;

  const total = rates.reduce((a, b) => a + b, 0);
  if (total <= 0) return null;

  return rates;
}

// Algorithm 1 linear (equal rates): [100/m, 100/(m-1), ..., 100/1]
function linearEqual(m, decimals) {
  const out = [];
  for (let i = 0; i < m; i++) {
    out.push(roundTo(100 / (m - i), decimals));
  }
  return out;
}

// Algorithm 3 linear (unequal rates): rate[i] / sum(rate[i..end]) * 100
function linearUnequal(rates, decimals) {
  const m = rates.length;
  const suffix = new Array(m + 1).fill(0);
  for (let i = m - 1; i >= 0; i--) suffix[i] = suffix[i + 1] + rates[i];

  const out = [];
  for (let i = 0; i < m; i++) {
    out.push(roundTo((rates[i] / suffix[i]) * 100, decimals));
  }
  return out;
}

function calculate() {
  const res = document.getElementById("result");

  const N = parseInt(document.getElementById("machines").value, 10);
  const decimals = Math.max(
    0,
    Math.min(9, parseInt(document.getElementById("decimals").value, 10) || 0)
  );

  const optAsym = document.getElementById("optAsym").checked;       // Algorithm 2
  const optUnequal = document.getElementById("optUnequal").checked; // Algorithm 3

  if (!Number.isFinite(N) || N <= 0) {
    res.textContent = "Invalid N (must be > 0).";
    return;
  }

  // L only matters if asymmetric is ON
  let L = 0;
  if (optAsym) {
    L = parseInt(document.getElementById("L").value, 10);
    if (!Number.isFinite(L) || L < 0 || L > N) {
      res.textContent = "Invalid L (must be between 0 and N).";
      return;
    }
  }

  // Rates only matter if unequal is ON
  let rates = null;
  if (optUnequal) {
    rates = parseRates(document.getElementById("rates").value, N);
    if (!rates) {
      res.textContent =
        "Invalid rates. Provide exactly N comma-separated numbers >= 0 (total must be > 0).";
      return;
    }
  }

  // Helper for side solving
  function solveSide(sideCount, sideRates) {
    if (sideCount <= 0) return [];
    return optUnequal ? linearUnequal(sideRates, decimals) : linearEqual(sideCount, decimals);
  }

  let text = "";
  text += `INPUTS\n`;
  text += `N = ${N}\n`;
  text += `Asymmetric start (Alg 2): ${optAsym ? "ON" : "OFF"}\n`;
  text += `Unequal rates (Alg 3): ${optUnequal ? "ON" : "OFF"}\n`;
  if (optUnequal) text += `Rates = [${rates.join(", ")}]\n`;
  text += `\n`;

  // CASE 1: Asymmetric OFF => pipe starts at machine 1 => one linear pipeline
  if (!optAsym) {
    const list = optUnequal ? linearUnequal(rates, decimals) : linearEqual(N, decimals);
    text += `LINEAR PIPELINE (pipe starts at machine 1)\n`;
    list.forEach((v, i) => (text += `  C${i + 1} = ${v}\n`));
    res.textContent = text;
    return;
  }

  // CASE 2: Asymmetric ON => split valve C1 + two pipelines
  const leftCount = L;        // machines 1..L
  const rightCount = N - L;   // machines L+1..N

  // C1 split percent: treat RIGHT as bypass port by default
  let c1;
  if (!optUnequal) {
    c1 = roundTo((rightCount / N) * 100, decimals);
  } else {
    const total = rates.reduce((a, b) => a + b, 0);
    const rightSum = rates.slice(leftCount).reduce((a, b) => a + b, 0);
    c1 = roundTo((rightSum / total) * 100, decimals);
  }

  const leftRates = optUnequal ? rates.slice(0, leftCount) : null;
  const rightRates = optUnequal ? rates.slice(leftCount) : null;

  const leftList = solveSide(leftCount, leftRates);
  const rightList = solveSide(rightCount, rightRates);

  text += `Source between ${L} and ${L + 1}\n\n`;

  text += `C1 (split valve)\n`;
  text += `  C1 = ${c1}   (RIGHT side treated as bypass)\n`;
  text += `\n`;

  let valveNum = 2;

  text += `LEFT PIPELINE (machines 1..${leftCount})\n`;
  if (leftList.length === 0) text += `  (none)\n`;
  else {
    leftList.forEach(v => {
      text += `  C${valveNum} = ${v}\n`;
      valveNum++;
    });
  }

  text += `\nRIGHT PIPELINE (machines ${leftCount + 1}..${N})\n`;
  if (rightList.length === 0) text += `  (none)\n`;
  else {
    rightList.forEach(v => {
      text += `  C${valveNum} = ${v}\n`;
      valveNum++;
    });
  }

  res.textContent = text;
}

// ================= UI CONTROLLER =================

document.addEventListener("DOMContentLoaded", () => {

  const asym = document.getElementById("optAsym");
  const unequal = document.getElementById("optUnequal");

  const asymBox = document.getElementById("asymBox");
  const ratesBox = document.getElementById("ratesBox");

  function updateUI() {

    // Asymmetric toggle (Algorithm 2)
    if (asym.checked) {
      asymBox.style.display = "block";
    } else {
      asymBox.style.display = "none";
    }

    // Unequal rates toggle (Algorithm 3)
    if (unequal.checked) {
      ratesBox.style.display = "block";
    } else {
      ratesBox.style.display = "none";
    }
  }

  // initialize page correctly
  updateUI();

  // react to user clicks
  asym.addEventListener("change", updateUI);
  unequal.addEventListener("change", updateUI);

});
