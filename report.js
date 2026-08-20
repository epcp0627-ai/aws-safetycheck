(() => {
  const loadBtn = document.getElementById('loadReport');
  const fileInput = document.getElementById('reportFile');
  if (!loadBtn || !fileInput) return;

  function parseCSV(text) {
    text = text.replace(/^\uFEFF/, '');
    const rows = [];
    let row = [], field = '', quoted = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (quoted) {
        if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (ch === '"') quoted = false;
        else field += ch;
      } else {
        if (ch === '"') quoted = true;
        else if (ch === ',') { row.push(field); field = ''; }
        else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
        else if (ch !== '\r') field += ch;
      }
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    if (!rows.length) return [];
    const headers = rows.shift().map(h => h.trim());
    return rows.filter(r => r.some(v => String(v).trim())).map(r => {
      const o = {};
      headers.forEach((h, i) => o[h || `col${i}`] = (r[i] ?? '').trim());
      return o;
    });
  }

  const controlRe = /\b([A-Za-z][A-Za-z0-9_-]*\.[0-9]+)\b/;
  const sevMap = {
    CRITICAL:'CRITICAL', HIGH:'HIGH', MEDIUM:'MEDIUM', LOW:'LOW', INFORMATIONAL:'LOW', INFO:'LOW',
    '매우 중요':'CRITICAL', '심각':'CRITICAL', '높음':'HIGH', '중간':'MEDIUM', '낮음':'LOW'
  };

  function values(row) { return Object.values(row).map(v => String(v ?? '').trim()).filter(Boolean); }
  function controlId(row) {
    for (const v of values(row)) { const m = v.match(controlRe); if (m) return m[1]; }
    return null;
  }
  function severity(row) {
    for (const v of values(row)) {
      const u = v.toUpperCase();
      if (sevMap[u]) return sevMap[u];
      if (sevMap[v]) return sevMap[v];
      for (const [k, mapped] of Object.entries(sevMap)) if (u === k || v === k) return mapped;
    }
    return 'MEDIUM';
  }
  function isPassed(row) {
    const s = values(row).join(' | ').toUpperCase();
    if (/\bFAILED?\b|실패|NON[- ]?COMPLIANT|비준수/.test(s)) return false;
    return /\bPASSED?\b|\bSUCCESS\b|성공|준수/.test(s);
  }
  function title(row, id) {
    const candidates = values(row).filter(v =>
      v !== id && !/^https?:\/\//i.test(v) && !controlRe.test(v) &&
      !/^(CRITICAL|HIGH|MEDIUM|LOW|INFORMATIONAL|FAILED?|PASSED?|SUCCESS)$/i.test(v) &&
      !/^(실패|성공|매우 중요|높음|중간|낮음)$/.test(v)
    );
    return candidates.sort((a,b) => b.length - a.length)[0] || `${id} CIS control`;
  }

  function genericFinding(id, t, s) {
    const risk = s === 'CRITICAL' ? 85 : s === 'HIGH' ? 65 : s === 'MEDIUM' ? 45 : 25;
    return {
      id, t, s, risk,
      impact: 'ReadOnly 확인 필요', ic: 'impact-possible', scope: '대상 리소스 확인 필요',
      impactDetail: '보고서만으로는 현재 연결 관계를 알 수 없습니다. Live AWS ReadOnly 연결 후 실제 리소스 의존성을 조회해 서비스 영향을 판정합니다.',
      cost: { before:'현재 구성 확인 필요', after:'조치 방식 확인 필요', delta:'실데이터 필요', one:'확인 필요', drivers:['대상 AWS 서비스','현재 SKU/사용량','조치 후 구성','리전'], conf:'보고서 기준 낮음' },
      rb:'조치별 확인', res:['보고서 기반 Finding'],
      steps:['대상 리소스 식별','현재 의존성 조회','서비스 영향 확인','비용 기준값 확인','변경 및 롤백 계획 수립']
    };
  }

  function normalize(rows) {
    const known = new Map();
    try { for (const x of F) known.set(String(x.id).toUpperCase(), x); } catch (_) {}
    const out = new Map();
    for (const row of rows) {
      if (isPassed(row)) continue;
      const id = controlId(row);
      if (!id) continue;
      const key = id.toUpperCase();
      if (out.has(key)) continue;
      const base = known.get(key);
      const t = title(row, id);
      const s = severity(row);
      if (base) out.set(key, { ...base, t: base.t || t, s: s || base.s, reportSource:true });
      else out.set(key, { ...genericFinding(id, t, s), reportSource:true });
    }
    return [...out.values()];
  }

  function refreshDashboard(items, fileName) {
    const stats = document.querySelectorAll('#dash .stats article');
    if (stats[0]) { const b=stats[0].querySelector('b'), sm=stats[0].querySelector('small'); if(b)b.textContent=items.length; if(sm)sm.textContent='CIS 보고서'; }
    if (stats[1]) { const b=stats[1].querySelector('b'); if(b)b.textContent=items.filter(x=>x.risk>=60).length; }
    if (stats[2]) { const b=stats[2].querySelector('b'); if(b)b.textContent=items.filter(x=>!String(x.impact).includes('직접 영향 없음')).length; }
    if (stats[3]) { const b=stats[3].querySelector('b'), sm=stats[3].querySelector('small'); if(b)b.textContent=items.filter(x=>x.cost && !/^\$0(?:\b|\s)/.test(String(x.cost.delta))).length; if(sm)sm.textContent='비용 검토 대상'; }
    const mode = document.getElementById('mode');
    const modeSub = document.getElementById('modeSub');
    if (mode) mode.textContent='Report Mode';
    if (modeSub) modeSub.textContent=fileName;
  }

  function goFindings() {
    const btn = document.querySelector('[data-v="findings"]');
    if (btn) btn.click();
  }

  loadBtn.onclick = async () => {
    const f = fileInput.files[0];
    if (!f) return alert('파일을 선택해 주세요.');
    try {
      const text = await f.text();
      let rows;
      if (f.name.toLowerCase().endsWith('.json')) {
        const d = JSON.parse(text);
        rows = Array.isArray(d) ? d : (d.findings || d.controls || d.Results || d.results || []);
      } else rows = parseCSV(text);

      const items = normalize(rows);
      if (!items.length) throw new Error('CIS Control ID를 찾지 못했습니다. CSV 헤더/형식을 확인해 주세요.');

      try {
        F.splice(0, F.length, ...items);
        if (typeof renderRows === 'function') renderRows();
        if (typeof renderPriority === 'function') renderPriority();
      } catch (e) {
        console.error('UI refresh error', e);
      }

      refreshDashboard(items, f.name);
      const rs = document.getElementById('reportStatus');
      if (rs) rs.innerHTML = `<b>${f.name}</b><br>${items.length}개 CIS 실패 Control 적용 · Findings/대시보드 갱신 완료`;
      const dlg = document.getElementById('reportDlg');
      if (dlg?.open) dlg.close();
      goFindings();
      alert(`${items.length}개 CIS 실패 Control을 적용했습니다. Findings 화면을 갱신했습니다.`);
    } catch (e) {
      alert(`보고서 적용 실패: ${e.message}`);
    }
  };
})();