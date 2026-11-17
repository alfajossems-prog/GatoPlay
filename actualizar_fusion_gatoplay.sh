#!/data/data/com.termux/files/usr/bin/bash
set -e

WEB_DIR="$HOME/GatoPlayWeb"
SHARED_WEB="$HOME/storage/shared/GatoPlayWeb_UI"
APP_UI_DIR="$HOME/MiReproductorVLC/app/src/main/assets/ui"
SHARED_APP_UI="$HOME/storage/shared/MiReproductorVLC_UI"

mkdir -p "$WEB_DIR/public"
mkdir -p "$WEB_DIR/data"
mkdir -p "$SHARED_WEB"

echo "=========================================================="
echo " APLICANDO FUSIÓN UI: NETFLIX + HBO MAX + PRIME (ANTI-COPYRIGHT)"
echo "=========================================================="

# 1. Actualizar styles.css (Fusión visual OLED Black + HBO Glass + Netflix Top 10 & Hero)
cat << 'EOT' > "$WEB_DIR/public/styles.css"
:root {
    --bg-oled: #000000;
    --bg-surface: #0b0e14;
    --bg-elevated: #151a24;
    --bg-glass: rgba(18, 23, 33, 0.78);
    --brand-accent: #00c2ff;
    --brand-gradient: linear-gradient(135deg, #00c2ff 0%, #3b82f6 55%, #6366f1 100%);
    --match-green: #46d369;
    --amber-star: #fbbf24;
    --danger-red: #ef4444;
    --text-white: #ffffff;
    --text-dim: #94a3b8;
    --border-glass: rgba(255, 255, 255, 0.12);
}

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-tap-highlight-color: transparent;
}

body {
    background-color: var(--bg-oled);
    background-image: radial-gradient(circle at 50% 0%, rgba(30, 41, 82, 0.32) 0%, rgba(0, 0, 0, 1) 55%);
    color: var(--text-white);
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, sans-serif;
    min-height: 100vh;
    padding-top: 104px;
    padding-bottom: 76px;
    overflow-x: hidden;
}

.hidden { display: none !important; }

/* CABECERA GLASSMORPHISM (ESTILO HBO MAX / NETFLIX MOBILE) */
.top-header {
    position: fixed;
    top: 0; left: 0; right: 0;
    background: linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.78) 100%);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    z-index: 120;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.header-main {
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    gap: 8px;
}

.brand-logo {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 17px;
    font-weight: 900;
    letter-spacing: 0.7px;
    color: var(--text-white);
    text-decoration: none;
    flex-shrink: 0;
}

.brand-logo svg {
    width: 25px;
    height: 25px;
    stroke: var(--brand-accent);
}

.brand-logo b {
    background: var(--brand-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.header-tools {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    justify-content: flex-end;
}

.search-input-wrap {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 999px;
    padding: 6px 12px;
    display: flex;
    align-items: center;
    max-width: 170px;
    width: 100%;
}

.search-input-wrap input {
    background: transparent;
    border: none;
    color: #fff;
    font-size: 12.5px;
    width: 100%;
    outline: none;
}

.btn-top-link {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.18);
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 11.5px;
    font-weight: 700;
    text-decoration: none;
    white-space: nowrap;
}

/* BARRA DE PÍLDORAS DE NAVEGACIÓN */
.nav-pills-bar {
    display: flex;
    gap: 8px;
    padding: 2px 16px 10px;
    overflow-x: auto;
}
.nav-pills-bar::-webkit-scrollbar { display: none; }

.top-pill {
    background: rgba(255, 255, 255, 0.06);
    color: #cbd5e1;
    border: 1px solid rgba(255, 255, 255, 0.14);
    padding: 6px 15px;
    border-radius: 999px;
    font-size: 12.5px;
    font-weight: 700;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.2s ease;
}

.top-pill.active {
    background: var(--brand-gradient);
    color: #ffffff;
    border-color: transparent;
    box-shadow: 0 4px 14px rgba(0, 194, 255, 0.3);
}

/* ========================================================= */
/* PORTADA FUSIÓN (NETFLIX SHOWCASE + HBO GRADIENT + SCROLL) */
/* ========================================================= */
.hero-carousel-wrap {
    position: relative;
    margin: 4px 0 22px;
}

.hero-slider {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    gap: 12px;
    padding: 0 16px;
}
.hero-slider::-webkit-scrollbar { display: none; }

.hero-slide {
    flex: 0 0 100%;
    height: 350px;
    border-radius: 18px;
    background-color: var(--bg-surface);
    background-size: cover;
    background-position: center top;
    position: relative;
    overflow: hidden;
    scroll-snap-align: center;
    box-shadow: 0 14px 34px rgba(0, 0, 0, 0.85);
}

.hero-slide-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.92) 85%, #000000 100%);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    text-align: center;
    padding: 20px 16px 18px;
}

.hero-type-pill {
    background: rgba(0, 194, 255, 0.18);
    border: 1px solid rgba(0, 194, 255, 0.45);
    color: #7dd3fc;
    font-size: 9.5px;
    font-weight: 900;
    letter-spacing: 1.4px;
    padding: 3px 10px;
    border-radius: 999px;
    text-transform: uppercase;
    margin-bottom: 8px;
}

.hero-slide-title {
    font-size: 27px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    line-height: 1.08;
    margin-bottom: 8px;
    text-shadow: 0 4px 16px rgba(0, 0, 0, 0.95);
    max-width: 92%;
}

.hero-genres-row {
    font-size: 12px;
    font-weight: 600;
    color: #cbd5e1;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    flex-wrap: wrap;
}

.hero-dot-sep {
    color: var(--brand-accent);
    font-weight: 900;
}

/* BOTONES RÁPIDOS DE PORTADA ESTILO NETFLIX (+ MI LISTA | REPRODUCIR | INFO) */
.hero-quick-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 18px;
    width: 100%;
    max-width: 320px;
}

.hero-side-btn {
    background: none;
    border: none;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    min-width: 64px;
}

.hero-side-btn span.icon-circle {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.22);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
}

.hero-play-main {
    background: #ffffff;
    color: #000000;
    border: none;
    padding: 10px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 900;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(255, 255, 255, 0.2);
}

/* INDICADORES DE BARRA (ESTILO HBO MAX) */
.hero-dots {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
    margin-top: 12px;
}

.hero-dot {
    width: 14px;
    height: 3px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.25);
    transition: all 0.25s ease;
    cursor: pointer;
}

.hero-dot.active {
    width: 28px;
    background: var(--brand-accent);
}

/* ========================================================= */
/* FILA CONTINUAR VIENDO                                     */
/* ========================================================= */
.cw-card {
    flex: 0 0 210px;
    scroll-snap-align: start;
    cursor: pointer;
}

.cw-thumb {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: 10px;
    overflow: hidden;
    background: var(--bg-surface);
}

.cw-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.cw-play-badge {
    position: absolute;
    inset: 0;
    margin: auto;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.72);
    border: 1.5px solid #fff;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
}

.cw-type-chip {
    position: absolute;
    top: 6px;
    right: 6px;
    background: rgba(0, 0, 0, 0.75);
    color: #fff;
    font-size: 8.5px;
    font-weight: 900;
    padding: 2px 6px;
    border-radius: 4px;
    letter-spacing: 0.4px;
}

.cw-progress-track {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 4px;
    background: rgba(255, 255, 255, 0.25);
}

.cw-progress-bar {
    height: 100%;
    background: var(--brand-gradient);
}

.cw-meta-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 2px 0;
    color: #cbd5e1;
    font-size: 11.5px;
    font-weight: 600;
}

.cw-meta-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.cw-remove-btn {
    background: none;
    border: none;
    color: var(--text-dim);
    font-size: 15px;
    padding: 0 4px;
    cursor: pointer;
}

/* ========================================================= */
/* FILA TOP 10 ESTILO NETFLIX CON NÚMEROS GIGANTES           */
/* ========================================================= */
.top10-card {
    flex: 0 0 155px;
    scroll-snap-align: start;
    display: flex;
    align-items: flex-end;
    position: relative;
    cursor: pointer;
    padding-left: 34px;
}

.top10-number {
    position: absolute;
    left: 0;
    bottom: -10px;
    font-size: 98px;
    font-weight: 900;
    line-height: 0.82;
    color: #000000;
    -webkit-text-stroke: 2.5px rgba(255, 255, 255, 0.75);
    z-index: 1;
    user-select: none;
    letter-spacing: -6px;
}

.top10-card .card-poster {
    position: relative;
    z-index: 2;
    width: 100%;
    box-shadow: -6px 4px 16px rgba(0, 0, 0, 0.85);
}

/* ========================================================= */
/* CARRUSELES Y TARJETAS CON BADGE "MOVIE" O "SERIE"         */
/* ========================================================= */
.catalog-row {
    margin-bottom: 24px;
}

.row-header {
    padding: 0 16px 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.row-header h3 {
    font-size: 16px;
    font-weight: 800;
    letter-spacing: 0.2px;
    color: #ffffff;
    display: flex;
    align-items: center;
    gap: 6px;
}

.row-chevron {
    color: var(--brand-accent);
    font-weight: 800;
    font-size: 15px;
}

.row-scroller {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding: 0 16px 4px;
    scroll-snap-type: x mandatory;
}
.row-scroller::-webkit-scrollbar { display: none; }

.media-card {
    flex: 0 0 122px;
    scroll-snap-align: start;
    background: transparent;
    border-radius: 10px;
    overflow: hidden;
    border: none !important;
    cursor: pointer;
    transition: transform 0.18s ease;
}
.media-card:active {
    transform: scale(0.96);
}

.card-poster {
    position: relative;
    width: 100%;
    aspect-ratio: 2 / 3;
    border-radius: 10px;
    overflow: hidden;
    background: var(--bg-surface);
    border: none !important;
}

.card-poster img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    color: transparent;
}

/* ETIQUETA "MOVIE" O "SERIE" EN LUGAR DE PRIME */
.card-type-badge {
    position: absolute;
    bottom: 6px;
    right: 6px;
    background: rgba(0, 0, 0, 0.78);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #ffffff;
    font-size: 8.5px;
    font-weight: 900;
    padding: 2px 6px;
    border-radius: 4px;
    letter-spacing: 0.6px;
    text-transform: uppercase;
}

.card-type-badge.is-series {
    border-color: rgba(0, 194, 255, 0.55);
    color: #7dd3fc;
}

.card-badge-new {
    position: absolute;
    top: 6px;
    left: 6px;
    background: #e50914;
    color: #ffffff;
    font-size: 8px;
    font-weight: 900;
    padding: 2px 6px;
    border-radius: 3px;
    text-transform: uppercase;
    letter-spacing: 0.4px;
}

/* ========================================================= */
/* VISTA PREVIA FUSIÓN (NETFLIX + HBO MAX + PRIME)           */
/* ========================================================= */
.prime-detail-overlay {
    position: fixed;
    inset: 0;
    background: var(--bg-oled);
    z-index: 250;
    overflow-y: auto;
    padding-bottom: 40px;
    animation: fadeInModal 0.2s ease;
}

@keyframes fadeInModal {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
}

.prime-detail-hero {
    position: relative;
    width: 100%;
    height: 310px;
    background-size: cover;
    background-position: center top;
    background-color: var(--bg-surface);
}

.prime-detail-hero-grad {
    position: absolute;
    inset: 0;
    background: linear-gradient(0deg, #000000 4%, rgba(0, 0, 0, 0.45) 55%, rgba(0, 0, 0, 0.3) 100%);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 16px 18px 12px;
}

.prime-back-btn {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: rgba(15, 20, 30, 0.7);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.15);
    color: #ffffff;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.prime-detail-title-wrap {
    margin-top: auto;
}

/* REEMPLAZO DE LA PALABRA PRIME POR EL BADGE DE MOVIE / SERIE */
.modal-content-type-badge {
    display: inline-block;
    background: var(--brand-gradient);
    color: #ffffff;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 1.2px;
    padding: 3px 9px;
    border-radius: 4px;
    text-transform: uppercase;
    margin-bottom: 6px;
}

.prime-detail-title {
    font-size: 28px;
    font-weight: 900;
    line-height: 1.08;
    letter-spacing: 0.3px;
    text-transform: uppercase;
    margin-bottom: 6px;
    text-shadow: 0 4px 15px rgba(0, 0, 0, 0.95);
}

/* FILA DE METADATOS ESTILO NETFLIX + HBO (98% PARA TI • AÑO • 4K • LATINO) */
.fusion-meta-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 14px;
    font-size: 12.5px;
    font-weight: 700;
}

.match-score {
    color: var(--match-green);
    font-weight: 800;
}

.tech-badge {
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.22);
    color: #f8fafc;
    font-size: 10px;
    font-weight: 800;
    padding: 2px 6px;
    border-radius: 4px;
}

.prime-detail-body {
    padding: 0 18px;
}

.prime-cta-stack {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 8px 0 14px;
    max-width: 440px;
}

.btn-prime-play-white {
    width: 100%;
    background: #ffffff;
    color: #000000;
    border: none;
    border-radius: 8px;
    padding: 13px 18px;
    font-size: 14.5px;
    font-weight: 900;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    cursor: pointer;
}

.btn-prime-dl-dark {
    width: 100%;
    background: #1c222e;
    color: #ffffff;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    padding: 13px 18px;
    font-size: 14.5px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    cursor: pointer;
}

.clean-options-bar {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
    overflow-x: auto;
}

.clean-opt-pill {
    background: #141a24;
    color: #cbd5e1;
    border: 1px solid rgba(255,255,255,0.12);
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
}
.clean-opt-pill.active {
    background: rgba(0, 194, 255, 0.2);
    color: var(--brand-accent);
    border-color: var(--brand-accent);
}

.prime-actions-scroller {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 6px;
    margin-bottom: 14px;
}
.prime-actions-scroller::-webkit-scrollbar { display: none; }

.prime-action-pill {
    background: rgba(255, 255, 255, 0.07);
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.14);
    padding: 8px 14px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
}

.prime-action-pill.active {
    border-color: var(--brand-accent);
    color: var(--brand-accent);
}

.prime-genres-line {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 12px;
    flex-wrap: wrap;
}

.genre-chip-hbo {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #e2e8f0;
    font-size: 11px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 999px;
}

.prime-synopsis-text {
    font-size: 13.5px;
    color: #cbd5e1;
    line-height: 1.55;
    margin-bottom: 18px;
}

/* PESTAÑAS INFERIORES */
.prime-tabs-header {
    display: flex;
    gap: 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    margin-bottom: 16px;
}

.prime-tab-btn {
    background: none;
    border: none;
    color: var(--text-dim);
    font-size: 14px;
    font-weight: 800;
    padding: 10px 4px;
    border-bottom: 3px solid transparent;
    cursor: pointer;
}

.prime-tab-btn.active {
    color: #ffffff;
    border-bottom-color: var(--brand-accent);
}

.season-select {
    width: 100%;
    max-width: 260px;
    background: #151a24;
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 13.5px;
    font-weight: 700;
    margin-bottom: 12px;
}

.episodes-list { display: flex; flex-direction: column; gap: 10px; }

.ep-card, .srv-row {
    background: #0b0e14;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    padding: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
}

.ep-meta h4, .srv-meta h4 { font-size: 13.5px; margin-bottom: 3px; }
.ep-meta p, .srv-meta p { font-size: 11.5px; color: var(--text-dim); }
.action-pair { display: flex; gap: 6px; flex-shrink: 0; }

/* BOTONES GENERALES */
.btn-cyan {
    background: var(--brand-gradient);
    color: #ffffff;
    border: none;
    padding: 10px 18px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 800;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
}

.btn-surface {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-white);
    border: 1px solid rgba(255, 255, 255, 0.18);
    padding: 10px 15px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
}

.btn-danger {
    background: rgba(239, 68, 68, 0.15);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.4);
    padding: 10px 15px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
}

.btn-play-sm {
    background: #ffffff;
    color: #000000;
    border: none;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
}

.btn-dl-sm {
    background: #1c222e;
    color: #ffffff;
    border: none;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
}

.btn-del-sm {
    background: rgba(239, 68, 68, 0.16);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.35);
    padding: 8px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
}

.empty-catalog-box {
    margin: 24px 16px;
    background: var(--bg-surface);
    border-radius: 16px;
    padding: 36px 20px;
    text-align: center;
    border: 1px solid var(--border-glass);
}
.empty-catalog-box h2 { font-size: 18px; margin-bottom: 8px; }
.empty-catalog-box p { font-size: 13px; color: var(--text-dim); max-width: 360px; margin: 0 auto 18px; line-height: 1.5; }

.full-grid {
    padding: 0 16px 20px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
    gap: 10px;
}
.full-grid .media-card { flex: initial; }

.panel-box {
    margin: 12px 16px;
    background: var(--bg-surface);
    border: 1px solid var(--border-glass);
    border-radius: 12px;
    padding: 14px;
}
.panel-box h3 { font-size: 14px; margin-bottom: 8px; color: var(--brand-accent); }

.input-group-row { display: flex; gap: 8px; margin-top: 8px; }
.input-group-row input, .admin-input {
    width: 100%;
    background: #06080c;
    border: 1px solid rgba(255,255,255,0.14);
    color: #fff;
    padding: 11px 12px;
    border-radius: 8px;
    font-size: 13px;
    outline: none;
}

/* PANEL ADMIN */
.admin-container { max-width: 900px; margin: 0 auto; padding: 12px 14px 60px; }
.admin-card { background: var(--bg-surface); border: 1px solid var(--border-glass); border-radius: 14px; padding: 16px; margin-bottom: 16px; }
.admin-card h2 { font-size: 15.5px; color: var(--brand-accent); margin-bottom: 10px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
.form-full { grid-column: 1 / -1; }
.field-label { display: block; font-size: 11px; color: var(--text-dim); margin-bottom: 4px; font-weight: 600; }
.server-pair-box { background: rgba(0, 0, 0, 0.5); border: 1px solid var(--border-glass); border-radius: 10px; padding: 10px; margin-bottom: 10px; }
.tmdb-results { display: flex; gap: 10px; overflow-x: auto; padding: 10px 0 4px; }
.tmdb-item { flex: 0 0 115px; background: #06080c; border-radius: 8px; overflow: hidden; cursor: pointer; }
.tmdb-item img { width: 100%; height: 155px; object-fit: cover; display: block; }
.tmdb-item p { font-size: 11px; padding: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* DOCK FLOTANTE CRISTAL (ESTILO HBO MAX) */
.bottom-dock {
    position: fixed;
    bottom: 10px; left: 14px; right: 14px;
    height: 58px;
    background: rgba(12, 16, 24, 0.88);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    display: flex;
    justify-content: space-around;
    align-items: center;
    z-index: 120;
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.8);
}

.dock-btn {
    background: none;
    border: none;
    color: var(--text-dim);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    font-size: 10px;
    flex: 1;
    cursor: pointer;
}

.dock-btn svg { width: 19px; height: 19px; stroke: currentColor; fill: none; stroke-width: 2; }
.dock-btn.active { color: var(--brand-accent); font-weight: 800; }
EOT

# 2. Actualizar index.html (Sin ninguna palabra "prime", con diseño Fusión Netflix + HBO + Prime)
cat << 'EOT' > "$WEB_DIR/public/index.html"
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Gato Play</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>

    <header class="top-header">
        <div class="header-main">
            <a href="#" class="brand-logo" onclick="filterTopMenu('all', document.getElementById('pill-all'))">
                <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3.1-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5Z"/>
                    <polygon points="10 11 15 14 10 17 10 11" fill="currentColor" stroke="none"/>
                </svg>
                <span>GATO <b>PLAY</b></span>
            </a>

            <div class="header-tools">
                <div class="search-input-wrap">
                    <input type="text" id="globalSearch" placeholder="Buscar título..." oninput="onSearchInput(this.value)">
                </div>
                <a href="admin.html" id="btnOpenAdmin" class="btn-top-link">+ Panel CMS</a>
            </div>
        </div>

        <nav class="nav-pills-bar">
            <button id="pill-all" class="top-pill active" onclick="filterTopMenu('all', this)">Inicio</button>
            <button id="pill-movies" class="top-pill" onclick="filterTopMenu('movie', this)">Películas</button>
            <button id="pill-series" class="top-pill" onclick="filterTopMenu('series', this)">Series</button>
            <button id="pill-favs" class="top-pill" onclick="filterTopMenu('favs', this)">Mi Lista</button>
        </nav>
    </header>

    <div id="extractorBanner" class="panel-box hidden">
        <span id="extractorMsg">Extrayendo flujo de video limpio sin anuncios...</span>
    </div>

    <!-- VISTA 1: CATÁLOGO FUSIÓN -->
    <main id="view-stream">

        <div id="emptyCatalogState" class="empty-catalog-box hidden">
            <h2>🎬 Tu catálogo está limpio y listo</h2>
            <p>Agrega tus películas o series desde el Panel CMS para activar la portada interactiva, el Top 10 y las categorías.</p>
            <a href="admin.html" class="btn-cyan" style="text-decoration:none;">+ Agregar Contenido</a>
        </div>

        <!-- CARRUSEL DE PORTADA (HERO SLIDER FUSIÓN) -->
        <section id="heroCarouselWrap" class="hero-carousel-wrap hidden">
            <div id="heroSlider" class="hero-slider"></div>
            <div id="heroDots" class="hero-dots"></div>
        </section>

        <!-- FILA: CONTINUAR VIENDO (DEBAJO DE LA PORTADA) -->
        <section id="continueWatchingRow" class="catalog-row hidden">
            <div class="row-header">
                <h3>Continuar viendo</h3>
            </div>
            <div id="continueWatchingScroller" class="row-scroller"></div>
        </section>

        <!-- CARRUSELES DINÁMICOS (INCLUYE TOP 10 Y CATEGORÍAS EN PELÍCULAS/SERIES) -->
        <div id="carouselsContainer"></div>

        <!-- CUADRÍCULA SOLO PARA BÚSQUEDA O MI LISTA -->
        <div id="filteredGridWrap" class="hidden">
            <div class="row-header">
                <h3 id="filteredTitle">Resultados</h3>
            </div>
            <div id="filteredGrid" class="full-grid"></div>
        </div>
    </main>

    <!-- VISTA 2: VIDEOS DEL CELULAR -->
    <section id="view-local" class="hidden">
        <div class="panel-box">
            <h3>Videos en tu Dispositivo</h3>
            <p style="font-size:12px; color:var(--text-dim);">Archivos multimedia escaneados en la memoria de tu teléfono:</p>
        </div>
        <div id="localVideosContainer" style="padding: 0 16px; display:flex; flex-direction:column; gap:10px;"></div>
    </section>

    <!-- VISTA 3: MIS DESCARGAS OFFLINE -->
    <section id="view-downloads" class="hidden">
        <div class="panel-box">
            <h3>Descargas Offline</h3>
            <p style="font-size:12px; color:var(--text-dim);">Películas y capítulos guardados para ver sin internet:</p>
        </div>
        <div id="offlineVideosContainer" style="padding: 0 16px; display:flex; flex-direction:column; gap:10px;"></div>
    </section>

    <!-- VISTA 4: CONECTOR DE API JSON -->
    <section id="view-api" class="hidden">
        <div class="panel-box">
            <h3>Vincular Biblioteca Remota / API JSON</h3>
            <p style="font-size:12px; color:var(--text-dim);">Pega la URL de tu servidor o sincroniza con tu almacenamiento local:</p>
            <div class="input-group-row">
                <input type="text" id="apiInputBox" placeholder="http://192.168.1.X:4000/api/catalogo.json">
                <button class="btn-cyan" onclick="saveAndLoadApi()">Conectar</button>
            </div>
            <div style="display:flex; gap:8px; margin-top:12px; flex-wrap:wrap;">
                <a href="admin.html" class="btn-cyan" style="text-decoration:none;">Ir al Panel CMS</a>
            </div>
        </div>
    </section>

    <!-- ==================================================================== -->
    <!-- VISTA PREVIA FUSIÓN (BADGE MOVIE/SERIE + % MATCH + RELACIONADOS)     -->
    <!-- ==================================================================== -->
    <div id="detailModal" class="prime-detail-overlay hidden">
        <div id="mHeroBackdrop" class="prime-detail-hero">
            <div class="prime-detail-hero-grad">
                <button class="prime-back-btn" onclick="closeModal()">‹</button>
                <div class="prime-detail-title-wrap">
                    <span id="mTypeBadge" class="modal-content-type-badge">MOVIE</span>
                    <h1 id="mTitle" class="prime-detail-title">TÍTULO</h1>
                </div>
            </div>
        </div>

        <div class="prime-detail-body">
            <!-- BARRA DE COINCIDENCIA ESTILO NETFLIX + BADGES HBO MAX -->
            <div class="fusion-meta-bar">
                <span id="mMatchScore" class="match-score">98% Para ti</span>
                <span id="mStatYear">2026</span>
                <span id="mStatQuality" class="tech-badge">1080p</span>
                <span id="mStatLang" class="tech-badge">LATINO</span>
                <span id="mStatRating" style="color:var(--amber-star);">★ 8.8</span>
            </div>

            <!-- BOTONES PRINCIPALES DE REPRODUCCIÓN Y DESCARGA (SIN NOMBRES DE SERVIDORES) -->
            <div class="prime-cta-stack">
                <button id="mBtnMainPlay" class="btn-prime-play-white">▶ Reproducir</button>
                <button id="mBtnMainDownload" class="btn-prime-dl-dark">⬇ Descargar</button>
            </div>

            <!-- SELECTOR LIMPIO SI HAY MÁS DE 1 ENLACE -->
            <div id="mCleanOptionsBar" class="clean-options-bar hidden"></div>

            <!-- BARRA DE PÍLDORAS DE ACCIÓN -->
            <div class="prime-actions-scroller">
                <button id="mBtnTrailer" class="prime-action-pill" onclick="searchTrailerOnYoutube()">🎬 Tráiler</button>
                <button id="mBtnFav" class="prime-action-pill">+ Mi Lista</button>
                <button id="mBtnLike" class="prime-action-pill" onclick="toggleLikeCurrent(this)">👍 Me gusta</button>
                <button class="prime-action-pill" onclick="shareCurrentTitle()">🔗 Compartir</button>
            </div>

            <!-- PÍLDORAS DE GÉNERO Y SINOPSIS -->
            <div id="mGenresLine" class="prime-genres-line"></div>
            <p id="mSynopsis" class="prime-synopsis-text"></p>

            <!-- PESTAÑAS: EPISODIOS / SIMILARES / DETALLES -->
            <div class="prime-tabs-header">
                <button id="tabBtnEpisodes" class="prime-tab-btn hidden" onclick="switchModalTab('episodes')">Episodios</button>
                <button id="tabBtnRelated" class="prime-tab-btn active" onclick="switchModalTab('related')">Similares</button>
                <button id="tabBtnDetails" class="prime-tab-btn" onclick="switchModalTab('details')">Detalles</button>
            </div>

            <!-- CONTENIDO PESTAÑA: SIMILARES -->
            <div id="modalTabRelated">
                <div class="row-header" style="padding-left:0; padding-right:0;">
                    <h3 style="font-size:15px;">Títulos similares recomendados</h3>
                </div>
                <div id="mRelatedScroller" class="row-scroller" style="padding-left:0; padding-right:0;"></div>
            </div>

            <!-- CONTENIDO PESTAÑA: EPISODIOS (SERIES) -->
            <div id="modalTabEpisodes" class="hidden">
                <select id="seasonDropdown" class="season-select" onchange="renderSelectedSeason()"></select>
                <div id="mEpisodesList" class="episodes-list"></div>
            </div>

            <!-- CONTENIDO PESTAÑA: DETALLES -->
            <div id="modalTabDetails" class="hidden" style="color:var(--text-dim); font-size:13px; line-height:1.8;">
                <p><strong style="color:#fff;">Tipo de formato:</strong> <span id="mDetailType">MOVIE</span></p>
                <p><strong style="color:#fff;">Audio disponible:</strong> <span id="mDetailLang">LATINO</span></p>
                <p><strong style="color:#fff;">Resolución máxima:</strong> <span id="mDetailQuality">1080p Full HD</span></p>
                <p><strong style="color:#fff;">Géneros:</strong> <span id="mDetailGenres"></span></p>
            </div>
        </div>
    </div>

    <!-- DOCK FLOTANTE CRISTAL -->
    <nav class="bottom-dock">
        <button id="dock-stream" class="dock-btn active" onclick="switchDock('stream')">
            <svg viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            <span>Inicio</span>
        </button>
        <button id="dock-local" class="dock-btn" onclick="switchDock('local')">
            <svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><polygon points="10 9 15 12 10 15 10 9"/></svg>
            <span>Videos Celular</span>
        </button>
        <button id="dock-downloads" class="dock-btn" onclick="switchDock('downloads')">
            <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>Descargas</span>
        </button>
        <button id="dock-api" class="dock-btn" onclick="switchDock('api')">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <span>API / Fuente</span>
        </button>
    </nav>

    <script src="web-app.js"></script>
</body>
</html>
EOT

# 3. Actualizar web-app.js (Etiquetas MOVIE/SERIE en tarjetas y vista previa, fila Top 10 y Hero Fusión)
cat << 'EOT' > "$WEB_DIR/public/web-app.js"
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

window.FALLBACK_POSTER = "data:image/svg+xml;utf8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
  <rect width="400" height="600" fill="#0b0e14"/>
  <circle cx="200" cy="260" r="46" fill="#151a24" stroke="#00c2ff" stroke-width="3"/>
  <polygon points="188,238 226,260 188,282" fill="#00c2ff"/>
  <text x="200" y="345" fill="#94a3b8" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle">GATO PLAY</text>
</svg>`);

function getApiBase() {
    if (window.location.port === "4000") return "";
    return "http://localhost:4000";
}

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

async function loadBestAvailableCatalog() {
    const cachedRaw = localStorage.getItem(STORAGE_KEY);
    let cachedData = null;
    if (cachedRaw) {
        try { cachedData = JSON.parse(cachedRaw); } catch (e) {}
    }

    try {
        const res = await fetch(getApiBase() + "/api/catalogo.json", { cache: "no-store" });
        if (res.ok) {
            const serverData = await res.json();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(serverData));
            processCatalogData(serverData);
            return;
        }
    } catch (e) {}

    if (cachedData && Array.isArray(cachedData.items)) {
        processCatalogData(cachedData);
        return;
    }

    try {
        const r = await fetch("catalogo_prueba.json", { cache: "no-store" });
        const d = await r.json();
        processCatalogData(d);
    } catch (e) {
        processCatalogData({ items: [] });
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
    catalogItems = Array.isArray(data) ? data : (data.items || data.movies || []);
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

// 1. PORTADA FUSIÓN NETFLIX + HBO (CON MOVIE/SERIE Y BOTONES RÁPIDOS SIN DESCARGA)
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
        const feats = pool.filter(i => i.featured);
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
                            <span class="icon-circle">${inFav ? '✓' : '+'}</span>
                            <span>Mi Lista</span>
                        </button>
                        <button class="hero-play-main" onclick="quickPlayFromHero('${escapeQuotes(item.id)}')">
                            ▶ Reproducir
                        </button>
                        <button class="hero-side-btn" onclick="openDetailModal('${escapeQuotes(item.id)}')">
                            <span class="icon-circle">ⓘ</span>
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

// 2. FILA "CONTINUAR VIENDO" DEBAJO DE LA PORTADA
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
                    <div class="cw-play-badge">▶</div>
                    <div class="cw-progress-track">
                        <div class="cw-progress-bar" style="width: ${entry.progress || 42}%"></div>
                    </div>
                </div>
                <div class="cw-meta-row">
                    <span class="cw-meta-text">${escapeHtml(subtitle)}</span>
                    <button class="cw-remove-btn" title="Quitar" onclick="event.stopPropagation(); removeContinueWatching('${escapeQuotes(item.id)}')">⋮</button>
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

// 3. CARRUSELES CON FILA "TOP 10" ESTILO NETFLIX + GÉNEROS
function renderCategoryCarousels(items, filterMode) {
    const container = document.getElementById("carouselsContainer");
    if (!items.length) {
        container.innerHTML = `<p style="padding:16px; color:var(--text-dim); font-size:13px;">No hay títulos en esta sección.</p>`;
        return;
    }

    const premieres = [...items].sort((a, b) => Number(b.year || 0) - Number(a.year || 0));
    const topRated = [...items].sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0)).slice(0, 10);

    // Fila Especial Top 10 con Números Gigantes (ADN Netflix)
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

// 4. TARJETAS DE PÓSTER CON "MOVIE" O "SERIE" (CERO PALABRA PRIME)
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

// 5. VISTA PREVIA FUSIÓN (CON "MOVIE" O "SERIE" EN LUGAR DE PRIME)
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

    // Calcular % de coincidencia basado en calificación
    const ratingFloat = parseFloat(item.rating || "8.6");
    const matchPct = Math.min(99, Math.max(84, Math.round(ratingFloat * 10.5)));
    document.getElementById("mMatchScore").textContent = `${matchPct}% Para ti`;
    document.getElementById("mStatYear").textContent = item.year || "2026";
    document.getElementById("mStatQuality").textContent = item.quality || "1080p";
    document.getElementById("mStatLang").textContent = item.language || "LATINO";
    document.getElementById("mStatRating").textContent = `★ ${item.rating || '8.5'}`;

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
    favBtn.textContent = isFav ? "✓ En Mi Lista" : "+ Mi Lista";
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

        playBtn.innerHTML = `▶ Reproducir ${epTag}`;
        playBtn.onclick = () => {
            if (firstUrl) runStreamOrDownload(firstUrl, `${item.title} - ${epTag}`, "PLAY", item, epTag);
        };
        dlBtn.innerHTML = `⬇ Descargar ${epTag}`;
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
        playBtn.innerHTML = `▶ Reproducir`;
        playBtn.onclick = () => {
            if (activeSrv.url) runStreamOrDownload(activeSrv.url, item.title, "PLAY", item, "");
        };
        dlBtn.innerHTML = `⬇ Descargar`;
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
                    <button class="btn-play-sm" onclick="runStreamOrDownload('${escapeQuotes(primarySrv.url)}', '${escapeQuotes(fullEpTitle)}', 'PLAY', currentActiveItem, '${escapeQuotes(epTag)}')">▶ Reproducir</button>
                    <button class="btn-dl-sm" onclick="runStreamOrDownload('${escapeQuotes(primarySrv.url)}', '${escapeQuotes(fullEpTitle)}', 'DOWNLOAD', currentActiveItem, '${escapeQuotes(epTag)}')">⬇</button>
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
    const val = document.getElementById("apiInputBox").value.trim();
    if (!val) return;
    if (isAndroidApp) {
        window.AndroidBridge.saveApiUrl(val);
        window.AndroidBridge.fetchCatalogJson(val);
        switchDock("stream");
    } else {
        fetch(val)
            .then(r => r.json())
            .then(d => {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
                processCatalogData(d);
                switchDock("stream");
            })
            .catch(e => alert("Error conectando API: " + e.message));
    }
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
            <button class="btn-play-sm">▶ Reproducir</button>
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
                <button class="btn-play-sm" onclick="window.AndroidBridge.playDirectVideo('${escapeQuotes(v.uri)}', '${escapeQuotes(v.title)}', '', '')">▶ Ver</button>
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
EOT

# 4. Limpiar menciones a "Prime" en el título del Panel Admin si existe
sed -i 's/PRIME ADMIN/STUDIO CMS/g' "$WEB_DIR/public/admin.html" 2>/dev/null || true

# 5. Sincronizar con TrebEdit y carpetas de la APK
cp "$WEB_DIR/data/catalogo.json" "$WEB_DIR/public/catalogo_prueba.json"
cp -r "$WEB_DIR/public/"* "$SHARED_WEB/"

if [ -d "$APP_UI_DIR" ]; then
    cp -r "$WEB_DIR/public/"* "$APP_UI_DIR/"
    cp -r "$WEB_DIR/public/"* "$SHARED_APP_UI/"
fi

echo ""
echo "✅ ¡FUSIÓN NETFLIX + HBO MAX + PRIME (SIN COPYRIGHT) APLICADA!"
echo "📂 Recarga tu navegador en TrebEdit o puerto 4000 para ver el nuevo diseño."
