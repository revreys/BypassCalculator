# bypass calculator

this project is a web-based valve bypass calculator for estimating control valve percentages across machine pipelines for the game industrialist.

it supports:
- symmetric and asymmetric source start layouts
- equal machine rates or variable machine rates
- split-valve calculations for asymmetric layouts
- keyboard-friendly machine rate input flow

## how to run

### option 1: open from github page

1. open 'https://revreys.github.io/BypassCalculator/src/index.html' in your browser

### option 2: open directly

1. go to `src/`
2. open `index.html` in your browser

### option 3: local server (recommended)

using a local server avoids browser restrictions in some setups.

example with python:

```bash
cd src
python -m http.server 8000
```

then open `http://localhost:8000`.

## project structure

- `src/index.html` main page
- `src/styles/style.css` ui styling
- `src/scripts/app.js` calculator logic and ui behavior
- `src/assets/icons/` svg icons used by the ui
- `src/assets/fonts/` mona sans fonts

## how to use the calculator

### instructions panel

- click the `instructions` icon or label to show/hide the instruction panel

### core inputs

- `round decimals` controls decimal rounding in outputs
- `source start` is `L` (source is between machine `L` and `L+1`)
- `total machines` is `N`

### toggles

- `asymmetric start`
  - on: uses split valve `c1` and two branches
  - off: treats pipeline as a single linear line starting at machine 1

- `variable machine rates`
  - on: uses one rate input per machine and unequal-rate formula
  - off: uses equal-rate logic and ignores manual rate values
  - when turned off, machine rate boxes reset to numbered defaults (`1..n`) and become disabled/gray

### machine consumption rate input behavior

each machine has its own input box.

- click/focus a default-numbered box to clear it automatically
- press `enter` to move to the next machine input
- when the next input still has default numbering, it clears automatically on focus
- press `backspace` on an empty input to move to the previous input

## calculation behavior

### equal-rate mode

when variable rates is off, the calculator uses equal-flow assumptions.

for a side with `m` machines:
- `c = [100/m, 100/(m-1), ..., 100/1]`

### variable-rate mode

for a side with rates array `r`:
- each valve percent is `r[i] / sum(r[i..end]) * 100`

### asymmetric start on

with `n` total machines and source between `l` and `l+1`:
- left side count: `l`
- right side count: `n - l`
- `c1` treats right side as bypass

`c1` is:
- equal-rate mode: `(right_count / n) * 100`
- variable-rate mode: `(sum(right_rates) / sum(all_rates)) * 100`

then valves are numbered:
- first: right/bypass branch (`c2`, `c3`, ...)
- then: left/other branch (continuing valve numbers)

## output panels

the app shows two output areas:

- `user entered...`
  - echoes interpreted inputs and formula context

- `results:`
  - final valve outputs by section
  - includes split valve and branch breakdown when asymmetric mode is on

## validation and errors

the calculator validates:
- `total machines > 0`
- if asymmetric is on: `0 <= l <= n`
- if variable rates is on:
  - each rate is numeric and `>= 0`
  - total of all rates is `> 0`

if validation fails, an error message is shown in both output panels.

## customization notes

- icons can be replaced in `src/assets/icons/` without changing logic if filenames stay the same
- fonts can be replaced in `src/assets/fonts/` by updating `@font-face` in `src/styles/style.css`
- link targets can be changed in `src/index.html`

## troubleshooting

### ui looks wrong or stale

- hard refresh the browser (`ctrl+f5`)
- confirm you are opening `src/index.html` (not an old root html file)

### icons or fonts not loading

- verify files exist in:
  - `src/assets/icons/`
  - `src/assets/fonts/`
- run with a local server if direct file loading blocks resources

### calculator not updating as expected

- ensure javascript is enabled
- check browser console for errors
- verify `src/scripts/app.js` is referenced by `src/index.html`

## license

see `license` for project licensing details.
