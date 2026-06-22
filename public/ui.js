/* Header menu (desktop "Menu" link + mobile hamburger) + collection filter + keyword search + neomorphic dropdowns. */
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
      t.addEventListener('click', function (e) {
        e.stopPropagation();
        setPanel(panel && panel.hasAttribute('hidden'));
      });
    });

    var tours = document.getElementById('tours');
    function goTours() { if (tours) tours.scrollIntoView({ behavior: 'smooth' }); }

    function applyFilter(f) {
      document.querySelectorAll('.card[data-cat]').forEach(function (c) {
        c.style.display = (f === 'all' || c.getAttribute('data-cat') === f) ? '' : 'none';
      });
      setPanel(false); goTours();
    }
    function applySearch(kw) {
      kw = (kw || '').trim().toLowerCase();
      document.querySelectorAll('.card[data-cat]').forEach(function (c) {
        c.style.display = (!kw || c.textContent.toLowerCase().indexOf(kw) !== -1) ? '' : 'none';
      });
      setPanel(false); goTours();
    }

    document.querySelectorAll('[data-filter]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        if (el.tagName === 'A') e.preventDefault();
        applyFilter(el.getAttribute('data-filter'));
      });
    });
    document.querySelectorAll('#menu-panel a').forEach(function (a) {
      a.addEventListener('click', function () { setPanel(false); });
    });

    // keyword search
    var kw = document.getElementById('kw-search');
    var findBtn = document.getElementById('find-btn');
    var searchBtn = document.getElementById('search-btn');
    if (kw) kw.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); applySearch(kw.value); } });
    if (findBtn) findBtn.addEventListener('click', function () { applySearch(kw ? kw.value : ''); });
    if (searchBtn) searchBtn.addEventListener('click', function () {
      if (!kw) { window.location.href = (window.TIK_BASE || '/') + 'all-tours/'; return; }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(function () { kw.focus(); }, 350);
    });

    // custom neomorphic dropdowns
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
          if (sel.getAttribute('data-name') === 'experience') applyFilter(li.getAttribute('data-val'));
        });
      });
    });
    document.addEventListener('click', closeAllSel);
  });
})();
