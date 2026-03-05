function roundTo(x, d) {
  const p = Math.pow(10, d);
  return Math.round(x * p) / p;
}

function parseRates(n) {
  const rates = [];
  for (let i = 0; i < n; i++) {
    const inp = document.getElementById(`rate_${i}`);
    if (!inp) return null;
    const v = Number(inp.value);
    if (!Number.isFinite(v) || v < 0) return null;
    rates.push(v);
  }
  const total = rates.reduce((a, b) => a + b, 0);
  if (total <= 0) return null;
  return rates;
}

function algorithm1BypassValues(totalMachines, decimals) {
  const out = [];
  for (let i = 0; i < totalMachines; i++) {
    const machinesFedByValve = totalMachines - i;
    out.push(roundTo(100 / machinesFedByValve, decimals));
  }
  return out;
}

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

const uiState = {
  asym: true,
  unequal: true
};

function updateToggleIcon(id, on) {
  const icon = document.getElementById(id);
  if (!icon) return;
  icon.src = on ? "assets/icons/toggleon.svg" : "assets/icons/toggleoff.svg";
}

function updateRatesUI() {
  const N = parseInt(document.getElementById("machines").value, 10);
  const container = document.getElementById("rateInputs");
  const oldValues = [];
  const oldPrefilled = [];
  const oldInputs = container.querySelectorAll("input");
  oldInputs.forEach((inp) => {
    oldValues.push(inp.value);
    oldPrefilled.push(inp.dataset.prefilled === "1");
  });
  container.innerHTML = "";
  if (!Number.isFinite(N) || N <= 0) return;

  for (let i = 0; i < N; i++) {
    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.step = "any";
    input.id = `rate_${i}`;
    input.className = "rate-box";
    if (oldValues[i] !== undefined) {
      input.value = oldValues[i];
      input.dataset.prefilled = oldPrefilled[i] ? "1" : "0";
    } else {
      input.value = String(i + 1);
      input.dataset.prefilled = "1";
    }

    input.addEventListener("focus", () => {
      if (input.dataset.prefilled === "1") {
        input.value = "";
        input.dataset.prefilled = "0";
      }
    });

    input.addEventListener("input", () => {
      input.dataset.prefilled = "0";
    });

    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        const next = document.getElementById(`rate_${i + 1}`);
        if (next) next.focus();
      } else if (ev.key === "Backspace" && input.value === "" && i > 0) {
        ev.preventDefault();
        const prev = document.getElementById(`rate_${i - 1}`);
        if (prev) prev.focus();
      }
    });

    container.appendChild(input);
  }
}

function updateUI() {
  const ratesBox = document.getElementById("ratesBox");
  const lInput = document.getElementById("L");
  const asymBtn = document.getElementById("asymToggleBtn");
  const unequalBtn = document.getElementById("unequalToggleBtn");

  asymBtn.setAttribute("aria-pressed", uiState.asym ? "true" : "false");
  unequalBtn.setAttribute("aria-pressed", uiState.unequal ? "true" : "false");

  updateToggleIcon("asymToggleIcon", uiState.asym);
  updateToggleIcon("unequalToggleIcon", uiState.unequal);

  lInput.disabled = !uiState.asym;
  lInput.style.opacity = uiState.asym ? "1" : "0.55";

  ratesBox.style.display = "block";
  updateRatesUI();

  const rateInputs = ratesBox.querySelectorAll(".rate-box");
  if (!uiState.unequal) {
    rateInputs.forEach((input, idx) => {
      input.value = String(idx + 1);
      input.dataset.prefilled = "1";
    });
  }
  rateInputs.forEach((input) => {
    input.disabled = !uiState.unequal;
    input.style.opacity = uiState.unequal ? "1" : "0.55";
  });
  ratesBox.style.opacity = uiState.unequal ? "1" : "0.75";
}

function calculate() {
  const userEntered = document.getElementById("result");
  const results = document.getElementById("resultMirror");

  const N = parseInt(document.getElementById("machines").value, 10);
  const decimals = Math.max(
    0,
    Math.min(9, parseInt(document.getElementById("decimals").value, 10) || 0)
  );

  if (!Number.isFinite(N) || N <= 0) {
    const err = "Invalid total machines (must be > 0).";
    userEntered.textContent = err;
    results.textContent = "results:\n\n" + err;
    return;
  }

  let L = parseInt(document.getElementById("L").value, 10);
  if (!Number.isFinite(L)) L = 0;

  if (uiState.asym && (L < 0 || L > N)) {
    const err = "Invalid source start L (must be between 0 and N).";
    userEntered.textContent = err;
    results.textContent = "results:\n\n" + err;
    return;
  }

  let rates = null;
  if (uiState.unequal) {
    rates = parseRates(N);
    if (!rates) {
      const err = "Invalid rates. Enter one non-negative value per machine and total > 0.";
      userEntered.textContent = err;
      results.textContent = "results:\n\n" + err;
      return;
    }
  }

  let userText = "user entered...\n";
  userText += `machines_total = ${N}\n`;
  userText += `asymmetric_start: ${uiState.asym ? "True" : "False"}\n`;
  userText += `variable_rates: ${uiState.unequal ? "True" : "False"}\n`;
  if (uiState.unequal) {
    userText += `rates = [${rates.join(", ")}]\n`;
    userText += "formula (Alg 3) = bypassFlow / totalValveFlow * 100\n";
  }
  if (uiState.asym) {
    userText += `source_start: between ${L} and ${L + 1}`;
  } else {
    userText += "source_start: machine 1";
  }

  function solveSide(sideCount, sideRates) {
    if (sideCount <= 0) return [];
    return uiState.unequal
      ? linearUnequal(sideRates, decimals)
      : algorithm1BypassValues(sideCount, decimals);
  }

  let resultText = "results:\n\n";

  if (!uiState.asym) {
    const list = uiState.unequal
      ? linearUnequal(rates, decimals)
      : algorithm1BypassValues(N, decimals);
    resultText += "LINEAR PIPELINE (pipe starts at machine 1)\n";
    list.forEach((v, i) => {
      resultText += `C${i + 1} = ${v}\n`;
    });

    userEntered.textContent = userText;
    results.textContent = resultText.trimEnd();
    return;
  }

  const leftCount = L;
  const rightCount = N - L;

  let c1;
  if (!uiState.unequal) {
    c1 = roundTo((rightCount / N) * 100, decimals);
  } else {
    const total = rates.reduce((a, b) => a + b, 0);
    const rightSum = rates.slice(leftCount).reduce((a, b) => a + b, 0);
    c1 = roundTo((rightSum / total) * 100, decimals);
  }

  // Left branch flows away from the split toward machine 1, so solve it from L..1.
  const leftRates = uiState.unequal ? rates.slice(0, leftCount).reverse() : null;
  const rightRates = uiState.unequal ? rates.slice(leftCount) : null;

  const leftList = solveSide(leftCount, leftRates);
  const rightList = solveSide(rightCount, rightRates);

  resultText += "C1 (split valve)\n";
  resultText += `C1 = ${c1} (RIGHT side treated as bypass)\n\n`;

  let valveNum = 2;
  resultText += `BYPASS-SIDE PIPELINE (RIGHT, machines ${leftCount + 1}..${N})\n`;
  if (rightList.length === 0) {
    resultText += "(none)\n";
  } else {
    rightList.forEach((v) => {
      resultText += `C${valveNum} = ${v}\n`;
      valveNum++;
    });
  }

  resultText += `\nOTHER PIPELINE (LEFT, machines ${leftCount}..1)\n`;
  if (leftList.length === 0) {
    resultText += "(none)\n";
  } else {
    leftList.forEach((v) => {
      resultText += `C${valveNum} = ${v}\n`;
      valveNum++;
    });
  }

  userEntered.textContent = userText;
  results.textContent = resultText.trimEnd();
}

document.addEventListener("DOMContentLoaded", () => {
  const instructionsBtn = document.getElementById("instructionsBtn");
  const instructionsPanel = document.getElementById("instructionsPanel");
  const asymToggleBtn = document.getElementById("asymToggleBtn");
  const unequalToggleBtn = document.getElementById("unequalToggleBtn");
  const machines = document.getElementById("machines");

  instructionsBtn.addEventListener("click", () => {
    instructionsPanel.hidden = !instructionsPanel.hidden;
  });

  asymToggleBtn.addEventListener("click", () => {
    uiState.asym = !uiState.asym;
    updateUI();
  });

  unequalToggleBtn.addEventListener("click", () => {
    uiState.unequal = !uiState.unequal;
    updateUI();
  });

  machines.addEventListener("input", () => {
    updateUI();
  });

  updateUI();
});
