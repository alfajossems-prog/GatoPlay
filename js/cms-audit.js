(function () {
  const WORKER = "https://gato-uploader.josseanm.workers.dev";
  const origFetch = window.fetch.bind(window);

  function getAdminPass() {
    return (
      localStorage.getItem("gato_admin_pass") ||
      localStorage.getItem("gato_worker_pass") ||
      ""
    );
  }

  function sendAudit(action, targetName, server = "", sizeInfo = "") {
    const pass = getAdminPass();
    if (!pass) return;
    origFetch(WORKER + "/admin/audit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Pass": pass,
      },
      body: JSON.stringify({
        action,
        target_name: targetName || "Sin nombre",
        server,
        size_info: sizeInfo,
      }),
    }).catch(() => {});
  }

  window.fetch = async function (input, init = {}) {
    const urlStr = typeof input === "string" ? input : (input?.url || "");
    const method = (init?.method || "GET").toUpperCase();

    if (urlStr.includes("/panel-config")) {
      const hdrPass =
        init?.headers?.["X-Panel-Pass"] ||
        init?.headers?.["x-panel-pass"] ||
        new URL(urlStr, location.origin).searchParams.get("p") ||
        "";
      if (hdrPass) localStorage.setItem("gato_admin_pass", hdrPass);
    }

    const res = await origFetch(input, init);

    try {
      if (urlStr.includes(WORKER + "/remote") && method === "POST" && res.ok) {
        const body = JSON.parse(init.body || "{}");
        const srvs = Array.isArray(body.servers) ? body.servers.join(", ") : "";
        const name = (body.url || "").split("/").pop() || "Carga remota";
        sendAudit("remote_upload", name, srvs);
      }

      if (urlStr.includes(WORKER + "/upload-url") && res.ok) {
        const u = new URL(urlStr, location.origin);
        const srv = u.searchParams.get("server") || "";
        const fileInput = document.querySelector('input[type="file"]');
        const file = fileInput?.files?.[0];
        const fname = file?.name || "Archivo de video";
        const fsize = file?.size ? (file.size / (1024 * 1024)).toFixed(1) + " MB" : "";
        sendAudit("upload_file", fname, srv, fsize);
      }

      if (
        urlStr.includes("api.github.com/repos/alfajossems-prog/gatoplay-db/contents/catalogo.json") &&
        method === "PUT" &&
        res.ok
      ) {
        const titleEl = document.getElementById("fTitle") || document.querySelector('input[placeholder*="Título"]');
        const title = titleEl?.value?.trim() || "Actualización de catálogo";
        sendAudit("add_title", title, "github");
      }
    } catch (_) {}

    return res;
  };

  // Insertar botón "Panel Pro" dentro del menú desplegable (debajo de Notificaciones)
  function injectMenuButton() {
    if (document.getElementById("menuBtnPanelPro")) return;
    const candidates = Array.from(document.querySelectorAll("button, a, div[onclick]"));
    const notifBtn = candidates.find(
      (el) => el.textContent && el.textContent.trim() === "Notificaciones"
    );
    if (!notifBtn || !notifBtn.parentElement) return;

    const btn = document.createElement("button");
    btn.id = "menuBtnPanelPro";
    btn.type = "button";
    btn.className = notifBtn.className;
    btn.style.cssText = notifBtn.style.cssText;
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
      </svg>
      <span>Panel Pro</span>
    `;
    btn.onclick = () => {
      window.location.href = "dashboard.html";
    };

    notifBtn.insertAdjacentElement("afterend", btn);
  }

  window.addEventListener("DOMContentLoaded", () => {
    injectMenuButton();
    setTimeout(injectMenuButton, 600);
  });
})();
