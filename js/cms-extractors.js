(function () {
  const OWNER = "alfajossems-prog";
  const REPO = "gatoplay-db";
  const PATH = "app_config.json";
  const API_URL = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;

  let currentSha = null;
  let currentCfg = null;

  function getToken() {
    return localStorage.getItem("gh_token") || "";
  }

  function setStatus(msg, isErr) {
    const el = document.getElementById("ext-status");
    if (!el) return;
    el.textContent = msg;
    el.style.color = isErr ? "#f87171" : "#34d399";
  }

  async function loadExtractorsConfig() {
    const token = getToken();
    if (!token) {
      setStatus("⚠️ Inicia sesión primero para cargar la configuración.", true);
      return;
    }
    setStatus("Cargando estado desde la nube...", false);
    try {
      const res = await fetch(API_URL + "?t=" + Date.now(), {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json"
        }
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      currentSha = data.sha;
      const decoded = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ""))));
      currentCfg = JSON.parse(decoded);
      const ex = currentCfg.extractors || {};

      document.getElementById("ext-streamtape").checked = ex.streamtape !== false;
      document.getElementById("ext-doodstream").checked = ex.doodstream !== false;
      document.getElementById("ext-vimeos").checked = ex.vimeos !== false;
      document.getElementById("ext-filemoon").checked = ex.filemoon !== false;

      setStatus("✓ Sincronizado con la nube.", false);
    } catch (e) {
      setStatus("❌ Error al cargar: " + e.message, true);
    }
  }

  async function saveExtractorsConfig() {
    const token = getToken();
    if (!token || !currentCfg || !currentSha) {
      setStatus("⚠️ Primero espera a que cargue la configuración.", true);
      return;
    }
    setStatus("Guardando cambios en la nube...", false);
    try {
      currentCfg.extractors = {
        streamtape: document.getElementById("ext-streamtape").checked,
        doodstream: document.getElementById("ext-doodstream").checked,
        vimeos: document.getElementById("ext-vimeos").checked,
        filemoon: document.getElementById("ext-filemoon").checked
      };
      const contentB64 = btoa(unescape(encodeURIComponent(JSON.stringify(currentCfg, null, 2))));
      const res = await fetch(API_URL, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: "feat(cms): actualizar estado de extractores activos",
          content: contentB64,
          sha: currentSha
        })
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const updated = await res.json();
      currentSha = updated.content.sha;
      setStatus("✓ Guardado. Las apps aplicarán los cambios al abrir.", false);
    } catch (e) {
      setStatus("❌ Error al guardar: " + e.message, true);
    }
  }

  window.openExtractorsModal = function () {
    const modal = document.getElementById("extractors-modal");
    if (modal) {
      modal.style.display = "flex";
      loadExtractorsConfig();
    }
  };

  window.closeExtractorsModal = function () {
    const modal = document.getElementById("extractors-modal");
    if (modal) modal.style.display = "none";
  };

  window.saveExtractorsConfig = saveExtractorsConfig;
})();
