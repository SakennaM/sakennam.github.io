const CONSTELLATION_SLOTS = [
  {
    id: 1,
    name: "Elnath",
    kickerDefault: "✦ Elnath · β Tauri ✦",
    x: 10.3,
    y: 5.9,
    size: 32,
    align: "r",
    defaultColor: "var(--lilac)"
  },
  {
    id: 2,
    name: "Tau",
    kickerDefault: "✦ Tau · τ Tauri ✦",
    x: 28.5,
    y: 27.5,
    size: 44,
    align: "r",
    defaultColor: "var(--pink)"
  },
  {
    id: 3,
    name: "Ain",
    kickerDefault: "✦ Ain · ε Tauri ✦",
    x: 33.0,
    y: 43.1,
    size: 34,
    align: "r",
    defaultColor: "var(--peach)"
  },
  {
    id: 4,
    name: "Aldebaran",
    kickerDefault: "✦ Aldebaran · α Tauri ✦",
    x: 38.7,
    y: 56.2,
    size: 50,
    align: "r",
    isBig: true,
    defaultColor: "#ffa65c"
  },
  {
    id: 5,
    name: "Tianguan",
    kickerDefault: "✦ Tianguan · ζ Tauri ✦",
    x: 23.0,
    y: 50.5,
    size: 34,
    align: "r",
    defaultColor: "var(--mint)"
  },
  {
    id: 6,
    name: "Prima Hyadum",
    kickerDefault: "✦ Prima Hyadum · γ Tauri ✦",
    x: 52.2,
    y: 67.7,
    size: 34,
    align: "t",
    defaultColor: "var(--sky)"
  },
  {
    id: 7,
    name: "Secunda Hyadum",
    kickerDefault: "✦ Secunda Hyadum · δ Tauri ✦",
    x: 76.5,
    y: 78.5,
    size: 42,
    align: "l",
    defaultColor: "var(--mint)"
  },
  {
    id: 8,
    name: "Omicron",
    kickerDefault: "✦ Omicron· ο Tauri ✦",
    x: 8.5,
    y: 33.5,
    size: 32,
    align: "r",
    defaultColor: "var(--mint)"
  },
  {
    id: 9,
    name: "Theta",
    kickerDefault: "✦ Theta · θ Tauri ✦",
    x: 88.5,
    y: 92.0,
    size: 28,
    align: "t",
    defaultColor: "var(--gold)"
  }
];

const iconCache = {};
const svgCache = {};

const UI_ICONS = {
  constellation: "icons/constellation.svg",
  list: "icons/list.svg"
};
const LINES_SVG = "icons/lines.svg";

async function fetchSvg(path) {
  if (svgCache[path] !== undefined) return svgCache[path];
  try {
    var res = await fetch(path);
    if (res.ok) {
      svgCache[path] = await res.text();
      return svgCache[path];
    }
  } catch (e) {}
  return "";
}

document.addEventListener("DOMContentLoaded", function(){
  initBackgroundStars();
  initStardustSystem();
  initViewModeSwitcher();
  initUiIcons();
  loadConstellationLines();
  showLoading();
  loadConfiguration();
});

function initUiIcons() {
  document.querySelectorAll("[data-icon]").forEach(async function(el){
    el.innerHTML = '<span class="loading-icon"></span>';
    el.innerHTML = await fetchSvg(UI_ICONS[el.dataset.icon]);
  });
}

async function loadConstellationLines() {
  var holder = document.getElementById("skyLines");
  if (holder) holder.innerHTML = await fetchSvg(LINES_SVG);
}

function showLoading() {
  var sky = document.getElementById("viewSky");
  var list = document.getElementById("viewList");

  if (sky) {
    CONSTELLATION_SLOTS.forEach(function(slot){
      var el = document.createElement("div");
      el.className = "star-unoccupied";
      el.setAttribute("aria-hidden", "true");
      el.style.cssText = "--x:" + slot.x + "%;--y:" + slot.y + "%;--s:" + slot.size + "px;--c:var(--gold);";
      el.innerHTML = '<span class="unoccupied-gem"><span class="unoccupied-disc"><span class="loading-icon"></span></span></span>';
      sky.appendChild(el);
    });
    var caption = document.createElement("div");
    caption.className = "sky-loading-text";
    caption.setAttribute("role", "status");
    caption.textContent = "loading";
    sky.appendChild(caption);
  }

  if (list) {
    list.innerHTML = `
      <li>
        <div class="list-item-link is-loading" style="--c:var(--gold)">
          <div class="list-icon-badge"><span class="loading-icon"></span></div>
          <div class="list-content"><span class="list-title">loading</span></div>
        </div>
      </li>
    `;
  }
}

// links.json couldn't be fetched (ie github farted probs)
function showLoadError() {
  var sky = document.getElementById("viewSky");
  var list = document.getElementById("viewList");
  if (sky) {
    sky.querySelectorAll(".star-unoccupied").forEach(function(el){ el.remove(); });
    var caption = sky.querySelector(".sky-loading-text");
    if (caption) caption.textContent = "couldn't load links";
  }
  if (list) list.innerHTML = '<li class="list-error">couldn\'t load links</li>';
}

function loadConfiguration() {
  fetch("./links.json")
    .then(function(res){
      if (!res.ok) throw new Error("Could not load links.json");
      return res.json();
    })
    .then(initAppWithConfig)
    .catch(function(err){
      console.warn("Could not load the links:", err);
      showLoadError();
    });
}

async function initAppWithConfig(config) {
  var iconDefinitions = config.icons || {};
  await Promise.all(
    Object.keys(iconDefinitions).map(async function(key){
      iconCache[key] = await fetchSvg(iconDefinitions[key]);
    })
  );
  renderApp(config);
}

function getIconSvg(iconKey) {
  return iconCache[iconKey] || iconCache.star || "";
}

function renderApp(config) {
  renderAnnouncements(config.announcements || []);

  var skyContainer = document.getElementById("viewSky");
  var listContainer = document.getElementById("viewList");
  if (!skyContainer || !listContainer) return;

  skyContainer.querySelectorAll(".star, .star-unoccupied, .sky-loading-text").forEach(function(el){ el.remove(); });
  listContainer.innerHTML = "";

  var links = config.links || [];
  var unoccupiedConfig = config.unoccupiedStar || { icon: "star", color: "var(--gold)" };

  var slotMap = {};
  links.forEach(function(link, index){
    var sId = link.slot !== undefined ? parseInt(link.slot, 10) : (index + 1);
    if (sId >= 1 && sId <= 9) {
      slotMap[sId] = link;
    }
  });

  CONSTELLATION_SLOTS.forEach(function(slot){
    var linkData = slotMap[slot.id];

    if (linkData) {
      // link star
      var color = linkData.color || slot.defaultColor;
      var iconSvg = getIconSvg(linkData.icon);
      var kicker = linkData.kicker || slot.kickerDefault;
      var target = /^mailto:/i.test(linkData.url) ? "_self" : "_blank";
      var rel = target === "_blank" ? ' target="_blank" rel="noopener"' : "";
      var bigClass = slot.isBig ? " big" : "";

      var starLink = document.createElement("a");
      starLink.className = "star " + slot.align + bigClass;
      starLink.href = linkData.url;
      if (target === "_blank") {
        starLink.target = "_blank";
        starLink.rel = "noopener";
      }
      starLink.setAttribute("aria-label", linkData.title + ": " + linkData.subtitle);
      starLink.style.cssText = "--x:" + slot.x + "%;--y:" + slot.y + "%;--s:" + slot.size + "px;--c:" + color + ";";

      starLink.innerHTML = `
        <span class="node-gem">
          <span class="node-rays"></span>
          <span class="node-disc">${iconSvg}</span>
        </span>
        <span class="thematic-pill">
          <span class="kicker">${escapeHtml(kicker)}</span>
          <b>${escapeHtml(linkData.title)}</b>
          <small>${escapeHtml(linkData.subtitle)}</small>
        </span>
      `;
      skyContainer.appendChild(starLink);

      // list row
      var listItem = document.createElement("li");
      listItem.innerHTML = `
        <a class="list-item-link" href="${escapeHtml(linkData.url)}"${rel} style="--c:${escapeHtml(color)}">
          <div class="list-icon-badge">${iconSvg}</div>
          <div class="list-content">
            <span class="list-kicker">${escapeHtml(kicker)}</span>
            <span class="list-title">${escapeHtml(linkData.title)}</span>
            <span class="list-sub">${escapeHtml(linkData.subtitle)}</span>
          </div>
          <span class="list-arrow" aria-hidden="true">›</span>
        </a>
      `;
      listContainer.appendChild(listItem);

    } else {
      // empty slot
      var unoccupiedColor = unoccupiedConfig.color || slot.defaultColor;
      var unoccupiedIconSvg = getIconSvg(unoccupiedConfig.icon || "star");

      var unoccupiedStar = document.createElement("div");
      unoccupiedStar.className = "star-unoccupied";
      unoccupiedStar.setAttribute("aria-hidden", "true");
      unoccupiedStar.title = slot.name;
      unoccupiedStar.style.cssText = "--x:" + slot.x + "%;--y:" + slot.y + "%;--s:" + slot.size + "px;--c:" + unoccupiedColor + ";";

      unoccupiedStar.innerHTML = `
        <span class="unoccupied-gem">
          <span class="unoccupied-disc">${unoccupiedIconSvg}</span>
        </span>
      `;
      skyContainer.appendChild(unoccupiedStar);
    }
  });

  initMobileTouchCards();
}

function renderAnnouncements(items) {
  var box = document.getElementById("notice");
  if (!box) return;
  box.innerHTML = "";
  if (!items || !items.length) {
    box.hidden = true;
    return;
  }
  var h = document.createElement("div");
  h.className = "nhead";
  h.textContent = "✦ news from the space! ✦";
  box.appendChild(h);

  items.forEach(function(item){
    if (typeof item === "string") item = { text: item };
    var p = document.createElement("p");
    if (item.url) {
      p.appendChild(makeLink(item.text, item.url));
    } else {
      appendRichText(p, item.text);
    }
    box.appendChild(p);
  });
  box.hidden = false;
}

// markdown [word](url) into <a> tag

function appendRichText(parent, text) {
  var re = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  var last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parent.appendChild(document.createTextNode(text.slice(last, m.index)));
    parent.appendChild(makeLink(m[1], m[2]));
    last = re.lastIndex;
  }
  if (last < text.length) parent.appendChild(document.createTextNode(text.slice(last)));
}

function makeLink(label, url) {
  var a = document.createElement("a");
  a.textContent = label;
  if (/^(https?:|mailto:|\/|\.\/|#)/i.test(url)) a.href = url;
  if (/^https?:/i.test(url)) {
    a.target = "_blank";
    a.rel = "noopener";
  }
  return a;
}

// background stars
function initBackgroundStars() {
  var st = document.getElementById("stars");
  if (!st) return;
  st.innerHTML = "";
  for (var i = 0; i < 45; i++) {
    var s = document.createElement("i");
    var z = Math.random() < 0.15 ? 3 : Math.random() < 0.5 ? 2 : 1;
    s.style.cssText = "left:" + (Math.random() * 100) + "%;top:" + (Math.random() * 100) + "%;width:" + z + "px;height:" + z + "px;animation-duration:" + (2.5 + Math.random() * 3.5) + "s;animation-delay:" + (-Math.random() * 5) + "s";
    st.appendChild(s);
  }
}

// click & drag effect
function initStardustSystem() {
  var sparkleColors = ["#ffe08a", "#ff9ec7", "#c4a8ff", "#9df0d0", "#8fd0ff", "#ffffff"];
  var sparkleGlyphs = ["✦", "✧", "★", "·", "•"];
  var activeSparkles = 0;
  var MAX_SPARKLES = 100;

  function spawnSparkles(x, y, count, spread) {
    if (activeSparkles >= MAX_SPARKLES) return;
    var allowed = Math.min(count, MAX_SPARKLES - activeSparkles);
    for (var i = 0; i < allowed; i++) {
      activeSparkles++;
      var z = document.createElement("span");
      var a = Math.random() * 6.28;
      var r = (spread || 18) + Math.random() * (spread ? spread * 1.1 : 20);
      z.className = "zap";
      z.textContent = sparkleGlyphs[Math.floor(Math.random() * sparkleGlyphs.length)];
      z.style.left = x + "px";
      z.style.top = y + "px";
      z.style.color = sparkleColors[Math.floor(Math.random() * sparkleColors.length)];
      z.style.fontSize = (11 + Math.random() * 9) + "px";
      z.style.setProperty("--x", (Math.cos(a) * r) + "px");
      z.style.setProperty("--y", (Math.sin(a) * r) + "px");
      document.body.appendChild(z);
      z.addEventListener("animationend", function(){
        this.remove();
        activeSparkles = Math.max(0, activeSparkles - 1);
      }, { once: true });
    }
  }

  var isDragging = false;
  var lastX = 0, lastY = 0;
  var rafPending = false;

  document.addEventListener("pointerdown", function(e){
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    if (!e.target.closest("a, button")) {
      spawnSparkles(e.clientX, e.clientY, 5, 28);
    }
  });

  window.addEventListener("pointermove", function(e){
    if (!isDragging || rafPending) return;
    rafPending = true;
    var cx = e.clientX, cy = e.clientY;
    requestAnimationFrame(function(){
      var dx = cx - lastX;
      var dy = cy - lastY;
      if (Math.hypot(dx, dy) > 10) {
        lastX = cx;
        lastY = cy;
        spawnSparkles(cx, cy, 2, 12);
      }
      rafPending = false;
    });
  }, { passive: true });

  window.addEventListener("pointerup", function(){ isDragging = false; });
  window.addEventListener("pointercancel", function(){ isDragging = false; });
}

// touch handling
function initMobileTouchCards() {
  var stars = document.querySelectorAll(".star");
  var touchedStar = null;

  stars.forEach(function(star){
    star.addEventListener("pointerdown", function(e){
      if (window.matchMedia("(hover: none)").matches) {
        if (touchedStar === star) {
          return;
        }
        e.preventDefault();
        if (touchedStar) touchedStar.classList.remove("is-touched");
        touchedStar = star;
        star.classList.add("is-touched");
      }
    });
  });

  document.addEventListener("pointerdown", function(e){
    if (touchedStar && !touchedStar.contains(e.target)) {
      touchedStar.classList.remove("is-touched");
      touchedStar = null;
    }
  });
}

// view switch
function initViewModeSwitcher() {
  var btn = document.getElementById("viewToggle");
  var viewSky = document.getElementById("viewSky");
  var viewList = document.getElementById("viewList");
  if (!btn || !viewSky || !viewList) return;

  function setViewMode(mode) {
    var isList = mode === "list";
    viewSky.hidden = isList;
    viewList.hidden = !isList;
    btn.dataset.view = isList ? "list" : "constellation";
    var label = isList ? "Switch to constellation view" : "Switch to list view";
    btn.setAttribute("aria-label", label);
    btn.title = label;
    try {
      localStorage.setItem("sakenna_view_mode", mode);
    } catch(e){}
  }

  btn.addEventListener("click", function(){
    setViewMode(btn.dataset.view === "list" ? "constellation" : "list");
  });

  try {
    var saved = localStorage.getItem("sakenna_view_mode");
    if (saved === "list") setViewMode("list");
  } catch(e){}
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
