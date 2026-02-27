function calculate() {

    let total = parseFloat(document.getElementById("machines").value);
    let bypass = parseFloat(document.getElementById("bypass").value);

    if (total <= 0 || bypass < 0 || bypass > total) {
        document.getElementById("result").innerText = "Invalid input";
        return;
    }

    // General algorithm
    // bypass % = bypassMachines / totalMachines * 100
    let percent = (bypass / total) * 100;

    percent = percent.toFixed(3);

    document.getElementById("result").innerText =
        "Bypass Percentage: " + percent;
}
