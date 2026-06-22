/* TIK currency switcher — ported contract from the live theme.
   THB is the base; conversion is DISPLAY-ONLY. Booking always happens in THB
   on the Shopify product page, so nothing about the cart/payload changes. */
(function () {
  var CUR = ['THB', 'USD', 'EUR'];
  var SYM = { THB: '฿', USD: '$', EUR: '€' };
  var rates = { THB: 1, USD: 0.0292, EUR: 0.0270 }; // fallback until live fetch
  var KEY = 'tik_cur';
  var cur = localStorage.getItem(KEY) || 'THB';

  function fmt(thb, c) {
    var v = Math.round(thb * rates[c]);
    return SYM[c] + v.toLocaleString('en-US');
  }
  function apply() {
    document.querySelectorAll('.price-amount').forEach(function (el) {
      var thb = parseFloat(el.getAttribute('data-thb'));
      if (!isNaN(thb)) el.textContent = fmt(thb, cur);
    });
    var btn = document.getElementById('cur-btn');
    if (btn) btn.textContent = SYM[cur] + ' ' + cur;
  }
  window.tikSetCurrency = function (c) {
    if (!SYM[c]) return;
    cur = c; localStorage.setItem(KEY, c); apply();
  };
  function cycle() {
    window.tikSetCurrency(CUR[(CUR.indexOf(cur) + 1) % CUR.length]);
  }

  function init() {
    apply();
    var btn = document.getElementById('cur-btn');
    if (btn) btn.addEventListener('click', cycle);
    fetch('https://open.er-api.com/v6/latest/THB')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.rates) {
          rates.USD = d.rates.USD || rates.USD;
          rates.EUR = d.rates.EUR || rates.EUR;
          apply();
        }
      })
      .catch(function () {});
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
