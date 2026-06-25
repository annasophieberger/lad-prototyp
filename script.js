/* ── Festes Datum für den Prototyp ───────────────────────── */
const HEUTE = { tag: 'Mo', datum: 29, monat: 6, jahr: 2026, wochentag: 1 };

/* ── Laufzeit-State ───────────────────────────────────────── */
const manualEntries  = [];
const kranktage      = Array(7).fill(false);
const notenEintraege = [];
let _renderZielSummary = null;

/* ── Screen Router ────────────────────────────────────────── */
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

  document.getElementById(screenId).classList.add('active');
  document.querySelector(`[data-screen="${screenId}"]`).classList.add('active');

  if (screenId === 'screen-fortschritt') {
    animateThemaBar();
    animateSemesterLines();
  } else if (screenId === 'screen-lernzeit') {
    animateHeatmapCells();
  }
}

document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', () => showScreen(tab.dataset.screen));
});

/* ── Screen-Animationen ───────────────────────────────────── */
function animateThemaBar() {
  const fill = document.querySelector('.thema-bar-fill');
  if (!fill) return;
  const pct = fill.dataset.pct || '0';
  fill.style.transition = 'none';
  fill.style.width = '0%';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    fill.style.transition = '';
    fill.style.width = pct + '%';
  }));
}

function animateSemesterLines() {
  const paths = document.querySelectorAll('#semester-svg-wrap .chart-line-path');
  paths.forEach((path, i) => {
    const len = path.getTotalLength ? path.getTotalLength() : 0;
    if (!len) return;
    path.style.transition = 'none';
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      path.style.transition = `stroke-dashoffset 800ms ease-in-out ${i * 100}ms`;
      path.style.strokeDashoffset = 0;
    }));
  });
}

function animateHeatmapCells() {
  const cells = document.querySelectorAll('.lz-heatmap-cell');
  cells.forEach(cell => {
    cell.style.animation = 'none';
    cell.style.opacity = '0';
  });
  requestAnimationFrame(() => {
    cells.forEach((cell, idx) => {
      const di = idx % 7;
      const wi = Math.floor(idx / 7);
      const delay = di * 30 + wi * 120;
      cell.style.opacity = '';
      cell.style.animation = `fadeScaleIn 150ms ease-out ${delay}ms both`;
    });
  });
}


/* ── Toast ───────────────────────────────────────────────── */
function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.querySelector('.app-container').appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 2200);
}

/* ── Info-Tooltips ───────────────────────────────────────── */
function initInfoTooltips() {
  const tip = document.createElement('div');
  tip.className = 'info-tooltip';
  tip.style.display = 'none';
  document.body.appendChild(tip);

  let anchor = null;

  document.addEventListener('click', e => {
    const icon = e.target.closest('.info-icon');
    if (icon) {
      if (anchor === icon && tip.style.display !== 'none') {
        tip.style.display = 'none';
        anchor = null;
        return;
      }
      tip.innerHTML = `<span class="info-tooltip-title">${icon.dataset.tipTitle || ''}</span>${icon.dataset.tipText || ''}`;
      tip.style.display = 'block';
      anchor = icon;

      const r  = icon.getBoundingClientRect();
      const vw = window.innerWidth;
      const tw = Math.min(260, vw - 24);
      let   lx = r.left;
      if (lx + tw > vw - 8) lx = vw - tw - 8;
      if (lx < 8)           lx = 8;
      tip.style.maxWidth = tw + 'px';
      tip.style.top  = (r.bottom + 6) + 'px';
      tip.style.left = lx + 'px';
    } else {
      tip.style.display = 'none';
      anchor = null;
    }
  });
}

/* ── Schnell-Modal: Lernzeit ohne App ───────────────────── */
function _openSchnellModal() {
  const MON     = ['','Jänner','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  const dateLbl = `Heute · ${HEUTE.tag}, ${HEUTE.datum}. ${MON[HEUTE.monat]}`;
  let selMin    = null;

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:400;display:flex;align-items:flex-end;justify-content:center;animation:overlayIn .2s ease;';
  overlay.innerHTML = `
    <div style="width:100%;max-width:390px;background:var(--color-surface);border-radius:16px 16px 0 0;padding:20px 16px 36px;animation:slideUp .25s ease;">
      <div style="font-size:16px;font-weight:700;color:var(--color-text);margin-bottom:14px;">Lernzeit eintragen</div>
      <p style="font-size:13px;color:var(--color-text-muted);margin:0 0 12px;">${dateLbl}</p>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;" id="sle-chips">
        ${[15,30,45,60,90].map(m => `<button class="chip" data-min="${m}">${m} min</button>`).join('')}
      </div>
      <input type="text" id="sle-notiz" class="input" placeholder="Womit hast du gelernt? (optional)" style="margin-bottom:14px;"/>
      <button class="btn btn-primary" id="sle-save" style="width:100%;" disabled>Speichern</button>
      <button id="sle-cancel" style="display:block;width:100%;background:none;border:none;color:var(--color-text-muted);font-size:14px;padding:12px 0 0;cursor:pointer;text-align:center;">Abbrechen</button>
    </div>`;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  const chips   = overlay.querySelectorAll('#sle-chips .chip');
  const saveBtn = overlay.querySelector('#sle-save');

  chips.forEach(chip => chip.addEventListener('click', () => {
    chips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    selMin = +chip.dataset.min;
    saveBtn.disabled = false;
  }));

  const close = () => { overlay.remove(); document.body.style.overflow = ''; };
  overlay.querySelector('#sle-cancel').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  saveBtn.addEventListener('click', () => {
    if (!selMin) return;
    manualEntries.push({
      typ: 'analog', tag: HEUTE.tag, datum: HEUTE.datum, monat: HEUTE.monat, minuten: selMin,
      date: `${HEUTE.jahr}-${String(HEUTE.monat).padStart(2,'0')}-${String(HEUTE.datum).padStart(2,'0')}T00:00:00.000Z`
    });
    close();
    if (_renderZielSummary) _renderZielSummary();
    renderLernzeitHeatmap();
    showToast('Lernzeit eingetragen ✓');
  });
}

/* ── Ziel Block (Metrik 4 + 5) ───────────────────────────── */
function initZielBlock() {

  const MONATE = ['Januar','Februar','März','April','Mai','Juni',
                  'Juli','August','September','Oktober','November','Dezember'];

  const PENCIL_BTN = `<button class="btn-icon" id="ziel-edit-btn" aria-label="Ziel bearbeiten">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  </button>`;

  function enddatumToISO(str) {
    const parts = str.split(' ');
    const day   = parseInt(parts[0]);
    const month = MONATE.indexOf(parts[1]);
    const year  = parseInt(parts[2]);
    if (month === -1) return '2026-06-30';
    return `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  }

  function isoToEnddatum(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${parseInt(d)}. ${MONATE[parseInt(m)-1]} ${y}`;
  }

  // ── Gespeicherter Zustand ─────────────────────────────────
  const defaultThema  = themen.find(t => t.id === (aktivesZiel.thema || 'AN')) || themen[0];
  const defaultModule = defaultThema.module.filter(m => !m.gemeistert).slice(0, 3).map(m => m.id);

  const _def14    = new Date(HEUTE.jahr, HEUTE.monat - 1, HEUTE.datum + 14);
  const _def14Str = `${_def14.getDate()}. ${MONATE[_def14.getMonth()]} ${_def14.getFullYear()}`;

  const zielState = {
    typ:                aktivesZiel.typ || 'leistung',
    tage:               woche.filter(t => t.geplant).map(t => t.tag),
    minuten:            aktivesZiel.minuten || 15,
    themaId:            defaultThema.id,
    ausgewaehlteModule: defaultModule,
    enddatum:           aktivesZiel.enddatum || _def14Str,
  };

  // ── Entwurfszustand (nur während Modal geöffnet) ──────────
  let draftTyp      = zielState.typ;
  let draftSchritt  = 1;
  let draftThemaId  = zielState.themaId;
  let draftModule   = [...zielState.ausgewaehlteModule];
  let draftEnddatum = zielState.enddatum;
  let draftTage     = [...zielState.tage];
  let draftMinuten  = zielState.minuten;

  // ── Modal-Container (einmalig erstellt) ───────────────────
  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'ziel-modal';
  modalOverlay.className = 'modal-overlay hidden';
  document.querySelector('.app-container').appendChild(modalOverlay);

  // ── Zusammenfassung rendern ───────────────────────────────
  function renderZielSummary() {
    const container = document.getElementById('ziel-summary');
    if (aktivesZiel.typ === null) {
      container.innerHTML = `
        <div class="ziel-type-row"><span></span>${PENCIL_BTN}</div>
        <p style="text-align:center;color:var(--color-text-muted);font-size:15px;padding:16px 8px 8px;">
          Noch kein Ziel gesetzt. Tippe auf ✏️ um dein erstes Ziel einzustellen.
        </p>`;
      document.getElementById('ziel-edit-btn').addEventListener('click', openModal);
      return;
    }
    if (zielState.typ === 'zeit') _renderZeitChart(container);
    else                          _renderLeistungChart(container);
    document.getElementById('ziel-edit-btn').addEventListener('click', openModal);
  }

  function _renderZeitChart(container) {
    const goalMin    = zielState.minuten;
    const lerntage   = zielState.tage;
    const ALL_TAGS   = ['Mo','Di','Mi','Do','Fr','Sa','So'];
    const manualForDay = tag => manualEntries
      .filter(e => e.typ === 'analog' && e.tag === tag)
      .reduce((sum, e) => sum + e.minuten, 0);
    const daily    = ALL_TAGS.map((tag, i) => ({
      tag,
      app:     lernzeitmuster[i] ? lernzeitmuster[i].minuten : 0,
      manual:  manualForDay(tag),
      done:    woche[i] ? woche[i].erledigt : false,
      planned: woche[i] ? woche[i].geplant  : false,
    }));

    const maxY  = Math.max(goalMin * 1.3, Math.max.apply(null, daily.map(d => d.app + d.manual)), 1);
    const VW=340, VH=158, ML=28, MR=6;
    const cRowY=6, cRowH=24, cTop=cRowY+cRowH+6, cBot=VH-22, cH=cBot-cTop;
    const todayIdx  = HEUTE.wochentag - 1;
    const cW    = VW - ML - MR;
    const colW  = cW / 7, barW = Math.min(colW * 0.52, 20);
    const xC    = i => ML + (i + 0.5) * colW;
    const yV    = v => cBot - (v / maxY) * cH;
    const goalY = yV(goalMin);

    const checkRow = daily.map((d, i) => {
      const cx = xC(i), cy = cRowY + cRowH / 2, r = 9;
      if (kranktage[i])
        return `<text x="${cx.toFixed(1)}" y="${(cy + 5).toFixed(1)}" text-anchor="middle" font-size="14">🤒</text>`;
      const istLerntag = lerntage.includes(d.tag);
      const erreicht   = (d.app + d.manual) >= goalMin;
      if (istLerntag && erreicht)
        return `<circle cx="${cx.toFixed(1)}" cy="${cy}" r="${r}" fill="#22C55E"/>` +
               `<polyline points="${(cx-4).toFixed(1)},${cy} ${(cx-1.5).toFixed(1)},${cy+3} ${(cx+4.5).toFixed(1)},${cy-3}" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
      if (istLerntag && !erreicht && i >= todayIdx)
        return `<circle cx="${cx.toFixed(1)}" cy="${cy}" r="${r}" fill="none" stroke="#007AFF" stroke-width="2"/>`;
      return `<circle cx="${cx.toFixed(1)}" cy="${cy}" r="${r}" fill="none" stroke="#E2E8F0" stroke-width="1.5"/>`;
    }).join('');

    const bars = daily.map((d, i) => {
      const cx = xC(i), x = cx - barW / 2;
      if (kranktage[i])
        return `<text x="${cx.toFixed(1)}" y="${(cBot - 6).toFixed(1)}" text-anchor="middle" font-size="15">🤒</text>`;
      const aH = (d.app    / maxY) * cH, aY = cBot - aH;
      const mH = (d.manual / maxY) * cH, mY = aY - mH;
      let s = '';
      if (mH > 0.5) s += `<rect x="${x.toFixed(1)}" y="${mY.toFixed(1)}" width="${barW}" height="${mH.toFixed(1)}" rx="2.5" fill="#BFDBFE"/>`;
      if (aH > 0.5) s += `<rect x="${x.toFixed(1)}" y="${aY.toFixed(1)}" width="${barW}" height="${aH.toFixed(1)}" rx="2.5" fill="#3B82F6"/>`;
      if (d.app === 0 && d.manual === 0)
        s += `<rect x="${x.toFixed(1)}" y="${(cBot-2).toFixed(1)}" width="${barW}" height="2" rx="1" fill="#E2E8F0"/>`;
      return s;
    }).join('');

    const xLabels = daily.map((d, i) =>
      `<text x="${xC(i).toFixed(1)}" y="${VH-5}" text-anchor="middle" font-size="11" fill="#64748B">${d.tag}</text>`
    ).join('');

    const todayColX    = ML + todayIdx * colW;
    const todayHighlight = `<rect x="${todayColX.toFixed(1)}" y="${cTop.toFixed(1)}" width="${colW.toFixed(1)}" height="${cH.toFixed(1)}" rx="4" fill="rgba(0,122,255,0.06)" stroke="#007AFF" stroke-width="1.5" stroke-opacity="0.35"/>`;
    const cChartMidY   = Math.round((cTop + cBot) / 2);

    container.innerHTML = `
      <div class="ziel-type-row"><span class="summary-type-label">Zeitziel</span>${PENCIL_BTN}</div>
      <div style="display:flex;align-items:flex-end;justify-content:space-between;margin:2px 0 10px;">
        <div style="display:flex;align-items:baseline;gap:4px;">
          <span style="font-size:30px;font-weight:700;color:var(--color-text);letter-spacing:-0.5px;">${goalMin}</span>
          <span style="font-size:15px;font-weight:500;color:var(--color-text-muted);">min/Tag</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;padding-bottom:3px;">
          <span style="display:flex;align-items:center;gap:4px;font-size:12px;color:var(--color-text-muted);">
            <span style="width:8px;height:8px;border-radius:50%;background:#3B82F6;display:inline-block;"></span>App
          </span>
          <span style="display:flex;align-items:center;gap:4px;font-size:12px;color:var(--color-text-muted);">
            <span style="width:8px;height:8px;border-radius:50%;background:#BFDBFE;border:1px solid #93C5FD;display:inline-block;"></span>Ohne App
          </span>
        </div>
      </div>
      <svg width="100%" viewBox="0 0 ${VW} ${VH}" style="display:block;overflow:visible;">
        ${checkRow}
        ${todayHighlight}
        <line x1="${ML}" y1="${cBot}" x2="${VW-MR}" y2="${cBot}" stroke="#E2E8F0" stroke-width="1"/>
        <line x1="${ML}" y1="${goalY.toFixed(1)}" x2="${VW-MR}" y2="${goalY.toFixed(1)}"
              stroke="#F59E0B" stroke-width="1.5" stroke-dasharray="4,3"/>
        <text x="${(VW-MR-2).toFixed(1)}" y="${(goalY-3).toFixed(1)}" text-anchor="end"
              font-size="10" fill="#F59E0B" font-weight="600">Ziel: ${goalMin} min</text>
        <text transform="rotate(-90,8,${cChartMidY})" x="8" y="${cChartMidY}" text-anchor="middle" font-size="9" fill="#94A3B8">Minuten</text>
        ${bars}
        ${xLabels}
      </svg>
      <button id="zeitziel-schnelleintrag-btn" class="btn btn-secondary"
        style="width:100%;margin-top:12px;font-size:13px;">
        + Lernzeit ohne App eintragen
      </button>`;
    container.querySelector('#zeitziel-schnelleintrag-btn')
      .addEventListener('click', _openSchnellModal);
  }

  function _renderLeistungChart(container) {
    const thema         = themen.find(t => t.id === zielState.themaId) || themen[0];
    const selModule     = thema.module.filter(m => zielState.ausgewaehlteModule.includes(m.id));
    const totalKonzepte = selModule.reduce((s, m) => s + m.aufgaben, 0);

    const verlauf   = aktivesZiel.verlauf || [];
    const startDate = new Date(aktivesZiel.zielStartdatum);
    const endDate   = new Date(enddatumToISO(zielState.enddatum));
    const today     = new Date(HEUTE.jahr, HEUTE.monat - 1, HEUTE.datum);
    const spanMs    = Math.max(endDate - startDate, 86400000);

    const fmtD = d => {
      const MS = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
      return `${d.getDate()}. ${MS[d.getMonth()]}`;
    };

    const VW=340, VH=120, ML=32, MR=16, MT=18, MB=22;
    const cW=VW-ML-MR, cH=VH-MT-MB, cBot=VH-MB;

    // 10% headroom above goal so dashed line is visually distinct from top edge
    const yMax = totalKonzepte + Math.max(2, Math.round(totalKonzepte * 0.1));
    const xT   = d => ML + ((d - startDate) / spanMs) * cW;
    const yK   = k => cBot - (k / yMax) * cH;

    const xStart = xT(startDate);
    const xEnd   = xT(endDate);
    const xToday = Math.min(xT(today), xEnd);
    const yGoal  = yK(totalKonzepte);

    const lastV     = verlauf.length > 0 ? verlauf[verlauf.length - 1] : null;
    const xLastV    = lastV ? xT(new Date(lastV.datum)) : xStart;
    const yLastV    = lastV ? yK(lastV.konzepte) : cBot;
    const lastKonzepte = lastV ? lastV.konzepte : 0;

    // Area fill polygon: start at bottom-left, trace verlauf, close at bottom
    let areaPath = `M ${xStart.toFixed(1)} ${cBot}`;
    verlauf.forEach(v => {
      areaPath += ` L ${xT(new Date(v.datum)).toFixed(1)} ${yK(v.konzepte).toFixed(1)}`;
    });
    areaPath += ` L ${xLastV.toFixed(1)} ${cBot} Z`;

    // Stroke line over verlauf points
    let linePath = verlauf.map((v, i) => {
      const cmd = i === 0 ? 'M' : 'L';
      return `${cmd} ${xT(new Date(v.datum)).toFixed(1)} ${yK(v.konzepte).toFixed(1)}`;
    }).join(' ');

    // Historical dots (light blue)
    const dots = verlauf.map(v => {
      const cx = xT(new Date(v.datum)).toFixed(1);
      const cy = yK(v.konzepte).toFixed(1);
      return `<circle cx="${cx}" cy="${cy}" r="3" fill="#93C5FD" stroke="white" stroke-width="1.5"/>`;
    }).join('');

    // Today dot — y-value explicitly from aktivesZiel.verlauf[last].konzepte
    const todayDotY   = yK(lastKonzepte);
    const countLabelY = todayDotY < MT + 20 ? todayDotY + 14 : todayDotY - 9;

    // Tempo calculations
    const frischstart    = verlauf.length <= 1 && lastKonzepte === 0;
    const daysRemaining  = Math.max(0, Math.ceil((endDate - today) / 86400000));
    const konzepteNoch   = totalKonzepte - lastKonzepte;
    const daysSinceStart = Math.max(1, Math.round((today - startDate) / 86400000));
    const tempoNoetig    = daysRemaining > 0 ? Math.ceil(konzepteNoch / daysRemaining) : '–';
    const tempoBisher    = frischstart ? '–' : Math.ceil(lastKonzepte / daysSinceStart);
    const zielErreicht   = konzepteNoch <= 0;
    const gutImPlan      = zielErreicht || (!frischstart && daysRemaining > 0
      ? tempoBisher >= tempoNoetig
      : true);

    container.innerHTML = `
      <div class="ziel-type-row"><span class="summary-type-label">Lernziel</span>${PENCIL_BTN}</div>
      <p class="summary-thema">${thema.name}</p>
      <p class="summary-meta" style="margin-top:4px;">
        ${selModule.length} Kapitel · ${totalKonzepte} Aufgaben · bis ${zielState.enddatum}
      </p>
      <svg width="100%" viewBox="0 0 ${VW} ${VH}" style="display:block;overflow:visible;margin-top:8px;">
        <line x1="${ML}" y1="${cBot}" x2="${xEnd.toFixed(1)}" y2="${cBot}" stroke="#E2E8F0" stroke-width="1"/>
        <line x1="${ML}" y1="${yGoal.toFixed(1)}" x2="${xEnd.toFixed(1)}" y2="${yGoal.toFixed(1)}"
              stroke="#F59E0B" stroke-width="1.5" stroke-dasharray="5,3"/>
        <text x="${(xEnd - 2).toFixed(1)}" y="${(yGoal - 4).toFixed(1)}" text-anchor="end"
              font-size="10" fill="#F59E0B" font-weight="600">Ziel: ${totalKonzepte} Aufg.</text>
        ${!frischstart ? `
          <path d="${areaPath}" fill="#3B82F6" fill-opacity="0.12"/>
          <path d="${linePath}" fill="none" stroke="#3B82F6" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round"/>
        ` : ''}
        <line x1="${xLastV.toFixed(1)}" y1="${yLastV.toFixed(1)}" x2="${xEnd.toFixed(1)}" y2="${yGoal.toFixed(1)}"
              stroke="#94A3B8" stroke-width="1.5" stroke-dasharray="4,3"/>
        <line x1="${xToday.toFixed(1)}" y1="${MT}" x2="${xToday.toFixed(1)}" y2="${cBot}"
              stroke="#3B82F6" stroke-width="1" stroke-dasharray="2,2" opacity="0.35"/>
        ${dots}
        ${!frischstart ? `
          <circle cx="${xToday.toFixed(1)}" cy="${todayDotY.toFixed(1)}" r="4" fill="#3B82F6" stroke="white" stroke-width="1.5"/>
          <text x="${xToday.toFixed(1)}" y="${countLabelY.toFixed(1)}" text-anchor="middle"
                font-size="10" fill="#3B82F6" font-weight="600">Aktuell: ${lastKonzepte}</text>
        ` : ''}
        <text transform="rotate(-90,8,${Math.round((MT + cBot) / 2)})" x="8" y="${Math.round((MT + cBot) / 2)}" text-anchor="middle" font-size="9" fill="#94A3B8">Aufgaben</text>
        ${!frischstart ? `
          <text x="${xStart.toFixed(1)}" y="${VH - 5}" text-anchor="start"
                font-size="10" fill="#64748B">${fmtD(startDate)}</text>
        ` : ''}
        <text x="${xToday.toFixed(1)}" y="${VH - 5}" text-anchor="${frischstart ? 'start' : 'middle'}"
              font-size="10" fill="#3B82F6" font-weight="600">Heute</text>
        <text x="${xEnd.toFixed(1)}" y="${VH - 5}" text-anchor="end"
              font-size="10" fill="#64748B">${fmtD(endDate)}</text>
      </svg>
      <div style="display:flex;align-items:center;gap:4px;margin:4px 0 6px;">
        <svg width="16" height="4" style="flex-shrink:0;overflow:visible;"><line x1="0" y1="2" x2="16" y2="2" stroke="#94A3B8" stroke-width="1.5" stroke-dasharray="4,3"/></svg>
        <span style="font-size:11px;color:var(--color-text-muted);">Projektion</span>
        <span class="info-icon" data-tip-title="Was zeigt die gestrichelte Linie?" data-tip-text="Die Linie zeigt den Weg den du noch vor dir hast um dein Ziel bis zum Enddatum zu erreichen.">?</span>
      </div>
      <div class="tempo-block">
        ${zielErreicht ? `
          <div class="tempo-row"><span>Ziel frühzeitig erreicht! 🎉</span></div>
        ` : `
          <div style="display:flex;gap:8px;margin-bottom:8px;">
            <div style="flex:1;background:rgba(0,122,255,0.07);border-radius:10px;padding:10px 12px;">
              <div style="font-size:11px;color:var(--color-text-muted);margin-bottom:4px;">Dein Tempo<span class="info-icon" data-tip-title="Was ist dein Tempo?" data-tip-text="Zeigt wie viele Aufgaben du bisher pro Tag gemeistert hast — seit du dein Ziel gesetzt hast.">?</span></div>
              <div style="font-size:16px;font-weight:700;color:var(--accent-blue);">${tempoBisher}<span style="font-size:11px;font-weight:500;color:var(--color-text-muted);">${frischstart ? '' : ' Aufgaben / Tag'}</span></div>
            </div>
            <div style="flex:1;background:rgba(255,149,0,0.07);border-radius:10px;padding:10px 12px;">
              <div style="font-size:11px;color:var(--color-text-muted);margin-bottom:4px;">Nötiges Tempo<span class="info-icon" data-tip-title="Was ist das nötige Tempo?" data-tip-text="Zeigt wie viele Aufgaben du pro Tag lösen musst um dein Ziel rechtzeitig bis zum Enddatum zu erreichen.">?</span></div>
              <div style="font-size:16px;font-weight:700;color:var(--accent-amber);">${tempoNoetig}<span style="font-size:11px;font-weight:500;color:var(--color-text-muted);"> Aufgaben / Tag</span></div>
            </div>
          </div>
          <div style="font-size:13px;font-weight:500;color:${frischstart ? 'var(--accent-blue)' : gutImPlan ? 'var(--accent-green)' : 'var(--accent-amber)'};">
            ${frischstart ? 'Du hast gerade gestartet — leg los! 🚀' : gutImPlan ? 'Du liegst gut im Plan ✓' : 'Du musst etwas zulegen ⚠️'}
          </div>
        `}
      </div>`;
  }

  // ── Modal öffnen / schließen ──────────────────────────────
  function openModal() {
    draftTyp      = zielState.typ;
    draftSchritt  = 1;
    draftThemaId  = zielState.themaId;
    draftModule   = [...zielState.ausgewaehlteModule];
    draftEnddatum = zielState.enddatum;
    draftTage     = [...zielState.tage];
    draftMinuten  = zielState.minuten;
    modalOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    renderModal();
  }

  function closeModal() {
    modalOverlay.classList.add('hidden');
    document.body.style.overflow = '';
  }

  // ── Modal rendern ─────────────────────────────────────────
  function _buildBodyHtml() {
    if (draftTyp === 'zeit') {
      const ALL_DAYS = ['Mo','Di','Mi','Do','Fr','Sa','So'];
      return `
        <div class="modal-section">
          <label class="field-label">Lerntage</label>
          <div class="chip-row" style="margin-top:8px;">
            ${ALL_DAYS.map(d =>
              `<button class="chip day-chip${draftTage.includes(d) ? ' active' : ''}" data-day="${d}">${d}</button>`
            ).join('')}
          </div>
        </div>
        <div class="modal-section">
          <label class="field-label">Minuten pro Tag</label>
          <div class="chip-row" style="margin-top:8px;">
            ${[15,30,45,60].map(v =>
              `<button class="chip min-chip${v === draftMinuten ? ' active' : ''}" data-min="${v}">${v} min</button>`
            ).join('')}
          </div>
        </div>
        <button class="btn btn-primary modal-save-btn">Speichern</button>`;

    } else if (draftSchritt === 1) {
      return `
        <div class="modal-section">
          <label class="field-label">Themengebiet wählen</label>
          <div class="leistung-thema-list">
            ${themen.map(t => `
              <button class="leistung-thema-card${t.id === draftThemaId ? ' active' : ''}" data-id="${t.id}">
                <div class="ltc-row">
                  <span class="ltc-name">${t.name}</span>
                  <span class="ltc-pct">${t.fortschritt}%</span>
                </div>
                <div class="ltc-bar-wrap"><div class="ltc-bar-fill" style="width:${t.fortschritt}%"></div></div>
              </button>`).join('')}
          </div>
        </div>
        <div class="modal-nav">
          <span></span>
          <button class="btn btn-primary modal-next-btn" style="width:auto;margin-top:0;">Weiter →</button>
        </div>`;

    } else if (draftSchritt === 2) {
      const thema         = themen.find(t => t.id === draftThemaId) || themen[0];
      const lastMastered  = [...thema.module].reverse().find(m => m.gemeistert);
      const openModule    = thema.module.filter(m => !m.gemeistert);
      const totalKonzepte = thema.module
        .filter(m => draftModule.includes(m.id))
        .reduce((s, m) => s + m.aufgaben, 0);
      const checkSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
      return `
        <div class="modal-section">
          ${lastMastered ? `
            <div class="last-mastered-row">
              ${checkSvg}
              <span>Zuletzt abgeschlossen: <strong>${lastMastered.name}</strong></span>
            </div>` : ''}
          <label class="field-label" style="margin-top:${lastMastered ? 12 : 0}px;">
            Kapitel wählen <span class="muted">(max. 5)</span>
          </label>
          <div class="modul-check-list">
            ${openModule.map(m => `
              <label class="modul-check-item${draftModule.includes(m.id) ? ' checked' : ''}">
                <input type="checkbox" class="modul-checkbox" data-id="${m.id}"
                  ${draftModule.includes(m.id) ? 'checked' : ''}
                  ${!draftModule.includes(m.id) && draftModule.length >= 5 ? 'disabled' : ''} />
                <span class="modul-check-name">${m.name}</span>
                <span class="konzept-badge">${m.aufgaben}</span>
              </label>`).join('')}
          </div>
          <p class="modal-count-summary">
            <strong>${draftModule.length} Kapitel</strong> · <strong>${totalKonzepte} Kapitel</strong>
          </p>
        </div>
        <div class="modal-nav">
          <button class="btn btn-secondary modal-back-btn" style="width:auto;margin-top:0;">← Zurück</button>
          <button class="btn btn-primary modal-next-btn" style="width:auto;margin-top:0;"
            ${draftModule.length === 0 ? 'disabled' : ''}>Weiter →</button>
        </div>`;

    } else {
      const thema         = themen.find(t => t.id === draftThemaId) || themen[0];
      const selModule     = thema.module.filter(m => draftModule.includes(m.id));
      const totalKonzepte = selModule.reduce((s, m) => s + m.aufgaben, 0);
      const isoVal        = enddatumToISO(draftEnddatum);
      const _now          = new Date(HEUTE.jahr, HEUTE.monat - 1, HEUTE.datum);
      const _minIso       = `${HEUTE.jahr}-${String(HEUTE.monat).padStart(2,'0')}-${String(HEUTE.datum).padStart(2,'0')}`;
      const _sel          = isoVal ? new Date(isoVal) : null;
      const dateOk        = !!(_sel && _sel >= _now);
      const _daysLeft     = dateOk ? Math.max(1, Math.ceil((_sel - _now) / 86400000)) : 0;
      const _warningTempo = _daysLeft > 0 ? Math.ceil(totalKonzepte / _daysLeft) : null;
      const _showWarning  = _warningTempo !== null && _warningTempo > 8;
      return `
        <div class="modal-section">
          <label class="field-label">Bis wann?</label>
          <input type="date" id="modal-enddatum" class="input" value="${isoVal}"
            style="margin-top:8px;" min="${_minIso}" />
          <p class="date-error"${dateOk ? ' style="display:none;"' : ''}>Bitte ein zukünftiges Datum wählen</p>
          <p id="tempo-warning" style="font-size:13px;color:var(--accent-amber);margin-top:8px;${_showWarning ? '' : 'display:none;'}">⚠️ Bei diesem Enddatum müsstest du ${_warningTempo} Aufgaben pro Tag schaffen — das ist sehr ambitioniert.</p>
          <div class="step3-summary">
            <span class="step3-item">${thema.name}</span>
            <span class="step3-sep">·</span>
            <span class="step3-item">${selModule.length} Kapitel</span>
            <span class="step3-sep">·</span>
            <span class="step3-item">${totalKonzepte} Aufgaben</span>
          </div>
        </div>
        <div class="modal-nav">
          <button class="btn btn-secondary modal-back-btn" style="width:auto;margin-top:0;">← Zurück</button>
          <button class="btn btn-primary modal-save-btn" style="width:auto;margin-top:0;"
            ${dateOk ? '' : 'disabled'}>Speichern</button>
        </div>`;
    }
  }

  function _attachBodyEvents() {
    if (draftTyp === 'zeit') {
      modalOverlay.querySelectorAll('.day-chip').forEach(chip => {
        chip.addEventListener('click', e => {
          e.preventDefault();
          const d = chip.dataset.day;
          chip.classList.toggle('active');
          if (chip.classList.contains('active')) { if (!draftTage.includes(d)) draftTage.push(d); }
          else { draftTage = draftTage.filter(x => x !== d); }
        });
      });
      modalOverlay.querySelectorAll('.min-chip').forEach(chip => {
        chip.addEventListener('click', e => {
          e.preventDefault();
          draftMinuten = +chip.dataset.min;
          _updateBody();
        });
      });
      modalOverlay.querySelector('.modal-save-btn').addEventListener('click', saveGoal);

    } else if (draftSchritt === 1) {
      modalOverlay.querySelectorAll('.leistung-thema-card').forEach(card => {
        card.addEventListener('click', e => {
          e.preventDefault();
          draftThemaId = card.dataset.id;
          draftModule  = [];
          _updateBody();
        });
      });
      modalOverlay.querySelector('.modal-next-btn').addEventListener('click', () => {
        draftSchritt = 2; renderModal();
      });

    } else if (draftSchritt === 2) {
      modalOverlay.querySelectorAll('.modul-checkbox').forEach(cb => {
        cb.addEventListener('change', () => {
          const id = cb.dataset.id;
          if (cb.checked && draftModule.length < 5 && !draftModule.includes(id)) draftModule.push(id);
          else draftModule = draftModule.filter(m => m !== id);
          _updateBody();
        });
      });
      modalOverlay.querySelector('.modal-back-btn').addEventListener('click', () => { draftSchritt = 1; renderModal(); });
      const nextBtn = modalOverlay.querySelector('.modal-next-btn');
      if (nextBtn) nextBtn.addEventListener('click', () => { draftSchritt = 3; renderModal(); });

    } else {
      const dateInput    = modalOverlay.querySelector('#modal-enddatum');
      const saveBtn      = modalOverlay.querySelector('.modal-save-btn');
      const errorEl      = modalOverlay.querySelector('.date-error');
      const warningEl    = modalOverlay.querySelector('#tempo-warning');
      const _totalKonz   = themen.find(t => t.id === draftThemaId)?.module
        .filter(m => draftModule.includes(m.id)).reduce((s, m) => s + m.aufgaben, 0) || 0;
      dateInput.addEventListener('change', e => {
        const val = e.target.value;
        const now = new Date(HEUTE.jahr, HEUTE.monat - 1, HEUTE.datum);
        const sel = val ? new Date(val) : null;
        if (sel && sel >= now) {
          draftEnddatum         = isoToEnddatum(val);
          errorEl.style.display = 'none';
          saveBtn.disabled      = false;
          const days  = Math.max(1, Math.ceil((sel - now) / 86400000));
          const tempo = Math.ceil(_totalKonz / days);
          if (tempo > 8) {
            warningEl.textContent   = `⚠️ Bei diesem Enddatum müsstest du ${tempo} Aufgaben pro Tag schaffen — das ist sehr ambitioniert.`;
            warningEl.style.display = '';
          } else {
            warningEl.style.display = 'none';
          }
        } else {
          errorEl.style.display   = '';
          warningEl.style.display = 'none';
          saveBtn.disabled        = true;
        }
      });
      modalOverlay.querySelector('.modal-back-btn').addEventListener('click', () => { draftSchritt = 2; renderModal(); });
      saveBtn.addEventListener('click', saveGoal);
    }
  }

  function _updateBody() {
    const bodyEl = modalOverlay.querySelector('.modal-body');
    if (!bodyEl) return;
    bodyEl.innerHTML = _buildBodyHtml();
    _attachBodyEvents();
  }

  function renderModal() {
    const stepIndicator = draftTyp === 'leistung'
      ? `<div class="step-indicator">${[1,2,3].map(s =>
          `<div class="step-dot${s === draftSchritt ? ' active' : ''}"></div>`
        ).join('')}</div>`
      : '';

    modalOverlay.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <span class="modal-title">Ziel bearbeiten</span>
          <button class="btn-icon modal-close-btn" aria-label="Schließen">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="ziel-type-toggle" style="margin-bottom:16px;">
          <button class="toggle-opt${draftTyp === 'zeit' ? ' active' : ''}" data-typ="zeit">Zeitziel</button>
          <button class="toggle-opt${draftTyp === 'leistung' ? ' active' : ''}" data-typ="leistung">Lernziel</button>
        </div>
        ${stepIndicator}
        <div class="modal-body">${_buildBodyHtml()}</div>
      </div>`;

    modalOverlay.querySelector('.modal-close-btn').addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
    modalOverlay.querySelectorAll('.toggle-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        draftTyp     = btn.dataset.typ;
        draftSchritt = 1;
        draftModule  = [];
        renderModal();
      });
    });

    _attachBodyEvents();
  }

  // ── Speichern ─────────────────────────────────────────────
  function saveGoal() {
    zielState.typ = draftTyp;
    if (draftTyp === 'zeit') {
      zielState.tage    = [...draftTage];
      zielState.minuten = draftMinuten;
      woche.forEach(t => { t.geplant = draftTage.includes(t.tag); });
    } else {
      zielState.themaId            = draftThemaId;
      zielState.ausgewaehlteModule = [...draftModule];
      zielState.enddatum           = draftEnddatum;
      const heuteIso = `${HEUTE.jahr}-${String(HEUTE.monat).padStart(2,'0')}-${String(HEUTE.datum).padStart(2,'0')}`;
      aktivesZiel.zielStartdatum      = heuteIso;
      aktivesZiel.verlauf             = [{ datum: heuteIso, konzepte: startKonzepte }];
      aktivesZiel.thema               = draftThemaId;
      aktivesZiel.ausgewaehlteModule  = [...draftModule];
    }
    aktivesZiel.typ = zielState.typ;
    goalSet = true;
    closeModal();
    renderZielSummary();
    initRecommendation();
    showToast('Ziel gespeichert ✓');
  }

  // ── Initialer Render ──────────────────────────────────────
  _renderZielSummary = renderZielSummary;
  renderZielSummary();
}

/* ── Lernempfehlung (Metrik 9) ───────────────────────────── */
function initRecommendation() {
  const section  = document.getElementById('recommendation-section');
  const tagEl    = document.getElementById('rec-subject-tag');
  const textEl   = document.getElementById('rec-text');
  const goalEl   = document.getElementById('rec-goal-link');
  const startBtn = document.getElementById('rec-start-btn');

  if (!aktivesZiel.typ) {
    section.style.display = 'none';
    return;
  }
  section.style.display = '';

  if (aktivesZiel.typ === 'leistung') {
    const thema   = themen.find(t => t.id === aktivesZiel.thema) || themen[0];
    const selIds  = aktivesZiel.ausgewaehlteModule || [];
    const offene  = thema.module.filter(m => selIds.includes(m.id) && !m.gemeistert);

    if (offene.length === 0) {
      tagEl.textContent      = thema.name;
      textEl.textContent     = 'Alle gewählten Kapitel gemeistert 🎉 Setze ein neues Ziel um weiterzumachen.';
      goalEl.textContent     = '';
      startBtn.style.display = 'none';
      return;
    }

    const worst = offene.reduce((min, m) => {
      return (m.aufgaben > 0 ? m.geschafft / m.aufgaben : 0) <
             (min.aufgaben > 0 ? min.geschafft / min.aufgaben : 0) ? m : min;
    }, offene[0]);

    tagEl.textContent      = `${thema.name} · ${worst.name}`;
    textEl.textContent     = `Bei ${worst.name} hast du noch am meisten Potential. Genau hier lohnt es sich jetzt weiterzumachen.`;
    goalEl.textContent     = `${worst.geschafft} von ${worst.aufgaben} Aufgaben gemeistert`;
    startBtn.style.display = '';
    startBtn.onclick       = () => openAufgabenScreen(thema.id);

  } else {
    const schwächstes   = themen.reduce((min, t) => t.fortschritt < min.fortschritt ? t : min, themen[0]);
    const erstesOffenes = schwächstes.module.find(m => !m.gemeistert);
    const kapitelName   = erstesOffenes ? erstesOffenes.name : schwächstes.name;
    const gemeistert    = schwächstes.module.filter(m => m.gemeistert).length;
    const gesamt        = schwächstes.module.length;

    tagEl.textContent      = `${schwächstes.name} · ${kapitelName}`;
    textEl.textContent     = `In ${schwächstes.name} hast du noch am meisten Potential. Jetzt wäre ein guter Moment weiterzumachen.`;
    goalEl.textContent     = `${gemeistert} von ${gesamt} Kapiteln gemeistert`;
    startBtn.style.display = '';
    startBtn.onclick       = () => openAufgabenScreen(schwächstes.id);
  }
}

/* ── Aufgaben-Overlay (Vorschau) ─────────────────────────── */
function openAufgabenScreen(themaId) {
  const aufgabe = mockAufgaben.find(a => a.thema === themaId);
  if (!aufgabe) return;

  const overlay = document.getElementById('aufgaben-overlay');

  const themaMap = { AG: 'Algebra & Geometrie', FA: 'Funktionale Abhängigkeiten', AN: 'Analysis', WS: 'Wahrscheinlichkeit & Statistik' };
  const themaName = themaMap[aufgabe.thema] || aufgabe.thema;

  document.getElementById('aufgaben-badges').innerHTML =
    `<span class="status-badge badge-progress">${themaName}</span>` +
    `<span class="status-badge" style="background:rgba(142,142,147,0.12);color:var(--color-text-muted);">${aufgabe.schwierigkeit}</span>`;

  document.getElementById('aufgaben-kapitel').textContent = aufgabe.kapitel;
  document.getElementById('aufgaben-text').textContent    = aufgabe.aufgabe;

  const buchstaben = ['a', 'b', 'c', 'd'];
  document.getElementById('aufgaben-antworten').innerHTML = aufgabe.antworten.map((ant, i) =>
    `<div class="aufgaben-antwort-btn">
      <span class="aufgaben-antwort-buchstabe">${buchstaben[i]}</span>
      <span class="aufgaben-antwort-text">${ant}</span>
    </div>`
  ).join('');

  overlay.style.display = 'block';
  document.body.style.overflow = 'hidden';

  document.getElementById('aufgaben-back-btn').onclick = () => {
    overlay.style.display = 'none';
    document.body.style.overflow = '';
  };
}

/* ── Semesteranforderungen (Metrik 6) ────────────────────── */
function initRequirements() {
  const SA = semesteranforderungen;

  document.getElementById('req-content').innerHTML = `
    <button class="req-accordion-btn" style="display:flex;align-items:center;justify-content:space-between;width:100%;background:none;border:none;padding:0;cursor:pointer;">
      <span class="card-title" style="margin:0;">Semesteranforderungen</span>
      <svg id="req-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;transition:transform 0.2s;"><polyline points="6 9 12 15 18 9"/></svg>
    </button>
    <ul id="req-list" style="display:none;margin:12px 0 0 0;padding:0;list-style:none;">
      ${SA.module.map((m, i) => {
        const dot      = m.status === 'gemeistert' ? '#22C55E' : '#F97316';
        const themaClr = FT_COLORS[m.thema] || '#8E8E93';
        const themaNam = FT_NAMES[m.thema]  || m.thema;
        return `<li style="display:flex;align-items:center;gap:8px;padding:7px 0;font-size:14px;color:#334155;${i < SA.module.length - 1 ? 'border-bottom:1px solid #F1F5F9;' : ''}">
          <span style="color:${dot};font-size:10px;flex-shrink:0;">●</span>
          <span style="background:${themaClr}1A;color:${themaClr};border-radius:6px;padding:2px 8px;font-size:11px;font-weight:500;flex-shrink:0;">${themaNam}</span>
          ${m.name}</li>`;
      }).join('')}
      <li style="padding:12px 0 4px;">
        <a href="#" id="req-fortschritt-link" style="font-size:13px;color:var(--accent-blue);text-decoration:none;">→ Zum aktuellen Fortschritt</a>
      </li>
    </ul>`;

  const btn     = document.getElementById('req-content').querySelector('.req-accordion-btn');
  const list    = document.getElementById('req-list');
  const chevron = document.getElementById('req-chevron');

  btn.addEventListener('click', () => {
    const open = list.style.display === 'none';
    list.style.display  = open ? 'block' : 'none';
    chevron.style.transform = open ? 'rotate(180deg)' : 'rotate(0deg)';
  });

  document.getElementById('req-fortschritt-link').addEventListener('click', e => {
    e.preventDefault();
    showScreen('screen-fortschritt');
  });
}

/* ── Manuelle Eingabe (Metrik 28) ────────────────────────── */
function initManualEntry() {
  const root      = document.getElementById('lz-manual-root');
  const ALLE_TAGE = ['Mo','Di','Mi','Do','Fr','Sa','So'];
  const MONATS_NAMEN = ['','Jänner','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  const todayTag  = HEUTE.tag;

  const rueckwirkend = Array.from({length: 7}, (_, i) => {
    const d      = HEUTE.datum - 7 + i;
    const tagIdx = (HEUTE.wochentag - 1 - 7 + i + 7) % 7;
    return { tag: ALLE_TAGE[tagIdx], datum: d < 1 ? d + 30 : d, monat: d < 1 ? 5 : 6 };
  });

  let activePanel  = null; // null | 'analog' | 'krank'
  let histOpen     = false;
  let selKrankTage = []; // indices into rueckwirkend

  function krankChips() {
    return rueckwirkend.map((t, i) => {
      const dateStr  = `${HEUTE.jahr}-${String(t.monat).padStart(2,'0')}-${String(t.datum).padStart(2,'0')}`;
      const disabled = manualEntries.some(e => e.date && e.date.startsWith(dateStr));
      const selected = selKrankTage.includes(i);
      let sty;
      if (disabled) {
        sty = `padding:5px 10px;border-radius:20px;font-size:13px;font-weight:500;cursor:not-allowed;` +
              `background:#F8FAFC;border:1px solid #E2E8F0;color:#CBD5E1;`;
      } else if (selected) {
        sty = `padding:5px 10px;border-radius:20px;font-size:13px;font-weight:500;cursor:pointer;` +
              `background:rgba(0,122,255,0.12);border:1.5px solid var(--accent-blue);color:var(--accent-blue);`;
      } else {
        sty = `padding:5px 10px;border-radius:20px;font-size:13px;font-weight:500;cursor:pointer;` +
              `background:#F8FAFC;border:1px solid #E2E8F0;color:#475569;`;
      }
      return `<button class="krank-chip" data-idx="${i}" style="${sty}"${disabled ? ' disabled' : ''}>${t.tag} ${t.datum}.${t.monat}.</button>`;
    }).join('');
  }

  function histHtml() {
    if (manualEntries.length === 0)
      return '<li style="color:#94A3B8;font-size:13px;padding:6px 0;">Noch keine Einträge.</li>';
    return [...manualEntries].reverse().map(e => {
      const isToday = e.datum === HEUTE.datum && e.monat === HEUTE.monat;
      const label   = isToday ? 'Heute' : `${e.tag} ${e.datum}.${e.monat}.`;
      const text    = e.typ === 'analog'
        ? `${label} · ${e.minuten} min`
        : `${label} · Fehltag${e.notiz ? ' · ' + e.notiz : ''}`;
      return `<li style="padding:6px 0;font-size:13px;color:#334155;border-bottom:1px solid #F1F5F9;">${text}</li>`;
    }).join('');
  }

  function btnStyle(panel) {
    if (panel === 'analog') {
      return `width:100%;padding:11px 14px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;border:none;` +
             `background:${activePanel === 'analog' ? '#0062CC' : 'var(--accent-blue)'};color:white;`;
    } else {
      return `width:100%;padding:11px 14px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;` +
             `background:${activePanel === 'krank' ? 'rgba(0,122,255,0.06)' : 'transparent'};` +
             `border:1.5px solid var(--accent-blue);color:var(--accent-blue);`;
    }
  }

  function render() {
    const heuteLbl = `Heute · ${HEUTE.tag}, ${HEUTE.datum}. ${MONATS_NAMEN[HEUTE.monat]}`;
    root.innerHTML = `
      <div class="card-title small" style="margin-bottom:12px;">Ohne App eintragen<span class="info-icon" data-tip-title="Wozu manuell eintragen?" data-tip-text="Lernzeit mit Schulbuch oder Karteikarten zählt auch. Trag sie hier ein damit dein Lernmuster vollständig ist. Fehltage kannst du eintragen wenn du krank warst — so entsteht kein Druck deine Gewohnheiten trotzdem aufrecht zu erhalten.">?</span></div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <button id="btn-analog" style="${btnStyle('analog')}">+ Lernzeit eintragen</button>
        <button id="btn-krank"  style="${btnStyle('krank')}">+ Fehltag eintragen</button>
      </div>

      ${activePanel === 'analog' ? `
        <div style="margin-top:14px;padding-top:14px;border-top:1px solid #F1F5F9;">
          <p style="font-size:13px;color:var(--color-text-muted);margin:0 0 12px;">${heuteLbl}</p>
          <label class="field-label">Minuten</label>
          <div class="input-row" style="margin-top:6px;">
            <input type="number" id="analog-min" class="input input-sm" min="1" max="480" placeholder="z.B. 30"/>
            <span class="input-unit">min</span>
          </div>
          <button class="btn btn-secondary" id="analog-save" style="margin-top:12px;">Speichern</button>
        </div>` : ''}

      ${activePanel === 'krank' ? `
        <div style="margin-top:14px;padding-top:14px;border-top:1px solid #F1F5F9;">
          <label class="field-label" style="display:block;margin-bottom:8px;">Tag auswählen</label>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">${krankChips()}</div>
          <label class="field-label">Grund (optional)</label>
          <input type="text" id="krank-notiz" class="input" style="margin-top:6px;" placeholder="z.B. Kopfweh"/>
          <button class="btn btn-secondary" id="krank-save" style="margin-top:12px;">Speichern</button>
        </div>` : ''}

      <div style="border-top:1px solid #F1F5F9;margin-top:16px;">
        <button id="hist-toggle" style="display:flex;align-items:center;justify-content:space-between;width:100%;background:none;border:none;padding:12px 0 0;cursor:pointer;">
          <span style="font-size:13px;font-weight:600;color:#334155;">Meine Einträge</span>
          <svg id="hist-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
               style="transition:transform 0.2s;${histOpen ? 'transform:rotate(180deg);' : ''}">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        <ul id="hist-list" style="${histOpen ? '' : 'display:none;'}padding:0;margin:8px 0 0;list-style:none;">
          ${histHtml()}
        </ul>
      </div>`;

    document.getElementById('btn-analog').addEventListener('click', () => {
      activePanel = activePanel === 'analog' ? null : 'analog';
      render();
    });
    document.getElementById('btn-krank').addEventListener('click', () => {
      activePanel = activePanel === 'krank' ? null : 'krank';
      render();
    });

    root.querySelectorAll('.krank-chip:not([disabled])').forEach(chip => {
      chip.addEventListener('click', () => {
        const idx = +chip.dataset.idx;
        const pos = selKrankTage.indexOf(idx);
        if (pos === -1) selKrankTage.push(idx);
        else selKrankTage.splice(pos, 1);
        render();
      });
    });

    const analogSave = document.getElementById('analog-save');
    if (analogSave) analogSave.addEventListener('click', () => {
      const minVal = +document.getElementById('analog-min').value;
      if (!minVal || minVal < 1) { showToast('Bitte Minuten eingeben.'); return; }
      manualEntries.push({ typ: 'analog', tag: todayTag, datum: HEUTE.datum, monat: HEUTE.monat, minuten: minVal, date: `${HEUTE.jahr}-${String(HEUTE.monat).padStart(2,'0')}-${String(HEUTE.datum).padStart(2,'0')}T00:00:00.000Z` });
      if (_renderZielSummary) _renderZielSummary();
      showToast('Lernzeit eingetragen ✓');
      activePanel = null;
      render();
      renderLernzeitHeatmap();
    });

    const krankSave = document.getElementById('krank-save');
    if (krankSave) krankSave.addEventListener('click', () => {
      if (selKrankTage.length === 0) { showToast('Bitte mindestens einen Tag auswählen.'); return; }
      const notiz = document.getElementById('krank-notiz').value.trim();
      selKrankTage.forEach(i => {
        const t      = rueckwirkend[i];
        const dayIdx = ALLE_TAGE.indexOf(t.tag);
        if (dayIdx >= 0) kranktage[dayIdx] = true;
        manualEntries.push({ typ: 'krank', tag: t.tag, datum: t.datum, monat: t.monat, notiz, date: `${HEUTE.jahr}-${String(t.monat).padStart(2,'0')}-${String(t.datum).padStart(2,'0')}T00:00:00.000Z` });
      });
      if (_renderZielSummary) _renderZielSummary();
      showToast('Fehltag eingetragen ✓');
      selKrankTage = [];
      activePanel  = null;
      render();
      renderLernzeitHeatmap();
    });

    document.getElementById('hist-toggle').addEventListener('click', () => {
      histOpen = !histOpen;
      document.getElementById('hist-list').style.display      = histOpen ? 'block' : 'none';
      document.getElementById('hist-chevron').style.transform = histOpen ? 'rotate(180deg)' : 'rotate(0deg)';
    });
  }

  render();
}

/* ── Screen 2: Fortschritt ────────────────────────────────── */
const FT_COLORS = { AG: '#007AFF', FA: '#AF52DE', AN: '#5856D6', WS: '#32ADE6' };
const FT_NAMES  = { AG: 'Algebra', FA: 'Funktionen', AN: 'Analysis', WS: 'Statistik' };

function initFortschritt() {
  renderThemenKachel();
  renderSemesterChart();
  renderNotenTabelle();
  initNotenModal();
  renderAbzeichenScroll();
}

function renderThemenKachel() {
  const tabsEl    = document.getElementById('thema-tabs');
  const contentEl = document.getElementById('thema-content');
  let activeId    = themen[0].id;
  const CHECK = `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

  function renderTabs() {
    tabsEl.innerHTML = themen.map(t => {
      const active = t.id === activeId;
      const clr    = FT_COLORS[t.id];
      return `<button class="thema-tab${active ? ' active' : ''}" data-id="${t.id}"
        ${active ? `style="color:${clr};border-bottom-color:${clr};"` : ''}>${FT_NAMES[t.id]}</button>`;
    }).join('');
    tabsEl.querySelectorAll('.thema-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.id === activeId) return;
        activeId = btn.dataset.id;
        renderTabs();
        renderContent();
      });
    });
  }

  function renderContent() {
    const thema         = themen.find(t => t.id === activeId);
    const masteredCount = thema.module.filter(m => m.gemeistert).length;
    const total         = thema.module.length;
    const pct           = thema.fortschritt;
    const clr           = FT_COLORS[activeId];

    const rows = thema.module.map(m => {
      const pctM       = m.aufgaben > 0 ? Math.round((m.geschafft / m.aufgaben) * 100) : 0;
      const inProgress = !m.gemeistert && m.geschafft > 0;
      const isWeak     = inProgress && pctM < 50;

      let dot;
      if (m.gemeistert) dot = `<span class="mod-dot mod-dot--green">${CHECK}</span>`;
      else              dot = `<span class="mod-dot mod-dot--amber"></span>`;

      const pctLabel = !m.gemeistert && m.geschafft > 0
        ? `<span class="mod-pct mod-pct--amber">${pctM}%</span>`
        : '';

      return `<div class="mod-row">
        ${dot}
        <span class="mod-name${m.gemeistert ? ' mod-name--done' : !inProgress ? ' mod-name--muted' : ''}">${m.name}</span>
        ${pctLabel}
      </div>`;
    }).join('');

    contentEl.innerHTML = `
      <div class="thema-progress-section">
        <div class="thema-progress-hdr">
          <span class="thema-big-pct" style="color:${clr};">${pct}%<span class="info-icon" data-tip-title="Was ist Kompetenz %?" data-tip-text="Zeigt wie viele Kapitel du in allen verfügbaren Kapiteln dieses Themenbereichs bereits gemeistert hast.">?</span></span>
          <span class="muted small">${masteredCount} von ${total} Kapitel gemeistert</span>
        </div>
        <div class="thema-bar-track">
          <div class="thema-bar-fill" style="width:0%;background:${clr};" data-pct="${pct}"></div>
        </div>
      </div>
      <div class="mod-list">${rows}</div>`;

    const fill = contentEl.querySelector('.thema-bar-fill');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (fill) fill.style.width = pct + '%';
    }));
  }

  renderTabs();
  const tabsHint = document.createElement('p');
  tabsHint.style.cssText = 'font-size:12px;color:var(--color-text-muted);margin:6px 0 8px;';
  tabsHint.textContent = 'Farben kennzeichnen die vier Themenbereiche — keine Bewertung.';
  tabsEl.insertAdjacentElement('afterend', tabsHint);
  renderContent();
}

function renderSemesterChart() {
  const legendEl    = document.getElementById('semester-legend');
  const tooltip     = document.getElementById('semester-tooltip');
  const svgWrap     = document.getElementById('semester-svg-wrap');

  function drawChart() {
    const labels = themen[0].verlauf.labels;
    const n      = labels.length;

    const VW=340, VH=160, ML=32, MR=8, MT=10, MB=24;
    const cW=VW-ML-MR, cH=VH-MT-MB, cBot=VH-MB;
    const xI = i => ML + (i / (n - 1)) * cW;
    const yV = v => cBot - (v / 100) * cH;

    const grid = [0, 25, 50, 75, 100].map(v => {
      const y = yV(v).toFixed(1);
      return `<line x1="${ML}" y1="${y}" x2="${VW-MR}" y2="${y}" stroke="#E2E8F0" stroke-width="1"/>` +
             `<text x="${ML-5}" y="${(parseFloat(y)+3.5).toFixed(1)}" text-anchor="end" font-size="9.5" fill="#94A3B8">${v}</text>`;
    }).join('');

    const xLabels = labels.map((l, i) =>
      `<text x="${xI(i).toFixed(1)}" y="${VH-4}" text-anchor="middle" font-size="10" fill="#64748B">${l}</text>`
    ).join('');

    let lines = '', dotsSvg = '';
    themen.forEach(t => {
      const clr  = FT_COLORS[t.id];
      const vals = t.verlauf.werte;
      const d    = vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xI(i).toFixed(1)} ${yV(v).toFixed(1)}`).join(' ');
      lines += `<path class="chart-line-path" d="${d}" fill="none" stroke="${clr}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
      vals.forEach((v, i) => {
        dotsSvg += `<circle class="chart-dot" cx="${xI(i).toFixed(1)}" cy="${yV(v).toFixed(1)}" r="4.5"
          fill="${clr}" stroke="white" stroke-width="1.5"
          data-id="${t.id}" data-lbl="${labels[i]}" data-v="${v}" style="cursor:pointer;"/>`;
      });
    });

    const yAxisCy = (MT + cH / 2).toFixed(0);
    svgWrap.innerHTML = `<svg width="100%" viewBox="0 0 ${VW} ${VH}" style="display:block;overflow:visible;">
      ${grid}
      <text transform="rotate(-90, 8, ${yAxisCy})" x="8" y="${yAxisCy}" text-anchor="middle" font-size="8" fill="#94A3B8">Kompetenz (%)</text>
      <line x1="${ML}" y1="${cBot}" x2="${VW-MR}" y2="${cBot}" stroke="#CBD5E1" stroke-width="1.5"/>
      ${lines}${dotsSvg}
      ${xLabels}
    </svg>`;

    legendEl.innerHTML = themen.map(t => {
      const werte = t.verlauf.werte;
      const gain  = werte[werte.length - 1] - werte[0];
      const sign  = gain >= 0 ? '+' : '';
      return `<span class="semester-legend-item">
        <span style="display:inline-block;width:14px;height:3px;border-radius:2px;background:${FT_COLORS[t.id]};vertical-align:middle;margin-right:3px;flex-shrink:0;"></span>
        <span style="font-size:11px;color:#64748B;">${FT_NAMES[t.id]} <span style="color:${gain >= 0 ? '#22C55E' : '#EF4444'};">(${sign}${gain}%)</span></span>
      </span>`;
    }).join('');

    svgWrap.querySelectorAll('.chart-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        tooltip.textContent = `${FT_NAMES[dot.dataset.id]} · ${dot.dataset.lbl}: ${dot.dataset.v}%`;
        tooltip.classList.add('visible');
        clearTimeout(tooltip._t);
        tooltip._t = setTimeout(() => tooltip.classList.remove('visible'), 2200);
      });
    });

    if (document.getElementById('screen-fortschritt').classList.contains('active')) {
      animateSemesterLines();
    }
  }

  drawChart();
}

function renderNotenTabelle() {
  const noteClr  = n => n <= 2 ? '#22C55E' : n === 3 ? '#3B82F6' : n === 4 ? '#F59E0B' : '#EF4444';
  const MONATE_N = ['Januar','Februar','März','April','Mai','Juni',
                    'Juli','August','September','Oktober','November','Dezember'];
  function fmtIso(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return `${d}. ${MONATE_N[m-1]} ${y}`;
  }

  const newRows = [...notenEintraege]
    .sort((a, b) => b.datum.localeCompare(a.datum))
    .map(n => {
      const clr = noteClr(n.note);
      return `<tr class="noten-tr">
        <td class="noten-td noten-td-datum">${fmtIso(n.datum)}</td>
        <td class="noten-td">${n.beschreibung}</td>
        <td class="noten-td noten-td-note">
          <span class="note-pill" style="color:${clr};background:${clr}18;border:1px solid ${clr}40;">${n.note}</span>
        </td>
      </tr>`;
    }).join('');

  const existingRows = noten.map(n => {
    const desc = n.typ === 'Schularbeit' && n.nummer ? `${n.nummer} Schularbeit` : n.typ;
    const clr  = noteClr(n.note);
    return `<tr class="noten-tr">
      <td class="noten-td noten-td-datum">${n.datum}</td>
      <td class="noten-td">${desc}</td>
      <td class="noten-td noten-td-note">
        <span class="note-pill" style="color:${clr};background:${clr}18;border:1px solid ${clr}40;">${n.note}</span>
      </td>
    </tr>`;
  }).join('');

  document.getElementById('noten-table-wrap').innerHTML = `<table class="noten-table">
    <thead>
      <tr>
        <th class="noten-th">Datum</th>
        <th class="noten-th">Beschreibung</th>
        <th class="noten-th noten-th-note">Note</th>
      </tr>
    </thead>
    <tbody>${newRows}${existingRows}</tbody>
  </table>`;
}

function initNotenModal() {
  const overlay = document.createElement('div');
  overlay.id = 'noten-modal';
  overlay.className = 'modal-overlay hidden';
  overlay.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <span class="modal-title">Note eintragen</span>
        <button class="btn-icon" id="noten-modal-close" aria-label="Schließen">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="modal-section">
          <label class="field-label">Datum</label>
          <input type="date" id="noten-datum" class="input" style="margin-top:6px;"/>
        </div>
        <div class="modal-section">
          <label class="field-label">Beschreibung</label>
          <input type="text" id="noten-beschreibung" class="input" style="margin-top:6px;" placeholder="z.B. 2. Schularbeit"/>
        </div>
        <div class="modal-section">
          <label class="field-label">Note</label>
          <div class="chip-row" style="margin-top:8px;">
            ${[1,2,3,4,5].map(n => `<button class="chip noten-chip" data-note="${n}">${n}</button>`).join('')}
          </div>
        </div>
        <button class="btn btn-primary" id="noten-save-btn" disabled>Speichern</button>
      </div>
    </div>`;
  document.querySelector('.app-container').appendChild(overlay);

  let selectedNote = null;

  function open() {
    document.getElementById('noten-datum').value = '';
    document.getElementById('noten-beschreibung').value = '';
    overlay.querySelectorAll('.noten-chip').forEach(c => c.classList.remove('active'));
    selectedNote = null;
    document.getElementById('noten-save-btn').disabled = true;
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
  }

  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.getElementById('noten-modal-close').addEventListener('click', close);

  overlay.querySelectorAll('.noten-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      overlay.querySelectorAll('.noten-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedNote = +chip.dataset.note;
      document.getElementById('noten-save-btn').disabled = false;
    });
  });

  document.getElementById('noten-save-btn').addEventListener('click', () => {
    const datum        = document.getElementById('noten-datum').value;
    const beschreibung = document.getElementById('noten-beschreibung').value.trim() || 'Eintrag';
    if (!datum) { showToast('Bitte Datum wählen.'); return; }
    notenEintraege.push({ datum, beschreibung, note: selectedNote });
    close();
    renderNotenTabelle();
    showToast('Note eingetragen ✓');
  });

  document.getElementById('noten-add-btn').addEventListener('click', open);
}

function renderAbzeichenScroll() {
  const wrap    = document.getElementById('abz-scroll-wrap');
  const dotsEl  = document.getElementById('abz-dots');
  const prevBtn = document.getElementById('abz-prev-btn');
  const nextBtn = document.getElementById('abz-next-btn');

  const STAR = `<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>`;
  const LOCK = `<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>`;

  const sorted = [...abzeichen].sort((a, b) => (a.locked ? 1 : 0) - (b.locked ? 1 : 0));
  const PAGE_SIZE  = 3;
  const ITEM_W     = 104 + 8;   // item width + gap
  const PAGE_W     = ITEM_W * PAGE_SIZE;
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  let currentPage  = 0;

  wrap.innerHTML = sorted.map(b => {
    const frei = !b.locked;
    const clr  = frei ? (FT_COLORS[b.thema] || '#3B82F6') : '#CBD5E1';
    return `<div class="abz-item${frei ? '' : ' abz-item--locked'}">
      <div class="abz-icon" style="background:${clr}18;border:1.5px solid ${clr}35;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="${clr}" stroke="none">${frei ? STAR : LOCK}</svg>
      </div>
      <div class="abz-label">${b.titel}</div>
      <div class="abz-sub">${b.datum || 'Gesperrt'}</div>
    </div>`;
  }).join('');

  dotsEl.innerHTML = Array.from({ length: totalPages }, (_, i) =>
    `<span class="abz-dot${i === 0 ? ' active' : ''}"></span>`
  ).join('');

  function updateUI() {
    dotsEl.querySelectorAll('.abz-dot').forEach((d, i) =>
      d.classList.toggle('active', i === currentPage)
    );
    prevBtn.classList.toggle('abz-arrow-btn--hidden', currentPage === 0);
    nextBtn.classList.toggle('abz-arrow-btn--hidden', currentPage >= totalPages - 1);
  }

  function goToPage(page) {
    currentPage = Math.max(0, Math.min(page, totalPages - 1));
    wrap.scrollTo({ left: currentPage * PAGE_W, behavior: 'smooth' });
    updateUI();
  }

  prevBtn.addEventListener('click', () => goToPage(currentPage - 1));
  nextBtn.addEventListener('click', () => goToPage(currentPage + 1));

  wrap.addEventListener('scroll', () => {
    const page = Math.max(0, Math.min(Math.round(wrap.scrollLeft / PAGE_W), totalPages - 1));
    if (page !== currentPage) { currentPage = page; updateUI(); }
  }, { passive: true });

  updateUI();
}

/* ── Screen 3: Reflexion ─────────────────────────────────── */
let refKompValue = null;  // null = not yet touched
let refEmoValue  = null;  // null = not yet touched

function initReflexion() {
  renderCheckin();
  renderEntwicklungsChart();
  updateReflexionEmpfehlung();
}

function setSliderFill(el, color) {
  const pct = Math.round(((el.value - el.min) / (el.max - el.min)) * 100);
  el.style.backgroundImage =
    `linear-gradient(to right, ${color} ${pct}%, #E2E8F0 ${pct}%)`;
}

function renderCheckin() {
  const kompSlider = document.getElementById('ref-komp-slider');
  const kompHint   = document.getElementById('ref-komp-hint');

  kompSlider.min   = 0;
  kompSlider.max   = 10;
  kompSlider.value = 5;
  kompSlider.style.setProperty('--thumb-color', '#60B4FF');

  ['mousedown', 'touchstart'].forEach(evt => {
    kompSlider.addEventListener(evt, () => {
      kompSlider.classList.remove('ref-slider--empty');
    }, { once: true });
  });

  kompSlider.addEventListener('input', () => {
    if (refKompValue === null) {
      kompSlider.classList.remove('ref-slider--empty');
      kompHint.style.display = 'none';
    }
    refKompValue = parseInt(kompSlider.value);
    setSliderFill(kompSlider, '#60B4FF');
    updateReflexionEmpfehlung();
  });

  const emoSlider = document.getElementById('ref-emo-slider');
  const emoHint   = document.getElementById('ref-emo-hint');
  emoSlider.min   = 0;
  emoSlider.max   = 10;
  emoSlider.value = 5;
  emoSlider.style.setProperty('--thumb-color', '#C4B5FD');

  ['mousedown', 'touchstart'].forEach(evt => {
    emoSlider.addEventListener(evt, () => {
      emoSlider.classList.remove('ref-slider--empty');
    }, { once: true });
  });

  emoSlider.addEventListener('input', () => {
    if (refEmoValue === null) {
      emoSlider.classList.remove('ref-slider--empty');
      emoHint.style.display = 'none';
    }
    refEmoValue = parseInt(emoSlider.value);
    setSliderFill(emoSlider, '#C4B5FD');
    updateReflexionEmpfehlung();
  });
}

function updateReflexionEmpfehlung() {
  const el = document.getElementById('ref-empfehlung-content');

  if (refKompValue === null || refEmoValue === null) {
    el.innerHTML = `<p class="ref-placeholder-text">Mach deine wöchentlichen Check-ins um eine persönliche Lernstrategie zu erhalten.</p>`;
    return;
  }

  const kompetenz = Math.round((refKompValue / 10) * 100);
  const emotion   = Math.round((refEmoValue  / 10) * 100);

  const MATRIX = [
    { // wenig + frustriert
      titel: 'Kleiner Schritt vorwärts',
      text: 'Diese Woche war mühsam, das passiert. Starte mit einer kurzen einfachen Aufgabe. Manchmal reicht ein kleiner Schritt um wieder in den Fluss zu kommen.'
    },
    { // wenig + neugierig
      titel: 'Einfach ausprobieren',
      text: 'Du bist neugierig aber noch nicht richtig in Gang gekommen. Perfekter Moment für eine Einstiegsaufgabe, schau einfach was du schon weißt.'
    },
    { // mittel + frustriert
      titel: 'Kurze Auffrischung',
      text: 'Du hast etwas geschafft, auch wenn es sich nicht so anfühlt. Eine kurze Wiederholung eines bekannten Kapitels kann helfen das Vertrauen zurückzubringen.'
    },
    { // mittel + neugierig
      titel: 'Nächste Stufe',
      text: 'Solide Woche und du bist motiviert. Genau jetzt lohnt es sich ein Kapitel anzugehen das du noch nicht gut kennst.'
    },
    { // viel + frustriert
      titel: 'Durchatmen',
      text: 'Du hast viel geleistet aber fühlst dich trotzdem nicht gut dabei. Gönn dir eine Pause oder mach etwas das dir leicht fällt um die Woche positiv abzuschließen.'
    },
    { // viel + neugierig
      titel: 'Volle Kraft',
      text: 'Starke Woche und du bist in Topform. Jetzt ist der beste Moment für eine echte Herausforderung. Greif das schwierigste offene Kapitel an.'
    }
  ];

  const fortIdx = kompetenz <= 33 ? 0 : kompetenz <= 66 ? 1 : 2;
  const emoIdx  = emotion < 50 ? 0 : 1;
  const idx = fortIdx * 2 + emoIdx;
  const rec = MATRIX[idx];

  el.innerHTML = `
    <p class="ref-rec-titel">${rec.titel}</p>
    <p class="ref-rec-body">${rec.text}</p>
    <p class="ref-rec-modul">Nächster Schritt: ${empfehlungen.ziel.modul}</p>
    <button class="btn btn-primary" id="ref-jetzt-starten" style="margin-top:8px;">Jetzt starten</button>`;

  const refStartBtn = document.getElementById('ref-jetzt-starten');
  if (refStartBtn) refStartBtn.addEventListener('click', () => openAufgabenScreen(aktivesZiel.thema || 'AN'));
}

function renderEntwicklungsChart() {
  const wrap     = document.getElementById('ref-verlauf-content');
  const kompData = reflexion.kompetenzVerlauf;
  const emoData  = reflexion.emotionVerlauf;
  const labels   = kompData.map(d => d.label);
  const n        = labels.length;

  const W = 310, H = 110;
  const PAD = { top: 8, right: 12, bottom: 22, left: 22 };
  const iW  = W - PAD.left - PAD.right;
  const iH  = H - PAD.top  - PAD.bottom;

  const xS = i => PAD.left + (i / (n - 1)) * iW;
  const yS = v => PAD.top  + iH - ((v - 1) / 9) * iH;

  function polyline(data, color) {
    const pts = data.map((d, i) => `${xS(i).toFixed(1)},${yS(d.wert).toFixed(1)}`).join(' ');
    return `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  function dots(data, color) {
    return data.map((d, i) =>
      `<circle cx="${xS(i).toFixed(1)}" cy="${yS(d.wert).toFixed(1)}" r="3.5" fill="white" stroke="${color}" stroke-width="1.5"/>`
    ).join('');
  }

  const yTicks  = [1, 4, 7, 10];
  const yLines  = yTicks.map(v =>
    `<line x1="${PAD.left}" y1="${yS(v).toFixed(1)}" x2="${PAD.left + iW}" y2="${yS(v).toFixed(1)}" stroke="#E2E8F0" stroke-width="1"/>`
  ).join('');
  const yLabels = yTicks.map(v =>
    `<text x="${PAD.left - 4}" y="${(yS(v) + 3.5).toFixed(1)}" text-anchor="end" font-size="9" fill="#94A3B8">${v}</text>`
  ).join('');
  const xLabels = labels.map((l, i) =>
    `<text x="${xS(i).toFixed(1)}" y="${H - 3}" text-anchor="middle" font-size="9" fill="#94A3B8">${l}</text>`
  ).join('');

  wrap.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;overflow:visible;">
      ${yLines}${yLabels}
      ${polyline(kompData, '#60B4FF')}
      ${polyline(emoData,  '#C4B5FD')}
      ${dots(kompData, '#60B4FF')}
      ${dots(emoData,  '#C4B5FD')}
      ${xLabels}
    </svg>
    <div class="ref-verlauf-legend">
      <span class="ref-verlauf-dot" style="background:#60B4FF;"></span>
      <span class="ref-verlauf-lbl">Gefühlter Lernfortschritt</span>
      <span class="ref-verlauf-dot" style="background:#C4B5FD;"></span>
      <span class="ref-verlauf-lbl">Emotionen beim Lernen</span>
    </div>`;
}

function renderLernzeitHeatmap() {
  const wrap = document.getElementById('lz-muster-content');

  function minToColor(min) {
    if (min === 0)    return '#F2F2F7';
    if (min <= 15)    return '#BFD9FF';
    if (min <= 30)    return '#6EB3FF';
    return '#007AFF';
  }

  const TAGE = ['Mo','Di','Mi','Do','Fr','Sa','So'];
  const DAYS_IN_MONTH = [31,28,31,30,31,30,31,31,30,31,30,31];
  const daysInMonth  = DAYS_IN_MONTH[HEUTE.monat - 1];
  const todayColIdx  = HEUTE.wochentag - 1;

  // Datum jeder Spalte der aktuellen Woche
  const weekDates = Array.from({length: 7}, (_, i) => {
    const d = HEUTE.datum + (i - todayColIdx);
    if (d < 1)          return d + DAYS_IN_MONTH[(HEUTE.monat - 2 + 12) % 12];
    if (d > daysInMonth) return d - daysInMonth;
    return d;
  });

  // Header: Tageskürzel + Datum; heutiger Tag in Blau
  const headerRow =
    `<div class="lz-heatmap-kw"></div>` +
    TAGE.map((t, i) => {
      const isToday = i === todayColIdx;
      const style   = isToday ? `color:var(--accent-blue);font-weight:600;` : '';
      return `<div class="lz-heatmap-day" style="${style}"><span>${t}</span><span>${weekDates[i]}</span></div>`;
    }).join('');

  const ROW_LABELS = ['Vor 3<br>Wochen', 'Vor 2<br>Wochen', 'Letzte<br>Woche', 'Diese<br>Woche'];

  const manuelleMinutenHeute = manualEntries
    .filter(e => e.typ === 'analog' && e.tag === HEUTE.tag)
    .reduce((sum, e) => sum + e.minuten, 0);

  const dataRows = lernzeitVerlauf.map((kw, wi) => {
    const isCurrent = wi === lernzeitVerlauf.length - 1;
    const kwStyle   = isCurrent ? `font-weight:600;color:var(--color-text);` : '';

    // Gestrichelte Trennlinie vor der aktuellen Woche
    const separator = isCurrent
      ? `<div style="grid-column:1/-1;height:0;border-top:1.5px dashed rgba(0,122,255,0.25);margin:2px 0;"></div>`
      : '';

    const cells = kw.tage.map((d, di) => {
      const appMinutenHeute = lernzeitmuster.find(t => t.tag === HEUTE.tag)?.minuten || 0;
      const effMin = (isCurrent && di === todayColIdx)
        ? d.minuten + manuelleMinutenHeute + appMinutenHeute
        : d.minuten;
      const bg = minToColor(effMin);
      let outline = '';
      if (isCurrent && di === todayColIdx) {
        outline = 'outline:2px solid var(--accent-blue);outline-offset:1px;';
      } else if (isCurrent) {
        outline = 'outline:1.5px solid rgba(0,122,255,0.2);outline-offset:1px;';
      }
      if (effMin === 0) {
        const isKrank = manualEntries.some(e =>
          e.typ === 'krank' && e.tag === d.tag &&
          e.datum === d.datum && e.monat === d.monat
        );
        if (isKrank) {
          return `<div class="lz-heatmap-cell" style="background:var(--bg-card);${outline};display:flex;align-items:center;justify-content:center;font-size:12px;" title="Fehltag">🤒</div>`;
        }
      }
      return `<div class="lz-heatmap-cell" style="background:${bg};${outline}" title="${effMin} min"></div>`;
    }).join('');

    return `${separator}<div class="lz-heatmap-kw" style="${kwStyle}">${ROW_LABELS[wi]}</div>${cells}`;
  }).join('');

  const legendItems = [
    { color: '#F2F2F7', label: '0 min' },
    { color: '#BFD9FF', label: '1–15 min' },
    { color: '#6EB3FF', label: '16–30 min' },
    { color: '#007AFF', label: '31+ min' },
  ];
  const legendHtml = legendItems.map(({ color, label }) =>
    `<div style="display:flex;align-items:center;gap:4px;">` +
    `<div style="width:14px;height:14px;background:${color};border-radius:3px;flex-shrink:0;"></div>` +
    `<span style="font-size:11px;color:var(--color-text-muted);">${label}</span>` +
    `</div>`
  ).join('');

  const totalAllMin  = lernzeitVerlauf.reduce((a, kw) => a + kw.tage.reduce((b, d) => b + d.minuten, 0), 0);
  const totalAllDays = lernzeitVerlauf.reduce((a, kw) => a + kw.tage.filter(d => d.minuten > 0).length, 0);
  const totalMin   = Math.round(totalAllMin  / lernzeitVerlauf.length);
  const activeDays = Math.round(totalAllDays / lernzeitVerlauf.length);
  const avgActive  = totalAllDays > 0 ? Math.round(totalAllMin / totalAllDays) : 0;

  const goalLink = aktivesZiel.typ === 'zeit'
    ? `<p id="lz-goal-link" style="margin-top:14px;font-size:13px;color:var(--accent-blue);cursor:pointer;text-align:center;">Zeitziel anpassen →</p>`
    : '';

  wrap.innerHTML = `
    <div class="card-title" style="margin-bottom:12px;">Dein Lernmuster<span class="info-icon" data-tip-title="Was zeigt das Lernmuster?" data-tip-text="Jedes Kästchen steht für einen Tag. Je dunkler das Blau, desto länger hast du an diesem Tag gelernt. So erkennst du deine Lerngewohnheiten auf einen Blick.">?</span></div>
    <div class="lz-heatmap-grid">${headerRow}${dataRows}</div>
    <div style="display:flex;align-items:center;gap:10px;margin-top:8px;flex-wrap:wrap;">
      ${legendHtml}
    </div>
    <div class="zt-stats" style="margin-top:14px;">
      <div class="zt-stat">
        <span class="zt-stat-val">${activeDays}</span>
        <span class="zt-stat-lbl">Ø Lerntage / Woche</span>
      </div>
      <div class="zt-stat">
        <span class="zt-stat-val">${totalMin}</span>
        <span class="zt-stat-lbl">Ø Minuten / Woche</span>
      </div>
      <div class="zt-stat">
        <span class="zt-stat-val">${avgActive}</span>
        <span class="zt-stat-lbl">Ø Minuten / Tag</span>
      </div>
    </div>
    <p style="font-size:11px;color:var(--color-text-muted);text-align:center;margin:4px 0 0;">Ø Durchschnitt der letzten 4 Wochen</p>
    ${goalLink}`;

  if (aktivesZiel.typ === 'zeit') {
    document.getElementById('lz-goal-link').addEventListener('click', () => {
      showScreen('screen-ziel');
      setTimeout(() => {
        const btn = document.getElementById('ziel-edit-btn');
        if (btn) btn.click();
      }, 150);
    });
  }
}

/* ── Screen 3: Lernzeit ──────────────────────────────────── */
function initLernzeit() {
  renderLernzeitHeatmap();
  initManualEntry();
}

/* ── Screen 4: Anpassungen ────────────────────────────────── */
const anpassungenState = {
  abzeichen:        true,
  lernzeitmuster:   true,
  noten:            true,
  anforderungen:    true,
  mikronachrichten: true,
};

const TOGGLE_CONFIG = [
  { key: 'anforderungen',    label: 'Leistungsanforderungen', loc: 'Screen: Ziel',        targetId: 'requirements-section' },
  { key: 'abzeichen',        label: 'Lernabzeichen',          loc: 'Screen: Fortschritt', targetId: 'abzeichen-section' },
  { key: 'noten',            label: 'Notenübersicht',         loc: 'Screen: Fortschritt', targetId: 'noten-section' },
  { key: 'lernzeitmuster',   label: 'Lernzeitmuster',         loc: 'Screen: Lernzeit',    targetId: 'lz-muster-card' },
  { key: 'mikronachrichten', label: 'Motivationsnachrichten',  loc: 'Screen: Lernzeit',    targetSelector: '.zt-pattern', dependsOn: 'lernzeitmuster' },
];

const LOCKED_CONFIG = [
  { label: 'Ziel-Visualisierung',          reason: 'Zeigt deinen Fortschritt zum aktiven Ziel.' },
  { label: 'Fortschrittsbalken pro Thema', reason: 'Kern-Feedback zu deinem Lehrplanfortschritt.' },
  { label: 'Lernfortschritt-Slider',        reason: 'Wöchentliche Selbsteinschätzung.' },
  { label: 'Emotions-Slider',              reason: 'Grundlage für die Lernempfehlung.' },
  { label: 'Lernempfehlungen',             reason: 'Dein personalisierter nächster Schritt.' },
  { label: 'Info-Tooltips',                reason: 'Erklärungen zu allen Metriken.' },
];

const PUSH_CONFIG = [
  { key: 'checkin', label: 'Wöchentliche Erinnerung zum Check-in' },
  { key: 'lernen',  label: 'Lern-Erinnerungen' },
];

const pushState = { checkin: true, lernen: true };

const LOCK_SVG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
</svg>`;

function applyAnpassung(cfg) {
  const el = cfg.targetId
    ? document.getElementById(cfg.targetId)
    : document.querySelector(cfg.targetSelector);
  if (!el) return;
  el.classList.toggle('hidden', !anpassungenState[cfg.key]);
}

function initAnpassungen() {
  const toggleList = document.getElementById('anp-toggle-list');
  const lockedList = document.getElementById('anp-locked-list');

  toggleList.innerHTML = TOGGLE_CONFIG.map(cfg => {
    const dependencyOff = cfg.dependsOn && !anpassungenState[cfg.dependsOn];
    return `<div class="anp-item${dependencyOff ? ' anp-item--disabled' : ''}" data-key="${cfg.key}">
      <div class="anp-item-info">
        <span class="anp-item-name">${cfg.label}</span>
        <span class="anp-item-loc">${cfg.loc}</span>
      </div>
      <label class="ios-toggle">
        <input type="checkbox" ${anpassungenState[cfg.key] ? 'checked' : ''} data-key="${cfg.key}">
        <span class="ios-toggle-track"></span>
      </label>
    </div>`;
  }).join('');

  lockedList.innerHTML = LOCKED_CONFIG.map(cfg => `
    <div class="anp-locked-item">
      <div class="anp-lock-icon">${LOCK_SVG}</div>
      <div class="anp-locked-info">
        <span class="anp-locked-name">${cfg.label}</span>
        <span class="anp-locked-reason">${cfg.reason}</span>
      </div>
    </div>`).join('');

  toggleList.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      const key = cb.dataset.key;
      anpassungenState[key] = cb.checked;
      applyAnpassung(TOGGLE_CONFIG.find(c => c.key === key));

      if (key === 'lernzeitmuster') {
        const mikroRow = toggleList.querySelector('[data-key="mikronachrichten"]');
        if (mikroRow) mikroRow.classList.toggle('anp-item--disabled', !cb.checked);
      }
    });
  });
}

/* ── Screen 4: Push-Benachrichtigungen ───────────────────── */
function initPushToggles() {
  const list = document.getElementById('anp-push-list');
  if (!list) return;
  list.innerHTML = PUSH_CONFIG.map(cfg => `
    <div class="anp-item">
      <div class="anp-item-info">
        <span class="anp-item-name">${cfg.label}</span>
      </div>
      <label class="ios-toggle">
        <input type="checkbox" ${pushState[cfg.key] ? 'checked' : ''} data-push-key="${cfg.key}">
        <span class="ios-toggle-track"></span>
      </label>
    </div>`).join('');

  list.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      pushState[cb.dataset.pushKey] = cb.checked;
    });
  });
}

/* ── Onboarding ──────────────────────────────────────────── */
function initOnboarding() {
  const overlay = document.getElementById('onboarding-overlay');
  if (!overlay) return;

  const slides = overlay.querySelectorAll('.onb-slide');
  const dotsEl = document.getElementById('onb-dots');
  const dotEls = dotsEl.querySelectorAll('.onb-dot');
  const btn    = document.getElementById('onb-btn');
  const total  = slides.length;
  let current  = 0;

  document.body.style.overflow = 'hidden';

  btn.addEventListener('click', () => {
    if (current < total - 1) {
      slides[current].classList.remove('active');
      dotEls[current].classList.remove('active');
      current++;
      slides[current].classList.add('active');
      dotEls[current].classList.add('active');
      if (current === total - 1) {
        dotsEl.style.display = 'none';
        btn.style.display = 'none';
      }
    } else {
      overlay.remove();
      document.body.style.overflow = '';
    }
  });

  overlay.querySelectorAll('#onb-nav [data-screen]').forEach(tab => {
    tab.addEventListener('click', () => {
      overlay.remove();
      document.body.style.overflow = '';
      showScreen(tab.dataset.screen);
    });
  });
}

/* ── Init ────────────────────────────────────────────────── */
function init() {
  initOnboarding();
  initZielBlock();
  initRecommendation();
  initRequirements();
  initFortschritt();
  initLernzeit();
  initReflexion();
  initAnpassungen();
  initPushToggles();
  initInfoTooltips();
}

document.addEventListener('DOMContentLoaded', init);
