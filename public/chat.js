/* TIK Samui chat widget — ported from the live theme snippet.
   Uses the EXACT same backend (Vercel /api/chat + Supabase realtime) so the bot is unchanged.
   Self-contained: injects its own styles + markup, lazy-loads Supabase only on first open. */
(function () {
  var CSS = "" +
"#tik-btn-wrap{position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;align-items:center;gap:6px}" +
"#tik-label{position:relative;background:linear-gradient(135deg,#0CC0DF,#38bdf8);color:#fff;font-size:13px;font-weight:600;padding:8px 14px;border-radius:16px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;white-space:nowrap;box-shadow:0 2px 10px rgba(12,192,223,0.4)}" +
"#tik-label::after{content:'';position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:7px solid #22d3ee}" +
"#tik-btn{width:80px;height:80px;border-radius:50%;background:#fff;border:2px solid rgba(12,192,223,0.3);cursor:pointer;box-shadow:0 4px 15px rgba(12,192,223,0.4);display:flex;align-items:center;justify-content:center;overflow:hidden;padding:0}" +
"#tik-btn img{width:100%;height:100%;object-fit:cover;object-position:top;border-radius:50%}" +
"#tik-win{position:fixed;bottom:20px;right:20px;width:380px;height:560px;background:#e8ecf0;border-radius:24px;box-shadow:12px 12px 24px #c5ccd6,-12px -12px 24px #ffffff;z-index:10000;display:none;flex-direction:column;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,sans-serif}" +
"#tik-head{background:#e8ecf0;padding:15px 20px;display:flex;align-items:center;flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,0.06);position:relative}" +
"#tik-close{position:absolute;top:15px;right:15px;width:30px;height:30px;border-radius:50%;background:#e8ecf0;border:none;color:#666;font-size:18px;cursor:pointer;box-shadow:3px 3px 6px #c5ccd6,-3px -3px 6px #fff;display:flex;align-items:center;justify-content:center}" +
"#tik-av{width:45px;height:45px;border-radius:50%;object-fit:cover;box-shadow:3px 3px 6px #c5ccd6,-3px -3px 6px #fff;opacity:0;transition:opacity .3s}" +
"#tik-info{margin-left:12px}#tik-name{color:#374151;font-weight:600;font-size:14px}" +
"#tik-status{color:#22c55e;font-size:11px;display:flex;align-items:center;gap:4px}#tik-status::before{content:'';width:5px;height:5px;background:#22c55e;border-radius:50%}" +
"#tik-logo{height:35px;object-fit:contain;position:absolute;left:50%;transform:translateX(-50%)}" +
"#tik-msgs{flex:1;overflow-y:auto;padding:20px;background:#e8ecf0;display:flex;flex-direction:column;gap:12px}" +
".tik-m{max-width:80%;padding:12px 16px;border-radius:18px;font-size:14px;line-height:1.5;word-wrap:break-word}" +
".tik-m.bot{align-self:flex-start;background:#fff;color:#374151;border:1px solid #e5e7eb;border-bottom-left-radius:4px}" +
".tik-m.user{align-self:flex-end;background:linear-gradient(135deg,#0CC0DF,#0a7180);color:#fff;border-bottom-right-radius:4px}" +
".tik-m.staff{align-self:flex-start;background:linear-gradient(135deg,#0CC0DF,#22c55e);color:#fff;border-bottom-left-radius:4px}" +
".tik-m a{color:inherit;text-decoration:underline}" +
".tik-m.admin{align-self:center;background:rgba(0,0,0,0.06);color:#666;font-size:11px;border-radius:8px;padding:6px 10px;font-family:monospace;border:none;max-width:95%}" +
".tik-typ{display:flex;gap:4px;padding:12px 16px;background:#fff;border-radius:18px;align-self:flex-start;border:1px solid #e5e7eb}" +
".tik-typ span{width:7px;height:7px;background:#9ca3af;border-radius:50%;animation:tikbounce 1.4s infinite}" +
".tik-typ span:nth-child(2){animation-delay:.2s}.tik-typ span:nth-child(3){animation-delay:.4s}" +
"@keyframes tikbounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}" +
"#tik-inp-area{padding:15px;background:#e8ecf0;display:flex;gap:10px;flex-shrink:0;box-shadow:0 -2px 8px rgba(0,0,0,0.04)}" +
"#tik-inp{flex:1;border:1px solid #e5e7eb;border-radius:20px;padding:12px 18px;font-size:14px;outline:none;background:#fff;color:#374151}" +
"#tik-send{width:44px;height:44px;min-width:44px;border-radius:50%;background:linear-gradient(135deg,#0CC0DF,#0a7180);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(12,192,223,.3)}" +
"#tik-send svg{width:20px;height:20px;stroke:#fff;fill:none}" +
"@media(max-width:500px){html.tik-open,html.tik-open body{overflow:hidden!important;position:fixed!important;width:100%!important;height:100%!important}#tik-btn{width:72px;height:72px}#tik-win{position:fixed!important;inset:0!important;width:100%!important;height:100%!important;border-radius:0!important}}";

  var HTML = '' +
'<div id="tik-btn-wrap"><div id="tik-label">Chat with us</div>' +
'<button id="tik-btn" aria-label="Open chat" aria-expanded="false" aria-controls="tik-win">' +
'<img src="/chat-avatar.png" alt="Chat with Tour In Koh Samui" width="80" height="80" loading="lazy" decoding="async"></button></div>' +
'<div id="tik-win"><div id="tik-head">' +
'<img id="tik-av" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="">' +
'<div id="tik-info"><div id="tik-name">...</div><div id="tik-status">Online</div></div>' +
'<img id="tik-logo" src="" data-src="/chat-logo.png" alt="" loading="lazy">' +
'<button id="tik-close" aria-label="Close chat">&times;</button></div>' +
'<div id="tik-msgs"></div>' +
'<div id="tik-inp-area"><input id="tik-inp" placeholder="Type a message..."><button id="tik-send" aria-label="Send message">' +
'<svg viewBox="0 0 24 24" stroke-width="2" aria-hidden="true"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg></button></div></div>';

  function boot() {
    var style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
    var holder = document.createElement('div'); holder.innerHTML = HTML; document.body.appendChild(holder);

    var API = 'https://tour-finance-app.vercel.app/api/chat';
    var SUPABASE_URL = 'https://tippsaxknexjelbnpryy.supabase.co';
    var SUPABASE_KEY = 'sb_publishable_5RQtGuGgDGBGrho7wh-hsw_qJathHTX';
    var sid = 's' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    var sb = null, channel = null, convId = null, isOpen = false, shownIds = {}, greetTimer = null, customerTypedFirst = false;

    function initSupabase() { if (!sb && window.supabase) sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); }
    function loadSupabaseThenInit() {
      var logo = document.getElementById('tik-logo');
      if (logo && logo.dataset.src && !logo.src) logo.src = logo.dataset.src;
      if (window.supabase) { initSupabase(); initChat(); return; }
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      s.onload = function () { initSupabase(); initChat(); };
      s.onerror = function () { initChat(); };
      document.head.appendChild(s);
    }
    function subscribe(cid) {
      if (!sb || !cid) return;
      if (channel) sb.removeChannel(channel);
      channel = sb.channel('widget_' + cid).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'conversation_id=eq.' + cid }, function (payload) {
        var m = payload.new;
        if (m && !shownIds[m.id] && m.sender === 'staff') { shownIds[m.id] = true; addMsg(m.content, 'staff'); }
      }).subscribe();
    }
    function toggle() {
      isOpen = !isOpen;
      var win = document.getElementById('tik-win'), wrap = document.getElementById('tik-btn-wrap'), btn = document.getElementById('tik-btn');
      if (isOpen) { win.style.display = 'flex'; wrap.style.display = 'none'; document.documentElement.classList.add('tik-open'); if (btn) btn.setAttribute('aria-expanded', 'true'); loadSupabaseThenInit(); }
      else { win.style.display = 'none'; wrap.style.display = 'flex'; document.documentElement.classList.remove('tik-open'); if (btn) btn.setAttribute('aria-expanded', 'false'); }
    }
    function initChat() {
      fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: '__init__', sessionId: sid }) })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.avatar) { var av = document.getElementById('tik-av'); av.onload = function () { av.style.opacity = '1'; }; av.src = d.avatar.img; document.getElementById('tik-name').textContent = d.avatar.name; }
          if (d.conversationId) { convId = d.conversationId; subscribe(convId); }
          greetTimer = setTimeout(function () { if (!customerTypedFirst) addMsg('Hey! Looking for a tour? Happy to help.', 'bot'); }, 4000);
        }).catch(function () {});
    }
    function linkify(t) {
      t = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
      t = t.replace(/(?<!['"=])(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
      t = t.replace(/\n/g, '<br>');
      return t;
    }
    function addMsg(text, type) {
      if (!text) return;
      var c = document.getElementById('tik-msgs'); var d = document.createElement('div');
      d.className = 'tik-m ' + type; d.innerHTML = linkify(text); c.appendChild(d); c.scrollTop = c.scrollHeight;
    }
    function showTyping() { if (document.getElementById('tik-typing')) return; var c = document.getElementById('tik-msgs'); var d = document.createElement('div'); d.className = 'tik-typ'; d.id = 'tik-typing'; d.innerHTML = '<span></span><span></span><span></span>'; c.appendChild(d); c.scrollTop = c.scrollHeight; }
    function hideTyping() { var e = document.getElementById('tik-typing'); if (e) e.remove(); }
    function send() {
      var inp = document.getElementById('tik-inp'); var msg = inp.value.trim(); if (!msg) return;
      customerTypedFirst = true; if (greetTimer) { clearTimeout(greetTimer); greetTimer = null; }
      inp.value = ''; addMsg(msg, 'user'); showTyping();
      fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg, sessionId: sid }) })
        .then(function (r) { if (!r.ok) throw new Error('err'); return r.json(); })
        .then(function (d) { hideTyping(); if (d.conversationId && !convId) { convId = d.conversationId; subscribe(convId); } if (d.response) addMsg(d.response, d.isAdminResponse ? 'admin' : 'bot'); })
        .catch(function () { hideTyping(); addMsg('Connection error. Please try again.', 'bot'); });
    }
    document.getElementById('tik-btn').addEventListener('click', toggle);
    document.getElementById('tik-close').addEventListener('click', toggle);
    document.getElementById('tik-send').addEventListener('click', send);
    document.getElementById('tik-inp').addEventListener('keypress', function (e) { if (e.key === 'Enter') send(); });
    if (window.location.search.indexOf('chat=open') !== -1 || window.location.hash === '#chat') setTimeout(toggle, 500);
  }
  if (document.readyState !== 'loading') boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
