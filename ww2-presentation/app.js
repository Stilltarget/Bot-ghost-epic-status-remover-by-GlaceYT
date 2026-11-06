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

  function runWipe(color) {
    wipe.style.background = color || "#111111";
    wipe.classList.remove("run");
    void wipe.offsetWidth;
    wipe.classList.add("run");
    return new Promise(function (resolve) {
      let settled = false;
      function done() {
        if (settled) return;
        settled = true;
        wipe.classList.remove("run");
        resolve();
      }
      wipe.addEventListener("animationend", done, { once: true });
      setTimeout(done, 800);
    });
  }

  function nameBox(slide) {
    return slide.querySelector(".mast .name, .mini .name");
  }

  function fly(from, to) {
    const start = nameBox(from);
    const end = nameBox(to);
    if (!start || !end) return Promise.resolve();
    const a = start.getBoundingClientRect();
    const bEnd = end;
    flyer.style.display = "block";
    flyer.style.transition = "none";
    flyer.style.left = a.left + "px";
    flyer.style.top = a.top + "px";
    flyer.style.fontSize = Math.max(18, a.height * 0.92) + "px";
    end.style.visibility = "hidden";
    return wait(30).then(function () {
      const b = bEnd.getBoundingClientRect();
      flyer.style.transition = "left .55s cubic-bezier(.2,.7,.2,1), top .55s cubic-bezier(.2,.7,.2,1), font-size .55s cubic-bezier(.2,.7,.2,1)";
      flyer.style.left = b.left + "px";
      flyer.style.top = b.top + "px";
      flyer.style.fontSize = Math.max(18, b.height * 0.92) + "px";
      return wait(560);
    }).then(function () {
      flyer.style.display = "none";
      end.style.visibility = "";
    });
  }

  async function go(next) {
    if (lock || next === index || next < 0 || next >= slides.length) return;
    lock = true;
    const from = slides[index];
    const to = slides[next];
    const forward = next > index;
    const kind = reduced || !forward ? "dissolve" : (to.dataset.trans || "dissolve");

    if (kind === "wipe") {
      const covered = runWipe(to.dataset.wipe);
      await wait(230);
      clearRoles(to);
      to.classList.add("is-current");
      arm(to);
      index = next;
      showCount();
      await covered;
      lock = false;
      schedule();
      return;
    }

    if (kind === "line") {
      clearRoles(to);
      to.classList.add("is-current", "line-in");
      arm(to);
      hair.classList.remove("run");
      void hair.offsetWidth;
      hair.classList.add("run");
      index = next;
      showCount();
      await wait(520);
      hair.classList.remove("run");
      to.classList.remove("line-in");
      lock = false;
      schedule();
      return;
    }

    if (kind === "match") {
      to.classList.add("is-under");
      arm(to);
      const flight = fly(from, to);
      from.style.transition = "opacity .35s ease";
      from.style.opacity = "0";
      await flight;
      from.style.opacity = "";
      from.style.transition = "";
      finish(next, true);
      return;
    }

    to.classList.add("is-under");
    arm(to);
    from.classList.add("is-leaving");
    from.style.transition = "opacity " + (to.classList.contains("quiet") ? "1s" : ".5s") + " ease";
    from.style.opacity = "0";
    await wait(to.classList.contains("quiet") ? 1000 : 520);
    from.style.opacity = "";
    from.style.transition = "";
    finish(next, true);
  }

  function nextSlide() { go(Math.min(slides.length - 1, index + 1)); }
  function prevSlide() { go(Math.max(0, index - 1)); }

  function schedule() {
    clearTimeout(timer);
    if (!playing) return;
    const dwell = slides[index].classList.contains("quiet") ? 8200 : 5400;
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
