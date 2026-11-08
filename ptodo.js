// 개인 To Do — 폰(index.html '개인' 탭)과 맥(/personal 작은 창)이 같이 쓰는 목록. 업무 To Do List·비서와 섞이지 않는다(2026-11-09).
// 항목: {id, text, done:'YYYY-MM-DD'|null, due:''|'YYYY-MM-DD', pin, u:마지막 수정(ms), del:지움 표시(다른 기기에도 지운 게 전해지게, 30일 뒤 정리)}
// 두 기기에서 동시에 고쳐도 id로 합친다(번호 X): 같은 항목이면 나중에 고친 것, 순서는 더 최근에 고친 쪽 기준.
(function () {
  const ymd = d => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  const today = () => ymd(new Date());
  const nid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MAX = 200;

  function merge(a, b) {
    a = Array.isArray(a) ? a : []; b = Array.isArray(b) ? b : [];
    const top = l => Math.max(0, ...l.map(x => x.u || 0));
    const [base, other] = top(b) >= top(a) ? [b, a] : [a, b];
    const om = new Map(other.map(x => [x.id, x])), out = [], seen = new Set();
    for (const x of base) { const y = om.get(x.id); out.push(y && (y.u || 0) > (x.u || 0) ? y : x); seen.add(x.id); }
    other.forEach((x, k) => {  // 다른 기기에서만 생긴 것: 그 기기에서 바로 앞에 있던 항목 뒤에 끼운다
      if (seen.has(x.id)) return;
      let prev = null; for (let j = k - 1; j >= 0; j--) if (seen.has(other[j].id)) { prev = other[j].id; break; }
      const pos = prev == null ? 0 : out.findIndex(z => z.id === prev) + 1;
      out.splice(pos, 0, x); seen.add(x.id);
    });
    const old = Date.now() - 30 * 864e5;
    return out.filter(x => !(x.del && (x.u || 0) < old));
  }
  const live = l => (l || []).filter(x => !x.del);
  const openCount = l => live(l).filter(x => !x.done).length;

  const STYLE = `
.pt{--pt-gold:var(--gold,#4255d6);--pt-red:var(--red,#b03a4d);--pt-mute:var(--mute,#66666f);--pt-line:var(--line,#e6e3dc);--pt-card:var(--card,#fff);--pt-ink:var(--ink,#1d1d24);--pt-soft:var(--soft,#f6f5f1)}
.pt h2{margin:0 0 10px;font-size:16px;font-weight:600;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.pt h2 .pt-n{font-size:12px;color:var(--pt-gold);background:color-mix(in srgb,var(--pt-gold) 12%,transparent);border-radius:20px;padding:1px 8px}
.pt h2 .pt-sp{flex:1}
.pt button{font:inherit;cursor:pointer}
.pt .pt-tb{border:1px solid var(--pt-line);background:var(--pt-card);color:var(--pt-ink);border-radius:20px;padding:6px 12px;font-size:13px;min-height:36px}
.pt .pt-tb.on{border-color:var(--pt-gold);color:var(--pt-gold)}
.pt form{display:flex;gap:8px;margin:0 0 4px}
.pt form input{flex:1;min-width:0;font:inherit;font-size:16px;padding:11px 14px;border:1px solid var(--pt-line);border-radius:12px;background:var(--pt-soft);color:var(--pt-ink)}
.pt form button{border:0;border-radius:12px;padding:0 18px;background:var(--pt-gold);color:#fff;font-weight:600;min-height:44px}
.pt form button:disabled{opacity:.45;cursor:default}
.pt .pt-hint{font-size:12px;color:var(--pt-mute);margin:2px 2px 10px;min-height:16px}.pt .pt-hint.err{color:var(--pt-red)}
.pt .pt-q{width:100%;box-sizing:border-box;font:inherit;font-size:14px;padding:8px 12px;border:1px solid var(--pt-line);border-radius:10px;background:var(--pt-card);color:var(--pt-ink);margin:0 0 8px}
.pt ul{list-style:none;margin:0;padding:0}
.pt .pt-row{display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid var(--pt-line);background:var(--pt-card);position:relative;touch-action:pan-y;transition:transform .18s}
.pt .pt-row.pt-in{animation:ptin .25s ease}@keyframes ptin{from{opacity:0;transform:translateY(-4px)}}
.pt .pt-ck{flex:0 0 44px;height:44px;display:flex;align-items:center;justify-content:center}
.pt .pt-ck input{width:22px;height:22px;margin:0;accent-color:var(--pt-gold);cursor:pointer}
.pt .pt-t{flex:1;min-width:0;padding:10px 0;line-height:1.4;word-break:keep-all;overflow-wrap:anywhere;cursor:text}
.pt .pt-t input{width:100%;box-sizing:border-box;font:inherit;font-size:16px;padding:6px 8px;border:1px solid var(--pt-gold);border-radius:8px;background:var(--pt-card);color:var(--pt-ink)}
.pt .pt-d{font-size:12px;color:var(--pt-mute);white-space:nowrap;padding:2px 8px;border-radius:20px;background:var(--pt-soft)}
.pt .pt-d.r{color:var(--pt-red);background:color-mix(in srgb,var(--pt-red) 10%,transparent)}.pt .pt-d.a{color:var(--pt-gold)}
.pt .pt-acts{display:flex;gap:2px;opacity:.35;transition:opacity .15s}.pt .pt-row:hover .pt-acts,.pt .pt-acts:focus-within{opacity:1}
.pt .pt-acts button,.pt .pt-h{border:0;background:none;color:var(--pt-mute);width:36px;height:36px;border-radius:8px;font-size:15px}
.pt .pt-acts button:hover{background:var(--pt-soft);color:var(--pt-ink)}
.pt .pt-h{cursor:grab;touch-action:none;width:28px}
.pt .pt-done .pt-t{color:var(--pt-mute);text-decoration:line-through}
.pt .pt-sel{flex:0 0 44px;height:44px;display:none;align-items:center;justify-content:center}.pt.selmode .pt-sel{display:flex}.pt.selmode .pt-ck{display:none}
.pt .pt-bar{display:none;position:sticky;bottom:8px;margin-top:10px;gap:6px;align-items:center;flex-wrap:wrap;background:var(--pt-card);border:1px solid var(--pt-line);border-radius:14px;padding:8px 10px;box-shadow:0 4px 14px rgba(0,0,0,.12);z-index:5}
.pt.selmode .pt-bar{display:flex}
.pt .pt-bar b{flex:1;font-size:13px}
.pt .pt-drag{opacity:.9;box-shadow:0 6px 18px rgba(0,0,0,.18);z-index:4;transition:none}
.pt .pt-fold{border:0;background:none;color:var(--pt-mute);font-size:13px;padding:12px 2px 6px;min-height:40px}
.pt .pt-empty{color:var(--pt-mute);font-size:14px;padding:18px 4px}
.pt .pt-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:var(--pt-ink);color:var(--pt-card);border-radius:12px;padding:10px 14px;font-size:14px;display:none;z-index:50;max-width:90vw}
.pt .pt-toast button{margin-left:10px;border:0;background:none;color:inherit;font-weight:700;text-decoration:underline}
.pt .pt-ptr{display:none}@media (hover:hover) and (pointer:fine){.pt .pt-ptr{display:inline}.pt .pt-tch{display:none}}
@media (hover:none){.pt .pt-acts,.pt .pt-h{display:none}}
@media (prefers-reduced-motion:reduce){.pt .pt-row{transition:none}.pt .pt-row.pt-in{animation:none}}
.pt :focus-visible{outline:2px solid var(--pt-gold);outline-offset:2px}`;

  // root에 목록을 그린다. io: {get():목록, set(목록), toast(글, 되돌리기fn)?}
  function mount(root, io) {
    if (!document.getElementById('pt-css')) { const s = document.createElement('style'); s.id = 'pt-css'; s.textContent = STYLE; document.head.append(s); }
    root.classList.add('pt');
    root.innerHTML = `<h2>개인 To Do <span class="pt-n"></span><span class="pt-sp"></span><button type="button" class="pt-tb pt-selbtn">☑ 여러 개</button></h2>
<form><input class="pt-in" maxlength="${MAX}" placeholder="개인 할 일 적기" autocomplete="off" enterkeyhint="done"><button class="pt-add" disabled>추가</button></form>
<div class="pt-hint"><span class="pt-tch">엔터로 추가 · 여러 줄 붙여넣으면 줄마다 하나씩 · 꾹 눌러 끌면 순서 · 옆으로 밀면 고치기·고정·삭제</span><span class="pt-ptr">엔터로 추가 · 여러 줄 붙여넣으면 줄마다 하나씩 · ⠿를 끌면 순서 · 글을 누르면 고치기</span></div>
<input class="pt-q" type="search" placeholder="찾기" hidden>
<ul class="pt-open"></ul><button type="button" class="pt-fold" hidden></button><ul class="pt-dl" hidden></ul>
<div class="pt-bar"><b></b><button type="button" class="pt-tb" data-b="done">완료</button><button type="button" class="pt-tb" data-b="pin">📌 고정</button><button type="button" class="pt-tb" data-b="del">🗑 삭제</button><button type="button" class="pt-tb" data-b="x">취소</button></div>
<input type="date" class="pt-date" style="position:fixed;opacity:0;pointer-events:none;width:1px;height:1px;left:0;top:0" tabindex="-1"><div class="pt-toast"></div>`;
    const $ = s => root.querySelector(s), inp = $('.pt-in'), add = $('.pt-add'), hint = $('.pt-hint'), q = $('.pt-q');
    const HINT0 = hint.innerHTML;
    let editing = null, sel = new Set(), showDone = false, dragging = false;
    try { inp.value = localStorage.getItem('pt_draft') || ''; } catch {}
    add.disabled = !inp.value.trim();

    const toast = io.toast || ((m, fn) => {
      const t = $('.pt-toast'); t.textContent = m;
      if (fn) { const b = document.createElement('button'); b.textContent = '되돌리기'; b.onclick = () => { t.style.display = 'none'; fn(); }; t.append(b); }
      t.style.display = 'block'; clearTimeout(t._t); t._t = setTimeout(() => t.style.display = 'none', fn ? 6000 : 2200);
    });
    const list = () => (io.get() || []).map(x => ({ ...x }));
    const commit = l => { io.set(l); render(); };
    // 바꾸기 전 목록을 기억해 되돌리기: 되살린 항목은 지금 시각으로 찍어야 다른 기기와 합칠 때도 이긴다
    const undoable = (msg, prev) => toast(msg, () => { const now = Date.now(), cur = list(), pm = new Map(prev.map(x => [x.id, x]));
      commit(cur.map(x => pm.has(x.id) ? { ...pm.get(x.id), u: now } : x).concat(prev.filter(x => !cur.some(y => y.id === x.id)).map(x => ({ ...x, u: now })))); });
    const touch = (id, f) => { const l = list(), x = l.find(y => y.id === id); if (!x) { toast('그 사이 다른 기기에서 지워졌어요'); render(); return null; } f(x); x.u = Date.now(); commit(l); return x; };

    function addTexts(texts) {
      const now = Date.now(), l = list(), bad = texts.filter(t => t.length > MAX).length;
      texts = texts.map(t => t.replace(/\s+/g, ' ').trim()).filter(Boolean).map(t => t.slice(0, MAX));
      if (!texts.length) return;
      const items = texts.map((text, k) => ({ id: nid(), text, done: null, due: '', pin: false, u: now + k }));
      const at = l.findIndex(x => !x.del && !x.pin && !x.done);  // 고정한 것 바로 아래(맨 위)
      l.splice(at < 0 ? l.length : at, 0, ...items);
      commit(l); inp.value = ''; add.disabled = true; try { localStorage.removeItem('pt_draft'); } catch {}
      toast(items.length > 1 ? `${items.length}개를 넣었어요` : '넣었어요' + (bad ? ` (${MAX}자 넘는 부분은 잘랐어요)` : ''));
      root.querySelectorAll('.pt-open .pt-row').forEach(r => items.some(i => i.id === r.dataset.id) && r.classList.add('pt-in'));
    }
    root.querySelector('form').onsubmit = e => { e.preventDefault(); const v = inp.value.trim(); if (!v) { hint.textContent = '할 일을 적어 주세요'; hint.classList.add('err'); return; } addTexts([v]); };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.isComposing || e.keyCode === 229)) e.preventDefault(); });  // 한글 조합 중 엔터는 두 번 들어가지 않게
    inp.addEventListener('input', () => { add.disabled = !inp.value.trim(); hint.classList.remove('err'); if (inp.value.length >= MAX) hint.textContent = `${MAX}자까지 쓸 수 있어요`; else if (hint.innerHTML !== HINT0) hint.innerHTML = HINT0; try { localStorage.setItem('pt_draft', inp.value); } catch {} });
    inp.addEventListener('paste', e => { const t = e.clipboardData?.getData('text/plain') || ''; const lines = t.split(/\r?\n/).map(s => s.replace(/^\s*([-*•·▪︎◦]|\d+[.)]|\[[ xX]?\])\s*/, '').trim()).filter(Boolean); if (lines.length > 1) { e.preventDefault(); addTexts(lines); } });
    q.oninput = () => render();

    function dueTag(x) {
      if (!x.due) return '';
      const n = Math.round((new Date(x.due + 'T00:00') - new Date(today() + 'T00:00')) / 864e5);
      const [t, c] = x.done ? [x.due.slice(5).replace('-', '/'), ''] : n < 0 ? [`${-n}일 지남`, 'r'] : n === 0 ? ['오늘', 'a'] : n === 1 ? ['내일', 'a'] : [`D-${n}`, ''];
      return `<span class="pt-d ${c}" title="마감 ${x.due}">${t}</span>`;
    }
    function row(x) {
      return `<li class="pt-row${x.done ? ' pt-done' : ''}" data-id="${esc(x.id)}">${x.done ? '' : '<span class="pt-h" title="끌어서 순서 바꾸기">⠿</span>'}
<label class="pt-sel"><input type="checkbox" ${sel.has(x.id) ? 'checked' : ''} aria-label="고르기"></label>
<label class="pt-ck"><input type="checkbox" ${x.done ? 'checked' : ''} aria-label="${x.done ? '완료 풀기' : '완료'}"></label>
<div class="pt-t">${x.pin ? '📌 ' : ''}${esc(x.text)}</div>${dueTag(x)}
<span class="pt-acts"><button type="button" data-a="edit" title="고치기">✎</button><button type="button" data-a="due" title="마감">📅</button>${x.done ? '' : `<button type="button" data-a="pin" title="${x.pin ? '고정 풀기' : '맨 위에 고정'}">📌</button>`}<button type="button" data-a="del" title="삭제(되돌리기 가능)">×</button></span></li>`;
    }
    function render() {
      if (editing || dragging) return;  // 고치는 중·끄는 중엔 다시 그리지 않는다(쓰던 글·위치 유지)
      const l = live(io.get()), f = q.value.trim().toLowerCase(), hit = x => !f || x.text.toLowerCase().includes(f);
      const open = l.filter(x => !x.done), done = l.filter(x => x.done).sort((a, b) => (b.done || '').localeCompare(a.done || ''));
      const ord = [...open.filter(x => x.pin), ...open.filter(x => !x.pin)].filter(hit);
      $('.pt-n').textContent = open.length ? `남은 ${open.length}` : '';
      q.hidden = l.length < 12 && !f;
      $('.pt-open').innerHTML = ord.map(row).join('') || `<li class="pt-empty">${f ? '찾는 할 일이 없어요' : '개인 할 일이 없어요. 위에 적어 보세요 🙂'}</li>`;
      const fb = $('.pt-fold'); fb.hidden = !done.length; fb.textContent = `완료 ${done.length}개 ${showDone ? '▴ 접기' : '▾ 보기'}`;
      const dl = $('.pt-dl'); dl.hidden = !showDone || !done.length;
      dl.innerHTML = showDone ? done.filter(hit).map(row).join('') + (done.length ? '<li><button type="button" class="pt-tb" data-clear="1" style="margin:10px 0">완료한 것 모두 지우기</button></li>' : '') : '';
      for (const id of [...sel]) if (!l.some(x => x.id === id)) sel.delete(id);
      $('.pt-bar b').textContent = `${sel.size}개 고름`;
      root.classList.toggle('selmode', root._sel === true);
      $('.pt-selbtn').classList.toggle('on', root._sel === true);
    }

    function edit(id) {
      const r = root.querySelector(`.pt-row[data-id="${CSS.escape(id)}"] .pt-t`), x = live(io.get()).find(y => y.id === id); if (!r || !x) return;
      editing = id; r.innerHTML = `<input maxlength="${MAX}" value="${esc(x.text)}" aria-label="할 일 고치기">`;
      const e = r.querySelector('input'); e.focus(); e.setSelectionRange(e.value.length, e.value.length);
      let done = false;
      const finish = save => { if (done) return; done = true; editing = null; const v = e.value.replace(/\s+/g, ' ').trim();
        if (save && v && v !== x.text) { const prev = list(); touch(id, y => y.text = v); undoable('고쳤어요', prev); } else { if (save && !v) toast('빈 이름은 안 돼요 — 지우려면 ×를 눌러 주세요'); render(); } };
      e.addEventListener('keydown', ev => { if (ev.key === 'Enter' && !ev.isComposing && ev.keyCode !== 229) { ev.preventDefault(); finish(true); } if (ev.key === 'Escape') finish(false); });
      e.addEventListener('blur', () => finish(true));
    }
    function setDue(id) {
      const d = $('.pt-date'), x = live(io.get()).find(y => y.id === id); if (!x) return;
      d.value = x.due || ''; d.onchange = () => { const prev = list(); touch(id, y => y.due = d.value || ''); undoable(d.value ? `마감을 ${d.value.slice(5).replace('-', '/')}로 했어요` : '마감을 지웠어요', prev); };
      try { d.showPicker(); } catch { d.focus(); d.click(); }
    }
    function pin(id) { const prev = list(); const x = touch(id, y => y.pin = !y.pin); if (x) undoable(x.pin ? '맨 위에 고정했어요' : '고정을 풀었어요', prev); }
    function del(ids) { const prev = list(), now = Date.now(), l = list(); let n = 0; for (const x of l) if (ids.includes(x.id) && !x.del) { x.del = true; x.u = now; n++; } if (!n) return; commit(l); undoable(n > 1 ? `${n}개를 지웠어요` : '지웠어요', prev); }
    function toggle(id, on) { const prev = list(); touch(id, y => y.done = on ? today() : null); if (on) undoable('완료했어요', prev); }

    root.addEventListener('click', e => {
      const r = e.target.closest('.pt-row'), id = r?.dataset.id;
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'edit') return edit(id); if (a === 'due') return setDue(id); if (a === 'pin') return pin(id); if (a === 'del') return del([id]);
      if (e.target.closest('[data-clear]')) return del(live(io.get()).filter(x => x.done).map(x => x.id));
      if (e.target.closest('.pt-fold')) { showDone = !showDone; return render(); }
      if (e.target.closest('.pt-selbtn')) { root._sel = !root._sel; sel.clear(); return render(); }
      const b = e.target.closest('[data-b]')?.dataset.b;
      if (b) { const ids = [...sel]; if (b === 'x' || !ids.length) { if (b !== 'x') toast('먼저 고를 항목을 눌러 주세요'); else { root._sel = false; sel.clear(); render(); } return; }
        const prev = list(), now = Date.now(), l = list();
        if (b === 'del') { root._sel = false; sel.clear(); return del(ids); }
        for (const x of l) if (ids.includes(x.id)) { if (b === 'done') x.done = today(); if (b === 'pin') x.pin = true; x.u = now; }
        root._sel = false; sel.clear(); commit(l); return undoable(b === 'done' ? `${ids.length}개를 완료했어요` : `${ids.length}개를 고정했어요`, prev); }
      if (root._sel && r && !e.target.closest('.pt-sel')) { sel.has(id) ? sel.delete(id) : sel.add(id); return render(); }
      if (e.target.closest('.pt-t') && r && !e.target.closest('input') && !root._sel) return edit(id);
    });
    root.addEventListener('change', e => {
      const r = e.target.closest('.pt-row'); if (!r) return;
      if (e.target.closest('.pt-ck')) toggle(r.dataset.id, e.target.checked);
      if (e.target.closest('.pt-sel')) { e.target.checked ? sel.add(r.dataset.id) : sel.delete(r.dataset.id); $('.pt-bar b').textContent = `${sel.size}개 고름`; }
    });

    // 순서 바꾸기: ⠿를 잡고 끌기(맥), 꾹 눌렀다가 끌기(폰). 같은 묶음(고정/보통) 안에서만
    let lp = null, dr = null;
    const ul = $('.pt-open');
    ul.addEventListener('pointerdown', e => {
      const r = e.target.closest('.pt-row'); if (!r || root._sel || editing || e.target.closest('input,button:not(.pt-h),label')) return;
      const start = () => { dragging = true; r.classList.add('pt-drag'); dr = { r, y0: e.clientY, id: r.dataset.id, pid: e.pointerId }; try { r.setPointerCapture(e.pointerId); } catch {} navigator.vibrate?.(15); };
      if (e.target.closest('.pt-h')) { e.preventDefault(); start(); } else if (e.pointerType !== 'mouse') { const x0 = e.clientX, y0 = e.clientY; lp = { t: setTimeout(start, 380), x0, y0 }; }
    });
    ul.addEventListener('pointermove', e => {
      if (lp && !dr && (Math.abs(e.clientX - lp.x0) > 8 || Math.abs(e.clientY - lp.y0) > 8)) { clearTimeout(lp.t); lp = null; }
      if (!dr) return; e.preventDefault(); e.stopImmediatePropagation();
      dr.r.style.transform = `translateY(${e.clientY - dr.y0}px)`;
    }, { capture: true });
    const end = e => {
      if (lp) { clearTimeout(lp.t); lp = null; }
      if (!dr) return; e.stopImmediatePropagation();
      const { r, id } = dr; dr = null; dragging = false; r.classList.remove('pt-drag'); r.style.transform = '';
      const l = list(), me = l.find(x => x.id === id); if (!me) return render();
      const pinOf = x => !!l.find(z => z.id === x.dataset.id)?.pin, y = e.clientY;
      const rows = [...ul.querySelectorAll('.pt-row')].filter(x => x !== r && pinOf(x) === !!me.pin);  // 같은 묶음(고정/보통) 안에서만
      const after = rows.filter(x => { const b = x.getBoundingClientRect(); return b.top + b.height / 2 < y; }).pop();
      const tgt = after?.dataset.id, ref = l.find(x => x.id === (tgt || rows[0]?.dataset.id));
      if (!ref) return render();
      const prev = list(); l.splice(l.indexOf(me), 1); const k = l.indexOf(ref); l.splice(tgt ? k + 1 : k, 0, me); me.u = Date.now();
      commit(l); undoable('순서를 바꿨어요', prev);
    };
    ul.addEventListener('pointerup', end, { capture: true }); ul.addEventListener('pointercancel', end, { capture: true });
    ul.addEventListener('contextmenu', e => { if (dr || lp) e.preventDefault(); });

    // 폰 '옆으로 밀기' 버튼용
    const acts = el => { const id = el.dataset.id, x = live(io.get()).find(y => y.id === id); return [['✎<span>고치기</span>', '', () => edit(id)], ['📅<span>마감</span>', '', () => setDue(id)]].concat(x && !x.done ? [['📌<span>' + (x.pin ? '풀기' : '고정') + '</span>', 'p', () => pin(id)]] : []).concat([['🗑<span>삭제</span>', 'd', () => del([id])]]); };
    render();
    return { render, acts };
  }
  window.PT = { mount, merge, openCount, live };
})();
