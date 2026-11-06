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
      stage.style.transform = "none";
      return;
    }
    const vp = document.getElementById("viewport");
    const fitted = Math.min(vp.clientWidth / 1600, vp.clientHeight / 900);
    stage.style.transform = "scale(" + fitted + ")";
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
      slide.classList.remove("is-current", "is-under", "is-leaving", "is-in", "line-in");
      slide.style.opacity = "";
      slide.style.transition = "";
    });
  }

  function finish(next, keepMotion) {
    const target = slides[next];
    clearRoles(target);
    target.classList.remove("is-under", "is-leaving", "line-in");
    target.classList.add("is-current");
    if (keepMotion) target.classList.add("is-in");
    else arm(target);
    index = next;
    lock = false;
    showCount();
    schedule();
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

  async function whip(from, to, dir) {
    const sign = dir < 0 ? -1 : 1;
    to.classList.add("is-current");
    to.style.transition = "none";
    to.style.transform = "translate3d(" + (sign * 108) + "%,0,0)";
    to.style.filter = "blur(10px)";
    void to.offsetWidth;
    from.style.zIndex = "4";
    from.style.filter = "blur(0px)";
    from.style.transition = "transform .24s cubic-bezier(.7,0,.15,1), filter .24s";
    to.style.transition = "transform .3s cubic-bezier(.12,1.2,.22,1), filter .3s";
    from.style.transform = "translate3d(" + (-sign * 112) + "%,0,0)";
    from.style.filter = "blur(6px)";
    to.style.transform = "translate3d(0,0,0)";
    to.style.filter = "none";
    await wait(310);
    resetMotion(from);
    resetMotion(to);
  }

  async function smash(from, to) {
    to.classList.add("is-under");
    to.style.transition = "none";
    to.style.transform = "scale(1.55)";
    to.style.filter = "blur(14px)";
    void to.offsetWidth;
    from.style.zIndex = "5";
    from.style.transition = "transform .2s ease-in, opacity .2s ease-in, filter .2s";
    to.style.transition = "transform .34s cubic-bezier(.14,1.15,.28,1), filter .28s";
    from.style.transform = "scale(1.7)";
    from.style.opacity = "0";
    from.style.filter = "blur(16px)";
    to.style.transform = "scale(1)";
    to.style.filter = "none";
    arm(to);
    await wait(350);
    resetMotion(from);
    resetMotion(to);
  }

  async function slash(from, to) {
    to.classList.add("is-current", "slash-in");
    from.style.zIndex = "4";
    from.style.transition = "transform .2s ease-in, opacity .2s ease-in";
    from.style.transform = "translate3d(-18%,0,0) scale(1.08)";
    from.style.opacity = "0";
    hair.classList.remove("run");
    void hair.offsetWidth;
    hair.classList.add("run");
    await wait(240);
    hair.classList.remove("run");
    resetMotion(from);
    to.classList.remove("slash-in");
  }

  async function impact(from, to) {
    hitFlash(to.dataset.flash);
    await wait(70);
    clearRoles(to);
    to.classList.add("is-current");
    arm(to);
    await wait(260);
  }

  async function fade(from, to) {
    const slow = to.classList.contains("quiet");
    to.classList.add("is-under");
    arm(to);
    from.classList.add("is-leaving");
    from.style.transition = "opacity " + (slow ? "1s" : ".28s") + " ease";
    from.style.opacity = "0";
    await wait(slow ? 1000 : 300);
    resetMotion(from);
  }

  async function go(next) {
    if (lock || next === index || next < 0 || next >= slides.length) return;
    lock = true;
    const from = slides[index];
    const to = slides[next];
    const forward = next > index;
    const kind = reduced ? "cut" : (!forward ? "whip" : (to.dataset.trans || "whip"));
    let keep = false;

    if (kind === "cut") {
      clearRoles(to);
      to.classList.add("is-current");
    } else if (kind === "impact") {
      await impact(from, to);
      keep = true;
    } else if (kind === "smash") {
      await smash(from, to);
      keep = true;
    } else if (kind === "slash") {
      await slash(from, to);
    } else if (kind === "fade") {
      await fade(from, to);
      keep = true;
    } else {
      await whip(from, to, forward ? 1 : -1);
    }

    finish(next, keep);
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
  window.__deck = { go: go, count: function () { return slides.length; } };
})();
