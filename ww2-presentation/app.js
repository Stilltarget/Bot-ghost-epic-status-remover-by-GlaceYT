(function () {
  const stage = document.getElementById("stage");
  const slides = Array.from(document.querySelectorAll(".slide"));
  const wipe = document.getElementById("wipe");
  const hair = document.getElementById("hair");
  const flyer = document.getElementById("flyer");
  const chrome = document.getElementById("chrome");
  const count = document.getElementById("count");
  const playBtn = document.getElementById("play");
  const groupInput = document.getElementById("group");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let index = 0;
  let lock = false;
  let pending = null;
  let playing = false;
  let timer = 0;
  let idleTimer = 0;

  const hint = document.getElementById("hint");
  const desktopHint = hint.textContent;

  function isPhone() {
    return document.documentElement.classList.contains("is-phone");
  }

  function fit() {
    const scale = Math.min(window.innerWidth / 1600, window.innerHeight / 900);
    const phone = scale < 0.78;
    document.documentElement.classList.toggle("is-phone", phone);
    hint.textContent = phone ? "Swipe sideways" : desktopHint;
    if (phone) {
      stage.style.left = "";
      stage.style.top = "";
      stage.style.transform = "none";
      return;
    }
    const chrome = 84;
    const fitted = Math.min(window.innerWidth / 1600, (window.innerHeight - chrome) / 900);
    stage.style.left = "50%";
    stage.style.top = ((window.innerHeight - chrome) / 2) + "px";
    stage.style.transform = "translate(-50%, -50%) scale(" + fitted + ")";
  }

  function applyGroup() {
    const value = groupInput.value.trim() || "Group 5";
    document.querySelectorAll(".gname").forEach(function (node) {
      node.textContent = value;
    });
    try { localStorage.setItem("sunday-record-group", value); } catch (err) {}
  }

  function arm(slide) {
    slide.classList.remove("is-in");
    void slide.offsetWidth;
    slide.classList.add("is-in");
  }

  function showCount() {
    count.textContent = (index + 1) + " / " + slides.length;
    const label = slides[index].dataset.label || "";
    stage.setAttribute("aria-label", "Slide " + (index + 1) + " of " + slides.length + ". " + label);
  }

  function clearRoles(except) {
    slides.forEach(function (slide) {
      if (slide === except) return;
      slide.classList.remove("is-current", "is-under", "is-leaving", "is-in", "line-in", "slash-in");
      resetMotion(slide);
    });
  }

  function finish(next, keepMotion) {
    const target = slides[next];
    clearRoles(target);
    target.classList.remove("is-under", "is-leaving", "line-in", "slash-in");
    resetMotion(target);
    target.classList.add("is-current");
    if (keepMotion) target.classList.add("is-in");
    else arm(target);
    index = next;
    lock = false;
    showCount();
    schedule();
    if (pending !== null && pending !== index) {
      const nextIndex = pending;
      pending = null;
      go(nextIndex);
    }
  }

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function resetMotion(el) {
    el.style.transition = "";
    el.style.transform = "";
    el.style.opacity = "";
    el.style.filter = "";
    el.style.zIndex = "";
  }

  function hitFlash(color) {
    const flash = document.getElementById("flash");
    flash.style.background = color || "#f3efe4";
    flash.classList.remove("go");
    void flash.offsetWidth;
    flash.classList.add("go");
    stage.classList.remove("hit");
    void stage.offsetWidth;
    stage.classList.add("hit");
  }

  const burst = document.getElementById("burst");

  function rays() {
    if (burst.childElementCount) return;
    for (let i = 0; i < 16; i++) {
      const line = document.createElement("i");
      line.style.setProperty("--a", (i * 22.5) + "deg");
      line.style.animationDelay = (i % 4) * 0.02 + "s";
      burst.appendChild(line);
    }
  }

  function flashBurst(color) {
    rays();
    burst.style.color = color || "#f3efe4";
    burst.classList.remove("on");
    void burst.offsetWidth;
    burst.classList.add("on");
  }

  async function zoom(from, to) {
    hitFlash(to.dataset.flash || "#f3efe4");
    flashBurst(to.dataset.flash === "#b11226" ? "#f6efe2" : "#f3efe4");
    to.classList.add("is-current");
    to.style.transition = "none";
    to.style.transformOrigin = "center center";
    to.style.transform = "scale(0.38) rotate(-1.5deg)";
    void to.offsetWidth;
    from.style.zIndex = "3";
    from.style.transition = "transform .28s ease-in, opacity .28s ease-in";
    from.style.transform = "scale(1.18)";
    from.style.opacity = "0";
    to.style.transition = "transform .46s cubic-bezier(.12,1.25,.28,1)";
    to.style.transform = "scale(1) rotate(0deg)";
    arm(to);
    await wait(480);
    resetMotion(from);
    burst.classList.remove("on");
  }

  async function pan(from, to, dir) {
    const sign = dir < 0 ? -1 : 1;
    to.classList.add("is-current");
    to.style.transition = "none";
    to.style.transform = "translate3d(0," + (sign * 104) + "%,0)";
    void to.offsetWidth;
    from.style.zIndex = "4";
    from.style.transition = "transform .3s cubic-bezier(.7,0,.15,1)";
    to.style.transition = "transform .34s cubic-bezier(.14,1.05,.3,1)";
    from.style.transform = "translate3d(0," + (-sign * 108) + "%,0)";
    to.style.transform = "translate3d(0,0,0)";
    await wait(350);
    resetMotion(from);
  }

  async function truck(from, to, dir) {
    const sign = dir < 0 ? -1 : 1;
    to.classList.add("is-current");
    to.style.transition = "none";
    to.style.transformOrigin = "center center";
    to.style.transform = "translate3d(" + (sign * 104) + "%,0,0) rotate(" + (sign * 3) + "deg)";
    to.style.filter = "blur(8px)";
    void to.offsetWidth;
    from.style.zIndex = "4";
    from.style.transition = "transform .26s cubic-bezier(.65,0,.2,1), filter .26s";
    to.style.transition = "transform .32s cubic-bezier(.12,1.15,.28,1), filter .28s";
    from.style.transform = "translate3d(" + (-sign * 108) + "%,0,0) rotate(" + (-sign * 4) + "deg)";
    from.style.filter = "blur(6px)";
    to.style.transform = "translate3d(0,0,0) rotate(0deg)";
    to.style.filter = "none";
    await wait(330);
    resetMotion(from);
  }

  async function throwCard(from, to) {
    to.classList.add("is-current");
    to.style.transition = "none";
    to.style.transformOrigin = "70% 60%";
    to.style.transform = "translate3d(42%, 10%, 0) rotate(9deg) scale(0.55)";
    void to.offsetWidth;
    from.style.zIndex = "4";
    from.style.transformOrigin = "20% 40%";
    from.style.transition = "transform .32s cubic-bezier(.55,0,.2,1), opacity .32s ease-in";
    to.style.transition = "transform .4s cubic-bezier(.12,1.35,.28,1)";
    from.style.transform = "translate3d(-36%, -8%, 0) rotate(-11deg) scale(0.62)";
    from.style.opacity = "0";
    to.style.transform = "translate3d(0,0,0) rotate(0deg) scale(1)";
    arm(to);
    await wait(420);
    resetMotion(from);
  }

  async function fade(from, to) {
    to.classList.add("is-under");
    arm(to);
    from.classList.add("is-leaving");
    from.style.transition = "opacity .55s ease";
    from.style.opacity = "0";
    await wait(560);
    resetMotion(from);
  }

  async function go(next) {
    if (next === index || next < 0 || next >= slides.length) return;
    if (lock) { pending = next; return; }
    lock = true;
    const from = slides[index];
    const to = slides[next];
    const forward = next > index;
    const kind = reduced ? "cut" : (!forward ? "truck" : (to.dataset.trans || "truck"));
    let keep = false;

    if (kind === "cut") {
      clearRoles(to);
      to.classList.add("is-current");
    } else if (kind === "zoom") {
      await zoom(from, to);
      keep = true;
    } else if (kind === "pan") {
      await pan(from, to, forward ? 1 : -1);
    } else if (kind === "throw") {
      await throwCard(from, to);
      keep = true;
    } else if (kind === "fade") {
      await fade(from, to);
      keep = true;
    } else {
      await truck(from, to, forward ? 1 : -1);
    }

    finish(next, keep);
  }

  function intro() {
    if (reduced || document.documentElement.classList.contains("still")) return;
    const slide = slides[0];
    flashBurst("#161616");
    slide.style.transformOrigin = "center center";
    slide.style.transition = "none";
    slide.style.transform = "scale(0.42)";
    void slide.offsetWidth;
    slide.style.transition = "transform .62s cubic-bezier(.14,1.2,.3,1)";
    slide.style.transform = "scale(1)";
    setTimeout(function () {
      if (index !== 0) return;
      slide.style.transition = "";
      slide.style.transform = "";
      burst.classList.remove("on");
    }, 680);
  }

  function nextSlide() { go(Math.min(slides.length - 1, index + 1)); }
  function prevSlide() { go(Math.max(0, index - 1)); }

  function schedule() {
    clearTimeout(timer);
    if (!playing) return;
    const dwell = slides[index].classList.contains("quiet") ? 8200 : 3600;
    timer = setTimeout(function () {
      if (index >= slides.length - 1) {
        playing = false;
        playBtn.textContent = "Play";
        return;
      }
      go(index + 1);
    }, dwell);
  }

  function togglePlay() {
    playing = !playing;
    playBtn.textContent = playing ? "Pause" : "Play";
    schedule();
  }

  function poke() {
    chrome.classList.remove("idle");
    clearTimeout(idleTimer);
    if (isPhone()) return;
    idleTimer = setTimeout(function () { chrome.classList.add("idle"); }, 2400);
  }

  function stopPlay() {
    playing = false;
    playBtn.textContent = "Play";
  }

  document.getElementById("next").addEventListener("click", function (event) {
    event.stopPropagation();
    stopPlay();
    nextSlide();
  });
  document.getElementById("prev").addEventListener("click", function (event) {
    event.stopPropagation();
    stopPlay();
    prevSlide();
  });
  playBtn.addEventListener("click", function (event) {
    event.stopPropagation();
    togglePlay();
  });
  document.getElementById("full").addEventListener("click", function (event) {
    event.stopPropagation();
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  });

  stage.addEventListener("click", function (event) {
    if (isPhone()) return;
    if (event.target.closest("#chrome")) return;
    const rect = stage.getBoundingClientRect();
    stopPlay();
    if (event.clientX < rect.left + rect.width * 0.18) prevSlide();
    else nextSlide();
  });

  let touchX = 0;
  let touchY = 0;
  stage.addEventListener("touchstart", function (event) {
    if (event.touches.length !== 1) return;
    touchX = event.touches[0].clientX;
    touchY = event.touches[0].clientY;
  }, { passive: true });
  stage.addEventListener("touchend", function (event) {
    if (!isPhone()) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchX;
    const dy = touch.clientY - touchY;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
    stopPlay();
    if (dx < 0) nextSlide();
    else prevSlide();
  }, { passive: true });

  window.addEventListener("keydown", function (event) {
    if (event.target === groupInput) return;
    if (event.key === "ArrowRight" || event.key === "PageDown") { playing = false; playBtn.textContent = "Play"; nextSlide(); }
    else if (event.key === "ArrowLeft" || event.key === "PageUp") { playing = false; playBtn.textContent = "Play"; prevSlide(); }
    else if (event.key === " " || event.key === "Spacebar") { event.preventDefault(); togglePlay(); }
    else if (event.key === "Home") { playing = false; playBtn.textContent = "Play"; go(0); }
    else if (event.key === "End") { playing = false; playBtn.textContent = "Play"; go(slides.length - 1); }
    else if (event.key === "f" || event.key === "F") {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen();
      else document.exitFullscreen();
    }
  });

  groupInput.addEventListener("input", applyGroup);
  groupInput.addEventListener("click", function (event) { event.stopPropagation(); });
  try {
    const saved = localStorage.getItem("sunday-record-group");
    if (saved) groupInput.value = saved;
  } catch (err) {}
  applyGroup();

  window.addEventListener("resize", fit);
  window.addEventListener("orientationchange", fit);
  if (window.visualViewport) window.visualViewport.addEventListener("resize", fit);
  document.addEventListener("mousemove", poke);
  fit();

  const params = new URLSearchParams(location.search);
  if (params.get("still") === "1") document.documentElement.classList.add("still");
  const jump = Number(params.get("slide") || "1") - 1;
  if (jump > 0 && jump < slides.length) {
    slides[0].classList.remove("is-current", "is-in");
    index = jump;
    slides[index].classList.add("is-current", "is-in");
  }
  showCount();
  poke();
  if (!(jump > 0)) intro();
  window.__deck = { go: go, count: function () { return slides.length; } };
})();
