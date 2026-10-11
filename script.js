(() => {
  "use strict";

  const TAU = Math.PI * 2;
  const COLORS = ["#191919", "#f0f0ec"];
  const genreItems = [
    "Action", "Comedy", "Thriller", "Romance", "Horror", "Sci-Fi",
    "Drama", "Mystery", "Animation", "Fantasy", "Adventure", "Crime"
  ];
  const formatItems = ["Movie", "Series"];
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const wheels = {
    genre: {
      canvas: document.getElementById("genre-wheel"),
      button: document.getElementById("spin-genre"),
      pill: document.getElementById("genre-pill"),
      hint: document.getElementById("genre-hint"),
      items: genreItems,
      angle: 0,
      selectedIndex: null,
      spinning: false,
      colors: COLORS
    },
    format: {
      canvas: document.getElementById("format-wheel"),
      button: document.getElementById("spin-format"),
      pill: document.getElementById("format-pill"),
      hint: document.getElementById("format-hint"),
      items: formatItems,
      angle: 0,
      selectedIndex: null,
      spinning: false,
      colors: COLORS
    }
  };

  const resultPanel = document.getElementById("result-panel");
  const resultEyebrow = document.getElementById("result-eyebrow");
  const resultTitle = document.getElementById("result-title");
  const resultDescription = document.getElementById("result-description");
  const resultAction = document.getElementById("result-action");
  const spinBothButton = document.getElementById("spin-both");
  const resetButton = document.getElementById("reset");

  function drawWheel(wheel) {
    const canvas = wheel.canvas;
    const ctx = canvas.getContext("2d");
    const size = canvas.width;
    const center = size / 2;
    const radius = size / 2 - 10;
    const count = wheel.items.length;
    const slice = TAU / count;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(wheel.angle);

    for (let i = 0; i < count; i++) {
      const start = -Math.PI / 2 + i * slice;
      const end = start + slice;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, start, end);
      ctx.closePath();
      ctx.fillStyle = i % 2 === 0 ? wheel.colors[0] : wheel.colors[1];
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.stroke();

      const mid = start + slice / 2;
      const textRadius = radius * (count <= 2 ? 0.58 : 0.69);
      ctx.save();
      ctx.rotate(mid);
      ctx.translate(textRadius, 0);
      ctx.rotate(Math.PI / 2);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const label = wheel.items[i];
      const fontSize = count > 8 ? (label.length > 8 ? 19 : 21) : 30;
      ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.fillStyle = i % 2 === 0 ? "#ffffff" : "#202020";
      if (count > 8) {
        ctx.fillText(label, 0, 0, radius * 0.48);
      } else {
        ctx.fillText(label, 0, 0, radius * 0.72);
      }
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, TAU);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.restore();
  }

  function setBusy(wheel, busy) {
    wheel.spinning = busy;
    wheel.button.disabled = busy;
    wheel.button.querySelector("span:first-child").textContent = busy
      ? "Spinning…"
      : `Spin ${wheel === wheels.genre ? "genre" : "format"}`;
    spinBothButton.disabled = wheels.genre.spinning || wheels.format.spinning;
  }

  function updatePill(wheel) {
    if (wheel.selectedIndex === null) {
      wheel.pill.textContent = "Ready when you are";
      wheel.pill.classList.remove("is-selected");
      wheel.hint.textContent = wheel === wheels.genre
        ? "12 genres · one choice"
        : "2 formats · endless possibilities";
      return;
    }
    wheel.pill.textContent = wheel.items[wheel.selectedIndex];
    wheel.pill.classList.add("is-selected");
    wheel.hint.textContent = "Selected · spin again anytime";
  }

  function buildIMDbUrl(genre, format) {
    const genreMap = {
      "Sci-Fi": "Sci-Fi",
      "Animation": "Animation"
    };
    const titleType = format === "Series" ? "tvSeries" : "feature";
    const encodedGenre = encodeURIComponent(genreMap[genre] || genre);
    return `https://www.imdb.com/search/title/?genres=${encodedGenre}&title_type=${titleType}`;
  }

  function updateResult() {
    const genre = wheels.genre.selectedIndex === null ? null : wheels.genre.items[wheels.genre.selectedIndex];
    const format = wheels.format.selectedIndex === null ? null : wheels.format.items[wheels.format.selectedIndex];
    const ready = Boolean(genre && format) && !wheels.genre.spinning && !wheels.format.spinning;

    resultPanel.classList.toggle("is-complete", ready);
    if (!ready) {
      resultEyebrow.textContent = "THE POSSIBILITIES ARE OPEN";
      resultTitle.innerHTML = "Your next watch<br><em>is one spin away.</em>";
      if (wheels.genre.spinning || wheels.format.spinning) {
        resultDescription.textContent = "The wheels are turning. Your next watch is taking shape.";
      } else if (genre || format) {
        resultDescription.textContent = "One choice is in. Spin the other wheel to complete your watch combination.";
      } else {
        resultDescription.textContent = "Spin both wheels to reveal a combination picked just for the moment.";
      }
      resultAction.innerHTML = '<div class="imdb-lockup" aria-hidden="true"><span class="imdb-mark">IMDb</span><span class="imdb-caption">DISCOVER MORE</span></div><span class="result-link-placeholder">Your IMDb list will appear here</span>';
      return;
    }

    resultEyebrow.textContent = "DECISION MADE";
    resultTitle.textContent = `${genre} ${format}`;
    resultDescription.textContent = `A little less scrolling, a little more watching. Explore ${genre.toLowerCase()} ${format.toLowerCase()} titles on IMDb.`;
    const link = buildIMDbUrl(genre, format);
    resultAction.innerHTML = '<div class="imdb-lockup" aria-hidden="true"><span class="imdb-mark">IMDb</span><span class="imdb-caption">DISCOVER MORE</span></div>';
    const anchor = document.createElement("a");
    anchor.className = "imdb-link";
    anchor.href = link;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.innerHTML = 'Explore on IMDb <span class="link-arrow" aria-hidden="true">↗</span>';
    anchor.setAttribute("aria-label", `Explore ${genre} ${format.toLowerCase()} titles on IMDb, opens in a new tab`);
    resultAction.appendChild(anchor);
  }

  function selectedIndexForAngle(wheel, angle) {
    const slice = TAU / wheel.items.length;
    // The pointer is fixed at the top. Wheel segment zero begins at the top before rotation.
    const normalized = ((-angle % TAU) + TAU) % TAU;
    return Math.floor((normalized + 0.0000001) / slice) % wheel.items.length;
  }

  function spinWheel(name) {
    const wheel = wheels[name];
    if (!wheel || wheel.spinning) return Promise.resolve();

    setBusy(wheel, true);
    wheel.pill.textContent = "Spinning…";
    wheel.pill.classList.remove("is-selected");
    updateResult();

    const count = wheel.items.length;
    const slice = TAU / count;
    const targetIndex = Math.floor(Math.random() * count);
    // The pointer lands at the middle of the chosen segment.
    const targetNormalized = (TAU - (targetIndex + 0.5) * slice) % TAU;
    const current = ((wheel.angle % TAU) + TAU) % TAU;
    const delta = ((targetNormalized - current) + TAU) % TAU;
    const extraTurns = prefersReducedMotion ? 0 : 5 + Math.floor(Math.random() * 3);
    const startAngle = wheel.angle;
    const endAngle = startAngle + extraTurns * TAU + delta;
    const duration = prefersReducedMotion ? 40 : 3000 + Math.random() * 450;
    const startTime = performance.now();

    return new Promise(resolve => {
      function frame(now) {
        const progress = Math.min(1, (now - startTime) / duration);
        const eased = 1 - Math.pow(1 - progress, 4);
        wheel.angle = startAngle + (endAngle - startAngle) * eased;
        drawWheel(wheel);
        if (progress < 1) {
          requestAnimationFrame(frame);
        } else {
          wheel.angle = endAngle % TAU;
          drawWheel(wheel);
          // Keep the exact intended segment rather than relying on floating-point boundary math.
          wheel.selectedIndex = targetIndex;
          updatePill(wheel);
          setBusy(wheel, false);
          updateResult();
          resolve();
        }
      }
      requestAnimationFrame(frame);
    });
  }

  function resetAll() {
    if (wheels.genre.spinning || wheels.format.spinning) return;
    for (const wheel of Object.values(wheels)) {
      wheel.angle = 0;
      wheel.selectedIndex = null;
      drawWheel(wheel);
      updatePill(wheel);
    }
    updateResult();
  }

  wheels.genre.button.addEventListener("click", () => spinWheel("genre"));
  wheels.format.button.addEventListener("click", () => spinWheel("format"));
  spinBothButton.addEventListener("click", async () => {
    if (wheels.genre.spinning || wheels.format.spinning) return;
    await Promise.all([spinWheel("genre"), spinWheel("format")]);
  });
  resetButton.addEventListener("click", resetAll);

  Object.values(wheels).forEach(wheel => {
    drawWheel(wheel);
    updatePill(wheel);
  });
  updateResult();
})();
