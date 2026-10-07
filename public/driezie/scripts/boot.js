/**
 * Runs in <head>, before the first paint, so nothing flashes in the wrong
 * state: the motion preference, an arriving page transition and the saved
 * canvas theme are all on <html> by the time the body renders.
 *
 * Plain ES5 on purpose: it is served as written, not compiled.
 */
;(function () {
  var html = document.documentElement

  // Storage throws when it is blocked (private mode, strict cookie settings).
  function read(storage, key) {
    try {
      return window[storage].getItem(key)
    } catch (e) {
      return null
    }
  }

  // ── Motion ───────────────────────────────────────────────────────────────
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  var motionOk = !reduced && read("localStorage", "pref-animations") !== "false"
  html.classList.add(motionOk ? "js" : "prefs-no-motion")

  // ── Page transition ──────────────────────────────────────────────────────
  // The page we came from left a flag: arrive covered, and let the transition
  // mark the page ready. Otherwise the reveals may start straight away.
  function arrive() {
    var flagged = read("sessionStorage", "dz-pt") === "1"
    if (flagged) {
      try {
        window.sessionStorage.removeItem("dz-pt")
      } catch (e) {}
    }
    if (flagged && motionOk) {
      html.setAttribute("data-pt", "in")
      return true
    }
    html.setAttribute("data-ready", "1")
    return false
  }

  if (document.prerendering) {
    // A prerendered page only arrives once it is actually shown.
    document.addEventListener(
      "prerenderingchange",
      function () {
        if (arrive()) window.dispatchEvent(new Event("dz:pt-in"))
      },
      { once: true },
    )
  } else {
    arrive()
  }

  // ── Saved canvas look ────────────────────────────────────────────────────
  var theme = read("localStorage", "dz-canvas-theme")
  if (theme === "ink" || theme === "paper") html.setAttribute("data-canvas-theme", theme)

  var page = {}
  try {
    page = JSON.parse(read("localStorage", "dz-figma-canvas-v2") || "{}").page || {}
  } catch (e) {}
  if (page.accent) html.style.setProperty("--color-accent", page.accent)
  if (page.density) html.setAttribute("data-density", page.density)
  if (page.pairing) html.setAttribute("data-pairing", page.pairing)
})()
