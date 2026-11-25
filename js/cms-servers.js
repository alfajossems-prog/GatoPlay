// === GATO CMS: TEMA + MENÚ MINIMALISTA + SERVERS ===
(function() {
  const SVG_SUN = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
  const SVG_MOON = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  const SVG_MENU = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>';
  const SVG_CLOSE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  const SVG_SRV = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="7" rx="2"/><rect x="2" y="14" width="20" height="7" rx="2"/><line x1="6" y1="6.5" x2="6.01" y2="6.5"/><line x1="6" y1="17.5" x2="6.01" y2="17.5"/></svg>';
  const SVG_BELL = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';
  const SVG_APK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>';
  const SVG_OUT = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>';
  const SVG_PLAY = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
  const SVG_CHECK = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  const SVG_PLUS = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';

  const WORKER_BASE = "https://gato-uploader.josseanm.workers.dev";
  const SRV_ORDER = ["pixeldrain", "voe", "streamtape", "mixdrop", "doodstream"];
  const SRV_LABELS = { pixeldrain: "Pixeldrain", voe: "VOE", streamtape: "Streamtape", mixdrop: "Mixdrop", doodstream: "Dood" };
  const SRV_SHORT = { pixeldrain: "P", voe: "V", streamtape: "S", mixdrop: "M", doodstream: "D" };
  const SRV_COLORS = { pixeldrain: "#8b5cf6", voe: "#0284c7", streamtape: "#10b981", mixdrop: "#f59e0b", doodstream: "#ef4444" };

  let activeServersMap = {};
  let allFilesRaw = [];
  let currentFilter = "all";
  let activeXhr = null;
  let msTasks = [];
  let msPollTimer = null;
  let msTrayOpen = true;

  try { msTasks = JSON.parse(localStorage.getItem("gato_remote_tasks") || "[]"); } catch(_) { msTasks = []; }
  const getPass = () => localStorage.getItem("gato_worker_pass") || "";
  let msSyncTimer = null;
  const pushTasksToCloud = () => {
    if (!getPass()) return;
    clearTimeout(msSyncTimer);
    msSyncTimer = setTimeout(() => {
      fetch(WORKER_BASE + "/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Panel-Pass": getPass() },
        body: JSON.stringify({ tasks: msTasks.slice(0, 20) })
      }).catch(() => {});
    }, 700);
  };
  const saveTasks = (skipCloud = false) => {
    localStorage.setItem("gato_remote_tasks", JSON.stringify(msTasks.slice(0, 20)));
    if (!skipCloud) pushTasksToCloud();
  };
  async function loadTasksFromCloud() {
    if (!getPass()) return;
    try {
      const r = await fetch(WORKER_BASE + "/tasks", { headers: { "X-Panel-Pass": getPass() } });
      if (!r.ok) return;
      const d = await r.json();
      if (Array.isArray(d.tasks)) {
        msTasks = d.tasks;
        if (msTasks.some(t => t.state === "running" || t.state === "processing")) msTrayOpen = true;
        saveTasks(true);
        renderTray();
        msRenderFiles();
    if (msTasks.some(t => t.state === "running" || t.state === "processing")) startPolling();
      }
    } catch (_) {}
  }

  const fmtBytes = (b) => {
    const n = Number(b) || 0;
    if (!n) return "";
    if (n >= 1073741824) return (n / 1073741824).toFixed(2) + " GB";
    if (n >= 1048576) return (n / 1048576).toFixed(1) + " MB";
    return (n / 1024).toFixed(0) + " KB";
  };

  function applyTheme(mode) {
    const isLight = mode === "light";
    document.body.classList.toggle("gato-light", isLight);
    const icon = isLight ? SVG_MOON : SVG_SUN;
    const fab = document.getElementById("gatoThemeFab");
    const btn = document.getElementById("msThemeBtn");
    if (fab) fab.innerHTML = icon;
    if (btn) btn.innerHTML = icon;
  }

  window.gatoToggleTheme = function() {
    const next = document.body.classList.contains("gato-light") ? "dark" : "light";
    localStorage.setItem("gato_theme", next);
    applyTheme(next);
  };

  function initHeaderMenu() {
    const header = document.querySelector("header") || document.querySelector("nav");
    if (!header || document.getElementById("gatoMenuToggleBtn")) return;
    header.classList.add("gh-topbar");

    const dd = document.createElement("div");
    dd.id = "gatoHeaderDropdown";
    const closeMenu = () => { dd.classList.remove("open"); toggleBtn.innerHTML = SVG_MENU; };

    const srvBtn = document.createElement("button");
    srvBtn.type = "button";
    srvBtn.className = "gh-menu-item accent";
    srvBtn.innerHTML = SVG_SRV + "<span>Servers</span>";
    srvBtn.onclick = () => { closeMenu(); window.msOpenModal(); };
    dd.appendChild(srvBtn);

    let exitEl = null;
    Array.from(header.querySelectorAll("button, a")).forEach(el => {
      if (el.id === "gatoMenuToggleBtn") return;
      const txt = (el.textContent || "").trim();
      const up = txt.toUpperCase();
      if (up.includes("GATO CMS")) return;
      if (up.includes("CATÁLOGO") || up.includes("CATALOGO") || (el.getAttribute("href") || "").includes("index.html")) {
        el.style.display = "none";
        return;
      }
      el.className = "gh-menu-item";
      el.removeAttribute("style");
      if (up.includes("PORTADA") || up.includes("APK")) el.innerHTML = SVG_APK + "<span>Portada / APK</span>";
      else if (up.includes("SALIR")) { el.classList.add("danger"); el.innerHTML = SVG_OUT + "<span>Cerrar sesión</span>"; exitEl = el; }
      else if (txt === "" || txt.includes("🔔") || el.innerHTML.includes("🔔")) el.innerHTML = SVG_BELL + "<span>Notificaciones</span>";
      el.addEventListener("click", closeMenu);
      if (el !== exitEl) dd.appendChild(el);
    });

    const statusBar = Array.from(document.querySelectorAll("div, section")).find(el => {
      if (el.closest("#gatoMultiServerModal") || el.closest("#gatoHeaderDropdown")) return false;
      const t = el.textContent || "";
      return t.includes("Cloud Activo") && t.includes("TMDB") && el.children.length <= 6 && el.offsetHeight < 120;
    });
    if (statusBar) {
      const div1 = document.createElement("div"); div1.className = "gh-dd-divider"; dd.appendChild(div1);
      const stWrap = document.createElement("div"); stWrap.className = "gh-dd-status"; stWrap.appendChild(statusBar); dd.appendChild(stWrap);
    }

    if (exitEl) {
      const div2 = document.createElement("div"); div2.className = "gh-dd-divider"; dd.appendChild(div2);
      dd.appendChild(exitEl);
    }

    Array.from(header.children).forEach(ch => {
      if (!ch.textContent.trim() && ch.querySelectorAll("svg, img").length === 0) ch.style.display = "none";
    });

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.id = "gatoMenuToggleBtn";
    toggleBtn.title = "Menú";
    toggleBtn.innerHTML = SVG_MENU;
    toggleBtn.onclick = (e) => {
      e.stopPropagation();
      const isOpen = dd.classList.toggle("open");
      toggleBtn.innerHTML = isOpen ? SVG_CLOSE : SVG_MENU;
    };

    header.appendChild(toggleBtn);
    document.body.appendChild(dd);
    document.addEventListener("click", (e) => {
      if (dd.classList.contains("open") && !dd.contains(e.target) && !toggleBtn.contains(e.target)) closeMenu();
    });
  }

  function normTitle(str) {
    return String(str || "").toLowerCase().replace(/\.(mp4|mkv|avi|mov|webm)(\.mp4)?$/gi, "").replace(/[\._\-\+;]+/g, " ").replace(/\s+/g, " ").trim();
  }

  function getCatalogEmbedSet() {
    const set = new Set();
    try {
      const list = window.catalogItems || window.movies || window.catalogo || [];
      if (Array.isArray(list)) (JSON.stringify(list).match(/https?:\/\/[^"'\s]+/g) || []).forEach(u => set.add(u.trim()));
    } catch (_) {}
    return set;
  }

  function groupFiles(files) {
    const map = new Map();
    files.forEach(f => {
      const key = normTitle(f.title) || f.embed;
      if (!map.has(key)) map.set(key, { key, displayTitle: f.title || "Sin título", servers: {}, maxSize: 0 });
      const g = map.get(key);
      if (!g.servers[f.server]) g.servers[f.server] = f;
      if ((Number(f.size) || 0) > g.maxSize) g.maxSize = Number(f.size) || 0;
    });
    return Array.from(map.values());
  }

  window.openMultiServerModal = window.msOpenModal = function() {
    const m = document.getElementById("gatoMultiServerModal");
    if (!m) return;
    m.style.display = "flex";
    
    if (!getPass()) {
      document.getElementById("msSettingsBox").style.display = "block";
      document.getElementById("msConnStatus").textContent = "Configura tu contraseña en ajustes";
    } else msPingAndLoad();
  };

  window.msCloseModal = () => { const m = document.getElementById("gatoMultiServerModal"); if (m) m.style.display = "none"; };
  window.msToggleSettings = () => { const b = document.getElementById("msSettingsBox"); if (!b) return; const show = b.style.display === "none"; b.style.display = show ? "block" : "none"; if (show) { const inp = document.getElementById("msPassInput"); if (inp) inp.value = getPass(); } };
  window.msSavePass = () => {
    const v = (document.getElementById("msPassInput").value || "").trim();
    if (!v) return;
    localStorage.setItem("gato_worker_pass", v);
    document.getElementById("msSettingsBox").style.display = "none";
    msPingAndLoad();
  };

  window.msSwitchTab = (tab) => {
    ["files", "remote", "upload"].forEach(t => {
      document.getElementById("msPane" + t.charAt(0).toUpperCase() + t.slice(1)).style.display = (t === tab) ? "block" : "none";
      document.getElementById("msTab" + t.charAt(0).toUpperCase() + t.slice(1)).classList.toggle("active", t === tab);
    });
  };

  async function msPingAndLoad() {
    const st = document.getElementById("msConnStatus");
    st.textContent = "Conectando...";
    try {
      const r = await fetch(WORKER_BASE + "/ping", { headers: { "X-Panel-Pass": getPass() } });
      const d = await r.json();
      if (!d.ok) { st.textContent = "Contraseña incorrecta"; document.getElementById("msSettingsBox").style.display = "block"; return; }
      activeServersMap = d.servers || {};
      const activeNames = SRV_ORDER.filter(k => activeServersMap[k]).map(k => SRV_LABELS[k]);
      st.textContent = activeNames.length ? activeNames.join(" · ") : "Sin servidores activos";
      const remBox = document.getElementById("msRemoteTargets");
      const upSel = document.getElementById("msUploadServer");
      const actives = SRV_ORDER.filter(k => activeServersMap[k]);
      if (remBox) remBox.innerHTML = actives.filter(k => k !== "pixeldrain").map(k => `<label class="ms-chip"><input type="checkbox" class="ms-rem-chk" value="${k}" checked style="accent-color:#14748E;"><span class="ms-badge-mini" style="background:${SRV_COLORS[k]};color:${k==='mixdrop'?'#111':'#fff'};">${SRV_SHORT[k]}</span>${SRV_LABELS[k]}</label>`).join("");
      if (upSel) upSel.innerHTML = actives.filter(k => k !== "pixeldrain").map(k => `<option value="${k}">${SRV_LABELS[k]}${k==='mixdrop'?' (máx. 100 MB)':''}</option>`).join("");
      msLoadFiles();
    } catch (_) { st.textContent = "Error de conexión"; }
  }

  window.msLoadFiles = async function() {
    loadTasksFromCloud();
    const listEl = document.getElementById("msFilesList");
    listEl.innerHTML = '<div style="padding:18px;text-align:center;color:var(--gt-muted);grid-column:1/-1;">Cargando archivos...</div>';
    try {
      const r = await fetch(WORKER_BASE + "/files", { headers: { "X-Panel-Pass": getPass() } });
      const d = await r.json();
      allFilesRaw = Array.isArray(d.files) ? d.files : [];
      reconcileTasksWithFiles();
      msRenderFiles();
    } catch (e) { listEl.innerHTML = '<div style="padding:18px;text-align:center;color:#ef4444;grid-column:1/-1;">Error: ' + e.message + '</div>'; }
  };

  window.msSetFilter = (f) => { currentFilter = f; msRenderFiles(); };

  window.msRenderFiles = function() {
    const groups = groupFiles(allFilesRaw);
    const activeSrvs = SRV_ORDER.filter(k => activeServersMap[k]);
    const catSet = getCatalogEmbedSet();
    const q = (document.getElementById("msSearchInput")?.value || "").toLowerCase().trim();
    const isIncomplete = (g) => activeSrvs.some(s => !g.servers[s]);
    const isPublished = (g) => Object.values(g.servers).some(f => catSet.has(f.embed));

    const counts = { all: groups.length, incomplete: groups.filter(isIncomplete).length, unpublished: groups.filter(g => !isPublished(g)).length };
    SRV_ORDER.forEach(s => counts[s] = allFilesRaw.filter(f => f.server === s).length);

    let chips = `
      <button type="button" class="ms-chip ${currentFilter==='all'?'active':''}" onclick="msSetFilter('all')">Todos (${counts.all})</button>
      <button type="button" class="ms-chip ${currentFilter==='incomplete'?'active':''}" onclick="msSetFilter('incomplete')">Incompletos (${counts.incomplete})</button>
      <button type="button" class="ms-chip ${currentFilter==='unpublished'?'active':''}" onclick="msSetFilter('unpublished')">Sin publicar (${counts.unpublished})</button>
    `;
    activeSrvs.forEach(s => {
      chips += `<button type="button" class="ms-chip ${currentFilter===s?'active':''}" onclick="msSetFilter('${s}')"><span class="ms-badge-mini" style="background:${SRV_COLORS[s]};color:${s==='mixdrop'?'#111':'#fff'};">${SRV_SHORT[s]}</span>${SRV_LABELS[s]} (${counts[s]})</button>`;
    });
    document.getElementById("msFilterBar").innerHTML = chips;

    const filtered = groups.filter(g => {
      if (q && !g.displayTitle.toLowerCase().includes(q)) return false;
      if (currentFilter === "incomplete") return isIncomplete(g);
      if (currentFilter === "unpublished") return !isPublished(g);
      if (SRV_ORDER.includes(currentFilter)) return Boolean(g.servers[currentFilter]);
      return true;
    });

    const listEl = document.getElementById("msFilesList");
    if (!filtered.length) { listEl.innerHTML = '<div style="padding:22px;text-align:center;color:var(--gt-muted);grid-column:1/-1;">No hay archivos en este filtro.</div>'; return; }

    listEl.innerHTML = filtered.map(g => {
      const pub = isPublished(g), sizeTxt = fmtBytes(g.maxSize), lowSize = g.maxSize > 0 && g.maxSize < 5242880;
      const firstAvail = Object.values(g.servers)[0];
      const pillsHtml = activeSrvs.map(s => {
        const f = g.servers[s];
        if (f) return `<button type="button" class="ms-srv-pill" style="background:${SRV_COLORS[s]};color:${s==='mixdrop'?'#111':'#fff'};" onclick="msInsertOne('${encodeURIComponent(f.embed)}','${s}')">${SVG_CHECK} ${SRV_LABELS[s]}</button>`;
        const qTask = msTasks.find(t => (t.state === "running" || t.state === "processing") && t.server === s && normTitle(t.title) === g.key);
        if (qTask) {
          const pctTxt = qTask.pct > 0 ? ` (${qTask.pct}%)` : "";
          return `<button type="button" class="ms-srv-pill missing" disabled style="border-style:solid;border-color:#10b981;color:#10b981;opacity:0.95;">En cola${pctTxt}</button>`;
        }
        const bestSrc = g.servers.pixeldrain ? g.servers.pixeldrain : ((s === "mixdrop" && g.servers.streamtape) ? g.servers.streamtape : firstAvail);
        const srcUrl = (s === "mixdrop" && bestSrc.server === "streamtape") ? bestSrc.embed.replace("/e/", "/v/") : bestSrc.embed;
        return `<button type="button" class="ms-srv-pill missing" onclick="msQuickTransfer(this,'${encodeURIComponent(srcUrl)}','${s}')">${SVG_PLUS} ${SRV_LABELS[s]}</button>`;
      }).join("");
      const allEmbedsJson = encodeURIComponent(JSON.stringify(Object.values(g.servers).map(x => ({ server: x.server, embed: x.embed }))));
      return `<div class="ms-card">
        <div class="ms-card-top">
          <div style="min-width:0;">
            <div class="ms-card-title">${g.displayTitle}</div>
            <div class="ms-card-meta">
              ${pub ? '<span class="ms-tag ms-tag-ok">En Catálogo</span>' : '<span class="ms-tag ms-tag-new">Sin publicar</span>'}
              ${sizeTxt ? '<span>' + sizeTxt + '</span>' : ''}
              ${lowSize ? '<span class="ms-tag ms-tag-warn">Archivo pequeño</span>' : ''}
            </div>
          </div>
          <a href="${firstAvail.embed}" target="_blank" rel="noopener" class="ms-icon-btn" style="text-decoration:none;width:30px;height:30px;" title="Probar video">${SVG_PLAY}</a>
        </div>
        <div class="ms-pills-row">${pillsHtml}</div>
        <div class="ms-card-actions"><button type="button" class="ms-btn ms-btn-primary" onclick="msInsertAll('${allEmbedsJson}')">Insertar Todos (${Object.keys(g.servers).length})</button></div>
      </div>`;
    }).join("");
  };

  function getVideoUrlInputs() {
    return Array.from(document.querySelectorAll('input[type="url"], input[type="text"]')).filter(el => {
      if (el.closest('#gatoMultiServerModal')) return false;
      const ph = (el.placeholder || "").toLowerCase();
      const id = (el.id || "").toLowerCase();
      if (id.includes("poster") || id.includes("backdrop") || id.includes("sub") || id.includes("tmdb") || id.includes("search")) return false;
      return ph.includes("streamtape") || ph.includes(".mp4") || ph.includes("enlace") || ph.includes("https://");
    });
  }

  function clickAddManualLinkBtn() {
    const btns = Array.from(document.querySelectorAll('button')).filter(b => !b.closest('#gatoMultiServerModal'));
    const addBtn = btns.find(b => (b.textContent || "").toLowerCase().includes("enlace manual"));
    if (addBtn) {
      addBtn.click();
      return true;
    }
    return false;
  }

  function fillServerRow(embedUrl, srvKey) {
    const srvName = SRV_LABELS[srvKey] || srvKey || "Servidor";
    let urlInputs = getVideoUrlInputs();

    // Evitar duplicar si ese enlace ya está en alguna caja
    if (urlInputs.some(el => el.value.trim() === embedUrl.trim())) return true;

    let targetUrlInput = urlInputs.find(el => !el.value.trim());

    // Si no hay caja vacía, crear una nueva pulsando "+ Enlace manual"
    if (!targetUrlInput && clickAddManualLinkBtn()) {
      urlInputs = getVideoUrlInputs();
      targetUrlInput = urlInputs.find(el => !el.value.trim()) || urlInputs[urlInputs.length - 1];
    }

    if (!targetUrlInput) return false;

    // Poner la URL
    targetUrlInput.value = embedUrl;
    targetUrlInput.dispatchEvent(new Event('input', { bubbles: true }));
    targetUrlInput.dispatchEvent(new Event('change', { bubbles: true }));

    // Buscar la caja del nombre del servidor dentro de la misma fila y rellenarla
    const row = targetUrlInput.parentElement?.parentElement || targetUrlInput.parentElement;
    if (row) {
      const rowInputs = Array.from(row.querySelectorAll('input[type="text"], input:not([type])')).filter(el => el !== targetUrlInput);
      if (rowInputs.length > 0) {
        rowInputs[0].value = srvName;
        rowInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        rowInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    return true;
  }

  window.msInsertOne = async (encUrl, srvKey) => {
    const url = decodeURIComponent(encUrl);
    const label = SRV_LABELS[srvKey] || srvKey || "Servidor";
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      alert("Enlace de " + label + " copiado:\n" + url);
    } catch (_) {
      prompt("Copia el enlace de " + label + ":", url);
    }
  };

  window.msInsertAll = (encList) => {
    const list = JSON.parse(decodeURIComponent(encList));
    const byKey = {};
    list.forEach(item => {
      const k = (item.server || "").toLowerCase();
      if (k.includes("voe")) byKey.voe = item.embed || "";
      else if (k.includes("pixeldrain")) byKey.pixeldrain = item.embed || "";
            else if (k.includes("mixdrop")) byKey.mixdrop = item.embed || "";
      else if (k.includes("streamtape")) byKey.streamtape = item.embed || "";
    });

    const fixedSlots = [
      { name: "VOE", url: byKey.voe || "", quality: "1080p" },
      { name: "Pixeldrain", url: byKey.pixeldrain || "", quality: "1080p" },
            { name: "Mixdrop", url: byKey.mixdrop || "", quality: "1080p" },
      { name: "Streamtape", url: byKey.streamtape || "", quality: "1080p" }
    ];

    const container = document.getElementById("dynamicServersContainer");
    if (container && typeof window.addServerInputRow === "function") {
      container.innerHTML = "";
      fixedSlots.forEach(slot => window.addServerInputRow(slot.name, slot.url, slot.quality));
      msCloseModal();
    } else if (navigator.clipboard) {
      const urls = fixedSlots.map(s => s.url).filter(Boolean).join("\n");
      navigator.clipboard.writeText(urls);
      alert("Enlaces copiados al portapapeles.");
    }
  };
window.msQuickTransfer = async function(btn, encSourceUrl, targetSrv) {
    const url = decodeURIComponent(encSourceUrl), orig = btn.innerHTML;
    btn.disabled = true; btn.textContent = "Enviando...";
    try {
      const r = await fetch(WORKER_BASE + "/remote", { method: "POST", headers: { "Content-Type": "application/json", "X-Panel-Pass": getPass() }, body: JSON.stringify({ url, servers: [targetSrv] }) });
      const d = await r.json(), res = (d.results || [])[0];
      if (d.ok && res && res.ok) {
        btn.style.borderStyle = "solid"; btn.style.borderColor = "#10b981"; btn.style.color = "#10b981"; btn.textContent = "En cola";
        const cardTitle = btn.closest(".ms-card")?.querySelector(".ms-card-title")?.textContent || "Video";
        msEnqueueTask({ server: targetSrv, id: res.id || "", title: cardTitle });
      } else {
        btn.style.color = "#ef4444"; btn.textContent = "Error: " + (res?.raw?.result?.msg || res?.error || "Rechazado");
        setTimeout(() => { btn.disabled = false; btn.innerHTML = orig; btn.style.color = ""; }, 3000);
      }
    } catch (_) {
      btn.style.color = "#ef4444"; btn.textContent = "Error red";
      setTimeout(() => { btn.disabled = false; btn.innerHTML = orig; btn.style.color = ""; }, 2500);
    }
  };

  window.msSendRemote = async function() {
    const url = (document.getElementById("msRemoteUrl").value || "").trim();
    const targets = Array.from(document.querySelectorAll(".ms-rem-chk:checked")).map(c => c.value);
    const out = document.getElementById("msRemoteResult");
    if (!url || !targets.length) { alert("Pega una URL y selecciona al menos un servidor."); return; }
    out.innerHTML = '<div style="font-size:12px;color:var(--gt-muted);">Enviando...</div>';
    try {
      const r = await fetch(WORKER_BASE + "/remote", { method: "POST", headers: { "Content-Type": "application/json", "X-Panel-Pass": getPass() }, body: JSON.stringify({ url, servers: targets }) });
      const d = await r.json();
      (d.results || []).forEach(res => { if (res.ok) msEnqueueTask({ server: res.server, id: res.id || "", title: url.split("/").pop() || "Carga remota" }); });
      out.innerHTML = (d.results || []).map(res => `<div style="display:flex;justify-content:space-between;padding:8px 10px;border-radius:8px;background:var(--gt-surface-2);font-size:12px;"><strong>${SRV_LABELS[res.server] || res.server}</strong><span style="font-weight:700;color:${res.ok?'#10b981':'#ef4444'};">${res.ok ? 'Enviado' : (res.raw?.result?.msg || res.error || 'Error')}</span></div>`).join("");
    } catch (e) { out.innerHTML = '<div style="color:#ef4444;font-size:12px;">Error: ' + e.message + '</div>'; }
  };

  
  const activeUploads = new Map();
let uploadSeq = 0;

function msEnsureUploadUI() {
  const fileEl = document.getElementById("msUploadFile");
  const nameEl = document.getElementById("msUploadName");
  if (!fileEl || fileEl.dataset.minimalReady) return;
  fileEl.dataset.minimalReady = "1";
  fileEl.removeAttribute("accept");
  fileEl.style.display = "none";

  if (nameEl) {
    nameEl.style.display = "none";
    nameEl.addEventListener("input", () => {
      const lbl = document.getElementById("msPickLabel");
      if (lbl && nameEl.value.trim()) lbl.textContent = nameEl.value.trim();
    });
  }

  const row = document.createElement("div");
  row.id = "msPickRow";
  row.style.cssText = "display:flex;align-items:stretch;gap:8px;width:100%;";

  const picker = document.createElement("button");
  picker.type = "button";
  picker.id = "msPickFileBtn";
  picker.style.cssText = "flex:1;min-width:0;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;border-radius:10px;border:1px dashed rgba(255,255,255,0.22);background:rgba(255,255,255,0.03);color:#e2e8f0;font-size:13px;cursor:pointer;text-align:left;";
  picker.innerHTML = '<span id="msPickLabel" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;opacity:.85;">+ Seleccionar video...</span><span id="msPickSize" style="font-size:11px;opacity:.6;flex-shrink:0;">MP4 / MKV</span>';
  picker.onclick = () => fileEl.click();

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.id = "msEditNameBtn";
  editBtn.title = "Editar nombre del archivo";
  editBtn.style.cssText = "display:none;align-items:center;justify-content:center;width:44px;flex-shrink:0;border-radius:10px;border:1px solid rgba(255,255,255,0.16);background:rgba(255,255,255,0.05);color:#cbd5e1;cursor:pointer;transition:all .15s;";
  editBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>';
  editBtn.onclick = () => {
    if (!nameEl) return;
    const isHidden = nameEl.style.display === "none";
    nameEl.style.display = isHidden ? "block" : "none";
    editBtn.style.borderColor = isHidden ? "#14748e" : "rgba(255,255,255,0.16)";
    editBtn.style.color = isHidden ? "#38bdf8" : "#cbd5e1";
    if (isHidden) {
      nameEl.focus();
      nameEl.select();
    }
  };

  row.appendChild(picker);
  row.appendChild(editBtn);
  fileEl.parentNode.insertBefore(row, fileEl);

  const upBtn = document.getElementById("msUploadBtn");
  if (upBtn) {
    upBtn.style.cssText += ";border-radius:10px;font-weight:600;letter-spacing:.2px;";
  }

  let queue = document.getElementById("msUploadQueue");
  if (!queue && upBtn) {
    queue = document.createElement("div");
    queue.id = "msUploadQueue";
    queue.style.cssText = "display:flex;flex-direction:column;gap:8px;margin-top:12px;width:100%;";
    const btnRow = upBtn.parentNode;
    if (btnRow && btnRow.parentNode) btnRow.parentNode.insertBefore(queue, btnRow.nextSibling);
    else btnRow.appendChild(queue);
  }

  if (!document.getElementById("msConfirmModal")) {
    const modal = document.createElement("div");
    modal.id = "msConfirmModal";
    modal.style.cssText = "position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.72);backdrop-filter:blur(4px);padding:18px;";
    modal.innerHTML = `
      <div style="width:100%;max-width:340px;background:#111827;border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:18px;box-shadow:0 20px 50px rgba(0,0,0,.55);color:#f8fafc;">
        <div style="font-size:15px;font-weight:700;margin-bottom:6px;">¿Cancelar subida?</div>
        <div id="msConfirmText" style="font-size:13px;color:#94a3b8;line-height:1.45;margin-bottom:16px;word-break:break-word;"></div>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button type="button" id="msConfirmNo" style="padding:9px 14px;border-radius:9px;border:1px solid rgba(255,255,255,.14);background:transparent;color:#e2e8f0;font-size:12px;font-weight:600;cursor:pointer;">Seguir subiendo</button>
          <button type="button" id="msConfirmYes" style="padding:9px 14px;border-radius:9px;border:none;background:#ef4444;color:#fff;font-size:12px;font-weight:700;cursor:pointer;">Sí, cancelar</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }
}

function msAskCancelConfirm(title, onConfirm) {
  msEnsureUploadUI();
  const modal = document.getElementById("msConfirmModal");
  const txt = document.getElementById("msConfirmText");
  const btnNo = document.getElementById("msConfirmNo");
  const btnYes = document.getElementById("msConfirmYes");
  txt.textContent = `Se detendrá la subida de "${title}".`;
  modal.style.display = "flex";
  const close = () => { modal.style.display = "none"; };
  btnNo.onclick = close;
  modal.onclick = (e) => { if (e.target === modal) close(); };
  btnYes.onclick = () => { close(); onConfirm(); };
}

function msRefreshUploadBtn() {
  const upBtn = document.getElementById("msUploadBtn");
  if (!upBtn) return;
  upBtn.disabled = false;
  upBtn.textContent = activeUploads.size > 0 ? "+ Agregar otro archivo" : "Subir Video";
}

setInterval(msEnsureUploadUI, 600);

document.addEventListener("change", (ev) => {
  if (ev.target && ev.target.id === "msUploadFile") {
    msEnsureUploadUI();
    const f = ev.target.files && ev.target.files[0];
    const nameEl = document.getElementById("msUploadName");
    const editBtn = document.getElementById("msEditNameBtn");
    const lbl = document.getElementById("msPickLabel");
    const sz = document.getElementById("msPickSize");
    if (f) {
      if (nameEl) { nameEl.value = f.name; nameEl.style.display = "none"; }
      if (editBtn) {
        editBtn.style.display = "flex";
        editBtn.style.borderColor = "rgba(255,255,255,0.16)";
        editBtn.style.color = "#cbd5e1";
      }
      if (lbl) { lbl.textContent = f.name; lbl.style.opacity = "1"; }
      if (sz) sz.textContent = (f.size / (1024 * 1024)).toFixed(1) + " MB";
    }
  }
});

window.msStartUpload = async function() {
  msEnsureUploadUI();
  const srvEl = document.getElementById("msUploadServer");
  const fileEl = document.getElementById("msUploadFile");
  const nameEl = document.getElementById("msUploadName");
  const queue = document.getElementById("msUploadQueue");
  const srv = srvEl ? srvEl.value : "";
  const file = fileEl && fileEl.files ? fileEl.files[0] : null;
  if (!file) {
    if (fileEl) fileEl.click();
    return;
  }

  const rawName = (nameEl ? nameEl.value.trim() : "") || file.name;
  const extMatch = file.name.match(/(\.[a-z0-9]{2,5})$/i);
  const ext = extMatch ? extMatch[1] : ".mp4";
  const finalName = /\.[a-z0-9]{2,5}$/i.test(rawName) ? rawName : (rawName + ext);

  // Limpiar selector para permitir agregar otro archivo al instante
  fileEl.value = "";
  if (nameEl) { nameEl.value = ""; nameEl.style.display = "none"; }
  const editBtnReset = document.getElementById("msEditNameBtn");
  if (editBtnReset) editBtnReset.style.display = "none";
  const lbl = document.getElementById("msPickLabel");
  const sz = document.getElementById("msPickSize");
  if (lbl) { lbl.textContent = "+ Seleccionar otro video..."; lbl.style.opacity = ".85"; }
  if (sz) sz.textContent = "MP4 / MKV";

  const uid = "up_" + (++uploadSeq);
  const srvColor = (typeof SRV_COLORS !== "undefined" && SRV_COLORS[srv]) ? SRV_COLORS[srv] : "#0284c7";
  const srvLabel = (typeof SRV_LABELS !== "undefined" && SRV_LABELS[srv]) ? SRV_LABELS[srv] : srv;

  const card = document.createElement("div");
  card.id = uid;
  card.style.cssText = "background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:10px 12px;display:flex;flex-direction:column;gap:6px;";
  card.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
      <div style="display:flex;align-items:center;gap:6px;min-width:0;">
        <span style="font-size:10px;font-weight:700;padding:2px 6px;border-radius:6px;background:${srvColor};color:${srv==="mixdrop"?"#111":"#fff"};flex-shrink:0;">${srvLabel}</span>
        <span style="font-size:12px;font-weight:600;color:#f1f5f9;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${finalName}</span>
      </div>
      <button type="button" class="ms-up-cancel" style="padding:4px 9px;border-radius:7px;border:1px solid rgba(239,68,68,.45);background:rgba(239,68,68,.12);color:#fca5a5;font-size:11px;font-weight:600;cursor:pointer;flex-shrink:0;">Cancelar</button>
    </div>
    <div style="height:6px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden;">
      <div class="ms-up-bar" style="height:100%;width:0%;background:${srvColor};transition:width .2s;"></div>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:11px;color:#94a3b8;">
      <span class="ms-up-detail">Obteniendo servidor...</span>
      <span class="ms-up-pct">0%</span>
    </div>`;
  queue.prepend(card);

  const bar = card.querySelector(".ms-up-bar");
  const det = card.querySelector(".ms-up-detail");
  const pctEl = card.querySelector(".ms-up-pct");
  const cancelBtn = card.querySelector(".ms-up-cancel");

  const entry = { xhr: null, aborted: false };
  activeUploads.set(uid, entry);
  msRefreshUploadBtn();

  cancelBtn.onclick = () => {
    msAskCancelConfirm(finalName, () => {
      entry.aborted = true;
      if (entry.xhr) entry.xhr.abort();
      activeUploads.delete(uid);
      msRefreshUploadBtn();
      det.innerHTML = '<span style="color:#f87171;">Cancelado</span>';
      cancelBtn.remove();
      setTimeout(() => card.remove(), 1800);
    });
  };

  try {
    const ctrl = new AbortController();
    const tOut = setTimeout(() => ctrl.abort(), 15000);
    const r = await fetch(WORKER_BASE + "/upload-url?server=" + encodeURIComponent(srv), {
      headers: { "X-Panel-Pass": getPass() },
      signal: ctrl.signal
    });
    clearTimeout(tOut);
    const d = await r.json();
    if (!d.ok || !d.uploadUrl) throw new Error(d.error || "No se obtuvo URL");
    if (entry.aborted) return;

    const fd = new FormData();
    if (d.extraFields) Object.entries(d.extraFields).forEach(([k, v]) => fd.append(k, v));
    fd.append(d.fieldName || "file", file, finalName);

    const t0 = Date.now();
    const xhr = new XMLHttpRequest();
    entry.xhr = xhr;
    xhr.open("POST", d.uploadUrl, true);
    if (d.authHeader) xhr.setRequestHeader("Authorization", d.authHeader);

    xhr.upload.onprogress = (ev) => {
      if (!ev.lengthComputable) return;
      const pct = Math.min(99, Math.round((ev.loaded / ev.total) * 100));
      const sec = Math.max(0.5, (Date.now() - t0) / 1000);
      const mbps = (ev.loaded / (1024 * 1024) / sec).toFixed(1);
      bar.style.width = pct + "%";
      pctEl.textContent = pct + "%";
      det.textContent = `${(ev.loaded / (1024 * 1024)).toFixed(1)} / ${(ev.total / (1024 * 1024)).toFixed(1)} MB · ${mbps} MB/s`;
    };

    xhr.onload = () => {
      activeUploads.delete(uid);
      msRefreshUploadBtn();
      cancelBtn.remove();
      if (xhr.status >= 200 && xhr.status < 300) {
        bar.style.width = "100%";
        pctEl.textContent = "100%";
        det.innerHTML = '<span style="color:#10b981;font-weight:700;">Listo · Actualizando lista...</span>';
        setTimeout(() => { if (typeof msLoadFiles === "function") msLoadFiles(); }, 1200);
        setTimeout(() => card.remove(), 4500);
      } else {
        det.innerHTML = `<span style="color:#ef4444;font-weight:700;">Error HTTP ${xhr.status}</span>`;
      }
    };

    xhr.onerror = () => {
      if (entry.aborted) return;
      activeUploads.delete(uid);
      msRefreshUploadBtn();
      cancelBtn.remove();
      det.innerHTML = '<span style="color:#ef4444;font-weight:700;">Error de red o CORS</span>';
    };

    det.textContent = "Conectando con " + srvLabel + "...";
    xhr.send(fd);
  } catch (e) {
    if (entry.aborted) return;
    activeUploads.delete(uid);
    msRefreshUploadBtn();
    cancelBtn.remove();
    det.innerHTML = `<span style="color:#ef4444;font-weight:700;">${e.message}</span>`;
  }
};

  window.msCancelUpload = () => {
    if (activeXhr) { activeXhr.abort(); activeXhr = null; document.getElementById("msUploadBtn").disabled = false; document.getElementById("msUploadCancelBtn").style.display = "none"; document.getElementById("msUploadStatus").innerHTML = '<span style="color:#f59e0b;">Subida cancelada.</span>'; }
  };

  window.msToggleTray = () => { msTrayOpen = !msTrayOpen; const l = document.getElementById("msTrayList"), a = document.getElementById("msTrayArrow"); if (l) l.style.display = msTrayOpen ? "flex" : "none"; if (a) a.textContent = msTrayOpen ? "▾" : "▴"; };
  window.msClearDoneTasks = () => { msTasks = msTasks.filter(t => t.state === "running" || t.state === "processing"); saveTasks(); renderTray(); };
  window.msCancelTask = async (uid) => {
    const idx = msTasks.findIndex(t => t.uid === uid);
    if (idx === -1) return;
    const t = msTasks[idx];
    msTasks.splice(idx, 1);
    saveTasks();
    renderTray();
    msRenderFiles();
    if (t.id && (t.state === "running" || t.state === "processing") && getPass()) {
      fetch(WORKER_BASE + "/remote-cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Panel-Pass": getPass() },
        body: JSON.stringify({ server: t.server, id: t.id })
      }).catch(() => {});
    }
  };
  window.msEnqueueTask = (task) => {
    const tKey = normTitle(task.title || "");
    const exists = msTasks.find(t => (t.state === "running" || t.state === "processing") && t.server === task.server && normTitle(t.title) === tKey);
    if (exists) {
      if (task.id && !exists.id) { exists.id = task.id; exists.state = "running"; }
      saveTasks(); renderTray(); startPolling();
      return;
    }
    msTasks.unshift({ uid: Date.now() + "_" + Math.random().toString(36).slice(2, 6), server: task.server, id: task.id || "", title: task.title || "Archivo", state: task.id ? "running" : "processing", pct: 0, detail: task.id ? "En cola..." : "Esperando en servidor..." });
    saveTasks(); msTrayOpen = true; renderTray(); msRenderFiles(); startPolling();
  };

  function renderTray() {
    const tray = document.getElementById("msQueueTray"), titleEl = document.getElementById("msTrayTitle"), listEl = document.getElementById("msTrayList");
    if (!tray || !listEl) return;
    if (!msTasks.length) { tray.style.display = "none"; return; }
    tray.style.display = "block";
    const running = msTasks.filter(t => t.state === "running" || t.state === "processing").length;
    titleEl.textContent = running > 0 ? `Transferencias en curso (${running})` : `Transferencias recientes (${msTasks.length})`;
    listEl.style.display = msTrayOpen ? "flex" : "none";
    listEl.innerHTML = msTasks.map(t => {
      const lbl = SRV_LABELS[t.server] || t.server, col = SRV_COLORS[t.server] || "#0E5A6F";
      const badge = t.state === "done" ? '<span style="color:#10b981;font-weight:700;">Listo</span>' : (t.state === "error" ? '<span style="color:#ef4444;font-weight:700;">Error</span>' : `<span style="color:var(--gt-muted);">${t.pct > 0 ? t.pct + "% · " : ""}${t.detail}</span>`);
      const cancelBtn = `<button type="button" onclick="msCancelTask('${t.uid}')" title="Cancelar / Quitar" style="background:transparent;border:none;color:#ef4444;cursor:pointer;font-weight:800;font-size:13px;padding:0 4px;line-height:1;">✕</button>`;
      return `<div class="ms-tray-item"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center;"><div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;"><strong style="color:${col};">${lbl}</strong> · ${t.title}</div><div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">${badge}${cancelBtn}</div></div>${t.state === "running" ? `<div class="ms-progress-track" style="height:6px;"><div class="ms-progress-fill" style="width:${Math.max(8, t.pct)}%;"></div></div>` : ""}</div>`;
    }).join("");
  }

  let msPollTick = 0;

  function reconcileTasksWithFiles() {
    let changed = false;
    msTasks.forEach(t => {
      if (t.state !== "running" && t.state !== "processing") return;
      const tKey = normTitle(t.title);
      const found = allFilesRaw.some(f => f.server === t.server && normTitle(f.title) === tKey);
      if (found) {
        t.state = "done"; t.pct = 100; t.detail = "Disponible";
        changed = true;
      }
    });
    if (changed) { saveTasks(); renderTray(); }
  }

  async function pollRemoteStatuses() {
    const pending = msTasks.filter(t => t.state === "running" || t.state === "processing");
    if (!pending.length || !getPass()) { clearInterval(msPollTimer); msPollTimer = null; return; }
    msPollTick++;
    try {
      const withId = pending.filter(t => t.id);
      let anyFinished = false;
      if (withId.length) {
        const r = await fetch(WORKER_BASE + "/remote-status", { method: "POST", headers: { "Content-Type": "application/json", "X-Panel-Pass": getPass() }, body: JSON.stringify({ tasks: withId.map(t => ({ server: t.server, id: t.id })) }) });
        const d = await r.json();
        (d.statuses || []).forEach(st => {
          const item = msTasks.find(t => t.id === st.id && t.server === st.server);
          if (!item) return;
          if (item.state !== "done" && st.state === "done") anyFinished = true;
          item.state = st.state; item.pct = st.pct || 0; item.detail = st.detail || "";
        });
        saveTasks(); renderTray(); msRenderFiles();
      }
      // Cada 3 ciclos (~24s) o si terminó alguno, refresca /files silenciosamente para detectar subidas listas
      if (anyFinished || msPollTick % 3 === 0) {
        const rf = await fetch(WORKER_BASE + "/files", { headers: { "X-Panel-Pass": getPass() } });
        const df = await rf.json();
        if (Array.isArray(df.files)) {
          allFilesRaw = df.files;
          reconcileTasksWithFiles();
          msRenderFiles();
        }
      }
    } catch (_) {}
  }

  function startPolling() { if (msPollTimer) return; pollRemoteStatuses(); msPollTimer = setInterval(pollRemoteStatuses, 8000); }

  function boot() {
    loadTasksFromCloud();
    applyTheme(localStorage.getItem("gato_theme") || "dark");
    initHeaderMenu();
    renderTray();
    if (msTasks.some(t => t.state === "running" || t.state === "processing")) startPolling();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();


/* GATO_STATE_PERSIST */
(function () {
  const KEY_OPEN = "gato_ms_open";
  const KEY_TAB = "gato_ms_tab";

  const origOpen = window.msOpenModal;
  if (typeof origOpen === "function") {
    window.openMultiServerModal = window.msOpenModal = function (...args) {
      sessionStorage.setItem(KEY_OPEN, "1");
      const res = origOpen.apply(this, args);
      const savedTab = sessionStorage.getItem(KEY_TAB);
      if (savedTab && typeof window.msSwitchTab === "function") {
        setTimeout(() => window.msSwitchTab(savedTab), 30);
      }
      return res;
    };
  }

  const origSwitch = window.msSwitchTab;
  if (typeof origSwitch === "function") {
    window.msSwitchTab = function (tab, ...rest) {
      if (tab) sessionStorage.setItem(KEY_TAB, tab);
      return origSwitch.call(this, tab, ...rest);
    };
  }

  const origClose = window.msCloseModal;
  if (typeof origClose === "function") {
    window.msCloseModal = function (...args) {
      sessionStorage.removeItem(KEY_OPEN);
      return origClose.apply(this, args);
    };
  }

  document.addEventListener("click", (e) => {
    const btn = e.target && e.target.closest ? e.target.closest("button") : null;
    if (!btn) return;
    const oc = btn.getAttribute("onclick") || "";
    if (oc.includes("msCloseModal") || btn.id === "msCloseBtn") {
      sessionStorage.removeItem(KEY_OPEN);
    }
  });

  window.addEventListener("DOMContentLoaded", () => {
    if (sessionStorage.getItem(KEY_OPEN) === "1") {
      setTimeout(() => {
        if (typeof window.msOpenModal === "function") window.msOpenModal();
      }, 250);
    }
  });
})();
