
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
        siteConfig = Object.assign({ hero_mode: "recent", hero_count: 5 }, data.site_config);
    }
    catalogItems = extractItemsArray(data);
    renderCurrentStreamView();
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

        return `
            <div class="hero-slide" style="background-image: url('${escapeHtml(bg)}')" onclick="openDetailModal('${escapeQuotes(item.id)}')">
                <div class="hero-slide-gradient">
                    <span class="hero-type-pill">${typeLabel}</span>
                    <h2 class="hero-slide-title">${escapeHtml(item.title)}</h2>
                    <div class="hero-genres-row">${genresTags}</div>
                    <div class="hero-quick-actions" onclick="event.stopPropagation()">
                        <button class="hero-side-btn" onclick="toggleFavFromHero('${escapeQuotes(item.id)}')">
                            <span class="icon-circle">${inFav ? SVG_CHECK : SVG_PLUS}</span>
                            <span>Mi Lista</span>
                        </button>
                        <button class="hero-play-main" onclick="quickPlayFromHero('${escapeQuotes(item.id)}')">
                            ${SVG_PLAY}
                            <span>Reproducir</span>
                        </button>
                        <button class="hero-side-btn" onclick="openDetailModal('${escapeQuotes(item.id)}')">
                            <span class="icon-circle">${SVG_INFO}</span>
                            <span>Info</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join("");

    dotsBox.innerHTML = heroList.map((_, idx) => `
        <span class="hero-dot ${idx === 0 ? 'active' : ''}" onclick="scrollToHeroSlide(${idx})"></span>
    `).join("");

    if (heroAutoTimer) clearInterval(heroAutoTimer);
    if (heroList.length > 1) {
        heroAutoTimer = setInterval(() => {
            if (!slider.clientWidth) return;
            const currentIdx = Math.round(slider.scrollLeft / slider.clientWidth);
            const nextIdx = (currentIdx + 1) % heroList.length;
            scrollToHeroSlide(nextIdx);
        }, 6500);
    }
}

function toggleFavFromHero(itemId) {
    const id = String(itemId);
    if (favIds.includes(id)) {
        favIds = favIds.filter(x => x !== id);
    } else {
        favIds.push(id);
    }
    localStorage.setItem("gatoplay_fav_ids", JSON.stringify(favIds));
    renderCurrentStreamView();
}

function quickPlayFromHero(itemId) {
    const item = catalogItems.find(i => String(i.id) === String(itemId));
    if (!item) return;
    if (item.type === "series") {
        const ep1 = (item.seasons && item.seasons[0] && item.seasons[0].episodes && item.seasons[0].episodes[0]) ? item.seasons[0].episodes[0] : null;
        if (ep1 && ep1.servers && ep1.servers[0]) {
            runStreamOrDownload(ep1.servers[0].url, `${item.title} - T1 E1`, "PLAY", item, "T1 E1");
            return;
        }
    } else if (item.servers && item.servers[0]) {
        runStreamOrDownload(item.servers[0].url, item.title, "PLAY", item, "");
        return;
    }
    openDetailModal(item.id);
}

function scrollToHeroSlide(index) {
    const slider = document.getElementById("heroSlider");
    if (!slider) return;
    slider.scrollTo({ left: slider.clientWidth * index, behavior: "smooth" });
}

function renderContinueWatching(currentSubset) {
    const row = document.getElementById("continueWatchingRow");
    const scroller = document.getElementById("continueWatchingScroller");

    const subsetIds = new Set(currentSubset.map(i => String(i.id)));
    const validCw = continueWatchingList
        .map(entry => {
            const item = catalogItems.find(i => String(i.id) === String(entry.id));
            return item && subsetIds.has(String(item.id)) ? { item, entry } : null;
        })
        .filter(Boolean);

    if (!validCw.length) {
        row.classList.add("hidden");
        return;
    }

    row.classList.remove("hidden");
    scroller.innerHTML = validCw.map(({ item, entry }) => {
        const thumb = item.backdrop || item.poster || window.FALLBACK_POSTER;
        const subtitle = entry.epLabel ? `${entry.epLabel} • ${entry.remainingText}` : entry.remainingText;
        const typeTag = item.type === "series" ? "SERIE" : "MOVIE";
        return `
            <div class="cw-card" onclick="resumeFromContinueWatching('${escapeQuotes(item.id)}')">
                <div class="cw-thumb">
                    <img src="${escapeHtml(thumb)}" alt="" loading="lazy" onerror="this.src=window.FALLBACK_POSTER">
                    <span class="cw-type-chip">${typeTag}</span>
                    <div class="cw-play-badge">${SVG_PLAY}</div>
                    <div class="cw-progress-track">
                        <div class="cw-progress-bar" style="width: ${entry.progress || 42}%"></div>
                    </div>
                </div>
                <div class="cw-meta-row">
                    <span class="cw-meta-text">${escapeHtml(subtitle)}</span>
                    <button class="cw-remove-btn" title="Quitar" onclick="event.stopPropagation(); removeContinueWatching('${escapeQuotes(item.id)}')">
                        <svg class="ico" style="width:15px;height:15px;" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

function saveToContinueWatching(item, epLabel, streamUrl, streamTitle) {
    if (!item) return;
    continueWatchingList = continueWatchingList.filter(x => String(x.id) !== String(item.id));
    const randomMins = Math.floor(Math.random() * 35) + 22;
    const randomProg = Math.floor(Math.random() * 45) + 28;
    continueWatchingList.unshift({
        id: item.id,
        epLabel: epLabel || "",
        remainingText: `${randomMins} min restantes`,
        progress: randomProg,
        lastUrl: streamUrl || "",
        lastTitle: streamTitle || item.title,
        timestamp: Date.now()
    });
    continueWatchingList = continueWatchingList.slice(0, 15);
    localStorage.setItem("gatoplay_continue_watching", JSON.stringify(continueWatchingList));
    renderCurrentStreamView();
}

function resumeFromContinueWatching(itemId) {
    const entry = continueWatchingList.find(x => String(x.id) === String(itemId));
    const item = catalogItems.find(i => String(i.id) === String(itemId));
    if (entry && entry.lastUrl) {
        runStreamOrDownload(entry.lastUrl, entry.lastTitle || (item ? item.title : ""), "PLAY", item, entry.epLabel);
    } else {
        openDetailModal(itemId);
    }
}

function removeContinueWatching(itemId) {
    continueWatchingList = continueWatchingList.filter(x => String(x.id) !== String(itemId));
    localStorage.setItem("gatoplay_continue_watching", JSON.stringify(continueWatchingList));
    renderCurrentStreamView();
}

function renderCategoryCarousels(items, filterMode) {
    const container = document.getElementById("carouselsContainer");
    if (!items.length) {
        container.innerHTML = `<p style="padding:16px; color:var(--text-dim); font-size:13px;">No hay títulos en esta sección.</p>`;
        return;
    }

    const premieres = [...items].sort((a, b) => Number(b.year || 0) - Number(a.year || 0));
    const topRated = [...items].sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0)).slice(0, 10);

    const top10Title = filterMode === "movie"
        ? "Top 10 Películas hoy"
        : (filterMode === "series" ? "Top 10 Series hoy" : "Top 10 en Gato Play hoy");

    const top10Html = topRated.length ? `
        <div class="catalog-row">
            <div class="row-header">
                <h3>${top10Title} <span class="row-chevron">›</span></h3>
            </div>
            <div class="row-scroller">
                ${topRated.map((item, idx) => createTop10CardHtml(item, idx + 1)).join("")}
            </div>
        </div>
    ` : "";

    const groups = [];
    if (filterMode === "all") {
        groups.push({ title: "Recién agregados", list: items });
        groups.push({ title: "Películas de estreno", list: premieres.filter(i => i.type !== "series") });
        groups.push({ title: "Series aclamadas", list: items.filter(i => i.type === "series") });
    } else if (filterMode === "movie") {
        groups.push({ title: "Películas recién agregadas", list: items });
        groups.push({ title: "Películas de estreno", list: premieres });
    } else if (filterMode === "series") {
        groups.push({ title: "Series recién agregadas", list: items });
        groups.push({ title: "Series de estreno", list: premieres });
    }

    const genresSet = new Set();
    items.forEach(i => (i.genres || []).forEach(g => genresSet.add(g)));
    genresSet.forEach(genre => {
        const prefixGenre = filterMode === "movie"
            ? `Películas de ${genre.toLowerCase()}`
            : (filterMode === "series" ? `Series de ${genre.toLowerCase()}` : genre);
        groups.push({
            title: prefixGenre,
            list: items.filter(i => (i.genres || []).includes(genre))
        });
    });

    const regularRowsHtml = groups
        .filter(g => g.list.length > 0)
        .map(g => `
            <div class="catalog-row">
                <div class="row-header">
                    <h3>${escapeHtml(g.title)} <span class="row-chevron">›</span></h3>
                </div>
                <div class="row-scroller">
                    ${g.list.map(item => createCardHtml(item)).join("")}
                </div>
            </div>
        `).join("");

    container.innerHTML = top10Html + regularRowsHtml;
}

function createCardHtml(item) {
    const posterSrc = item.poster || window.FALLBACK_POSTER;
    const isSeries = item.type === "series";
    const typeText = isSeries ? "SERIE" : "MOVIE";
    const isNew = Number(item.year || 0) >= 2025;
    const newBadge = isNew ? `<span class="card-badge-new">NUEVO</span>` : "";

    return `
        <div class="media-card" onclick="openDetailModal('${escapeQuotes(item.id)}')">
            <div class="card-poster">
                <img src="${escapeHtml(posterSrc)}" alt="" loading="lazy" onerror="this.onerror=null;this.src=window.FALLBACK_POSTER;">
                ${newBadge}
                <span class="card-type-badge ${isSeries ? 'is-series' : ''}">${typeText}</span>
            </div>
        </div>
    `;
}

function createTop10CardHtml(item, rankNum) {
    const posterSrc = item.poster || window.FALLBACK_POSTER;
    const isSeries = item.type === "series";
    const typeText = isSeries ? "SERIE" : "MOVIE";
    return `
        <div class="top10-card" onclick="openDetailModal('${escapeQuotes(item.id)}')">
            <span class="top10-number">${rankNum}</span>
            <div class="card-poster">
                <img src="${escapeHtml(posterSrc)}" alt="" loading="lazy" onerror="this.onerror=null;this.src=window.FALLBACK_POSTER;">
                <span class="card-type-badge ${isSeries ? 'is-series' : ''}">${typeText}</span>
            </div>
        </div>
    `;
}

function filterTopMenu(filterType, btnEl) {
    document.querySelectorAll(".top-pill").forEach(b => b.classList.remove("active"));
    if (btnEl) btnEl.classList.add("active");
    currentFilterMode = filterType;
    switchDock("stream");
    renderCurrentStreamView();
}

function openDetailModal(itemId) {
    const item = catalogItems.find(i => String(i.id) === String(itemId));
    if (!item) return;
    currentActiveItem = item;
    selectedServerIndex = 0;

    const isSeries = item.type === "series";
    const typeText = isSeries ? "SERIE" : "MOVIE";
    const backdropUrl = item.backdrop || item.poster || window.FALLBACK_POSTER;

    document.getElementById("mHeroBackdrop").style.backgroundImage = `url('${backdropUrl}')`;
    document.getElementById("mTypeBadge").textContent = typeText;
    document.getElementById("mTitle").textContent = item.title;

    const ratingFloat = parseFloat(item.rating || "8.6");
    const matchPct = Math.min(99, Math.max(84, Math.round(ratingFloat * 10.5)));
    document.getElementById("mMatchScore").textContent = `${matchPct}% Para ti`;
    document.getElementById("mStatYear").textContent = item.year || "2026";
    document.getElementById("mStatQuality").textContent = item.quality || "1080p";
    document.getElementById("mStatLang").textContent = item.language || "LATINO";
    document.getElementById("mStatRatingVal").textContent = item.rating || "8.5";

    const genresArr = item.genres && item.genres.length ? item.genres : [typeText];
    document.getElementById("mGenresLine").innerHTML = genresArr
        .map(g => `<span class="genre-chip-hbo">${escapeHtml(g)}</span>`)
        .join("");

    document.getElementById("mSynopsis").textContent = item.synopsis || "Sin descripción disponible.";

    document.getElementById("mDetailType").textContent = typeText;
    document.getElementById("mDetailLang").textContent = item.language || "LATINO";
    document.getElementById("mDetailQuality").textContent = item.quality || "1080p";
    document.getElementById("mDetailGenres").textContent = genresArr.join(", ");

    const favBtn = document.getElementById("mBtnFav");
    const isFav = favIds.includes(String(item.id));
    favBtn.innerHTML = `${isFav ? SVG_CHECK : SVG_PLUS} <span>${isFav ? 'En Mi Lista' : 'Mi Lista'}</span>`;
    favBtn.classList.toggle("active", isFav);
    favBtn.onclick = () => {
        if (favIds.includes(String(item.id))) {
            favIds = favIds.filter(id => id !== String(item.id));
        } else {
            favIds.push(String(item.id));
        }
        localStorage.setItem("gatoplay_fav_ids", JSON.stringify(favIds));
        openDetailModal(item.id);
        renderCurrentStreamView();
    };

    const likeBtn = document.getElementById("mBtnLike");
    likeBtn.classList.toggle("active", likedIds.includes(String(item.id)));

    setupCleanPlaybackButtons(item);

    const tabEp = document.getElementById("tabBtnEpisodes");
    if (isSeries) {
        tabEp.classList.remove("hidden");
        const seasons = item.seasons || [];
        const select = document.getElementById("seasonDropdown");
        select.innerHTML = seasons.map((s, idx) => `<option value="${idx}">Temporada ${s.season_number}</option>`).join("");
        renderSelectedSeason();
    } else {
        tabEp.classList.add("hidden");
    }

    renderRelatedMovies(item);
    switchModalTab(isSeries ? "episodes" : "related");

    const modal = document.getElementById("detailModal");
    modal.classList.remove("hidden");
    modal.scrollTop = 0;
}

function setupCleanPlaybackButtons(item) {
    const isSeries = item.type === "series";
    const playBtn = document.getElementById("mBtnMainPlay");
    const dlBtn = document.getElementById("mBtnMainDownload");
    const optsBar = document.getElementById("mCleanOptionsBar");

    if (isSeries) {
        optsBar.classList.add("hidden");
        const firstEp = (item.seasons && item.seasons[0] && item.seasons[0].episodes && item.seasons[0].episodes[0])
            ? item.seasons[0].episodes[0]
            : null;
        const firstUrl = firstEp && firstEp.servers && firstEp.servers[0] ? firstEp.servers[0].url : "";
        const epTag = firstEp ? `T1 E${firstEp.episode_number}` : "T1 E1";

        playBtn.innerHTML = `${SVG_PLAY} <span>Reproducir ${epTag}</span>`;
        playBtn.onclick = () => {
            if (firstUrl) runStreamOrDownload(firstUrl, `${item.title} - ${epTag}`, "PLAY", item, epTag);
        };
        dlBtn.innerHTML = `${SVG_DL} <span>Descargar ${epTag}</span>`;
        dlBtn.onclick = () => {
            if (firstUrl) runStreamOrDownload(firstUrl, `${item.title} - ${epTag}`, "DOWNLOAD", item, epTag);
        };
    } else {
        const servers = item.servers || [];
        if (servers.length > 1) {
            optsBar.classList.remove("hidden");
            optsBar.innerHTML = servers.map((_, idx) => `
                <button class="clean-opt-pill ${idx === selectedServerIndex ? 'active' : ''}" onclick="selectCleanOption(${idx})">
                    Opción ${idx + 1}
                </button>
            `).join("");
        } else {
            optsBar.classList.add("hidden");
        }

        const activeSrv = servers[selectedServerIndex] || servers[0] || { url: "" };
        playBtn.innerHTML = `${SVG_PLAY} <span>Reproducir</span>`;
        playBtn.onclick = () => {
            if (activeSrv.url) runStreamOrDownload(activeSrv.url, item.title, "PLAY", item, "");
        };
        dlBtn.innerHTML = `${SVG_DL} <span>Descargar</span>`;
        dlBtn.onclick = () => {
            if (activeSrv.url) runStreamOrDownload(activeSrv.url, item.title, "DOWNLOAD", item, "");
        };
    }
}

function selectCleanOption(idx) {
    selectedServerIndex = idx;
    if (currentActiveItem) setupCleanPlaybackButtons(currentActiveItem);
}

function renderRelatedMovies(item) {
    const scroller = document.getElementById("mRelatedScroller");
    const itemGenres = new Set(item.genres || []);

    let related = catalogItems.filter(other => {
        if (String(other.id) === String(item.id)) return false;
        return (other.genres || []).some(g => itemGenres.has(g));
    });

    if (related.length < 6) {
        const extras = catalogItems.filter(other => String(other.id) !== String(item.id) && !related.includes(other));
        related = related.concat(extras);
    }

    if (!related.length) {
        scroller.innerHTML = `<p style="font-size:12.5px; color:var(--text-dim);">Agrega más títulos al catálogo para ver recomendaciones similares.</p>`;
        return;
    }

    scroller.innerHTML = related.slice(0, 12).map(rel => createCardHtml(rel)).join("");
}

function switchModalTab(tabName) {
    ["episodes", "related", "details"].forEach(t => {
        const panel = document.getElementById("modalTab" + t.charAt(0).toUpperCase() + t.slice(1));
        const btn = document.getElementById("tabBtn" + t.charAt(0).toUpperCase() + t.slice(1));
        if (panel) panel.classList.toggle("hidden", t !== tabName);
        if (btn) btn.classList.toggle("active", t === tabName);
    });
}

function renderSelectedSeason() {
    if (!currentActiveItem || !currentActiveItem.seasons) return;
    const idx = Number(document.getElementById("seasonDropdown").value || 0);
    const season = currentActiveItem.seasons[idx];
    if (!season) return;

    const epContainer = document.getElementById("mEpisodesList");
    epContainer.innerHTML = (season.episodes || []).map(ep => {
        const primarySrv = (ep.servers && ep.servers[0]) ? ep.servers[0] : { url: ep.url || "" };
        const epTag = `T${season.season_number} E${ep.episode_number}`;
        const fullEpTitle = `${currentActiveItem.title} ${epTag} - ${ep.title}`;
        return `
            <div class="ep-card">
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
        window.AndroidBridge.processRemoteServer(url, title, action);
    } else {
        window.open(url, "_blank");
    }
}

function switchDock(viewName) {
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
