/* Header menu (desktop "Menu" + mobile hamburger) + UNIFIED filter (category + when + keyword)
   + neomorphic dropdowns. The "When" filter respects real tour availability:
   each card may carry data-days (JS getDay() values the tour runs) and data-blockdom
   (days-of-month blocked), baked from Supabase tour_blocks. No data-days = runs any day. */
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  ready(function () {
    var panel = document.getElementById('menu-panel');
    var toggles = document.querySelectorAll('.js-menu-toggle');
    function setPanel(open) {
      if (!panel) return;
      if (open) panel.removeAttribute('hidden'); else panel.setAttribute('hidden', '');
      toggles.forEach(function (t) { t.setAttribute('aria-expanded', String(open)); });
    }
    toggles.forEach(function (t) {
      t.addEventListener('click', function (e) { e.stopPropagation(); setPanel(panel && panel.hasAttribute('hidden')); });
    });

    var toursEl = document.getElementById('tours');
    function goTours() { if (toursEl) toursEl.scrollIntoView({ behavior: 'smooth' }); }

    // ---------- unified filter ----------
    var state = { cat: 'all', when: 'Anytime', kw: '' };
    var cards = [].slice.call(document.querySelectorAll('.card[data-cat]'));
    // On the All Tours page the keyword search and the category pills are SEPARATE,
    // authoritative controls (not the home's combine-experience-then-find funnel):
    // a keyword search spans every category, and picking a category clears the keyword.
    var hasPills = !!document.querySelector('.fbar .fpill');

    function nums(s) { return (s || '').split(',').map(function (x) { return parseInt(x, 10); }).filter(function (x) { return !isNaN(x); }); }
    function dateOk(card, d) {
      var days = card.getAttribute('data-days');
      var dom = card.getAttribute('data-blockdom');
      var dayOk = !days || nums(days).indexOf(d.getDay()) !== -1;
      var domOk = !dom || nums(dom).indexOf(d.getDate()) === -1;
      return dayOk && domOk;
    }
    function whenOk(card) {
      if (state.when === 'Anytime') return true;
      var now = new Date(); now.setHours(0, 0, 0, 0);
      function plus(n) { var x = new Date(now); x.setDate(x.getDate() + n); return x; }
      if (state.when === 'Today') return dateOk(card, now);
      if (state.when === 'Tomorrow') return dateOk(card, plus(1));
      if (state.when === 'This week') { for (var i = 0; i < 7; i++) { if (dateOk(card, plus(i))) return true; } return false; }
      return true;
    }
    function applyFilters() {
      var kw = state.kw.trim().toLowerCase();
      var any = false;
      cards.forEach(function (c) {
        var ok = (state.cat === 'all' || c.getAttribute('data-cat') === state.cat)
              && (!kw || c.textContent.toLowerCase().indexOf(kw) !== -1)
              && whenOk(c);
        c.style.display = ok ? '' : 'none';
        if (ok) any = true;
      });
      var note = document.querySelector('.no-match'); if (note) note.hidden = any;
      return any;
    }
    function applyAndGo() { applyFilters(); setPanel(false); goTours(); }

    // category: data-filter buttons/links + experience dropdown
    document.querySelectorAll('[data-filter]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        if (el.tagName === 'A') e.preventDefault();
        state.cat = el.getAttribute('data-filter');
        if (hasPills) { state.kw = ''; if (kw) kw.value = ''; } // picking a category clears the keyword (All Tours)
        applyAndGo();
      });
    });
    document.querySelectorAll('#menu-panel a').forEach(function (a) {
      a.addEventListener('click', function () { setPanel(false); });
    });

    // keyword
    var kw = document.getElementById('kw-search');
    var findBtn = document.getElementById('find-btn');
    var searchBtn = document.getElementById('search-btn');
    if (kw) kw.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); state.kw = kw.value; if (hasPills) state.cat = 'all'; applyAndGo(); } });
    if (findBtn) findBtn.addEventListener('click', function () { state.kw = kw ? kw.value : ''; if (hasPills) state.cat = 'all'; applyAndGo(); });
    if (searchBtn) searchBtn.addEventListener('click', function () {
      if (!kw) { window.location.href = (window.TIK_BASE || '/') + 'all-tours/'; return; }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(function () { kw.focus(); }, 350);
    });

    // neomorphic dropdowns: experience -> category, when -> when
    function closeAllSel() {
      document.querySelectorAll('.nsel-list').forEach(function (l) { l.setAttribute('hidden', ''); });
      document.querySelectorAll('.nsel-btn').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    }
    document.querySelectorAll('.nsel').forEach(function (sel) {
      var b = sel.querySelector('.nsel-btn');
      var list = sel.querySelector('.nsel-list');
      var val = sel.querySelector('.nsel-val');
      if (!b || !list || !val) return;
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = list.hasAttribute('hidden');
        closeAllSel();
        if (open) { list.removeAttribute('hidden'); b.setAttribute('aria-expanded', 'true'); }
      });
      list.querySelectorAll('li').forEach(function (li) {
        li.addEventListener('click', function () {
          val.textContent = li.textContent;
          list.querySelectorAll('li').forEach(function (o) { o.removeAttribute('aria-selected'); });
          li.setAttribute('aria-selected', 'true');
          closeAllSel();
          var name = sel.getAttribute('data-name');
          var v = li.getAttribute('data-val');
          // Hero search: dropdowns ONLY set the selection. The search runs when the
          // user presses "Find my tour" (or Enter) — like the current Shopify search,
          // so they can pick Experience AND When before anything moves.
          if (name === 'experience') { state.cat = v; }
          else if (name === 'when') { state.when = v; }
        });
      });
    });
    document.addEventListener('click', closeAllSel);
  });
})();
