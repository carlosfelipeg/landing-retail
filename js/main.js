(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------------
     Theme toggle
     --------------------------------------------------------------------- */
  var root = document.documentElement;
  var themeBtn = document.querySelector(".theme-toggle");
  var stored = localStorage.getItem("rtl-theme");
  if (stored) root.setAttribute("data-theme", stored);

  function currentTheme() {
    if (root.getAttribute("data-theme")) return root.getAttribute("data-theme");
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function setTheme(mode) {
    root.setAttribute("data-theme", mode);
    localStorage.setItem("rtl-theme", mode);
  }

  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      setTheme(currentTheme() === "dark" ? "light" : "dark");
    });
  }

  /* ---------------------------------------------------------------------
     Top nav scroll state + mobile drawer
     --------------------------------------------------------------------- */
  var topnav = document.querySelector(".topnav");
  var onScroll = function () {
    if (window.scrollY > 40) topnav.classList.add("is-scrolled");
    else topnav.classList.remove("is-scrolled");
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var menuToggle = document.querySelector(".menu-toggle");
  var navLinks = document.querySelector(".nav-links");
  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", function () {
      menuToggle.classList.toggle("is-open");
      navLinks.classList.toggle("is-open");
    });
    navLinks.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        menuToggle.classList.remove("is-open");
        navLinks.classList.remove("is-open");
      });
    });
  }

  /* ---------------------------------------------------------------------
     Scroll reveal
     --------------------------------------------------------------------- */
  var revealEls = document.querySelectorAll(".reveal, .reveal-stagger");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------------------------------------------------------------------
     Section rail + active nav link
     --------------------------------------------------------------------- */
  var sections = document.querySelectorAll("main section[id]");
  var railItems = document.querySelectorAll(".rail-item");
  var navAnchors = document.querySelectorAll(".nav-links a");

  function setActive(id) {
    railItems.forEach(function (item) {
      item.classList.toggle("active", item.getAttribute("data-target") === id);
    });
    navAnchors.forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("href") === "#" + id);
    });
  }

  if ("IntersectionObserver" in window) {
    var sectionIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { threshold: 0, rootMargin: "-45% 0px -45% 0px" }
    );
    sections.forEach(function (s) { sectionIO.observe(s); });
  }

  railItems.forEach(function (item) {
    item.addEventListener("click", function () {
      var target = document.getElementById(item.getAttribute("data-target"));
      if (target) target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    });
  });

  /* ---------------------------------------------------------------------
     Animated stat counters
     --------------------------------------------------------------------- */
  var stats = document.querySelectorAll(".stat .num[data-count]");
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    var decimals = el.getAttribute("data-decimals") ? parseInt(el.getAttribute("data-decimals"), 10) : 0;
    if (reduceMotion) {
      el.textContent = target.toFixed(decimals) + suffix;
      return;
    }
    var start = null;
    var duration = 1400;
    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = target * eased;
      el.textContent = value.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var statIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            statIO.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    stats.forEach(function (el) { statIO.observe(el); });
  }

  /* ---------------------------------------------------------------------
     Team bio overlay
     --------------------------------------------------------------------- */
  var overlay = document.querySelector(".bio-overlay");
  var bioCard = overlay ? overlay.querySelector(".bio-card") : null;

  function renderBio(data) {
    var trajectory = data.trajectory.map(function (row) {
      return '<li><span class="yr">' + row[0] + "</span><span>" + row[1] + "</span></li>";
    }).join("");
    var formation = data.formation.map(function (row) {
      return '<li><span class="yr">' + row[0] + "</span><span>" + row[1] + "</span></li>";
    }).join("");

    bioCard.innerHTML =
      '<button class="bio-close" aria-label="Cerrar">&times;</button>' +
      '<div class="bio-head">' +
        '<img src="' + data.photo + '" alt="' + data.name + '">' +
        "<div><h3>" + data.name + '</h3><div class="role">' + data.role + "</div></div>" +
      "</div>" +
      '<p class="bio-summary">' + data.summary + "</p>" +
      '<div class="bio-columns">' +
        '<div class="bio-col"><h4>Trayectoria profesional</h4><ul>' + trajectory + "</ul></div>" +
        '<div class="bio-col"><h4>Formación</h4><ul>' + formation + "</ul></div>" +
      "</div>" +
      '<div class="bio-lang"><strong>Idiomas — </strong>' + data.languages + "</div>";

    bioCard.querySelector(".bio-close").addEventListener("click", closeBio);
  }

  function openBio(key) {
    var data = window.TEAM_DATA[key];
    if (!data || !overlay) return;
    renderBio(data);
    overlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeBio() {
    if (!overlay) return;
    overlay.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  if (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeBio();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeBio();
    });
  }

  document.querySelectorAll("[data-bio]").forEach(function (card) {
    card.addEventListener("click", function () {
      openBio(card.getAttribute("data-bio"));
    });
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openBio(card.getAttribute("data-bio"));
      }
    });
  });

  /* ---------------------------------------------------------------------
     Client logo filter tabs
     --------------------------------------------------------------------- */
  var tabs = document.querySelectorAll(".client-tab");
  var cells = document.querySelectorAll(".client-cell");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) { t.classList.remove("active"); });
      tab.classList.add("active");
      var group = tab.getAttribute("data-group");
      cells.forEach(function (cell) {
        var match = group === "all" || cell.getAttribute("data-group") === group;
        cell.classList.toggle("hidden", !match);
      });
    });
  });

  /* ---------------------------------------------------------------------
     Ambient topographic contour canvas
     --------------------------------------------------------------------- */
  var canvas = document.getElementById("contour-bg");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var w, h, dpr;
    var t = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    function isDark() {
      return currentTheme() === "dark";
    }

    function noise(x, y, seed) {
      return Math.sin(x * 0.0016 + seed) * Math.cos(y * 0.0021 - seed * 0.7) +
             Math.sin((x + y) * 0.0009 + seed * 1.3) * 0.6;
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      var lineColor = isDark() ? "231,237,245" : "15,33,56";
      var rows = 26;
      var step = h / rows + 40;
      for (var r = -2; r < rows + 2; r++) {
        var baseY = r * (h / rows);
        ctx.beginPath();
        for (var x = -40; x <= w + 40; x += 18) {
          var y = baseY + noise(x, baseY, t + r * 0.35) * 26;
          if (x === -40) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        var alpha = 0.05 + 0.03 * Math.sin(r * 0.6 + t * 0.3);
        ctx.strokeStyle = "rgba(" + lineColor + "," + Math.max(alpha, 0.02) + ")";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    var raf;
    function loop() {
      t += 0.0035;
      draw();
      raf = requestAnimationFrame(loop);
    }

    if (reduceMotion) {
      draw();
    } else {
      loop();
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) {
          cancelAnimationFrame(raf);
        } else {
          loop();
        }
      });
    }
  }

  /* ---------------------------------------------------------------------
     Alianzas — wireframe globe (orthographic lat/long grid, drawn live)
     --------------------------------------------------------------------- */
  var globeCanvas = document.getElementById("globe-canvas");
  if (globeCanvas && globeCanvas.getContext) {
    var gctx = globeCanvas.getContext("2d");

    function cssVar(name, fallback) {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    }

    // Orthographic view centered on the Americas (lon0=-70, lat0=0) —
    // matches the projection used to place the .city-pin markers in the HTML.
    var GLOBE_LON0 = -70;

    // Simplified coastline outlines (lat, lon pairs), coarse but recognizable —
    // enough to read as "the Americas" on a small wireframe globe, not a nautical chart.
    var LANDMASSES = [
      // North America incl. Central America
      [[70,-165],[60,-140],[50,-128],[40,-124],[32,-117],[23,-106],[16,-99],[14,-92],
       [9,-83],[8,-77.5],[9,-77],[15,-83],[18,-88],[21,-97],[26,-97],[29,-89],[25,-80],
       [32,-80],[36,-76],[41,-71],[45,-67],[47,-60],[50,-56],[55,-60],[60,-65],[65,-70],
       [70,-90],[70,-130],[70,-165]],
      // South America
      [[8,-77],[4,-77],[-2,-80],[-9,-78],[-18,-71],[-23,-70],[-33,-72],[-42,-74],
       [-52,-73],[-55,-68],[-52,-64],[-42,-63],[-38,-58],[-34,-56],[-28,-48],[-23,-43],
       [-16,-39],[-8,-35],[-2,-44],[1,-50],[5,-52],[8,-60],[11,-64],[11,-72],[8,-77]]
    ];

    function project(latDeg, lonDeg, cx, cy, R) {
      var lat = (latDeg * Math.PI) / 180;
      var dLon = ((lonDeg - GLOBE_LON0) * Math.PI) / 180;
      var visible = Math.cos(lat) * Math.cos(dLon) > -0.06;
      return {
        x: cx + Math.cos(lat) * Math.sin(dLon) * R,
        y: cy - Math.sin(lat) * R,
        visible: visible
      };
    }

    function drawGlobe() {
      var rect = globeCanvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = rect.width, h = rect.height;
      if (!w || !h) return;
      globeCanvas.width = w * dpr;
      globeCanvas.height = h * dpr;
      gctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gctx.clearRect(0, 0, w, h);

      var size = Math.min(w, h);
      var R = size * 0.4;
      var cx = w / 2;
      var cy = h / 2;

      var gridColor = cssVar("--mist-strong", "#8a96a8");
      var equatorColor = cssVar("--azure", "#2f6fa3");
      var landFill = cssVar("--azure", "#2f6fa3");
      var landStroke = cssVar("--azure-strong", "#1f5480");

      gctx.lineWidth = 1;

      // ocean disk
      gctx.beginPath();
      gctx.arc(cx, cy, R, 0, Math.PI * 2);
      gctx.fillStyle = gridColor;
      gctx.globalAlpha = 0.06;
      gctx.fill();

      // landmasses, clipped to the globe disk
      gctx.save();
      gctx.beginPath();
      gctx.arc(cx, cy, R, 0, Math.PI * 2);
      gctx.clip();
      LANDMASSES.forEach(function (points) {
        gctx.beginPath();
        points.forEach(function (pt, i) {
          var p = project(pt[0], pt[1], cx, cy, R);
          if (i === 0) gctx.moveTo(p.x, p.y);
          else gctx.lineTo(p.x, p.y);
        });
        gctx.closePath();
        gctx.fillStyle = landFill;
        gctx.globalAlpha = 0.32;
        gctx.fill();
        gctx.strokeStyle = landStroke;
        gctx.globalAlpha = 0.7;
        gctx.lineWidth = 1.2;
        gctx.stroke();
      });
      gctx.restore();
      gctx.lineWidth = 1;

      // outer limb
      gctx.beginPath();
      gctx.arc(cx, cy, R, 0, Math.PI * 2);
      gctx.strokeStyle = gridColor;
      gctx.globalAlpha = 0.55;
      gctx.stroke();

      // latitude chords — orthographic view centered on the equator,
      // so parallels project as straight horizontal chords
      [0, 30, -30, 60, -60].forEach(function (latDeg) {
        var lat = (latDeg * Math.PI) / 180;
        var y = cy - Math.sin(lat) * R;
        var halfW = Math.cos(lat) * R;
        gctx.beginPath();
        gctx.moveTo(cx - halfW, y);
        gctx.lineTo(cx + halfW, y);
        gctx.strokeStyle = latDeg === 0 ? equatorColor : gridColor;
        gctx.globalAlpha = latDeg === 0 ? 0.5 : 0.35;
        gctx.stroke();
      });

      // meridians — fixed longitude offsets project as ellipses whose
      // width shrinks to a straight line at the center and to the outer
      // limb at ±90°
      [-60, -30, 0, 30, 60].forEach(function (dLonDeg) {
        var dLon = (dLonDeg * Math.PI) / 180;
        var k = Math.sin(dLon);
        var halfW = Math.abs(k) * R;
        gctx.beginPath();
        if (halfW < 0.6) {
          gctx.moveTo(cx, cy - R);
          gctx.lineTo(cx, cy + R);
        } else {
          gctx.ellipse(cx, cy, halfW, R, 0, 0, Math.PI * 2);
        }
        gctx.strokeStyle = gridColor;
        gctx.globalAlpha = 0.3;
        gctx.stroke();
      });

      gctx.globalAlpha = 1;
    }

    drawGlobe();
    window.addEventListener("resize", drawGlobe);
    if (themeBtn) themeBtn.addEventListener("click", function () { setTimeout(drawGlobe, 0); });
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
      setTimeout(drawGlobe, 0);
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            drawGlobe();
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 }).observe(globeCanvas);
    }
  }
})();
