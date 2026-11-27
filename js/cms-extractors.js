(function () {
  const OWNER = "alfajossems-prog";
  const REPO = "gatoplay-db";
  const PATH = "app_config.json";
  const API_URL = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;

  const SVG_ZAP = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`;

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

  function ensureModal() {
    if (document.getElementById("extractors-modal")) return;
    const wrap = document.createElement("div");
    wrap.id = "extractors-modal";
    wrap.style.cssText = "display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.78);align-items:center;justify-content:center;padding:16px;";
    wrap.innerHTML = `
      <div style="width:100%;max-width:420px;background:#121418;border:1px solid #232730;border-radius:16px;padding:20px;color:#fff;box-shadow:0 20px 50px rgba(0,0,0,0.6);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h3 style="margin:0;font-size:18px;color:#fff;display:flex;align-items:center;gap:8px;">${SVG_ZAP} Extractores Activos</h3>
          <button type="button" id="ext-close-btn" style="background:#1f242d;border:1px solid #232730;color:#fff;width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:16px;">✕</button>
        </div>
        <p id="ext-status" style="font-size:13px;color:#9ca3af;margin:0 0 14px 0;">Cargando...</p>
        <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:18px;">
          <label style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:#0A0B0E;border:1px solid #232730;border-radius:10px;cursor:pointer;">
            <span>Streamtape</span>
            <input id="ext-streamtape" type="checkbox" checked style="width:18px;height:18px;accent-color:#14748E;">
          </label>
          <label style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:#0A0B0E;border:1px solid #232730;border-radius:10px;cursor:pointer;">
            <span>Doodstream / Playmogo</span>
            <input id="ext-doodstream" type="checkbox" checked style="width:18px;height:18px;accent-color:#14748E;">
          </label>
          <label style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:#0A0B0E;border:1px solid #232730;border-radius:10px;cursor:pointer;">
            <span>Vimeos</span>
            <input id="ext-vimeos" type="checkbox" checked style="width:18px;height:18px;accent-color:#14748E;">
          </label>
          <label style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:#0A0B0E;border:1px solid #232730;border-radius:10px;cursor:pointer;">
            <span>Filemoon</span>
            <input id="ext-filemoon" type="checkbox" checked style="width:18px;height:18px;accent-color:#14748E;">
          </label>
        </div>
        <button type="button" id="ext-save-btn" style="width:100%;padding:12px;border:none;border-radius:10px;background:#0E5A6F;color:#fff;font-weight:700;font-size:14px;cursor:pointer;">GUARDAR EXTRACTORES EN LA NUBE</button>
      </div>
    `;
    document.body.appendChild(wrap);
    wrap.addEventListener("click", (e) => {
      if (e.target === wrap) closeExtractorsModal();
    });
    document.getElementById("ext-close-btn").onclick = closeExtractorsModal;
    document.getElementById("ext-save-btn").onclick = saveExtractorsConfig;
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

  function openExtractorsModal() {
    ensureModal();
    const modal = document.getElementById("extractors-modal");
    if (modal) {
      modal.style.display = "flex";
      loadExtractorsConfig();
    }
  }

  function closeExtractorsModal() {
    const modal = document.getElementById("extractors-modal");
    if (modal) modal.style.display = "none";
  }

  function injectExtractorsMenuButton() {
    if (document.getElementById("menuBtnExtractores")) return;
    const anchor =
      document.getElementById("menuBtnPanelPro") ||
      Array.from(document.querySelectorAll("button, a, div[onclick]")).find(
        (el) => el.textContent && el.textContent.trim() === "Notificaciones"
      );
    if (!anchor || !anchor.parentElement) return;

    const btn = document.createElement("button");
    btn.id = "menuBtnExtractores";
    btn.type = "button";
    btn.className = anchor.className;
    btn.innerHTML = `${SVG_ZAP}<span>Extractores</span>`;
    btn.onclick = () => {
      document.body.click();
      openExtractorsModal();
    };
    anchor.insertAdjacentElement("afterend", btn);
  }

  const observer = new MutationObserver(() => injectExtractorsMenuButton());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("DOMContentLoaded", injectExtractorsMenuButton);
  setTimeout(injectExtractorsMenuButton, 600);

  window.openExtractorsModal = openExtractorsModal;
  window.closeExtractorsModal = closeExtractorsModal;
})();
