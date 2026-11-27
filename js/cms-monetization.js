// ============================================================================
// GATO CMS - MÓDULO DE MONETIZACIÓN (UNITY ADS + PREMIUM MENSUAL)
// ============================================================================
(function () {
  const OWNER = "alfajossems-prog";
  const REPO = "gatoplay-db";
  const CONFIG_PATH = "app_config.json";
  const LICENSES_PATH = "licenses.json";

  let configSha = "";
  let licensesSha = "";
  let licensesList = [];

  function getToken() {
    return (localStorage.getItem("gh_token") || "").trim();
  }

  function setStatus(msg, isError = false) {
    const el = document.getElementById("monStatus");
    if (!el) return;
    el.textContent = msg;
    el.style.color = isError ? "#ff6b6b" : "#38d9a9";
  }

  async function ghGetFile(path) {
    const token = getToken();
    if (!token) throw new Error("Falta gh_token en localStorage. Inicia sesión primero.");
    const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?t=${Date.now()}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github+json"
      }
    });
    if (res.status === 404) return { exists: false, sha: "", data: null };
    if (!res.ok) throw new Error(`GitHub GET ${path} falló (HTTP ${res.status})`);
    const json = await res.json();
    const decoded = decodeURIComponent(escape(atob(json.content.replace(/\n/g, ""))));
    return { exists: true, sha: json.sha, data: JSON.parse(decoded) };
  }

  async function ghPutFile(path, dataObj, sha, message) {
    const token = getToken();
    if (!token) throw new Error("Falta gh_token en localStorage.");
    const rawStr = JSON.stringify(dataObj, null, 2);
    const b64 = btoa(unescape(encodeURIComponent(rawStr)));
    const body = { message, content: b64 };
    if (sha) body.sha = sha;

    const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`GitHub PUT ${path} falló (HTTP ${res.status})`);
    const out = await res.json();
    return out.content?.sha || "";
  }

  window.monLoadAll = async function () {
    setStatus("Cargando configuración de monetización...");
    try {
      const cfg = await ghGetFile(CONFIG_PATH);
      if (cfg.exists && cfg.data) {
        configSha = cfg.sha;
        const d = cfg.data;
        document.getElementById("monAdsEnabled").checked = !!d.ads_enabled;
        document.getElementById("monTestMode").checked = !!d.unity_test_mode;
        document.getElementById("monGameId").value = d.unity_game_id || "";
        document.getElementById("monInterstitialId").value = d.interstitial_placement || "Interstitial_Android";
        document.getElementById("monRewardedId").value = d.rewarded_placement || "Rewarded_Android";
        document.getElementById("monPreroll").checked = !!d.preroll_enabled;
        document.getElementById("monMidroll").checked = !!d.midroll_enabled;
        document.getElementById("monMidrollMin").value = d.midroll_interval_min ?? 35;
        document.getElementById("monCooldownMin").value = d.cooldown_min ?? 10;
        document.getElementById("monRewardedDownload").checked = !!d.rewarded_for_download;
        document.getElementById("monPremiumEnabled").checked = !!d.premium_enabled;
        document.getElementById("monPremiumPrice").value = d.premium_price_text || "$49 MXN / mes";
        document.getElementById("monPremiumUrl").value = d.premium_contact_url || "";
      }

      const lic = await ghGetFile(LICENSES_PATH);
      licensesSha = lic.exists ? lic.sha : "";
      licensesList = (lic.exists && Array.isArray(lic.data)) ? lic.data : [];
      renderLicenses();
      setStatus("✓ Configuración sincronizada con la nube.");
    } catch (e) {
      setStatus("❌ " + e.message, true);
    }
  };

  window.monSaveConfig = async function () {
    setStatus("Guardando app_config.json en la nube...");
    try {
      const payload = {
        ads_enabled: document.getElementById("monAdsEnabled").checked,
        unity_game_id: document.getElementById("monGameId").value.trim(),
        unity_test_mode: document.getElementById("monTestMode").checked,
        interstitial_placement: document.getElementById("monInterstitialId").value.trim() || "Interstitial_Android",
        rewarded_placement: document.getElementById("monRewardedId").value.trim() || "Rewarded_Android",
        preroll_enabled: document.getElementById("monPreroll").checked,
        midroll_enabled: document.getElementById("monMidroll").checked,
        midroll_interval_min: Math.max(5, parseInt(document.getElementById("monMidrollMin").value, 10) || 35),
        cooldown_min: Math.max(1, parseInt(document.getElementById("monCooldownMin").value, 10) || 10),
        rewarded_for_download: document.getElementById("monRewardedDownload").checked,
        premium_enabled: document.getElementById("monPremiumEnabled").checked,
        premium_price_text: document.getElementById("monPremiumPrice").value.trim() || "$49 MXN / mes",
        premium_contact_url: document.getElementById("monPremiumUrl").value.trim()
      };
      configSha = await ghPutFile(CONFIG_PATH, payload, configSha, "cms: actualizar app_config.json");
      setStatus("✓ Cambios guardados. Las apps se actualizarán al instante.");
    } catch (e) {
      setStatus("❌ " + e.message, true);
    }
  };

  function generateCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const part = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    return `GP-${part()}-${part()}`;
  }

  window.monCreateLicense = async function () {
    const days = Math.max(1, parseInt(document.getElementById("monLicDays").value, 10) || 30);
    const note = (document.getElementById("monLicNote").value || "").trim();
    const exp = new Date(Date.now() + days * 86400000).toISOString();
    const newLic = {
      code: generateCode(),
      note,
      status: "active",
      device_id: "",
      created_at: new Date().toISOString(),
      expires_at: exp
    };
    licensesList.unshift(newLic);
    setStatus("Creando clave Premium en la nube...");
    try {
      licensesSha = await ghPutFile(LICENSES_PATH, licensesList, licensesSha, `cms: crear licencia ${newLic.code}`);
      document.getElementById("monLicNote").value = "";
      renderLicenses();
      setStatus(`✓ Clave creada: ${newLic.code}`);
    } catch (e) {
      licensesList.shift();
      setStatus("❌ " + e.message, true);
    }
  };

  window.monToggleLicense = async function (idx) {
    const item = licensesList[idx];
    if (!item) return;
    item.status = item.status === "active" ? "revoked" : "active";
    try {
      licensesSha = await ghPutFile(LICENSES_PATH, licensesList, licensesSha, `cms: estado licencia ${item.code}`);
      renderLicenses();
      setStatus(`✓ Clave ${item.code} ahora está ${item.status}.`);
    } catch (e) {
      setStatus("❌ " + e.message, true);
    }
  };

  function renderLicenses() {
    const box = document.getElementById("monLicensesList");
    if (!box) return;
    if (!licensesList.length) {
      box.innerHTML = `<div style="opacity:.6;font-size:13px;">Aún no hay claves Premium creadas.</div>`;
      return;
    }
    box.innerHTML = licensesList.map((l, i) => {
      const expDate = (l.expires_at || "").slice(0, 10);
      const isAct = l.status === "active";
      return `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;border:1px solid #232730;border-radius:8px;margin-bottom:8px;background:#0A0B0E;">
          <div>
            <div style="font-weight:700;color:#14748E;letter-spacing:.5px;">${l.code}</div>
            <div style="font-size:12px;opacity:.75;">${l.note || "Sin nota"} · Vence: ${expDate} · ${l.device_id ? "Vinculada" : "Libre"}</div>
          </div>
          <button type="button" onclick="monToggleLicense(${i})" style="padding:6px 10px;border-radius:6px;border:none;cursor:pointer;font-size:12px;background:${isAct ? "#2b1d1d" : "#12352c"};color:${isAct ? "#ff6b6b" : "#38d9a9"};">
            ${isAct ? "Desactivar" : "Reactivar"}
          </button>
        </div>
      `;
    }).join("");
  }
})();
