if (!localStorage.getItem("gh_repo") || localStorage.getItem("gh_repo") === "GatoPlay") { localStorage.setItem("gh_repo", "gatoplay-db"); }
/* Lógica principal de Gato CMS */

(function() {
    const EXP_KEY = "gato_cms_auth_exp";
    const HASH_KEY = "gato_cms_auth_hash";
    const ALLOWED_HASHES = ["4c8a863e100d943d5e8df79449bf683678d4168d38368338504fcfc01a9d3572", "23384a56a74c20a474ed46afe2de42dc220c0055f07199bef4e9ad653ce17024"];
    const exp = Number(localStorage.getItem(EXP_KEY) || 0);
    const savedHash = localStorage.getItem(HASH_KEY) || "";
    if (ALLOWED_HASHES.includes(savedHash) && Date.now() < exp) {
        document.getElementById("gatoCmsLoginGate")?.classList.add("unlocked");
    }
})();

async function _sha256Hex(text) {
    const data = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function syncPanelConfigFromWorker(pass) {
    if (!pass) return;
    try {
        const res = await fetch("https://gato-uploader.josseanm.workers.dev/panel-config", {
            method: "GET",
            headers: { "X-Panel-Pass": pass.trim() }
        });
        if (!res.ok) {
            alert("Auto-login: Worker respondió HTTP " + res.status + ". Verifica CMS_PASS en Cloudflare.");
            return;
        }
        const cfg = await res.json();
        if (!cfg || !cfg.ok) {
            alert("Auto-login: " + (cfg?.error || "Respuesta inválida del Worker"));
            return;
        }
        if (cfg.ghToken) localStorage.setItem("gh_token", cfg.ghToken);
        if (cfg.tmdbKey) localStorage.setItem("tmdb_api_key", cfg.tmdbKey);
        if (cfg.panelPass) localStorage.setItem("gato_worker_pass", cfg.panelPass);
    } catch (err) {
        alert("Auto-login error de red: " + err.message);
    }
}

async function handleGatoCmsLogin(ev) {
    ev.preventDefault();
    const user = (document.getElementById("cmsLoginUser")?.value || "").trim();
    const pass = document.getElementById("cmsLoginPass")?.value || "";
    const errEl = document.getElementById("cmsLoginErr");
    if (errEl) errEl.textContent = "";

    try {
        const digest = await _sha256Hex(user + ":" + pass);
        if (["4c8a863e100d943d5e8df79449bf683678d4168d38368338504fcfc01a9d3572", "23384a56a74c20a474ed46afe2de42dc220c0055f07199bef4e9ad653ce17024"].includes(digest)) {
            const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
            localStorage.setItem("gato_cms_auth_hash", digest);
            localStorage.setItem("gato_cms_auth_exp", String(Date.now() + sevenDaysMs));
            await syncPanelConfigFromWorker(pass);
            document.getElementById("gatoCmsLoginGate")?.classList.add("unlocked");
            location.reload();
        } else {
            if (errEl) errEl.textContent = "Usuario o contraseña incorrectos.";
        }
    } catch (e) {
        if (errEl) errEl.textContent = "Error al verificar sesión: " + e.message;
    }
    return false;
}

const STORAGE_KEY = "gatoplay_catalog_db";
        const DEFAULT_TMDB_KEY = "a62e8cfd975bb03190263788e2ba9a89";
        let currentDb = {
            site_config: { site_name: "GATO<b>PLAY</b>", accent_color: "#00c2ff", hero_mode: "recent", hero_count: 5 },
            items: []
        };
        let draftSeasonsMap = {};
        let liveSearchTimer = null;

        const SVG_CHECK_SM = `<svg viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12"/></svg>`;
        const SVG_EDIT = `<svg class="ico" style="width:15px;height:15px;" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`;
        const SVG_TRASH = `<svg class="ico" style="width:15px;height:15px;" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;

        const TMDB_GENRES = {
            28: "Acción", 12: "Aventura", 16: "Animación", 35: "Comedia", 80: "Crimen",
            99: "Documental", 18: "Drama", 10751: "Familia", 14: "Fantasía", 36: "Historia",
            27: "Terror", 10402: "Música", 9648: "Misterio", 10749: "Romance", 878: "Ciencia Ficción",
            10770: "Película de TV", 53: "Suspenso", 10752: "Bélica", 37: "Western",
            10759: "Acción y Aventura", 10762: "Infantil", 10765: "Sci-Fi y Fantasía", 10768: "Guerra y Política"
        };

        function inferGithubRepoFromUrl() {
            let owner = localStorage.getItem("gh_owner") || "";
            let repo = localStorage.getItem("gh_repo") || "";
            if (window.location.hostname.endsWith(".github.io")) {
                if (!owner) owner = window.location.hostname.replace(".github.io", "");
                const parts = window.location.pathname.split("/").filter(Boolean);
                if (!repo && parts.length > 0) repo = parts[0];
            }
            if (!owner) owner = "alfajossems-prog";
            if (!repo) repo = "gatoplay-api";
            return { owner, repo };
        }

        document.addEventListener("DOMContentLoaded", async () => {
            if (!localStorage.getItem("tmdb_api_key")) {
                localStorage.setItem("tmdb_api_key", DEFAULT_TMDB_KEY);
            }
            const inferred = inferGithubRepoFromUrl();
            if (!localStorage.getItem("gh_owner")) localStorage.setItem("gh_owner", inferred.owner);
            if (!localStorage.getItem("gh_repo")) localStorage.setItem("gh_repo", "gatoplay-db");

            updateApiKeysStatusUI();
            resetServersUI();
            await loadCatalogAdmin();
        });

        function updateApiKeysStatusUI() {
            const tmdbKey = localStorage.getItem("tmdb_api_key") || "";
            const ghToken = localStorage.getItem("gh_token") || "";
            const { owner, repo } = inferGithubRepoFromUrl();

            const ghDot = document.getElementById("ghDot");
            const ghText = document.getElementById("ghStatusText");
            const tmdbDot = document.getElementById("tmdbDot");
            const tmdbText = document.getElementById("tmdbStatusText");
            const btnLabel = document.getElementById("btnManageKeysLabel");

            if (ghToken) {
                ghDot.className = "status-dot";
                ghText.textContent = `Cloud Activo (${currentDb.items ? currentDb.items.length : 0})`;
            } else {
                ghDot.className = "status-dot warn";
                ghText.textContent = "Cloud Local";
            }

            if (tmdbKey) {
                tmdbDot.className = "status-dot";
                tmdbText.textContent = "TMDB Listo";
            } else {
                tmdbDot.className = "status-dot warn";
                tmdbText.textContent = "Sin TMDB Key";
            }

            btnLabel.textContent = (ghToken || tmdbKey) ? "Editar" : "Configurar Claves";
            document.getElementById("liveApkUrlField").value = `https://raw.githubusercontent.com/${owner}/${repo}/main/catalogo.json`;
        }

        function openApiKeysModal() {
            const { owner, repo } = inferGithubRepoFromUrl();
            document.getElementById("modalTmdbKey").value = localStorage.getItem("tmdb_api_key") || DEFAULT_TMDB_KEY;
            document.getElementById("modalGhToken").value = localStorage.getItem("gh_token") || "";
            document.getElementById("modalGhOwner").value = owner;
            document.getElementById("modalGhRepo").value = repo;
            document.getElementById("apiKeysModal").classList.remove("hidden");
        }

        function closeApiKeysModal() {
            document.getElementById("apiKeysModal").classList.add("hidden");
        }

        async function saveAllApiKeys() {
            const tmdbKey = document.getElementById("modalTmdbKey").value.trim() || DEFAULT_TMDB_KEY;
            const ghToken = document.getElementById("modalGhToken").value.trim();
            const ghOwner = document.getElementById("modalGhOwner").value.trim();
            const ghRepo = document.getElementById("modalGhRepo").value.trim();

            localStorage.setItem("tmdb_api_key", tmdbKey);
            if (ghToken) localStorage.setItem("gh_token", ghToken);
            else localStorage.removeItem("gh_token");
            if (ghOwner) localStorage.setItem("gh_owner", ghOwner);
            if (ghRepo) localStorage.setItem("gh_repo", ghRepo);

            closeApiKeysModal();
            await loadCatalogAdmin();
            updateApiKeysStatusUI();
        }

        function openHeroSettingsModal() {
            updateApiKeysStatusUI();
            if (currentDb.site_config) {
                document.getElementById("cfgHeroMode").value = currentDb.site_config.hero_mode || "recent";
                document.getElementById("cfgHeroCount").value = String(currentDb.site_config.hero_count || 5);
            }
            document.getElementById("heroSettingsModal").classList.remove("hidden");
        }

        function closeHeroSettingsModal() {
            document.getElementById("heroSettingsModal").classList.add("hidden");
        }

        function syncLocalCache() {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(currentDb));
            updateApiKeysStatusUI();
        }

        // SINCRONIZACIÓN DIRECTA CON GITHUB API (SI TIENE TOKEN) + SERVIDOR NODE LOCAL
        async function pushDatabaseToCloudAndServer() {
            syncLocalCache();

            // 1. Intentar guardar en el servidor Node local si está activo
            try {
                await fetch("/api/save-config", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(currentDb.site_config || {})
                });
            } catch (e) {}

            // 2. Si el usuario tiene GitHub Token configurado, subir catalogo.json directo a su repo
            const ghToken = (localStorage.getItem("gh_token") || "").trim();
        const owner = (localStorage.getItem("gh_user") || "alfajossems-prog").trim();
        const repo = "gatoplay-db";
        if (!ghToken) {
            alert("Error: Falta el GitHub Token (gh_token). Cierra sesión y vuelve a entrar.");
            return false;
        }

            try {
                const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/catalogo.json`;
            const contentBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(currentDb, null, 2))));

            for (let attempt = 0; attempt < 2; attempt++) {
                let sha = undefined;
                const getRes = await fetch(`${apiUrl}?t=${Date.now()}`, {
                    headers: { "Authorization": `token ${ghToken}`, "Accept": "application/vnd.github.v3+json" },
                    cache: "no-store"
                });
                if (getRes.ok) {
                    const existingFile = await getRes.json();
                    sha = existingFile.sha;
                }

                const putRes = await fetch(apiUrl, {
                    method: "PUT",
                    headers: {
                        "Authorization": `token ${ghToken}`,
                        "Accept": "application/vnd.github.v3+json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        message: "Actualizacion desde Gato CMS",
                        content: contentBase64,
                        ...(sha ? { sha } : {})
                    })
                });

                if (putRes.ok) return true;
                if (putRes.status === 409 && attempt === 0) {
                    await new Promise(r => setTimeout(r, 300));
                    continue;
                }
                const errTxt = await putRes.text().catch(() => "");
                alert("Error guardando en GitHub (HTTP " + putRes.status + "): " + errTxt.slice(0, 140));
                return false;
            }
            return false;
            } catch (e) {
                return false;
            }
        }

        // BUSCADOR EN VIVO TMDB (CON DEBOUNCE DE 300ms Y PALOMITA VERDE)
        function onTypeFilterChange(val) {
            switchFormMode(val);
            const q = document.getElementById("tmdbQuery").value.trim();
            if (q.length >= 2) searchTmdb(q);
        }

        function onLiveTmdbInput(val) {
            if (liveSearchTimer) clearTimeout(liveSearchTimer);
            const q = val.trim();
            if (q.length < 2) {
                document.getElementById("tmdbResultsRow").classList.add("hidden");
                document.getElementById("tmdbSearchStatus").classList.add("hidden");
                return;
            }
            document.getElementById("tmdbSearchStatus").classList.remove("hidden");
            liveSearchTimer = setTimeout(() => searchTmdb(q), 300);
        }

        async function searchTmdb(customQuery) {
            const key = (localStorage.getItem("tmdb_api_key") || DEFAULT_TMDB_KEY).trim();
            const query = (customQuery !== undefined ? customQuery : document.getElementById("tmdbQuery").value).trim();
            const mode = document.getElementById("searchContentType").value;
            if (!query) return;

            const endpoint = mode === "series" ? "tv" : "movie";
            const url = `https://api.themoviedb.org/3/search/${endpoint}?api_key=${encodeURIComponent(key)}&language=es-MX&query=${encodeURIComponent(query)}`;

            try {
                const res = await fetch(url);
                const data = await res.json();
                document.getElementById("tmdbSearchStatus").classList.add("hidden");

                const results = data.results || [];
                const row = document.getElementById("tmdbResultsRow");
                row.classList.remove("hidden");

                if (!results.length) {
                    row.innerHTML = `<p style="font-size:12px; color:var(--text-dim);">Sin resultados para "${escapeAttr(query)}".</p>`;
                    return;
                }

                // Mapa de IDs y Títulos ya agregados para mostrar la palomita verde
                const existingIds = new Set((currentDb.items || []).map(i => String(i.id)));
                const existingTitles = new Set((currentDb.items || []).map(i => (i.title || "").toLowerCase().trim()));

                row.innerHTML = results.slice(0, 12).map(item => {
                    const tmdbId = "tmdb_" + item.id;
                    const title = item.title || item.name || "Sin título";
                    const date = (item.release_date || item.first_air_date || "2026").substring(0, 4);
                    const poster = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : window.FALLBACK_POSTER || "";
                    const backdrop = item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : poster;
                    const genreNames = (item.genre_ids || []).map(id => TMDB_GENRES[id]).filter(Boolean).join(", ");

                    const isAdded = existingIds.has(tmdbId) || existingTitles.has(title.toLowerCase().trim());

                    const payload = encodeURIComponent(JSON.stringify({
                        id: tmdbId,
                        type: mode,
                        title,
                        year: date,
                        rating: (item.vote_average || 8.0).toFixed(1),
                        genres: genreNames || "Estreno, Destacado",
                        poster,
                        backdrop,
                        synopsis: item.overview || ""
                    }));

                    return `
                        <div class="tmdb-item ${isAdded ? 'already-added' : ''}" onclick="fillFromTmdb('${payload}')">
                            <div class="tmdb-item-poster-wrap">
                                <img src="${poster}" alt="" loading="lazy">
                                ${isAdded ? `<span class="tmdb-added-check" title="Ya agregado en tu catálogo">${SVG_CHECK_SM}</span>` : ''}
                            </div>
                            <p>${escapeAttr(title)} (${date})</p>
                        </div>
                    `;
                }).join("");
            } catch (e) {
                document.getElementById("tmdbSearchStatus").classList.add("hidden");
            }
        }

        // MOSTRAR EL FORMULARIO SOLO AL ELEGIR UN TÍTULO
        function fillFromTmdb(encoded) {
            const d = JSON.parse(decodeURIComponent(encoded));
            const existing = (currentDb.items || []).find(
                i => String(i.id) === String(d.id) || (i.title || "").toLowerCase().trim() === (d.title || "").toLowerCase().trim()
            );

            if (existing) {
                editCatalogItem(existing.id);
                return;
            }

            document.getElementById("formEditorCard").classList.remove("hidden");
            switchFormMode(d.type || "movie");
            document.getElementById("fId").value = d.id;
            document.getElementById("fTitle").value = d.title;
            document.getElementById("fYear").value = d.year;
            document.getElementById("fQuality").value = "1080p";
            document.getElementById("fLang").value = "LATINO";
            document.getElementById("fRating").value = d.rating;
            document.getElementById("fGenres").value = d.genres || "Estreno";
            document.getElementById("fPoster").value = d.poster;
            document.getElementById("fBackdrop").value = d.backdrop;
      window.__lastTmdbId = d.tmdb_id || d.id || "";
      if (document.getElementById("fSubtitle")) { document.getElementById("fSubtitle").value = ""; buscarSubtituloWyzie(window.__lastTmdbId); }
            document.getElementById("fSynopsis").value = d.synopsis;
        const _fSub = document.getElementById("fSubtitle");
        if (_fSub) _fSub.value = (d.subtitle || "").trim();
        document.querySelectorAll("[id*=subStatus i],[id*=subtitleStatus i]").forEach(el => el.textContent = "");
            document.getElementById("fFeatured").checked = false;

            resetServersUI();
            draftSeasonsMap = {};
            renderDraftEpisodes();
            checkIfIdExists(d.id);

            document.getElementById("formEditorCard").scrollIntoView({ behavior: "smooth", block: "nearest" });
        }

        function openEmptyManualForm() {
            resetForm();
            document.getElementById("formEditorCard").classList.remove("hidden");
            document.getElementById("formEditorCard").scrollIntoView({ behavior: "smooth" });
        }

        function closeFormEditor() {
            document.getElementById("formEditorCard").classList.add("hidden");
        }

        function resetServersUI(serversArray) {
            const container = document.getElementById("dynamicServersContainer");
            container.innerHTML = "";
            if (Array.isArray(serversArray) && serversArray.length > 0) {
                serversArray.forEach(s => addServerInputRow(s.name || "Streamtape", s.url || "", s.quality || "1080p"));
            } else {
                addServerInputRow("Streamtape", "", "1080p");
            }
        }

        function addServerInputRow(nameVal, urlVal, qualityVal) {
    const container = document.getElementById("dynamicServersContainer");
    const idx = container.children.length + 1;
    const div = document.createElement("div");
    div.className = "server-pair-box srv-input-item";

    const rawName = (nameVal || "VOE").trim();
    const low = rawName.toLowerCase();
    const normalized = low.includes("voe") ? "VOE"
      : low.includes("mixdrop") ? "Mixdrop"
      : low.includes("streamtape") ? "Streamtape"
      : rawName;

    const opts = ["VOE", "Mixdrop", "Streamtape"];
    if (normalized && !opts.includes(normalized)) opts.push(normalized);
    const optionsHtml = opts.map(o =>
      `<option value="${escapeAttr(o)}"${o === normalized ? " selected" : ""}>${escapeAttr(o)}</option>`
    ).join("");

    div.innerHTML = `
        <div class="form-grid" style="margin-bottom:8px;">
            <select class="admin-input srv-name-field">${optionsHtml}</select>
            <input type="text" class="admin-input srv-qual-field" value="${escapeAttr(qualityVal || "1080p")}" placeholder="1080p">
        </div>
        <input type="text" class="admin-input srv-url-field" value="${escapeAttr(urlVal || "")}" placeholder="https://... o enlace .mp4">
        ${idx > 1 ? `
        <button type="button" class="btn-danger" style="width:100%; margin-top:8px; padding:7px;" onclick="this.closest('.srv-input-item').remove()">
            ${SVG_TRASH} <span>Quitar este enlace</span>
        </button>` : ""}
    `;
    container.appendChild(div);
}

        function collectServerInputs(defaultQuality) {
            const rows = document.querySelectorAll("#dynamicServersContainer .srv-input-item");
            const list = [];
            rows.forEach((r, i) => {
                const name = r.querySelector(".srv-name-field").value.trim() || `Servidor ${i + 1}`;
                const qual = r.querySelector(".srv-qual-field").value.trim() || defaultQuality || "1080p";
                const url = r.querySelector(".srv-url-field").value.trim();
                if (url) {
                    list.push({ name, quality: qual, format: "MP4", url });
                }
            });
            return list;
        }

        function switchFormMode(type) {
            document.getElementById("fType").value = type;
            document.getElementById("searchContentType").value = type;
            if (type === "series") {
                document.getElementById("adminMovieServers").classList.add("hidden");
                document.getElementById("adminSeriesEpisodes").classList.remove("hidden");
            } else {
                document.getElementById("adminSeriesEpisodes").classList.add("hidden");
                document.getElementById("adminMovieServers").classList.remove("hidden");
            }
        }

        function checkIfIdExists(idVal) {
            const cleanId = String(idVal || "").trim();
            const existing = (currentDb.items || []).find(i => String(i.id) === cleanId);
            const delBtn = document.getElementById("btnDeleteFromForm");
            const badge = document.getElementById("editStatusBadge");
            const submitText = document.getElementById("btnSubmitText");

            if (existing) {
                delBtn.classList.remove("hidden");
                badge.classList.remove("hidden");
                submitText.textContent = "GUARDAR CAMBIOS EN LA NUBE";
            } else {
                delBtn.classList.add("hidden");
                badge.classList.add("hidden");
                submitText.textContent = "SUBIR Y PUBLICAR EN EL CATÁLOGO";
            }
        }

        function addEpisodeToDraft() {
            const sNum = Number(document.getElementById("epSeasonNum").value || 1);
            const eNum = Number(document.getElementById("epNum").value || 1);
            const eTitle = document.getElementById("epTitle").value.trim() || `Episodio ${eNum}`;
            const eUrl = document.getElementById("epServerUrl").value.trim();
            const eSub = (document.getElementById("epSubtitleUrl")?.value || "").trim();

            if (!eUrl) return alert("Coloca el enlace del capítulo.");

            if (!draftSeasonsMap[sNum]) draftSeasonsMap[sNum] = [];
            const epObj = {
                episode_number: eNum,
                title: eTitle,
                duration: "45 min",
                subtitle: eSub,
                servers: [{ name: "Streamtape", quality: "1080p", format: "MP4", url: eUrl }]
            };

            const existingEpIdx = draftSeasonsMap[sNum].findIndex(x => Number(x.episode_number) === eNum);
            if (existingEpIdx >= 0) {
                draftSeasonsMap[sNum][existingEpIdx] = epObj;
            } else {
                draftSeasonsMap[sNum].push(epObj);
            }

            document.getElementById("epNum").value = eNum + 1;
            document.getElementById("epTitle").value = "";
            document.getElementById("epServerUrl").value = "";
            if (document.getElementById("epSubtitleUrl")) document.getElementById("epSubtitleUrl").value = "";
            renderDraftEpisodes();
        }

        function removeDraftEpisode(sNum, eNum) {
            if (!draftSeasonsMap[sNum]) return;
            draftSeasonsMap[sNum] = draftSeasonsMap[sNum].filter(ep => Number(ep.episode_number) !== Number(eNum));
            if (!draftSeasonsMap[sNum].length) delete draftSeasonsMap[sNum];
            renderDraftEpisodes();
        }

        function toggleEpSubEditor(sNum, eNum) {
            const el = document.getElementById(`epSubEditor_${sNum}_${eNum}`);
            if (el) el.style.display = (el.style.display === "none" || !el.style.display) ? "flex" : "none";
        }

        function updateDraftEpSubtitle(sNum, eNum, val) {
            const list = draftSeasonsMap[sNum] || [];
            const ep = list.find(x => Number(x.episode_number) === Number(eNum));
            if (!ep) return;
            ep.subtitle = (val || "").trim();
            renderDraftEpisodes();
        }

        async function obtenerImdbIdSerie() {
            const tmdbKey = localStorage.getItem("gato_tmdb_key") || localStorage.getItem("tmdb_api_key") || "";
            if (!tmdbKey) {
                alert("Configura tu clave API de TMDB primero en el botón de Llaves.");
                return "";
            }
            const rawId = (document.getElementById("fId")?.value || "").trim();
            let tmdbId = rawId.replace(/^tmdb_/i, "");
            if (!/^\d+$/.test(tmdbId)) {
                const title = (document.getElementById("fTitle")?.value || "").trim();
                if (!title) return "";
                const sr = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${encodeURIComponent(tmdbKey)}&query=${encodeURIComponent(title)}&language=es-MX`);
                const sd = await sr.json();
                tmdbId = sd?.results?.[0]?.id ? String(sd.results[0].id) : "";
            }
            if (!tmdbId) return "";
            const extRes = await fetch(`https://api.themoviedb.org/3/tv/${tmdbId}/external_ids?api_key=${encodeURIComponent(tmdbKey)}`);
            const extData = await extRes.json();
            return extData?.imdb_id || "";
        }

        async function buscarSubOpenSubtitlesEpisodio(sNum, eNum) {
            const imdbId = await obtenerImdbIdSerie();
            if (!imdbId) {
                alert("No se encontró el IMDb ID de la serie en TMDB.");
                return "";
            }
            const res = await fetch(`https://opensubtitles-v3.strem.io/subtitles/series/${imdbId}:${sNum}:${eNum}.json`);
            if (!res.ok) throw new Error("OpenSubtitles no respondió");
            const data = await res.json();
            const subs = Array.isArray(data?.subtitles) ? data.subtitles : [];
            const esSub = subs.find(s => /^(spa|es|es-mx|es-es)$/i.test(String(s.lang || "")))
                       || subs.find(s => String(s.lang || "").toLowerCase().includes("es"));
            return esSub?.url || "";
        }

        async function buscarSubtituloCapituloForm() {
            const btn = document.getElementById("btnAutoEpSub");
            const input = document.getElementById("epSubtitleUrl");
            const sNum = Number(document.getElementById("epSeasonNum")?.value || 1);
            const eNum = Number(document.getElementById("epNum")?.value || 1);
            if (btn) { btn.disabled = true; btn.textContent = "Buscando..."; }
            try {
                const url = await buscarSubOpenSubtitlesEpisodio(sNum, eNum);
                if (url) {
                    if (input) input.value = url;
                } else {
                    alert(`No se encontraron subtítulos en español para T${sNum} • Cap ${eNum}.`);
                }
            } catch (err) {
                alert("Error buscando subtítulo: " + err.message);
            } finally {
                if (btn) { btn.disabled = false; btn.textContent = "Buscar auto"; }
            }
        }

        async function buscarSubtituloEnTarjeta(sNum, eNum, btnEl) {
            if (btnEl) { btnEl.disabled = true; btnEl.textContent = "..."; }
            try {
                const url = await buscarSubOpenSubtitlesEpisodio(sNum, eNum);
                if (url) {
                    updateDraftEpSubtitle(sNum, eNum, url);
                } else {
                    alert(`Sin subtítulos en español para T${sNum} • Cap ${eNum}.`);
                }
            } catch (err) {
                alert("Error buscando subtítulo: " + err.message);
            } finally {
                if (btnEl) { btnEl.disabled = false; btnEl.textContent = "Auto"; }
            }
        }

        function renderDraftEpisodes() {
            const box = document.getElementById("draftEpisodesPreview");
            const lines = [];
            Object.keys(draftSeasonsMap).sort((a, b) => Number(a) - Number(b)).forEach(s => {
                draftSeasonsMap[s].sort((a, b) => Number(a.episode_number) - Number(b.episode_number)).forEach(ep => {
                    const hasSub = !!(ep.subtitle && String(ep.subtitle).trim());
                    const ccBadge = hasSub
                        ? `<span style="background:rgba(20,116,142,0.22); color:#38bdf8; border:1px solid #14748E; padding:2px 6px; border-radius:6px; font-size:10px; font-weight:700; white-space:nowrap;">CC ✓</span>`
                        : `<span style="background:#181B22; color:#64748B; border:1px solid #232730; padding:2px 6px; border-radius:6px; font-size:10px; font-weight:600; white-space:nowrap;">Sin CC</span>`;
                    const videoUrl = (ep.servers && ep.servers[0] && ep.servers[0].url) ? ep.servers[0].url : "";
                    lines.push(`
                        <div class="ep-card" style="flex-direction:column; align-items:stretch; gap:8px;">
                            <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; width:100%;">
                                <div class="ep-meta" style="min-width:0; flex:1;">
                                    <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                                        <h4 style="margin:0;">T${s} • Cap ${ep.episode_number}: ${escapeAttr(ep.title)}</h4>
                                        ${ccBadge}
                                    </div>
                                    <p style="margin:4px 0 0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeAttr(videoUrl)}</p>
                                </div>
                                <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
                                    <button type="button" title="Editar capítulo" onclick="editarCapituloDraft(${s}, ${ep.episode_number})" style="background:#181B22; color:#38bdf8; border:1px solid #232730; border-radius:8px; padding:6px 9px; font-size:13px; cursor:pointer;">✎</button><button type="button" onclick="toggleEpSubEditor(${s}, ${ep.episode_number})" title="Subtítulo del capítulo" style="height:32px; padding:0 9px; border-radius:8px; border:1px solid ${hasSub ? '#14748E' : '#2A303C'}; background:${hasSub ? 'rgba(14,90,111,0.25)' : '#121418'}; color:${hasSub ? '#38bdf8' : '#CBD5E1'}; font-size:11px; font-weight:700; cursor:pointer;">CC</button>
                                    <button type="button" class="btn-icon-sq del" onclick="removeDraftEpisode(${s}, ${ep.episode_number})">${SVG_TRASH}</button>
                                </div>
                            </div>
                            <div id="epSubEditor_${s}_${ep.episode_number}" style="display:none; gap:6px; align-items:center; padding-top:8px; border-top:1px solid #232730;">
                                <input type="text" id="epSubInput_${s}_${ep.episode_number}" class="admin-input" value="${escapeAttr(ep.subtitle || "")}" placeholder="URL .srt / .vtt para T${s} Cap ${ep.episode_number}" style="flex:1; min-width:0; padding:7px 9px; font-size:12px;" onchange="updateDraftEpSubtitle(${s}, ${ep.episode_number}, this.value)">
                                <button type="button" onclick="buscarSubtituloEnTarjeta(${s}, ${ep.episode_number}, this)" style="background:#0E5A6F; color:#fff; border:1px solid #14748E; border-radius:7px; padding:7px 10px; font-size:11.5px; font-weight:600; cursor:pointer; white-space:nowrap;">Auto</button>
                            </div>
                        </div>
                    `);
                });
            });
            box.innerHTML = lines.join("");
        }

        async function saveItemToCatalog() {
            const type = document.getElementById("fType").value;
            const title = document.getElementById("fTitle").value.trim();
            if (!title) return alert("El título es obligatorio.");

            const itemId = document.getElementById("fId").value.trim() || ("id_" + Date.now());
            const qualityVal = document.getElementById("fQuality").value.trim() || "1080p";

            const newItem = {
                id: itemId,
                type,
                title,
                year: document.getElementById("fYear").value.trim() || "2026",
                quality: qualityVal,
                language: document.getElementById("fLang").value.trim() || "LATINO",
                rating: document.getElementById("fRating").value.trim() || "8.5",
                featured: document.getElementById("fFeatured").checked,
                genres: document.getElementById("fGenres").value.split(",").map(s => s.trim()).filter(Boolean),
                poster: document.getElementById("fPoster").value.trim(),
                backdrop: document.getElementById("fBackdrop").value.trim() || document.getElementById("fPoster").value.trim(),
        subtitle: (document.getElementById("fSubtitle") ? document.getElementById("fSubtitle").value.trim() : ""),
                synopsis: document.getElementById("fSynopsis").value.trim()
            };

            if (type === "series") {
                newItem.seasons = Object.keys(draftSeasonsMap).map(sNum => ({
                    season_number: Number(sNum),
                    episodes: draftSeasonsMap[sNum]
                }));
                if (!newItem.seasons.length) return alert("Agrega al menos 1 capítulo a la serie.");
            } else {
                const servers = collectServerInputs(qualityVal);
                if (!servers.length) return alert("Coloca al menos 1 enlace de video.");
                newItem.servers = servers;
            }

            const btnText = document.getElementById("btnSubmitText");
            btnText.textContent = "GUARDANDO EN LA NUBE...";

            if (!Array.isArray(currentDb.items)) currentDb.items = [];
            const existingIndex = currentDb.items.findIndex(i => String(i.id) === String(newItem.id));
            if (existingIndex >= 0) {
                currentDb.items[existingIndex] = newItem;
            } else {
                currentDb.items.unshift(newItem);
            }

            try {
                await fetch("/api/save-item", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newItem)
                });
            } catch (e) {}

            await pushDatabaseToCloudAndServer();
            renderAdminList();

            // Refrescar palomita verde en los resultados de búsqueda actuales si están abiertos
            const currentQ = document.getElementById("tmdbQuery").value.trim();
            if (currentQ.length >= 2) searchTmdb(currentQ);

            closeFormEditor();
            resetForm();
        }

        function editCatalogItem(id) {
            const item = (currentDb.items || []).find(i => String(i.id) === String(id));
            if (!item) return;

            document.getElementById("formEditorCard").classList.remove("hidden");
            switchFormMode(item.type || "movie");
            document.getElementById("fId").value = item.id || "";
            document.getElementById("fTitle").value = item.title || "";
            document.getElementById("fYear").value = item.year || "2026";
            document.getElementById("fQuality").value = item.quality || "1080p";
            document.getElementById("fLang").value = item.language || "LATINO";
            document.getElementById("fRating").value = item.rating || "8.5";
            document.getElementById("fGenres").value = (item.genres || []).join(", ");
            document.getElementById("fPoster").value = item.poster || "";
            document.getElementById("fBackdrop").value = item.backdrop || "";
      if (document.getElementById("fSubtitle")) document.getElementById("fSubtitle").value = item.subtitle || "";
            document.getElementById("fSynopsis").value = item.synopsis || "";
        const _fSub = document.getElementById("fSubtitle");
        if (_fSub) _fSub.value = (item.subtitle || "").trim();
        document.querySelectorAll("[id*=subStatus i],[id*=subtitleStatus i]").forEach(el => el.textContent = "");
            document.getElementById("fFeatured").checked = Boolean(item.featured);

            if (item.type === "series") {
                draftSeasonsMap = {};
                (item.seasons || []).forEach(s => {
                    draftSeasonsMap[s.season_number] = [...(s.episodes || [])];
                });
                renderDraftEpisodes();
            } else {
                resetServersUI(item.servers || []);
            }

            checkIfIdExists(item.id);
            document.getElementById("formEditorCard").scrollIntoView({ behavior: "smooth", block: "start" });
        }

        function resetForm() {
            document.getElementById("fId").value = "";
            document.getElementById("fTitle").value = "";
            document.getElementById("fYear").value = "2026";
            document.getElementById("fQuality").value = "1080p";
            document.getElementById("fLang").value = "LATINO";
            document.getElementById("fRating").value = "8.7";
            document.getElementById("fGenres").value = "";
            document.getElementById("fPoster").value = "";
            document.getElementById("fBackdrop").value = "";
            document.getElementById("fSynopsis").value = "";
        const _fSubClr = document.getElementById("fSubtitle");
        if (_fSubClr) _fSubClr.value = "";
        document.querySelectorAll("[id*=subStatus i],[id*=subtitleStatus i]").forEach(el => el.textContent = "");
            document.getElementById("fFeatured").checked = false;
            resetServersUI();
            draftSeasonsMap = {};
            renderDraftEpisodes();
            checkIfIdExists("");
        }

        async function deleteCurrentFormItem() {
            const id = document.getElementById("fId").value.trim();
            if (!id) return;
            await deleteCatalogItem(id);
            closeFormEditor();
            resetForm();
        }

        async function loadCatalogAdmin() {
            const ts = Date.now();
            const { owner, repo } = inferGithubRepoFromUrl();
            const ghToken = localStorage.getItem("gh_token");

            const urls = [
                `https://api.github.com/repos/${owner}/${repo}/contents/catalogo.json?t=${ts}`,
                `https://raw.githubusercontent.com/${owner}/${repo}/main/catalogo.json?t=${ts}`,
                `./catalogo.json?t=${ts}`,
                `/api/catalogo.json?t=${ts}`
            ];

            for (const u of urls) {
                try {
                    const headers = {};
                    if (u.includes("api.github.com") && ghToken) {
                        headers["Authorization"] = `token ${ghToken}`;
                    }
                    const r = await fetch(u, { cache: "no-store", headers });
                    if (!r.ok) continue;
                    let data = await r.json();
                    if (data && data.content && data.encoding === "base64") {
                        const decoded = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ""))));
                        data = JSON.parse(decoded);
                    }
                    const items = Array.isArray(data) ? data : (data.items || data.movies || []);
                    if (items.length > 0 || !currentDb.items.length) {
                        currentDb = Array.isArray(data)
                            ? { site_config: { hero_mode: "recent", hero_count: 5 }, items: data }
                            : data;
                        syncLocalCache();
                        if (items.length > 0) break;
                    }
                } catch (e) {}
            }

            if (!currentDb.items || !currentDb.items.length) {
                const cached = localStorage.getItem(STORAGE_KEY);
                if (cached) {
                    try { currentDb = JSON.parse(cached); } catch (e) {}
                }
            }

            renderAdminList();
            updateApiKeysStatusUI();
        }

        function renderAdminList() {
            const allItems = currentDb.items || [];
            document.getElementById("catalogCount").textContent = allItems.length;

            const filterQ = (document.getElementById("savedCatalogSearch").value || "").trim().toLowerCase();
            const filtered = filterQ
                ? allItems.filter(i => (i.title || "").toLowerCase().includes(filterQ) || String(i.year || "").includes(filterQ))
                : allItems;

            const box = document.getElementById("adminCatalogList");
            if (!filtered.length) {
                box.innerHTML = `<p style="font-size:12.5px; color:var(--text-dim); text-align:center; padding:14px 0;">${filterQ ? 'No coinciden títulos con tu búsqueda.' : 'Tu catálogo está vacío. Busca una película arriba para empezar.'}</p>`;
                return;
            }

            box.innerHTML = filtered.map(item => {
                const linksCount = item.type === "series"
                    ? `${(item.seasons || []).length} temp.`
                    : `${(item.servers || []).length} enlaces`;
                return `
                    <div class="saved-item-row">
                        <div class="saved-item-left">
                            <img src="${escapeAttr(item.poster || '')}" class="saved-item-thumb" alt="" loading="lazy">
                            <div class="ep-meta">
                                <h4>${escapeAttr(item.title)}</h4>
                                <p>${escapeAttr(item.year || '2026')} • ${linksCount}</p>
                            </div>
                        </div>
                        <div class="action-pair">
                            <button type="button" class="btn-icon-sq edit" title="Editar" onclick="editCatalogItem('${escapeAttr(item.id)}')">${SVG_EDIT}</button>
                            <button type="button" class="btn-icon-sq del" title="Eliminar" onclick="deleteCatalogItem('${escapeAttr(item.id)}')">${SVG_TRASH}</button>
                        </div>
                    </div>
                `;
            }).join("");
        }

        async function deleteCatalogItem(id) {
            if (!confirm("¿Eliminar este título del catálogo?")) return;
            const prevItems = [...(currentDb.items || [])];
    currentDb.items = prevItems.filter(i => String(i.id) !== String(id));

    const saved = await pushDatabaseToCloudAndServer();
    if (!saved) {
        currentDb.items = prevItems;
        renderAdminList();
        return;
    }
    renderAdminList();

            const currentQ = document.getElementById("tmdbQuery").value.trim();
            if (currentQ.length >= 2) searchTmdb(currentQ);
        }

        async function saveHeroConfig() {
            const hero_mode = document.getElementById("cfgHeroMode").value;
            const hero_count = Number(document.getElementById("cfgHeroCount").value || 5);
            currentDb.site_config = Object.assign(currentDb.site_config || {}, { hero_mode, hero_count });
            await pushDatabaseToCloudAndServer();
            closeHeroSettingsModal();
        }

        function copyLiveApiUrl() {
            const url = document.getElementById("liveApkUrlField").value;
            navigator.clipboard.writeText(url);
            document.getElementById("copyFeedback").textContent = "URL copiada al portapapeles";
        }

        function copyRawJsonForApk() {
            navigator.clipboard.writeText(JSON.stringify(currentDb, null, 2));
            document.getElementById("copyFeedback").textContent = "JSON completo copiado";
        }

        function downloadJsonFile() {
            const blob = new Blob([JSON.stringify(currentDb, null, 2)], { type: "application/json" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "catalogo.json";
            a.click();
        }

        function escapeAttr(str) {
            return String(str || "").replace(/[&<>"']/g, s => ({
                "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
            }[s]));
        }

window.__lastTmdbId = "";

function getTmdbKeyForSubs() {
  try {
    if (typeof TMDB_API_KEY !== "undefined" && TMDB_API_KEY) return TMDB_API_KEY;
    if (typeof TMDB_KEY !== "undefined" && TMDB_KEY) return TMDB_KEY;
    const inp = document.querySelector('#apiKeysModal input[id*="tmdb" i], #apiKeysModal input[placeholder*="TMDB" i], #apiKeysModal input');
    if (inp && /^[a-f0-9]{32}$/i.test(inp.value.trim())) return inp.value.trim();
    for (let i = 0; i < localStorage.length; i++) {
      const val = (localStorage.getItem(localStorage.key(i)) || "").trim();
      if (/^[a-f0-9]{32}$/i.test(val)) return val;
    }
  } catch (e) {}
  return "";
}

async function fetchImdbFromTmdb(tmdbNumId, mediaType, tmdbKey) {
  const endpoint = mediaType === "tv" ? "tv" : "movie";
  const r = await fetch("https://api.themoviedb.org/3/" + endpoint + "/" + encodeURIComponent(tmdbNumId) + "/external_ids?api_key=" + encodeURIComponent(tmdbKey));
  if (!r.ok) return "";
  const data = await r.json();
  return (data && data.imdb_id) ? data.imdb_id : "";
}

async function buscarSubtituloWyzie(tmdbId) {
  const input = document.getElementById("fSubtitle");
  const msg = document.getElementById("subStatusMsg");
  if (!input || !msg) return;

  const tmdbKey = getTmdbKeyForSubs();
  if (!tmdbKey) {
    msg.textContent = "Falta la clave API de TMDB en Configurar Claves API.";
    return;
  }

  msg.textContent = "Buscando subtítulos en español (OpenSubtitles)...";
  try {
    let rawId = String(tmdbId || window.__lastTmdbId || "").trim();
    let imdbId = rawId.startsWith("tt") ? rawId : "";
    let mediaType = "movie";

    const numMatch = rawId.match(/\d+/);
    const numId = (numMatch && numMatch[0].length <= 9) ? numMatch[0] : "";

    if (!imdbId && numId) {
      imdbId = await fetchImdbFromTmdb(numId, "movie", tmdbKey);
      if (imdbId) {
        mediaType = "movie";
      } else {
        imdbId = await fetchImdbFromTmdb(numId, "tv", tmdbKey);
        if (imdbId) mediaType = "series";
      }
    }

    if (!imdbId) {
      const titleEl = document.getElementById("fTitle") || document.querySelector('input[placeholder*="Título" i]');
      const title = titleEl ? titleEl.value.trim() : "";
      if (title) {
        const sRes = await fetch("https://api.themoviedb.org/3/search/multi?api_key=" + encodeURIComponent(tmdbKey) + "&language=es-MX&query=" + encodeURIComponent(title));
        if (sRes.ok) {
          const sData = await sRes.json();
          const hit = (sData.results || []).find(x => x.media_type === "movie" || x.media_type === "tv");
          if (hit && hit.id) {
            mediaType = hit.media_type === "tv" ? "series" : "movie";
            imdbId = await fetchImdbFromTmdb(hit.id, hit.media_type, tmdbKey);
          }
        }
      }
    }

    if (!imdbId) {
      msg.textContent = "No se encontró IMDb ID para este título. Puedes pegar el subtítulo manual.";
      return;
    }

    const osEndpoint = mediaType === "series"
      ? "https://opensubtitles-v3.strem.io/subtitles/series/" + encodeURIComponent(imdbId) + ":1:1.json"
      : "https://opensubtitles-v3.strem.io/subtitles/movie/" + encodeURIComponent(imdbId) + ".json";

    const subRes = await fetch(osEndpoint);
    if (!subRes.ok) throw new Error("HTTP " + subRes.status);
    const subData = await subRes.json();
    const list = (subData && Array.isArray(subData.subtitles)) ? subData.subtitles : [];

    const esSubs = list.filter(s => {
      const l = (s.lang || "").toLowerCase();
      return l === "spa" || l === "es" || l.startsWith("es-") || l.includes("spanish");
    });

    if (esSubs.length > 0 && esSubs[0].url) {
      input.value = esSubs[0].url;
      msg.textContent = "✅ Subtítulo encontrado (" + imdbId + " • Español)";
    } else {
      msg.textContent = "No hay subtítulos en español en OpenSubtitles para " + imdbId + ".";
    }
  } catch (e) {
    msg.textContent = "Error al buscar subtítulos (" + e.message + ").";
  }
}

function editarCapituloDraft(sNum, eNum) {
    try {
        const list = (typeof draftSeasonsMap !== "undefined" && draftSeasonsMap[sNum]) ? draftSeasonsMap[sNum] : [];
        const ep = list.find(x => Number(x.episode_number) === Number(eNum));
        if (!ep) return;

        const elSeason = document.getElementById("epSeasonNum");
        const elNum = document.getElementById("epNum");
        const elTitle = document.getElementById("epTitle");
        const elUrl = document.getElementById("epServerUrl");
        const elSub = document.getElementById("epSubtitleUrl");

        if (elSeason) elSeason.value = Number(sNum) || 1;
        if (elNum) elNum.value = Number(ep.episode_number) || 1;
        if (elTitle) elTitle.value = ep.title || "";
        if (elUrl) elUrl.value = (Array.isArray(ep.servers) && ep.servers[0] ? ep.servers[0].url : ep.url) || "";
        if (elSub) elSub.value = ep.subtitle || "";

        if (elUrl) {
            elUrl.scrollIntoView({ behavior: "smooth", block: "center" });
            elUrl.focus();
            elUrl.select();
        }
    } catch (e) {
        alert("Error cargando capítulo: " + e.message);
    }
}


// === UX CONTEXTUAL SERIES VS PELICULAS ===
function syncSubtitleBoxByType() {
    const movieSubBox = document.getElementById("movieSubtitleBox");
    if (!movieSubBox) return;

    const typeEl = document.getElementById("fType") || document.querySelector('select[name="type"]');
    const epInput = document.getElementById("epSeasonNum");

    let isSeries = false;
    if (typeEl && String(typeEl.value).toLowerCase() === "series") {
        isSeries = true;
    } else if (epInput && epInput.offsetParent !== null) {
        isSeries = true;
    }

    movieSubBox.style.display = isSeries ? "none" : "block";
}

function setEpisodeComposerMode(isEditing, sNum, eNum) {
    const btn = document.getElementById("btnAddEpDraft");
    const lbl = document.getElementById("epSubmitLabel");
    if (!btn || !lbl) return;

    if (isEditing) {
        lbl.textContent = `Guardar cambios (T${sNum} • Cap ${eNum})`;
        btn.style.background = "#0E5A6F";
        btn.style.borderColor = "#14748E";
        btn.style.color = "#FFFFFF";
    } else {
        lbl.textContent = "Añadir Capítulo";
        btn.style.background = "";
        btn.style.borderColor = "";
        btn.style.color = "";
    }
}

(function initSeriesUxHooks() {
    // Envolver editarCapituloDraft para activar el botón en modo edición
    if (typeof window.editarCapituloDraft === "function") {
        const origEdit = window.editarCapituloDraft;
        window.editarCapituloDraft = function(sNum, eNum) {
            origEdit(sNum, eNum);
            setEpisodeComposerMode(true, sNum, eNum);
        };
    }

    // Envolver addEpisodeToDraft para restaurar el botón al guardar
    if (typeof window.addEpisodeToDraft === "function") {
        const origAdd = window.addEpisodeToDraft;
        window.addEpisodeToDraft = function() {
            const res = origAdd.apply(this, arguments);
            setEpisodeComposerMode(false);
            return res;
        };
    }

    const bindObservers = () => {
        syncSubtitleBoxByType();
        const typeEl = document.getElementById("fType") || document.querySelector('select[name="type"]');
        if (typeEl) {
            typeEl.addEventListener("change", () => {
                setEpisodeComposerMode(false);
                syncSubtitleBoxByType();
            });
        }
        const epInput = document.getElementById("epSeasonNum");
        const seriesSection = epInput ? epInput.closest("[id]") || epInput.parentElement?.parentElement : null;
        if (seriesSection && typeof MutationObserver !== "undefined") {
            new MutationObserver(syncSubtitleBoxByType).observe(seriesSection, {
                attributes: true,
                attributeFilter: ["class", "style"]
            });
        }
        // Respaldo al abrir cualquier título existente en modo edición
        document.addEventListener("click", () => setTimeout(syncSubtitleBoxByType, 60));
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bindObservers);
    } else {
        bindObservers();
    }
})();


// === GATO CMS UX PRO: CONFIRMACION Y BARRA FLOTANTE ===
function openDeleteConfirmModal() {
    const title = (document.getElementById("fTitle")?.value || "").trim() || "este título";
    const nameEl = document.getElementById("delModalItemName");
    if (nameEl) nameEl.textContent = `"${title}"`;
    document.getElementById("deleteConfirmModal")?.classList.add("open");
}

function closeDeleteConfirmModal() {
    document.getElementById("deleteConfirmModal")?.classList.remove("open");
}

function confirmDeleteCurrentTitle() {
    closeDeleteConfirmModal();
    if (typeof deleteCurrentFormItem === "function") {
        deleteCurrentFormItem();
    }
}

function updateEditingStickyBar() {
    const bar = document.getElementById("editingStickyBar");
    const titleInput = document.getElementById("fTitle");
    const posterInput = document.getElementById("fPoster");
    if (!bar || !titleInput) return;

    const titleVal = (titleInput.value || "").trim();
    const posterVal = (posterInput?.value || "").trim();
    const formVisible = titleInput.offsetParent !== null;

    if (!formVisible || !titleVal || window.scrollY < 220) {
        bar.classList.remove("visible");
        return;
    }

    const titleEl = document.getElementById("editingStickyTitle");
    const posterEl = document.getElementById("editingStickyPoster");
    if (titleEl) titleEl.textContent = titleVal;
    if (posterEl) {
        if (posterVal) {
            posterEl.src = posterVal;
            posterEl.style.display = "block";
        } else {
            posterEl.style.display = "none";
        }
    }
    bar.classList.add("visible");
}

window.addEventListener("scroll", updateEditingStickyBar, { passive: true });
document.addEventListener("input", (e) => {
    if (e.target && (e.target.id === "fTitle" || e.target.id === "fPoster")) {
        updateEditingStickyBar();
    }
});
document.getElementById("deleteConfirmModal")?.addEventListener("click", (e) => {
    if (e.target.id === "deleteConfirmModal") closeDeleteConfirmModal();
});


// === GATO CMS SECURITY PRO ===
const CMS_FAIL_KEY = "gato_cms_fail_count";
const CMS_LOCK_KEY = "gato_cms_lock_until";

function isGatoCmsSessionValid() {
    const exp = Number(localStorage.getItem("gato_cms_auth_exp") || 0);
    const saved = localStorage.getItem("gato_cms_auth_hash") || "";
    return Boolean(saved && Date.now() < exp);
}

function logoutGatoCms() {
    localStorage.removeItem("gato_cms_auth_hash");
    localStorage.removeItem("gato_cms_auth_exp");
    location.reload();
}

// Envolver handleGatoCmsLogin con bloqueo anti fuerza bruta (5 intentos = 5 min)
(function wrapLoginSecurity() {
    const origLogin = window.handleGatoCmsLogin;
    if (typeof origLogin !== "function") return;

    window.handleGatoCmsLogin = async function(ev) {
        ev.preventDefault();
        const errEl = document.getElementById("cmsLoginErr");
        const lockUntil = Number(localStorage.getItem(CMS_LOCK_KEY) || 0);

        if (Date.now() < lockUntil) {
            const mins = Math.ceil((lockUntil - Date.now()) / 60000);
            if (errEl) errEl.textContent = `Demasiados intentos. Espera ${mins} min.`;
            return false;
        }

        await origLogin(ev);

        if (isGatoCmsSessionValid()) {
            localStorage.removeItem(CMS_FAIL_KEY);
            localStorage.removeItem(CMS_LOCK_KEY);
        } else {
            const fails = Number(localStorage.getItem(CMS_FAIL_KEY) || 0) + 1;
            localStorage.setItem(CMS_FAIL_KEY, String(fails));
            if (fails >= 5) {
                localStorage.setItem(CMS_LOCK_KEY, String(Date.now() + 5 * 60 * 1000));
                localStorage.setItem(CMS_FAIL_KEY, "0");
                if (errEl) errEl.textContent = "Bloqueado 5 minutos por demasiados intentos.";
            } else if (errEl) {
                errEl.textContent = `Datos incorrectos (${fails}/5 intentos).`;
            }
        }
        return false;
    };

    // Vigilante anti-tampering: si borran u ocultan el modal desde DevTools sin sesión válida, recarga
    const gate = document.getElementById("gatoCmsLoginGate");
    if (gate && typeof MutationObserver !== "undefined") {
        const guard = () => {
            if (isGatoCmsSessionValid()) return;
            const el = document.getElementById("gatoCmsLoginGate");
            if (!el || el.classList.contains("unlocked") || getComputedStyle(el).display === "none") {
                location.reload();
            }
        };
        new MutationObserver(guard).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"] });
    }
})();


// === GATO CMS: BUSCADOR MODAL DE SUBTITULOS + NOMBRE VERIFICADO ===
function _getCmsTmdbKey() {
    if (window.TMDB_API_KEY) return window.TMDB_API_KEY;
    const inputs = ["cfgTmdbKey", "tmdbApiKey", "fTmdbKey"];
    for (const id of inputs) {
        const v = document.getElementById(id)?.value?.trim();
        if (v) return v;
    }
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i) || "";
        if (k.toLowerCase().includes("tmdb")) {
            const v = (localStorage.getItem(k) || "").trim();
            if (v && v.length >= 16 && !v.includes(" ")) return v;
        }
    }
    return "";
}

function setSubVerifiedLabel(movieName, yearStr, extra) {
    const el = document.getElementById("subVerifiedMeta");
    if (!el) return;
    if (!movieName) {
        el.classList.remove("visible");
        el.innerHTML = "";
        return;
    }
    const yr = yearStr ? ` (${yearStr})` : "";
    const info = extra ? ` • ${extra}` : "";
    el.innerHTML = `<span>✓</span><span>Subtítulo de: <strong style="color:#f1f5f9;">${movieName}${yr}</strong>${info}</span>`;
    el.classList.add("visible");
}

function openSubSearchModal() {
    const modal = document.getElementById("subSearchModal");
    const qInput = document.getElementById("subModalQuery");
    const curTitle = (document.getElementById("fTitle")?.value || "").trim();
    if (qInput) qInput.value = curTitle;
    if (modal) modal.classList.add("open");
    if (curTitle) runSubModalTmdbSearch();
}

function closeSubSearchModal() {
    document.getElementById("subSearchModal")?.classList.remove("open");
}

async function runSubModalTmdbSearch() {
    const q = (document.getElementById("subModalQuery")?.value || "").trim();
    const st = document.getElementById("subModalStatus");
    const box = document.getElementById("subModalResults");
    if (!q || !box) return;

    const apiKey = _getCmsTmdbKey();
    if (!apiKey) {
        if (st) st.textContent = "Configura tu clave API de TMDB primero.";
        return;
    }
    if (st) st.textContent = "Buscando película en TMDB...";
    box.innerHTML = "";

    try {
        const r = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${encodeURIComponent(apiKey)}&language=es-MX&query=${encodeURIComponent(q)}`);
        const data = await r.json();
        const list = (data.results || []).slice(0, 8);
        if (!list.length) {
            if (st) st.textContent = "No se encontraron películas con ese nombre.";
            return;
        }
        if (st) st.textContent = "Toca la película correcta para ver sus subtítulos en español:";
        box.innerHTML = list.map(m => {
            const yr = (m.release_date || "").slice(0, 4);
            const poster = m.poster_path ? `https://image.tmdb.org/t/p/w92${m.poster_path}` : "";
            const safeTitle = String(m.title || m.original_title || "").replace(/'/g, "\'").replace(/"/g, "&quot;");
            return `<div class="sub-result-row" onclick="loadOpenSubtitlesForMovie(${m.id}, '${safeTitle}', '${yr}')">
                ${poster ? `<img class="sub-result-poster" src="${poster}">` : `<div class="sub-result-poster"></div>`}
                <div class="sub-result-info">
                    <div class="sub-result-title">${m.title || m.original_title}</div>
                    <div class="sub-result-sub">${yr || "Sin año"} • ${m.original_title || ""}</div>
                </div>
                <span class="sub-pick-btn">Ver subs</span>
            </div>`;
        }).join("");
    } catch (e) {
        if (st) st.textContent = "Error buscando en TMDB: " + e.message;
    }
}

async function loadOpenSubtitlesForMovie(tmdbId, title, year) {
    const st = document.getElementById("subModalStatus");
    const box = document.getElementById("subModalResults");
    const apiKey = _getCmsTmdbKey();
    if (st) st.textContent = `Buscando subtítulos en español para "${title}"...`;
    if (box) box.innerHTML = "";

    try {
        const extRes = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}/external_ids?api_key=${encodeURIComponent(apiKey)}`);
        const ext = await extRes.json();
        const imdbId = ext.imdb_id;
        if (!imdbId) {
            if (st) st.textContent = `No se encontró IMDb ID para "${title}".`;
            return;
        }

        const subRes = await fetch(`https://opensubtitles-v3.strem.io/subtitles/movie/${imdbId}.json`);
        const subData = await subRes.json();
        const esSubs = (subData.subtitles || []).filter(s => {
            const lang = String(s.lang || "").toLowerCase();
            return lang === "spa" || lang === "es" || lang.startsWith("es-") || lang.includes("span");
        }).slice(0, 12);

        if (!esSubs.length) {
            if (st) st.textContent = `No hay subtítulos en español disponibles para "${title}" (${imdbId}).`;
            return;
        }

        if (st) st.textContent = `${esSubs.length} subtítulos encontrados para "${title}" (${year || imdbId}):`;
        const safeTitle = String(title).replace(/'/g, "\'").replace(/"/g, "&quot;");
        box.innerHTML = esSubs.map((s, idx) => {
            const safeUrl = String(s.url || "").replace(/'/g, "\'");
            return `<div class="sub-result-row">
                <div class="sub-result-info">
                    <div class="sub-result-title">Opción ${idx + 1} • Español (${s.lang || "spa"})</div>
                    <div class="sub-result-sub">${title}${year ? " (" + year + ")" : ""} • ${imdbId}</div>
                </div>
                <button type="button" class="sub-pick-btn" onclick="applyPickedSubtitle('${safeUrl}', '${safeTitle}', '${year}', '${imdbId}')">Usar</button>
            </div>`;
        }).join("");
    } catch (e) {
        if (st) st.textContent = "Error consultando OpenSubtitles: " + e.message;
    }
}

function applyPickedSubtitle(url, title, year, imdbId) {
    const input = document.getElementById("fSubtitle");
    if (input) input.value = url;
    setSubVerifiedLabel(title, year, imdbId);
    closeSubSearchModal();
}

(function syncSubLabelOnEdit() {
    const refresh = () => {
        const subVal = (document.getElementById("fSubtitle")?.value || "").trim();
        const titleVal = (document.getElementById("fTitle")?.value || "").trim();
        const yearVal = (document.getElementById("fYear")?.value || "").trim();
        const labelEl = document.getElementById("subVerifiedMeta");
        if (!subVal) {
            setSubVerifiedLabel("");
        } else if (titleVal && labelEl && !labelEl.classList.contains("visible")) {
            setSubVerifiedLabel(titleVal, yearVal, "Enlace asignado");
        }
    };
    document.addEventListener("click", () => setTimeout(refresh, 120));
    document.getElementById("fSubtitle")?.addEventListener("input", refresh);
    document.getElementById("subSearchModal")?.addEventListener("click", (e) => {
        if (e.target.id === "subSearchModal") closeSubSearchModal();
    });
})();

const CMS_REPORT_API = "https://script.google.com/macros/s/AKfycbwsldvsEVvjuCRDz03zKyvUVlshY-6x-nBtRkX9Md0rzK7vRAz2kvqIgK0E3aIQAIvG/exec";
let __cmsReports = [];

function openCmsNotifModal() {
    const m = document.getElementById("cmsNotifModal");
    if (m) m.style.display = "flex";
    loadCmsReports(true);
}
function closeCmsNotifModal() {
    const m = document.getElementById("cmsNotifModal");
    if (m) m.style.display = "none";
}

async function loadCmsReports(renderList) {
    try {
        const res = await fetch(CMS_REPORT_API + "?action=list&t=" + Date.now());
        const data = await res.json();
        __cmsReports = Array.isArray(data.reports) ? data.reports : [];
        const badge = document.getElementById("cmsNotifBadge");
        if (badge) {
            badge.textContent = __cmsReports.length;
            badge.style.display = __cmsReports.length > 0 ? "inline-block" : "none";
        }
        if (renderList) renderCmsReportsList();
    } catch (e) {
        if (renderList) {
            const box = document.getElementById("cmsNotifList");
            if (box) box.innerHTML = '<p style="color:#f87171; font-size:13px;">Error al cargar reportes.</p>';
        }
    }
}

function renderCmsReportsList() {
    const box = document.getElementById("cmsNotifList");
    if (!box) return;
    if (!__cmsReports.length) {
        box.innerHTML = '<p style="color:#94A3B8; font-size:13px; text-align:center; padding:18px 0;">No hay reportes pendientes.</p>';
        return;
    }
    box.innerHTML = __cmsReports.map(r => {
        const dt = r.date ? new Date(r.date).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" }) : "";
        const safeId = String(r.itemId || "").replace(/'/g, "\\'");
        const safeTitle = String(r.title || "").replace(/'/g, "\\'");
        const safeRepId = String(r.id || "").replace(/'/g, "\\'");
        const noteStr = String(r.note || "");
        const isSync = r.type === "sync" || noteStr.startsWith("SYNC_OFFSET:");
        let syncVal = 0;
        if (isSync) {
            const m = noteStr.match(/SYNC_OFFSET:([+-]?\d+(?:\.\d+)?)/);
            if (m) syncVal = parseFloat(m[1]);
        }
        const primaryBtn = isSync
            ? `<button type="button" onclick="applyCmsSyncReport('${safeRepId}', '${safeId}', '${safeTitle}', ${syncVal}, this)" style="flex:1; background:#0E7490; color:#fff; border:none; border-radius:8px; padding:8px; font-size:12px; font-weight:700; cursor:pointer;">&#128190; Guardar Sync (${syncVal >= 0 ? "+" : ""}${syncVal}s)</button>`
            : `<button type="button" onclick="fixReportedItem('${safeId}', '${safeTitle}')" style="flex:1; background:#14748E; color:#fff; border:none; border-radius:8px; padding:8px; font-size:12px; font-weight:700; cursor:pointer;">&#128295; Arreglar</button>`;
        const noteHtml = (!isSync && noteStr)
            ? `<div style="font-size:12px; color:#CBD5E1; margin-bottom:8px;">Nota: ${noteStr}</div>`
            : "";
        return `<div style="background:#0A0B0E; border:1px solid #232730; border-radius:12px; padding:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:4px;">
                <strong style="font-size:14px; color:#F8FAFC;">${r.title || "Sin título"}</strong>
                <span style="font-size:10px; color:#94A3B8;">${dt}</span>
            </div>
            <div style="font-size:12.5px; color:#38BDF8; font-weight:600; margin-bottom:4px;">${r.reason || ""}</div>
            ${noteHtml}
            <div style="display:flex; gap:8px; margin-top:8px;">
                ${primaryBtn}
                <button type="button" onclick="resolveCmsReport('${safeRepId}')" style="background:#1A1E26; color:#4ADE80; border:1px solid #232730; border-radius:8px; padding:8px 12px; font-size:12px; font-weight:700; cursor:pointer;">&#10003; Listo</button>
            </div>
        </div>`;
    }).join("");
}

function findCatalogItemForReport(itemId, title) {
    const items = (typeof currentDb !== "undefined" && Array.isArray(currentDb.items))
        ? currentDb.items
        : (typeof catalog !== "undefined" && Array.isArray(catalog) ? catalog : []);
    const cleanTitle = String(title || "").trim().toLowerCase();
    return items.find(i => itemId && String(i.id) === String(itemId))
        || items.find(i => String(i.title || "").trim().toLowerCase() === cleanTitle)
        || items.find(i => cleanTitle && cleanTitle.startsWith(String(i.title || "").trim().toLowerCase()));
}

async function applyCmsSyncReport(repId, itemId, title, offsetVal, btn) {
    const found = findCatalogItemForReport(itemId, title);
    if (!found) {
        alert("No se encontró '" + title + "' en el catálogo cargado.");
        return;
    }
    const origText = btn ? btn.innerHTML : "";
    if (btn) { btn.disabled = true; btn.textContent = "Guardando en GitHub..."; }
    try {
        found.subtitleOffset = Number(offsetVal);
        if (typeof pushDatabaseToCloudAndServer === "function") {
            await pushDatabaseToCloudAndServer();
        }
        if (typeof renderAdminList === "function") {
            renderAdminList();
        }
        await resolveCmsReport(repId);
    } catch (e) {
        if (btn) { btn.disabled = false; btn.innerHTML = origText; }
        alert("Error al guardar la sincronización en GitHub.");
    }
}

function fixReportedItem(itemId, title) {
    closeCmsNotifModal();
    const found = findCatalogItemForReport(itemId, title);
    const targetId = found ? found.id : itemId;
    if (typeof editCatalogItem === "function" && targetId) {
        editCatalogItem(targetId);
        window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
        alert("No se encontró el título en el catálogo cargado. Asegúrate de tener el catálogo sincronizado.");
    }
}

async function resolveCmsReport(repId) {
    try {
        await fetch(CMS_REPORT_API + "?action=delete&id=" + encodeURIComponent(repId));
        __cmsReports = __cmsReports.filter(r => String(r.id) !== String(repId));
        const badge = document.getElementById("cmsNotifBadge");
        if (badge) {
            badge.textContent = __cmsReports.length;
            badge.style.display = __cmsReports.length > 0 ? "inline-block" : "none";
        }
        renderCmsReportsList();
    } catch (e) {
        alert("No se pudo marcar como resuelto.");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => loadCmsReports(false), 1200);
});
