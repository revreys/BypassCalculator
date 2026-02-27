function roundTo(x, d) {
  const p = Math.pow(10, d);
  return Math.round(x * p) / p;
}

function parseRates(csv, n) {
  const parts = csv.split(",").map(s => s.trim()).filter(s => s.length > 0);
  if (parts.length !== n) return null;
  const rates = parts.map(v => Number(v));
  if (rates.some(r => !Number.isFinite(r) || r < 0)) return null;
  if (rates.reduce((a,b)=>a+b,0) <= 0) return null;
  return rates;
}

// Algorithm 1 (equal): Ci = 100 / remainingMachines
function linearEqual(m, decimals) {
  const out = [];
  for (let i = 0; i < m; i++) {
    out.push(roundTo(100 / (m - i), decimals));
  }
  return out;
}

// Algorithm 3 (unequal): Ci = rate[i] / sum(rate[i..end]) * 100
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
  const N = parseInt(document.getElementById("machines").value, 10);
  const Lraw = parseInt(document.getElementById("L").value, 10);
  const decimals = Math.max(0, Math.min(9, parseInt(document.getElementById("decimals").value, 10) || 0));

  const optAsym = document.getElementById("optAsym").checked;     // Algorithm 2
  const optUnequal = document.getElementById("optUnequal").checked; // Algorithm 3

  const res = document.getElementById("result");

  if (!Number.isFinite(N) || N <= 0) {
    res.textContent = "Invalid N.";
    return;
  }

  // L means how many machines are on the LEFT side
  if (!Number.isFinite(Lraw) || Lraw < 0 || Lraw > N) {
    res.textContent = "Invalid L. Must be 0..N.";
    return;
  }

  const leftCount = Lraw;     // machines 1..L
  const rightCount = N - Lraw; // machines L+1..N

  // Rates array (only used if unequal)
  let rates = null;
  if (optUnequal) {
    rates = parseRates(document.getElementById("rates").value, N);
    if (!rates) {
      res.textContent = "Invalid rates list. Provide N numbers (comma-separated), all >= 0, total > 0.";
      return;
    }
  }

  // Helper: compute split valve C1 (Algorithm 2 generalized by rates if unequal)
  function splitValvePercent() {
    if (!optUnequal) {
      // equal consumption => use counts
      return roundTo((rightCount / N) * 100, decimals); // treat RIGHT as bypass port
    } else {
      const total = rates.reduce((a,b)=>a+b,0);
      const rightSum = rates.slice(leftCount).reduce((a,b)=>a+b,0);
      return roundTo((rightSum / total) * 100, decimals); // RIGHT as bypass
    }
  }

  // Helper: compute linear valves for a side
  function sideValves(sideRatesOrCount) {
    if (!optUnequal) {
      return linearEqual(sideRatesOrCount, decimals);
    } else {
      return linearUnequal(sideRatesOrCount, decimals);
    }
  }

  // Build output
  let text = "";
  text += `INPUTS\n`;
  text += `N = ${N}\n`;
  text += `Source between ${leftCount} and ${leftCount + 1}\n`;
  text += `Asymmetric start (Alg 2): ${optAsym ? "ON" : "OFF"}\n`;
  text += `Unequal rates (Alg 3): ${optUnequal ? "ON" : "OFF"}\n`;
  if (optUnequal) text += `Rates = [${rates.join(", ")}]\n`;
  text += `\n`;

  // CASE A: Asymmetric start ON => we include a split valve C1, then solve two pipelines
  if (optAsym) {
    const c1 = splitValvePercent();

    // left pipeline data
    const leftData = optUnequal ? rates.slice(0, leftCount) : leftCount;
    const rightData = optUnequal ? rates.slice(leftCount) : rightCount;

    const leftList = (leftCount > 0) ? sideValves(leftData) : [];
    const rightList = (rightCount > 0) ? sideValves(rightData) : [];

    text += `C1 (split valve)\n`;
    text += `  C1 = ${c1}   (RIGHT side treated as bypass)\n`;
    text += `\n`;

    text += `LEFT PIPELINE (machines 1..${leftCount})\n`;
    if (leftList.length === 0) text += `  (none)\n`;
    else leftList.forEach((v, i) => text += `  C${2 + i} = ${v}\n`);

    text += `\nRIGHT PIPELINE (machines ${leftCount + 1}..${N})\n`;
    if (rightList.length === 0) text += `  (none)\n`;
    else rightList.forEach((v, i) => text += `  C${2 + leftList.length + i} = ${v}\n`);

    res.textContent = text;
    return;
  }

  // CASE B: Asymmetric OFF => pipe starts at machine 1; solve one pipeline (Alg 1 or 3)
  if (!optAsym) {
    const list = optUnequal ? linearUnequal(rates, decimals) : linearEqual(N, decimals);
    text += `LINEAR PIPELINE\n`;
    list.forEach((v, i) => text += `  C${1 + i} = ${v}\n`);
    res.textContent = text;
    return;
  }
}

// Show/hide rates input when checkbox changes
document.addEventListener("DOMContentLoaded", () => {
  const optUnequal = document.getElementById("optUnequal");
  const ratesBox = document.getElementById("ratesBox");

  function refresh() {
    ratesBox.style.display = optUnequal.checked ? "block" : "none";
  }

  optUnequal.addEventListener("change", refresh);
  refresh();
});
