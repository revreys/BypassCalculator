#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <iomanip>
#include <cmath>
#include <limits>

static double round_to(double value, int decimals) {
    const double p = std::pow(10.0, decimals);
    return std::round(value * p) / p;
}

static bool read_int(const std::string& prompt, int& out) {
    while (true) {
        std::cout << prompt;
        std::string line;
        if (!std::getline(std::cin, line)) return false;

        std::stringstream ss(line);
        int v;
        char extra;
        if (ss >> v && !(ss >> extra)) {
            out = v;
            return true;
        }
        std::cout << "Invalid integer. Try again.\n";
    }
}

static bool read_double(const std::string& prompt, double& out) {
    while (true) {
        std::cout << prompt;
        std::string line;
        if (!std::getline(std::cin, line)) return false;

        std::stringstream ss(line);
        double v;
        char extra;
        if (ss >> v && !(ss >> extra)) {
            out = v;
            return true;
        }
        std::cout << "Invalid number. Try again.\n";
    }
}

static void print_header() {
    std::cout << "Valve Bypass Calculator\n";
    std::cout << "Outputs are NUMBERS ONLY (no % sign).\n\n";
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    print_header();

    int decimals = 3;
    {
        int d;
        if (read_int("Decimal places to round to (default 3): ", d)) {
            if (d >= 0 && d <= 9) decimals = d;
            else std::cout << "Keeping default (3). Valid range is 0..9.\n";
        } else {
            return 0;
        }
    }

    while (true) {
        std::cout << "\nChoose a mode:\n";
        std::cout << "  1) Single valve (machine counts)   [Algorithm 1/2 count form]\n";
        std::cout << "  2) Single valve (flow rates)       [Algorithm 3 general form]\n";
        std::cout << "  3) Linear pipeline (equal rates)   [Algorithm 1 linear]\n";
        std::cout << "  4) Linear pipeline (unequal rates) [Algorithm 3 linear]\n";
        std::cout << "  0) Exit\n";

        int mode;
        if (!read_int("Mode: ", mode)) break;

        if (mode == 0) break;

        std::cout << std::fixed << std::setprecision(decimals);

        if (mode == 1) {
            // Bypass % = bypassMachines / (bypassMachines + mainMachines) * 100
            int bypassMachines, mainMachines;
            if (!read_int("How many machines are in the BYPASS? ", bypassMachines)) break;
            if (!read_int("How many machines are in the MAIN OUTPUT? ", mainMachines)) break;

            if (bypassMachines < 0 || mainMachines < 0) {
                std::cout << "Counts must be non-negative.\n";
                continue;
            }
            const int total = bypassMachines + mainMachines;
            if (total == 0) {
                std::cout << "Total machines cannot be 0.\n";
                continue;
            }

            double pct = (static_cast<double>(bypassMachines) / static_cast<double>(total)) * 100.0;
            pct = round_to(pct, decimals);
            std::cout << "Bypass percentage: " << pct << "\n";
        }
        else if (mode == 2) {
            // Bypass % = bypassFlow / (bypassFlow + mainFlow) * 100
            double bypassFlow, mainFlow;
            if (!read_double("Total consumption rate of the BYPASS? ", bypassFlow)) break;
            if (!read_double("Total consumption rate of the MAIN OUTPUT? ", mainFlow)) break;

            if (bypassFlow < 0.0 || mainFlow < 0.0) {
                std::cout << "Rates must be non-negative.\n";
                continue;
            }
            const double total = bypassFlow + mainFlow;
            if (total <= 0.0) {
                std::cout << "Total flow cannot be 0.\n";
                continue;
            }

            double pct = (bypassFlow / total) * 100.0;
            pct = round_to(pct, decimals);
            std::cout << "Bypass percentage: " << pct << "\n";
        }
        else if (mode == 3) {
            // Equal rates linear:
            // For i = 1..N, Ci = 100 / (N - (i-1))
            int n;
            if (!read_int("How many MACHINES in the pipeline? ", n)) break;

            if (n <= 0) {
                std::cout << "Machine count must be > 0.\n";
                continue;
            }

            std::cout << "Bypass values (C1..C" << n << "):\n";
            for (int i = 0; i < n; i++) {
                int remaining = n - i;
                double pct = 100.0 / static_cast<double>(remaining);
                pct = round_to(pct, decimals);
                std::cout << "  C" << (i + 1) << " = " << pct << "\n";
            }

            std::cout << "Note: 50 and 100 splits can often be done with junction/turn.\n";
        }
        else if (mode == 4) {
            // Unequal rates linear:
            // Ci = rate[i] / sum(rate[i..end]) * 100
            int n;
            if (!read_int("How many MACHINES in the pipeline? ", n)) break;

            if (n <= 0) {
                std::cout << "Machine count must be > 0.\n";
                continue;
            }

            std::vector<double> rates(n);
            for (int i = 0; i < n; i++) {
                double r;
                if (!read_double("Consumption rate of machine #" + std::to_string(i + 1) + ": ", r)) return 0;
                if (r < 0.0) {
                    std::cout << "Rates must be non-negative.\n";
                    i--; // re-ask same machine
                    continue;
                }
                rates[i] = r;
            }

            // Precompute suffix sums
            std::vector<double> suffix(n + 1, 0.0);
            for (int i = n - 1; i >= 0; i--) {
                suffix[i] = suffix[i + 1] + rates[i];
            }

            if (suffix[0] <= 0.0) {
                std::cout << "Total consumption is 0. Cannot compute percentages.\n";
                continue;
            }

            std::cout << "Bypass values (C1..C" << n << "):\n";
            for (int i = 0; i < n; i++) {
                if (suffix[i] <= 0.0) {
                    std::cout << "  C" << (i + 1) << " = (undefined: remaining total is 0)\n";
                    continue;
                }
                double pct = (rates[i] / suffix[i]) * 100.0;
                pct = round_to(pct, decimals);
                std::cout << "  C" << (i + 1) << " = " << pct << "\n";
            }
        }
        else {
            std::cout << "Please select a correct mode.\n";
        }
    }

    std::cout << "\nGoodbye.\n";
    return 0;
}
