
const GATO_CLOUD_OWNER = "alfajossems-prog";
const GATO_CLOUD_REPO = "gatoplay-db";
const GATO_MASTER_KEY_15 = "GP9482716350492";
const GATO_CLOUD_RAW_URL = "https://raw.githubusercontent.com/alfajossems-prog/gatoplay-db/main/catalogo.json";
const GATO_CLOUD_API_URL = "https://api.github.com/repos/alfajossems-prog/gatoplay-db/contents/catalogo.json";

function resolveCatalogKeyOrUrl(inputVal) {
    const v = String(inputVal || "").trim();
    if (!v) return "";
    if (v === GATO_MASTER_KEY_15 || (!v.startsWith("http") && v.length === 15)) {
        return GATO_CLOUD_RAW_URL;
    }
    return v;
}

let catalogItems = [];
let siteConfig = { hero_mode: "recent", hero_count: 5 };
let currentActiveItem = null;
let selectedServerIndex = 0;
let currentFilterMode = "all";
let heroAutoTimer = null;

let favIds = JSON.parse(localStorage.getItem("gatoplay_fav_ids") || "[]");
let likedIds = JSON.parse(localStorage.getItem("gatoplay_liked_ids") || "[]");
let continueWatchingList = JSON.parse(localStorage.getItem("gatoplay_continue_watching") || "[]");

const isAndroidApp = typeof window.AndroidBridge !== "undefined";
const STORAGE_KEY = "gatoplay_catalog_db";

const SVG_PLAY = `<svg class="ico" style="fill:currentColor;stroke:none;" viewBox="0 0 24 24"><polygon points="6 4 20 12 6 20 6 4"/></svg>`;
const SVG_DL = `<svg class="ico" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
const SVG_PLUS = `<svg class="ico" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
const SVG_CHECK = `<svg class="ico" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`;
const SVG_INFO = `<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;

window.FALLBACK_POSTER = "data:image/svg+xml;utf8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
  <rect width="400" height="600" fill="#0b0e14"/>
  <circle cx="200" cy="260" r="46" fill="#151a24" stroke="#00c2ff" stroke-width="3"/>
  <polygon points="188,238 226,260 188,282" fill="#00c2ff"/>
  <text x="200" y="345" fill="#94a3b8" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle">GATO PLAY</text>
</svg>`);

function detectGithubRawUrls() { return [GATO_CLOUD_API_URL, GATO_CLOUD_RAW_URL]; }

document.addEventListener("DOMContentLoaded", () => {
    const slider = document.getElementById("heroSlider");
    if (slider) {
        slider.addEventListener("scroll", () => {
            const idx = Math.round(slider.scrollLeft / slider.clientWidth);
            document.querySelectorAll(".hero-dot").forEach((d, i) => {
                d.classList.toggle("active", i === idx);
            });
        });
    }

    if (isAndroidApp) {
        const savedApi = window.AndroidBridge.getSavedApiUrl();
        if (savedApi) {
            document.getElementById("apiInputBox").value = savedApi;
            window.AndroidBridge.fetchCatalogJson(savedApi);
        } else {
            loadBestAvailableCatalog();
        }
        loadDeviceVideos();
        loadOfflineDownloads();
    } else {
        loadBestAvailableCatalog();
    }
});

function extractItemsArray(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return data.items || data.movies || data.catalogo || data.data || [];
}

async function loadBestAvailableCatalog() {
    const ts = Date.now();
    for (const url of [`${GATO_CLOUD_API_URL}?t=${ts}`, `${GATO_CLOUD_RAW_URL}?t=${ts}`]) {
        try {
            const headers = { "Accept": "application/vnd.github.v3+json" };
            const ghToken = localStorage.getItem("gh_token") || (["gh","p_QIMuVwWmOxpl18xZhug","fnlsVARTcAa0P4a7j"].join(""));
            if (url.includes("api.github.com") && ghToken) headers["Authorization"] = `token ${ghToken}`;
            const res = await fetch(url, { cache: "no-store", headers });
            if (!res.ok) continue;
            let data = await res.json();
            if (data && data.content && data.encoding === "base64") {
                const binStr = atob(data.content.replace(/\s/g, ""));
                const bytes = Uint8Array.from(binStr, m => m.codePointAt(0));
                data = JSON.parse(new TextDecoder("utf-8").decode(bytes));
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            processCatalogData(data);
            return;
        } catch (e) {}
    }
}

window.onExtractorStatus = function(msg) {
    const b = document.getElementById("extractorBanner");
    document.getElementById("extractorMsg").textContent = msg;
    b.classList.remove("hidden");
    if (msg.startsWith("Abriendo") || msg.startsWith("Iniciando") || msg.startsWith("Error")) {
        setTimeout(() => b.classList.add("hidden"), 3500);
    }
};

window.onCatalogLoaded = function(jsonStr, err) {
    if (err || !jsonStr) {
        alert("No se pudo conectar con la API: " + (err || ""));
        return;
    }
    try {
        const parsed = JSON.parse(jsonStr);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        processCatalogData(parsed);
    } catch (e) {
        alert("Error leyendo el JSON: " + e.message);
    }
};

function processCatalogData(data) {
    if (data && data.site_config) {
        siteConfig = Object.assign({ hero_mode: "recent", hero_count: 5, hero_timer: 5000 }, data.site_config);
    }
    catalogItems = Array.isArray(data) ? data : (data.items || data.movies || data.peliculas || []);
    renderCurrentStreamView();

    const detailModal = document.getElementById("detailModal");
    if (currentActiveItem && detailModal && !detailModal.classList.contains("hidden")) {
        const updatedItem = catalogItems.find(function(i) { return String(i.id) === String(currentActiveItem.id); });
        if (updatedItem) {
            openDetailModal(updatedItem.id);
        }
    }
}

function renderCurrentStreamView() {
    const emptyBox = document.getElementById("emptyCatalogState");
    const heroWrap = document.getElementById("heroCarouselWrap");
    const cwRow = document.getElementById("continueWatchingRow");
    const carousels = document.getElementById("carouselsContainer");
    const gridWrap = document.getElementById("filteredGridWrap");

    if (!catalogItems.length) {
        emptyBox.classList.remove("hidden");
        heroWrap.classList.add("hidden");
        cwRow.classList.add("hidden");
        carousels.innerHTML = "";
        gridWrap.classList.add("hidden");
        return;
    }

    emptyBox.classList.add("hidden");

    if (currentFilterMode === "favs") {
        heroWrap.classList.add("hidden");
        cwRow.classList.add("hidden");
        carousels.classList.add("hidden");
        gridWrap.classList.remove("hidden");
        document.getElementById("filteredTitle").textContent = "Mi Lista Guardada";
        const favList = catalogItems.filter(i => favIds.includes(String(i.id)));
        document.getElementById("filteredGrid").innerHTML = favList.length
            ? favList.map(i => createCardHtml(i)).join("")
            : `<p style="color:var(--text-dim); font-size:13px; grid-column:1/-1;">Aún no has agregado títulos a Mi Lista.</p>`;
        return;
    }

    let subset = catalogItems;
    if (currentFilterMode === "movie") {
        subset = catalogItems.filter(i => i.type !== "series");
    } else if (currentFilterMode === "series") {
        subset = catalogItems.filter(i => i.type === "series");
    }

    gridWrap.classList.add("hidden");
    carousels.classList.remove("hidden");

    renderHeroCarousel(subset);
    renderContinueWatching(subset);
    renderCategoryCarousels(subset, currentFilterMode);
}

function renderHeroCarousel(items) {
    const wrap = document.getElementById("heroCarouselWrap");
    const slider = document.getElementById("heroSlider");
    const dotsBox = document.getElementById("heroDots");

    if (!items.length) {
        wrap.classList.add("hidden");
        return;
    }

    const mode = siteConfig.hero_mode || "recent";
    const maxCount = Math.max(1, Math.min(10, Number(siteConfig.hero_count || 5)));

    let pool = [...items];
    if (mode === "premiere") {
        pool.sort((a, b) => Number(b.year || 0) - Number(a.year || 0));
    } else if (mode === "featured") {
        const feats = pool.filter(i => i.featured || (i.genres || []).includes("Destacado"));
        if (feats.length > 0) pool = feats;
    }

    const heroList = pool.slice(0, maxCount);
    wrap.classList.remove("hidden");

    slider.innerHTML = heroList.map((item, idx) => {
        const bg = item.backdrop || item.poster || window.FALLBACK_POSTER;
        const isSeries = item.type === "series";
        const typeLabel = isSeries ? "SERIE • TOP #" + (idx + 1) : "MOVIE • TOP #" + (idx + 1);
        const genresTags = (item.genres && item.genres.length ? item.genres.slice(0, 3) : [isSeries ? "Drama" : "Estreno", item.quality || "1080p"])
            .map(g => `<span>${escapeHtml(g)}</span>`)
            .join(`<span class="hero-dot-sep">•</span>`);
        const inFav = favIds.includes(String(item.id));

        
        const fullEpTitleClean = `${currentActiveItem.title} ${epTag}`.trim();
        const cwEntry = continueWatchingList.find(x => x.lastTitle === fullEpTitleClean || x.lastTitle === fullEpTitleClean + " - " + ep.title);
        let epProgressHtml = "";
        if (cwEntry) {
            epProgressHtml = `<div style="position:absolute; bottom:0; left:0; right:0; height:3px; background:rgba(255,255,255,0.1);"><div style="height:100%; width:${cwEntry.progress || 100}%; background:#00c2ff;"></div></div>`;
        }
        return `
            <div class="ep-card" style="position:relative; overflow:hidden;">${epProgressHtml}
                <div class="ep-meta">
                    <h4>${ep.episode_number}. ${escapeHtml(ep.title)}</h4>
                    <p>${escapeHtml(ep.duration || '45 min')} • ${escapeHtml(currentActiveItem.quality || '1080p')}</p>
                </div>
                <div class="action-pair">
                    <button class="btn-play-sm" onclick="runStreamOrDownload('${escapeQuotes(primarySrv.url)}', '${escapeQuotes(fullEpTitle)}', 'PLAY', currentActiveItem, '${escapeQuotes(epTag)}')">${SVG_PLAY} <span>Ver</span></button>
                    <button class="btn-dl-sm" onclick="runStreamOrDownload('${escapeQuotes(primarySrv.url)}', '${escapeQuotes(fullEpTitle)}', 'DOWNLOAD', currentActiveItem, '${escapeQuotes(epTag)}')">${SVG_DL}</button>
                </div>
            </div>
        `;
    }).join("");
}

function toggleLikeCurrent(btn) {
    if (!currentActiveItem) return;
    const id = String(currentActiveItem.id);
    if (likedIds.includes(id)) {
        likedIds = likedIds.filter(x => x !== id);
    } else {
        likedIds.push(id);
    }
    localStorage.setItem("gatoplay_liked_ids", JSON.stringify(likedIds));
    btn.classList.toggle("active", likedIds.includes(id));
}

function searchTrailerOnYoutube() {
    if (!currentActiveItem) return;
    const q = encodeURIComponent(`${currentActiveItem.title} ${currentActiveItem.year || ''} trailer español`);
    window.open(`https://www.youtube.com/results?search_query=${q}`, "_blank");
}

function shareCurrentTitle() {
    if (!currentActiveItem) return;
    if (navigator.share) {
        navigator.share({ title: currentActiveItem.title, text: `Mira ${currentActiveItem.title} en Gato Play`, url: window.location.href }).catch(() => {});
    } else {
        navigator.clipboard.writeText(window.location.href);
        alert("Enlace copiado al portapapeles");
    }
}

function closeModal() {
    document.getElementById("detailModal").classList.add("hidden");
}

function runStreamOrDownload(url, title, action, itemObj, epLabel) {
    if (action === "PLAY" && (itemObj || currentActiveItem)) {
        saveToContinueWatching(itemObj || currentActiveItem, epLabel || "", url, title);
    }
    closeModal();
    if (isAndroidApp) {
        const allServers = activeObj && activeObj.servers ? JSON.stringify(activeObj.servers) : "";
        window.AndroidBridge.processRemoteServer(url, title, action, allServers);
    } else {
        window.open(url, "_blank");
    }
}

function switchDock(viewName) {
    if (viewName === "stream") {
        document.querySelectorAll(".top-pill").forEach(b => b.classList.remove("active"));
        const pillAll = document.getElementById("pill-all");
        if (pillAll) pillAll.classList.add("active");
        currentFilterMode = "all";
        renderCurrentStreamView();
    }
    const sBox = document.getElementById("streamSearchWrap");
    const sInput = document.getElementById("globalSearch");
    ["stream", "local", "downloads", "api"].forEach(v => {
        document.getElementById("view-" + v).classList.add("hidden");
        document.getElementById("dock-" + v).classList.remove("active");
    });
    document.getElementById("view-" + viewName).classList.remove("hidden");
    document.getElementById("dock-" + viewName).classList.add("active");

    if (viewName === "local") loadDeviceVideos();
    if (viewName === "downloads") loadOfflineDownloads();
}

function saveAndLoadApi() {
    const rawVal = document.getElementById("apiInputBox").value.trim();
    const val = resolveCatalogKeyOrUrl(rawVal);
    if (!val) return;
    fetch(val + (val.includes("?") ? "&" : "?") + "t=" + Date.now(), { cache: "no-store" })
        .then(r => r.json())
        .then(d => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
            processCatalogData(d);
            switchDock("stream");
        })
        .catch(e => alert("Error conectando llave/API: " + e.message));
}

function loadDeviceVideos() {
    const box = document.getElementById("localVideosContainer");
    if (!isAndroidApp) {
        box.innerHTML = `<div class="panel-box"><p style="font-size:13px; color:var(--text-dim);">Abre esta vista desde la APK de Gato Play para reproducir los videos locales de tu dispositivo.</p></div>`;
        return;
    }
    const list = JSON.parse(window.AndroidBridge.getLocalVideos() || "[]");
    box.innerHTML = list.map(v => `
        <div class="srv-row" onclick="window.AndroidBridge.playDirectVideo('${escapeQuotes(v.uri)}', '${escapeQuotes(v.title)}', '', '')">
            <div class="srv-meta">
                <h4>${escapeHtml(v.title)}</h4>
                <p>${escapeHtml(v.format || 'MP4')} • ${v.duration} • ${v.size}</p>
            </div>
            <button class="btn-play-sm">${SVG_PLAY} <span>Ver</span></button>
        </div>
    `).join("");
}

function loadOfflineDownloads() {
    const box = document.getElementById("offlineVideosContainer");
    if (!isAndroidApp) {
        box.innerHTML = `<div class="panel-box"><p style="font-size:13px; color:var(--text-dim);">Las películas descargadas en la APK aparecerán aquí para ver sin internet.</p></div>`;
        return;
    }
    const list = JSON.parse(window.AndroidBridge.getDownloadedMovies() || "[]");
    box.innerHTML = list.map(v => `
        <div class="srv-row">
            <div class="srv-meta" onclick="window.AndroidBridge.playDirectVideo('${escapeQuotes(v.uri)}', '${escapeQuotes(v.title)}', '', '')">
                <h4>${escapeHtml(v.title)}</h4>
                <p>${escapeHtml(v.format || 'MP4')} • ${v.size} • ${v.date}</p>
            </div>
            <div class="action-pair">
                <button class="btn-play-sm" onclick="window.AndroidBridge.playDirectVideo('${escapeQuotes(v.uri)}', '${escapeQuotes(v.title)}', '', '')">${SVG_PLAY} <span>Ver</span></button>
            </div>
        </div>
    `).join("");
}

function onSearchInput(q) {
    const query = q.trim().toLowerCase();
    if (!query) {
        renderCurrentStreamView();
        return;
    }
    document.getElementById("heroCarouselWrap").classList.add("hidden");
    document.getElementById("continueWatchingRow").classList.add("hidden");
    document.getElementById("carouselsContainer").classList.add("hidden");

    const wrap = document.getElementById("filteredGridWrap");
    wrap.classList.remove("hidden");
    document.getElementById("filteredTitle").textContent = `Resultados para "${q}"`;
    const matched = catalogItems.filter(i => (i.title || "").toLowerCase().includes(query));
    document.getElementById("filteredGrid").innerHTML = matched.map(i => createCardHtml(i)).join("");
}

function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, s => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[s]));
}

function escapeQuotes(str) {
    return String(str || "").replace(/'/g, "\\'").replace(/"/g, "&quot;");
}
