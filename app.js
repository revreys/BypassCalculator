function roundTo(x, d) {
  const p = Math.pow(10, d);
  return Math.round(x * p) / p;
}

function linearValveList(m, decimals) {
  // Returns [100/m, 100/(m-1), ... 100/1] (numbers only)
  const out = [];
  for (let i = 0; i < m; i++) {
    const remaining = m - i;
    out.push(roundTo(100 / remaining, decimals));
  }
  return out;
}

function calculate() {
  const N = parseInt(document.getElementById("machines").value, 10);
  let L = parseInt(document.getElementById("L").value, 10);
  let R = parseInt(document.getElementById("R").value, 10);
  const decimals = Math.max(0, Math.min(9, parseInt(document.getElementById("decimals").value, 10) || 0));

  const res = document.getElementById("result");

  if (!Number.isFinite(N) || N <= 0) {
    res.textContent = "Invalid N.";
    return;
  }
  if (!Number.isFinite(L) || !Number.isFinite(R)) {
    res.textContent = "Invalid L/R.";
    return;
  }

  // Normalize: ensure L < R
  if (L > R) [L, R] = [R, L];

  // You *intended* "between L and R" to usually mean adjacent (R = L+1).
  // If user gives non-adjacent (like 2 and 4), we snap to the middle split.
  // Example: (2,4) -> treat as between 3 and 4? Actually midpoint -> L=3,R=4.
  if (R !== L + 1) {
    const mid = Math.floor((L + R) / 2);
    L = Math.max(0, Math.min(N - 1, mid));
    R = L + 1;
  }

  // L can be 0 (means source before machine 1) and L can be N-1 (before machine N)
  if (L < 0 || L > N - 1) {
    res.textContent = "L must be in range 0..N-1 (0 means before machine 1).";
    return;
  }

  const leftCount = L;         // machines 1..L
  const rightCount = N - L;    // machines (L+1)..N

  // Split valve: treat RIGHT side as bypass port by default
  const splitBypassPct = roundTo((rightCount / N) * 100, decimals);

  const leftVals = (leftCount > 0) ? linearValveList(leftCount, decimals) : [];
  const rightVals = (rightCount > 0) ? linearValveList(rightCount, decimals) : [];

  let text = "";
  text += `INPUTS\n`;
  text += `N = ${N}\n`;
  text += `Source between ${L} and ${L + 1}\n\n`;

  text += `SPLIT VALVE\n`;
  text += `C_split (RIGHT side as bypass) = ${splitBypassPct}\n`;
  text += `(If LEFT side is bypass instead, use ${(roundTo((leftCount / N) * 100, decimals))})\n\n`;

  text += `LEFT PIPELINE (machines 1..${L}) count = ${leftCount}\n`;
  if (leftVals.length === 0) text += `  (none)\n`;
  else {
    for (let i = 0; i < leftVals.length; i++) {
      text += `  C_L${i + 1} = ${leftVals[i]}\n`;
    }
  }
  text += `\n`;

  text += `RIGHT PIPELINE (machines ${L + 1}..${N}) count = ${rightCount}\n`;
  if (rightVals.length === 0) text += `  (none)\n`;
  else {
    for (let i = 0; i < rightVals.length; i++) {
      text += `  C_R${i + 1} = ${rightVals[i]}\n`;
    }
  }

  res.textContent = text;
}
