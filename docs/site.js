/* Landing page demo: blur toggle, one curtain sweep on load, and a pretend PIN lock (PIN 1234). */
(function () {
  const demo = document.getElementById("demo");
  if (!demo) return;

  const toggle = document.getElementById("demoToggle");
  const lockBtn = document.getElementById("demoLockBtn");
  const lock = document.getElementById("demoLock");
  const slots = document.getElementById("demoSlots");
  const pin = document.getElementById("demoPin");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setOn(on) {
    toggle.checked = on;
    if (!on || reduce) { demo.classList.toggle("on", on); return; }
    // sweep the curtain across, apply blur when it covers the window
    demo.classList.remove("sweeping");
    void demo.offsetWidth;
    demo.classList.add("sweeping");
    setTimeout(() => demo.classList.add("on"), 450);
  }

  toggle.addEventListener("change", () => setOn(toggle.checked));

  // The one orchestrated moment: show the chat in the clear, then draw the curtain.
  if (reduce) demo.classList.add("on");
  else setTimeout(() => setOn(true), 900);

  function paint() {
    [...slots.querySelectorAll("span")].forEach((s, i) => s.classList.toggle("filled", i < pin.value.length));
  }

  function openLock() {
    demo.classList.add("locked");
    lock.setAttribute("aria-hidden", "false");
    pin.tabIndex = 0;
    pin.value = "";
    paint();
    setTimeout(() => pin.focus(), 300);
    lockBtn.textContent = "Terkunci";
    lockBtn.disabled = true;
  }

  function closeLock() {
    demo.classList.remove("locked");
    lock.setAttribute("aria-hidden", "true");
    pin.tabIndex = -1;
    lockBtn.textContent = "Coba kunci PIN";
    lockBtn.disabled = false;
    lockBtn.focus();
  }

  lockBtn.addEventListener("click", openLock);
  lock.addEventListener("mousedown", (e) => { if (e.target !== pin) { e.preventDefault(); pin.focus(); } });
  pin.addEventListener("input", () => {
    pin.value = pin.value.replace(/\D/g, "").slice(0, 4);
    paint();
    if (pin.value.length < 4) return;
    if (pin.value === "1234") { setTimeout(closeLock, 150); return; }
    slots.classList.remove("shake");
    void slots.offsetWidth;
    slots.classList.add("shake");
    pin.value = "";
    setTimeout(paint, 200);
  });
})();
