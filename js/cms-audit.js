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

    // 1. Capturar contraseña exacta del admin (GatoPlay o Mauricio) en login
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
      // 2. Registrar carga remota
      if (urlStr.includes(WORKER + "/remote") && method === "POST" && res.ok) {
        const body = JSON.parse(init.body || "{}");
        const srvs = Array.isArray(body.servers) ? body.servers.join(", ") : "";
        const name = (body.url || "").split("/").pop() || "Carga remota";
        sendAudit("remote_upload", name, srvs);
      }

      // 3. Registrar subida directa de archivo
      if (urlStr.includes(WORKER + "/upload-url") && res.ok) {
        const u = new URL(urlStr, location.origin);
        const srv = u.searchParams.get("server") || "";
        const fileInput = document.querySelector('input[type="file"]');
        const file = fileInput?.files?.[0];
        const fname = file?.name || "Archivo de video";
        const fsize = file?.size ? (file.size / (1024 * 1024)).toFixed(1) + " MB" : "";
        sendAudit("upload_file", fname, srv, fsize);
      }

      // 4. Registrar título agregado/editado en catalogo.json
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

  // Botón directo a Panel Pro en admin.html
  window.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("btnGatoProDash")) return;
    const a = document.createElement("a");
    a.id = "btnGatoProDash";
    a.href = "dashboard.html";
    a.textContent = "📊 Panel Pro";
    Object.assign(a.style, {
      position: "fixed",
      bottom: "16px",
      right: "16px",
      zIndex: "9999",
      background: "#0E5A6F",
      color: "#fff",
      padding: "10px 15px",
      borderRadius: "999px",
      fontSize: "13px",
      fontWeight: "700",
      textDecoration: "none",
      border: "1px solid #14748E",
      boxShadow: "0 6px 18px rgba(0,0,0,0.45)",
    });
    document.body.appendChild(a);
  });
})();
