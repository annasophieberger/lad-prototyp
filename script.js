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
}

document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', () => showScreen(tab.dataset.screen));
});


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

  const zielState = {
    typ:                aktivesZiel.typ || 'leistung',
    tage:               woche.filter(t => t.geplant).map(t => t.tag),
    minuten:            aktivesZiel.minuten || 15,
    themaId:            defaultThema.id,
    ausgewaehlteModule: defaultModule,
    enddatum:           aktivesZiel.enddatum || '30. Juni 2026',
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
    if (zielState.typ === 'zeit') _renderZeitChart(container);
    else                          _renderLeistungChart(container);
    document.getElementById('ziel-edit-btn').addEventListener('click', openModal);
  }

  function _renderZeitChart(container) {
    const goalMin  = zielState.minuten;
    const ALL_TAGS = ['Mo','Di','Mi','Do','Fr','Sa','So'];
    const daily    = ALL_TAGS.map((tag, i) => ({
      tag,
      app:     lernzeitmuster[i] ? lernzeitmuster[i].minuten : 0,
      manual:  manuellZeiten[i]  ? manuellZeiten[i].minuten  : 0,
      done:    woche[i] ? woche[i].erledigt : false,
      planned: woche[i] ? woche[i].geplant  : false,
    }));

    const maxY  = Math.max(goalMin * 1.3, Math.max.apply(null, daily.map(d => d.app + d.manual)), 1);
    const VW=340, VH=158, ML=28, MR=6;
    const cRowY=6, cRowH=24, cTop=cRowY+cRowH+6, cBot=VH-22, cH=cBot-cTop;
    const cW    = VW - ML - MR;
    const colW  = cW / 7, barW = Math.min(colW * 0.52, 20);
    const xC    = i => ML + (i + 0.5) * colW;
    const yV    = v => cBot - (v / maxY) * cH;
    const goalY = yV(goalMin);

    const checkRow = daily.map((d, i) => {
      const cx = xC(i), cy = cRowY + cRowH / 2, r = 9;
      const erreicht = (d.app + d.manual) >= goalMin;
      if (erreicht)
        return `<circle cx="${cx.toFixed(1)}" cy="${cy}" r="${r}" fill="#22C55E"/>` +
               `<polyline points="${(cx-4).toFixed(1)},${cy} ${(cx-1.5).toFixed(1)},${cy+3} ${(cx+4.5).toFixed(1)},${cy-3}" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
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

    container.innerHTML = `
      <div class="ziel-type-row"><span class="summary-type-label">Zeitziel · ${goalMin} min/Tag</span>${PENCIL_BTN}</div>
      <svg width="100%" viewBox="0 0 ${VW} ${VH}" style="display:block;overflow:visible;">
        ${checkRow}
        <line x1="${ML}" y1="${cBot}" x2="${VW-MR}" y2="${cBot}" stroke="#E2E8F0" stroke-width="1"/>
        <line x1="${ML}" y1="${goalY.toFixed(1)}" x2="${VW-MR}" y2="${goalY.toFixed(1)}"
              stroke="#F59E0B" stroke-width="1.5" stroke-dasharray="4,3"/>
        <text x="${(ML-2).toFixed(1)}" y="${(goalY+4).toFixed(1)}" text-anchor="end"
              font-size="10" fill="#F59E0B" font-weight="600">${goalMin}</text>
        ${bars}
        ${xLabels}
      </svg>
      <div class="chart-legend">
        <span class="legend-dot" style="background:#3B82F6;"></span>
        <span class="legend-lbl">App</span>
        <span class="legend-dot" style="background:#BFDBFE;border:1px solid #93C5FD;"></span>
        <span class="legend-lbl">Manuell</span>
      </div>`;
  }

  function _renderLeistungChart(container) {
    const thema         = themen.find(t => t.id === zielState.themaId) || themen[0];
    const selModule     = thema.module.filter(m => zielState.ausgewaehlteModule.includes(m.id));
    const totalKonzepte = selModule.reduce((s, m) => s + m.aufgaben, 0);

    const verlauf   = aktivesZiel.verlauf || [];
    const startDate = new Date(aktivesZiel.zielStartdatum);
    const endDate   = new Date(enddatumToISO(zielState.enddatum));
    const today     = new Date(); today.setHours(0, 0, 0, 0);
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

    // Dots at every verlauf entry
    const dots = verlauf.map((v, i) => {
      const cx = xT(new Date(v.datum)).toFixed(1);
      const cy = yK(v.konzepte).toFixed(1);
      const isLast = i === verlauf.length - 1;
      return `<circle cx="${cx}" cy="${cy}" r="${isLast ? 4 : 3}"
        fill="${isLast ? '#3B82F6' : '#93C5FD'}" stroke="white" stroke-width="1.5"/>`;
    }).join('');

    // Count label near last dot
    const countLabelY = yLastV < MT + 20 ? yLastV + 14 : yLastV - 9;

    // Tempo calculations
    const daysRemaining  = Math.max(0, Math.ceil((endDate - today) / 86400000));
    const konzepteNoch   = totalKonzepte - lastKonzepte;
    const daysSinceStart = Math.max(1, Math.round((today - startDate) / 86400000));
    const tempoNoetig    = daysRemaining > 0 ? (konzepteNoch / daysRemaining).toFixed(1) : '–';
    const tempoBisher    = (lastKonzepte / daysSinceStart).toFixed(1);
    const zielErreicht   = konzepteNoch <= 0;
    const gutImPlan      = zielErreicht || (daysRemaining > 0
      ? parseFloat(tempoBisher) >= parseFloat(tempoNoetig)
      : true);
    const tempoColor = gutImPlan ? '#22C55E' : '#F97316';

    container.innerHTML = `
      <div class="ziel-type-row"><span class="summary-type-label">Lernziel</span>${PENCIL_BTN}</div>
      <p class="summary-thema">${thema.name}</p>
      <p class="summary-meta" style="margin-top:4px;">
        ${selModule.length} Module · ${totalKonzepte} Konzepte · bis ${zielState.enddatum}
      </p>
      <svg width="100%" viewBox="0 0 ${VW} ${VH}" style="display:block;overflow:visible;margin-top:8px;">
        <line x1="${ML}" y1="${cBot}" x2="${xEnd.toFixed(1)}" y2="${cBot}" stroke="#E2E8F0" stroke-width="1"/>
        <line x1="${ML}" y1="${yGoal.toFixed(1)}" x2="${xEnd.toFixed(1)}" y2="${yGoal.toFixed(1)}"
              stroke="#F59E0B" stroke-width="1.5" stroke-dasharray="5,3"/>
        <text x="${(xEnd - 2).toFixed(1)}" y="${(yGoal - 4).toFixed(1)}" text-anchor="end"
              font-size="10" fill="#F59E0B" font-weight="600">Ziel: ${totalKonzepte}</text>
        <path d="${areaPath}" fill="#3B82F6" fill-opacity="0.12"/>
        <path d="${linePath}" fill="none" stroke="#3B82F6" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="${xLastV.toFixed(1)}" y1="${yLastV.toFixed(1)}" x2="${xEnd.toFixed(1)}" y2="${yGoal.toFixed(1)}"
              stroke="#94A3B8" stroke-width="1.5" stroke-dasharray="4,3"/>
        <line x1="${xToday.toFixed(1)}" y1="${MT}" x2="${xToday.toFixed(1)}" y2="${cBot}"
              stroke="#3B82F6" stroke-width="1" stroke-dasharray="2,2" opacity="0.35"/>
        ${dots}
        <text x="${xLastV.toFixed(1)}" y="${countLabelY.toFixed(1)}" text-anchor="middle"
              font-size="10" fill="#3B82F6" font-weight="600">${lastKonzepte}</text>
        <text x="${xStart.toFixed(1)}" y="${VH - 5}" text-anchor="start"
              font-size="10" fill="#64748B">${fmtD(startDate)}</text>
        <text x="${xToday.toFixed(1)}" y="${VH - 5}" text-anchor="middle"
              font-size="10" fill="#3B82F6" font-weight="600">Heute</text>
        <text x="${xEnd.toFixed(1)}" y="${VH - 5}" text-anchor="end"
              font-size="10" fill="#64748B">${fmtD(endDate)}</text>
      </svg>
      <div class="tempo-block">
        ${zielErreicht ? `
          <div class="tempo-row"><span>Ziel frühzeitig erreicht! 🎉</span></div>
        ` : `
          <div class="tempo-row"><span>Bisheriges Tempo: ${tempoBisher} Konzepte/Tag</span></div>
          <div class="tempo-row"><span>Nötiges Tempo: ${tempoNoetig} Konzepte/Tag</span></div>
          <div class="tempo-row"><span>${gutImPlan
            ? `Läuft nach Plan <span style="color:#22C55E;font-size:10px;">●</span>`
            : `Aufholen um Ziel zu erreichen <span style="color:#F97316;font-size:10px;">●</span>`
          }</span></div>
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
            Module wählen <span class="muted">(max. 5)</span>
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
            <strong>${draftModule.length} Module</strong> · <strong>${totalKonzepte} Konzepte</strong>
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
      const _now          = new Date(); _now.setHours(0,0,0,0);
      const _minIso       = _now.toISOString().slice(0,10);
      const _sel          = isoVal ? new Date(isoVal) : null;
      const dateOk        = !!(_sel && _sel >= _now);
      return `
        <div class="modal-section">
          <label class="field-label">Bis wann?</label>
          <input type="date" id="modal-enddatum" class="input" value="${isoVal}"
            style="margin-top:8px;" min="${_minIso}" />
          <p class="date-error"${dateOk ? ' style="display:none;"' : ''}>Bitte ein zukünftiges Datum wählen</p>
          <div class="step3-summary">
            <span class="step3-item">${thema.name}</span>
            <span class="step3-sep">·</span>
            <span class="step3-item">${selModule.length} Module</span>
            <span class="step3-sep">·</span>
            <span class="step3-item">${totalKonzepte} Konzepte</span>
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
      const dateInput = modalOverlay.querySelector('#modal-enddatum');
      const saveBtn   = modalOverlay.querySelector('.modal-save-btn');
      const errorEl   = modalOverlay.querySelector('.date-error');
      dateInput.addEventListener('change', e => {
        const val = e.target.value;
        const now = new Date(); now.setHours(0,0,0,0);
        const sel = val ? new Date(val) : null;
        if (sel && sel >= now) {
          draftEnddatum         = isoToEnddatum(val);
          errorEl.style.display = 'none';
          saveBtn.disabled      = false;
        } else {
          errorEl.style.display = '';
          saveBtn.disabled      = true;
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
    }
    closeModal();
    renderZielSummary();
    showToast('Ziel gespeichert ✓');
  }

  // ── Initialer Render ──────────────────────────────────────
  _renderZielSummary = renderZielSummary;
  renderZielSummary();
}

/* ── Lernempfehlung (Metrik 9) ───────────────────────────── */
function initRecommendation() {
  const rec = empfehlungen.ziel;
  document.getElementById('rec-subject-tag').textContent =
    `${rec.themaName} · ${rec.modul}`;
  document.getElementById('rec-text').textContent = rec.begruendung;

  const recThema   = themen.find(t => t.id === rec.thema) || themen[0];
  const recModul   = recThema.module.find(m => m.name.includes(rec.modul));
  const geschafft  = recModul ? recModul.geschafft : 0;
  const aufgaben   = recModul ? recModul.aufgaben  : 0;
  document.getElementById('rec-goal-link').textContent =
    `${geschafft} von ${aufgaben} Konzepten gemeistert`;

  document.getElementById('rec-start-btn').addEventListener('click', () => {
    showToast('Lerneinheit wird gestartet …');
  });
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
        const dot = m.status === 'gemeistert' ? '#22C55E' : '#F97316';
        return `<li style="display:flex;align-items:center;gap:8px;padding:7px 0;font-size:14px;color:#334155;${i < SA.module.length - 1 ? 'border-bottom:1px solid #F1F5F9;' : ''}">
          <span style="color:${dot};font-size:10px;flex-shrink:0;">●</span>${m.name}</li>`;
      }).join('')}
    </ul>`;

  const btn     = document.getElementById('req-content').querySelector('.req-accordion-btn');
  const list    = document.getElementById('req-list');
  const chevron = document.getElementById('req-chevron');

  btn.addEventListener('click', () => {
    const open = list.style.display === 'none';
    list.style.display  = open ? 'block' : 'none';
    chevron.style.transform = open ? 'rotate(180deg)' : 'rotate(0deg)';
  });
}

/* ── Manuelle Eingabe (Metrik 28) ────────────────────────── */
function initManualEntry() {
  const root     = document.getElementById('manual-entry-root');
  const ALL_TAGS = ['Mo','Di','Mi','Do','Fr','Sa','So'];
  const todayTag = ALL_TAGS[(new Date().getDay() + 6) % 7];

  let activePanel = null; // null | 'analog' | 'krank'
  let histOpen    = false;
  const selDay    = { analog: todayTag, krank: todayTag };

  function dayChips(type) {
    return ALL_TAGS.map(t =>
      `<button class="chip day-chip-m${t === selDay[type] ? ' active' : ''}" data-day="${t}" data-type="${type}">${t}</button>`
    ).join('');
  }

  function histHtml() {
    if (manualEntries.length === 0)
      return '<li style="color:#94A3B8;font-size:13px;padding:6px 0;">Noch keine Einträge.</li>';
    return [...manualEntries].reverse().map(e => {
      const label = e.tag === todayTag ? 'Heute' : e.tag;
      const text  = e.typ === 'analog'
        ? `${label} · ${e.minuten} min analog`
        : `${label} · Krank${e.notiz ? ' · ' + e.notiz : ''}`;
      return `<li style="padding:6px 0;font-size:13px;color:#334155;border-bottom:1px solid #F1F5F9;">${text}</li>`;
    }).join('');
  }

  function btnStyle(panel) {
    const on = activePanel === panel;
    return `flex:1;padding:8px 6px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;` +
           `background:${on ? '#EFF6FF' : '#F8FAFC'};` +
           `border:1px solid ${on ? '#3B82F6' : '#E2E8F0'};` +
           `color:${on ? '#3B82F6' : '#475569'};`;
  }

  function render() {
    root.innerHTML = `
      <div class="card-title small" style="margin-bottom:12px;">Manuell eintragen</div>
      <div style="display:flex;gap:8px;">
        <button id="btn-analog" style="${btnStyle('analog')}">+ Ohne App gelernt</button>
        <button id="btn-krank"  style="${btnStyle('krank')}">+ Heute nicht gelernt</button>
      </div>

      ${activePanel === 'analog' ? `
        <div style="margin-top:14px;padding-top:14px;border-top:1px solid #F1F5F9;">
          <label class="field-label">Wochentag</label>
          <div class="chip-row" style="margin:8px 0 12px;">${dayChips('analog')}</div>
          <label class="field-label">Minuten</label>
          <div class="input-row" style="margin-top:6px;">
            <input type="number" id="analog-min" class="input input-sm" min="1" max="480" placeholder="z.B. 30"/>
            <span class="input-unit">min</span>
          </div>
          <button class="btn btn-secondary" id="analog-save" style="margin-top:12px;">Speichern</button>
        </div>` : ''}

      ${activePanel === 'krank' ? `
        <div style="margin-top:14px;padding-top:14px;border-top:1px solid #F1F5F9;">
          <label class="field-label">Wochentag</label>
          <div class="chip-row" style="margin:8px 0 12px;">${dayChips('krank')}</div>
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

    root.querySelectorAll('.day-chip-m').forEach(chip => {
      chip.addEventListener('click', e => {
        e.preventDefault();
        const type = chip.dataset.type;
        selDay[type] = chip.dataset.day;
        root.querySelectorAll(`.day-chip-m[data-type="${type}"]`).forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      });
    });

    const analogSave = document.getElementById('analog-save');
    if (analogSave) analogSave.addEventListener('click', () => {
      const minVal = +document.getElementById('analog-min').value;
      if (!minVal || minVal < 1) { showToast('Bitte Minuten eingeben.'); return; }
      const idx = ALL_TAGS.indexOf(selDay.analog);
      if (idx >= 0) manuellZeiten[idx].minuten += minVal;
      manualEntries.push({ typ: 'analog', tag: selDay.analog, minuten: minVal, date: new Date().toISOString() });
      if (_renderZielSummary) _renderZielSummary();
      showToast('Lernzeit eingetragen ✓');
      activePanel = null;
      render();
    });

    const krankSave = document.getElementById('krank-save');
    if (krankSave) krankSave.addEventListener('click', () => {
      const notiz = document.getElementById('krank-notiz').value.trim();
      const idx   = ALL_TAGS.indexOf(selDay.krank);
      if (idx >= 0) kranktage[idx] = true;
      manualEntries.push({ typ: 'krank', tag: selDay.krank, notiz, date: new Date().toISOString() });
      if (_renderZielSummary) _renderZielSummary();
      showToast('Krankmeldung eingetragen ✓');
      activePanel = null;
      render();
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
const FT_COLORS = { AG: '#3B82F6', FA: '#F59E0B', AN: '#22C55E', WS: '#8B5CF6' };
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

      return `<div class="mod-row${isWeak ? ' mod-row--amber' : ''}">
        ${dot}
        <span class="mod-name${m.gemeistert ? ' mod-name--done' : !inProgress ? ' mod-name--muted' : ''}">${m.name}</span>
        ${pctLabel}
      </div>`;
    }).join('');

    contentEl.innerHTML = `
      <div class="thema-progress-section">
        <div class="thema-progress-hdr">
          <span class="thema-big-pct" style="color:${clr};">${pct}%</span>
          <span class="muted small">${masteredCount} von ${total} Module gemeistert</span>
        </div>
        <div class="thema-bar-track">
          <div class="thema-bar-fill" style="width:${pct}%;background:${clr};"></div>
        </div>
      </div>
      <div class="mod-list">${rows}</div>`;
  }

  renderTabs();
  renderContent();
}

function renderSemesterChart() {
  const subtitleEl  = document.getElementById('chart-subtitle');
  const toggleWrap  = document.getElementById('chart-toggle');
  const legendEl    = document.getElementById('semester-legend');
  const tooltip     = document.getElementById('semester-tooltip');
  const svgWrap     = document.getElementById('semester-svg-wrap');
  let   mode        = 'jahr';

  function drawChart() {
    const isJahr = mode === 'jahr';
    const labels = isJahr ? themen[0].verlauf.labels : themen[0].verlaufMonat.labels;
    const n      = labels.length;
    subtitleEl.textContent = isJahr ? 'Sep – Mai' : 'KW 20 – KW 23';

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
      const vals = isJahr ? t.verlauf.werte : t.verlaufMonat.werte;
      const d    = vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xI(i).toFixed(1)} ${yV(v).toFixed(1)}`).join(' ');
      lines += `<path d="${d}" fill="none" stroke="${clr}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
      vals.forEach((v, i) => {
        dotsSvg += `<circle class="chart-dot" cx="${xI(i).toFixed(1)}" cy="${yV(v).toFixed(1)}" r="4.5"
          fill="${clr}" stroke="white" stroke-width="1.5"
          data-id="${t.id}" data-lbl="${labels[i]}" data-v="${v}" style="cursor:pointer;"/>`;
      });
    });

    svgWrap.innerHTML = `<svg width="100%" viewBox="0 0 ${VW} ${VH}" style="display:block;overflow:visible;">
      ${grid}
      <line x1="${ML}" y1="${cBot}" x2="${VW-MR}" y2="${cBot}" stroke="#CBD5E1" stroke-width="1.5"/>
      ${lines}${dotsSvg}
      ${xLabels}
    </svg>`;

    legendEl.innerHTML = themen.map(t => {
      const werte = isJahr ? t.verlauf.werte : t.verlaufMonat.werte;
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
  }

  function renderToggle() {
    toggleWrap.innerHTML =
      `<button class="chart-toggle-btn${mode === 'jahr'   ? ' active' : ''}" data-mode="jahr">Schuljahr</button>` +
      `<button class="chart-toggle-btn${mode === 'monat'  ? ' active' : ''}" data-mode="monat">Letzter Monat</button>`;
    toggleWrap.querySelectorAll('.chart-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.mode === mode) return;
        mode = btn.dataset.mode;
        renderToggle();
        drawChart();
      });
    });
  }

  renderToggle();
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

function getSysWochenInfo() {
  if (aktivesZiel.typ === 'zeit') {
    const geplant  = woche.filter(t => t.geplant).length;
    const erledigt = woche.filter(t => t.geplant && t.erledigt).length;
    const pct      = geplant > 0 ? Math.round(erledigt / geplant * 100) : 0;
    return {
      pct,
      label: `Dein Zielfortschritt diese Woche: ${pct}% · ${erledigt} von ${geplant} geplanten Lerntagen`
    };
  }
  const v        = aktivesZiel.verlauf || [];
  const geplant  = aktivesZiel.konzepteProWoche || 5;
  const erledigt = v.length >= 2 ? v[v.length - 1].konzepte - v[v.length - 2].konzepte : 0;
  const pct      = geplant > 0 ? Math.min(100, Math.round(erledigt / geplant * 100)) : 0;
  return {
    pct,
    label: `Dein Zielfortschritt diese Woche: ${pct}% · ${erledigt} von ${geplant} geplanten Konzepten`
  };
}

function initReflexion() {
  renderCheckin();
  renderEntwicklungsChart();
  renderLernzeitmuster();
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
  const sysMarker  = document.getElementById('ref-sys-marker');
  const sysText    = document.getElementById('ref-sys-text');

  kompSlider.min   = 0;
  kompSlider.max   = 10;
  kompSlider.value = 5;

  const sysInfo = getSysWochenInfo();
  const sysPct  = sysInfo.pct / 100;
  sysMarker.style.left = `calc(${sysPct * 100}% + ${(0.5 - sysPct) * 22}px)`;
  document.getElementById('ref-sys-marker-pct').textContent = `${sysInfo.pct}%`;

  ['mousedown', 'touchstart'].forEach(evt => {
    kompSlider.addEventListener(evt, () => {
      kompSlider.classList.remove('ref-slider--empty');
    }, { once: true });
  });

  kompSlider.addEventListener('input', () => {
    if (refKompValue === null) {
      kompSlider.classList.remove('ref-slider--empty');
      kompHint.style.display = 'none';
      sysMarker.style.display = 'flex';
      sysText.style.display   = 'block';
      sysText.textContent     = sysInfo.label;
    }
    refKompValue = parseInt(kompSlider.value);
    setSliderFill(kompSlider, '#3B82F6');
    updateReflexionEmpfehlung();
  });

  const emoSlider = document.getElementById('ref-emo-slider');
  const emoHint   = document.getElementById('ref-emo-hint');
  emoSlider.min   = 0;
  emoSlider.max   = 10;
  emoSlider.value = 5;
  emoSlider.style.backgroundImage = 'linear-gradient(to right, #F59E0B, #94A3B8 50%, #22C55E)';

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
    updateReflexionEmpfehlung();
  });
}

function updateReflexionEmpfehlung() {
  const el = document.getElementById('ref-empfehlung-content');

  if (refKompValue === null || refEmoValue === null) {
    el.innerHTML = `<p class="ref-placeholder-text">Mach deine wöchentlichen Check-ins um eine persönliche Lernstrategie zu erhalten.</p>`;
    return;
  }

  const highKomp = refKompValue > 5;
  const highEmo  = refEmoValue  > 5;

  const MATRIX = [
    { // niedrig + frustriert
      titel: 'Kleine Schritte zuerst',
      clr: '#F59E0B',
      text: 'Fang mit einem bekannten Konzept an, ein kleiner Erfolg baut Vertrauen auf und hilft, wieder in den Fluss zu kommen.',
      action: 'Einstiegsaufgabe starten'
    },
    { // niedrig + neugierig
      titel: 'Neugier nutzen',
      clr: '#22C55E',
      text: 'Deine Motivation ist dein Vorteil gerade. Probiere eine Einstiegsaufgabe in einem offenen Modul, du wirst merken, wie viel du schon weißt.',
      action: 'Modul entdecken'
    },
    { // hoch + frustriert
      titel: 'Kurze Auffrischung',
      clr: '#3B82F6',
      text: 'Du beherrschst mehr, als du gerade glaubst. Eine kurze Wiederholung eines bekannten Moduls kann helfen, das Vertrauen zurückzuholen.',
      action: 'Wiederholung starten'
    },
    { // hoch + neugierig
      titel: 'Bereit für mehr',
      clr: '#3B82F6',
      text: 'Du bist in bester Verfassung. Jetzt ist der richtige Moment für eine anspruchsvolle Aufgabe, setze dein Wissen in einem neuen Kontext ein.',
      action: 'Herausforderung starten'
    }
  ];

  const idx = (!highKomp && !highEmo) ? 0 : (!highKomp && highEmo) ? 1 : (highKomp && !highEmo) ? 2 : 3;
  const rec = MATRIX[idx];

  el.innerHTML = `
    <div class="ref-chips">
      <span class="ref-chip" style="background:${rec.clr}18;color:${rec.clr};">${highKomp ? 'Kompetenz hoch' : 'Kompetenz niedrig'}</span>
      <span class="ref-chip" style="background:${rec.clr}18;color:${rec.clr};">${highEmo ? 'Motiviert' : 'Frustriert'}</span>
    </div>
    <p class="ref-rec-titel" style="color:${rec.clr};">${rec.titel}</p>
    <p class="ref-rec-body">${rec.text}</p>
    <p class="ref-rec-modul">Nächster Schritt: ${empfehlungen.ziel.modul}</p>
    <button class="btn btn-primary" style="margin-top:8px;">Jetzt starten</button>`;
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
      ${polyline(kompData, '#3B82F6')}
      ${polyline(emoData,  '#F59E0B')}
      ${dots(kompData, '#3B82F6')}
      ${dots(emoData,  '#F59E0B')}
      ${xLabels}
    </svg>
    <div class="ref-verlauf-legend">
      <span class="ref-verlauf-dot" style="background:#3B82F6;"></span>
      <span class="ref-verlauf-lbl">Gefühlter Lernfortschritt</span>
      <span class="ref-verlauf-dot" style="background:#F59E0B;"></span>
      <span class="ref-verlauf-lbl">Emotionen beim Lernen</span>
    </div>`;
}

function renderLernzeitmuster() {
  const wrap   = document.getElementById('ref-muster-content');
  const maxVal = Math.max(...lernzeitmuster.map(d => d.minuten), 1);
  const BAR_H  = 48;

  const bars = lernzeitmuster.map(d => {
    const h       = d.minuten > 0 ? Math.max(Math.round((d.minuten / maxVal) * BAR_H), 5) : 0;
    const isEmpty = d.minuten === 0;
    return `<div class="zt-col">
      <span class="zt-min-lbl">${d.minuten > 0 ? d.minuten : ''}</span>
      <div class="zt-bar-wrap">
        <div class="zt-bar${isEmpty ? ' zt-bar--empty' : ''}" style="height:${isEmpty ? 2 : h}px;"></div>
      </div>
      <span class="zt-day">${d.tag}</span>
    </div>`;
  }).join('');

  const totalMin   = lernzeitmuster.reduce((a, d) => a + d.minuten, 0);
  const activeDays = lernzeitmuster.filter(d => d.minuten > 0).length;
  const avgActive  = activeDays > 0 ? Math.round(totalMin / activeDays) : 0;

  const hasWeekend  = lernzeitmuster.some(d => ['Sa', 'So'].includes(d.tag) && d.minuten > 0);
  const weekdayDays = lernzeitmuster.filter(d => !['Sa', 'So'].includes(d.tag) && d.minuten > 0).length;
  let pattern;
  if (activeDays >= 4) pattern = 'Regelmäßiges Lernen wie deins zahlt sich langfristig aus.';
  else if (hasWeekend && weekdayDays < 2) pattern = 'Du lernst hauptsächlich am Wochenende — mehr Werktage könnten helfen.';
  else pattern = 'Mehr Kontinuität kann den Lerneffekt deutlich steigern.';

  wrap.innerHTML = `
    <div class="zt-chart">${bars}</div>
    <div class="zt-stats">
      <div class="zt-stat">
        <span class="zt-stat-val">${activeDays}</span>
        <span class="zt-stat-lbl">Lerntage</span>
      </div>
      <div class="zt-stat">
        <span class="zt-stat-val">${totalMin}</span>
        <span class="zt-stat-lbl">Minuten</span>
      </div>
      <div class="zt-stat">
        <span class="zt-stat-val">${avgActive}</span>
        <span class="zt-stat-lbl">Ø min/Tag</span>
      </div>
    </div>
    <p class="zt-pattern">${pattern}</p>`;
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
  { key: 'abzeichen',        label: 'Lernabzeichen',          loc: 'Screen: Fortschritt', targetId: 'abzeichen-section' },
  { key: 'lernzeitmuster',   label: 'Lernzeitmuster',         loc: 'Screen: Reflexion',   targetId: 'ref-muster-card' },
  { key: 'noten',            label: 'Notenübersicht',         loc: 'Screen: Fortschritt', targetId: 'noten-section' },
  { key: 'anforderungen',    label: 'Leistungsanforderungen', loc: 'Screen: Ziel',        targetId: 'requirements-section' },
  { key: 'mikronachrichten', label: 'Motivationsnachrichten',  loc: 'Screen: Reflexion',   targetSelector: '.zt-pattern', dependsOn: 'lernzeitmuster' },
];

const LOCKED_CONFIG = [
  { label: 'Ziel-Visualisierung',          reason: 'Zeigt deinen Fortschritt zum aktiven Ziel.' },
  { label: 'Fortschrittsbalken pro Thema', reason: 'Kern-Feedback zu deinem Lehrplanfortschritt.' },
  { label: 'Kompetenz-Slider',             reason: 'Wöchentliche Selbsteinschätzung.' },
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
        btn.textContent = 'Dashboard öffnen';
      }
    } else {
      overlay.remove();
      document.body.style.overflow = '';
    }
  });
}

/* ── Init ────────────────────────────────────────────────── */
function init() {
  initOnboarding();
  initZielBlock();
  initRecommendation();
  initRequirements();
  initManualEntry();
  initFortschritt();
  initReflexion();
  initAnpassungen();
  initPushToggles();
}

document.addEventListener('DOMContentLoaded', init);
