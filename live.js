/* =====================================================================
   Incentive Automation — LIVE backend adapter
   When window.INCENTIVE_BACKEND_URL is set, exchanges the Google ID token
   for role-filtered, server-computed data and swaps it into the app.
   Falls back to seeded sample data on any failure (app keeps working).
   ===================================================================== */
(function () {
  const I = window.INCENTIVE;
  I.backendUrl = (window.INCENTIVE_BACKEND_URL || '').trim();
  I.connStatus = 'idle'; // idle | connecting | live | error | sample

  // Replace the in-memory roster with server data, rebuild graph + aggregations.
  function ingest(resp) {
    const people = resp.people || [];
    // rebuild byEmail + reporting graph + descendants over the returned subset
    const byEmail = {}; people.forEach((p) => { byEmail[p.email] = p; });
    people.forEach((p) => { p.reports = []; });
    people.forEach((p) => { if (p.managerEmail && byEmail[p.managerEmail]) byEmail[p.managerEmail].reports.push(p); });

    // mutate the SAME array reference engine.js closed over, so all
    // aggregation helpers (teamSummary, flaggedPeople, …) see live data.
    I.people.length = 0; people.forEach((p) => I.people.push(p));
    Object.keys(I.byEmail).forEach((k) => delete I.byEmail[k]);
    Object.assign(I.byEmail, byEmail);

    if (resp.months) { I.MONTHS.length = 0; resp.months.forEach((m) => I.MONTHS.push(m)); }
    if (resp.period) I.PERIOD = resp.period;
    // point the active period at the latest returned month
    if (I.MONTHS.length) I.setPeriod(I.MONTHS[I.MONTHS.length - 1].key);

    I.DATA_LIVE = true; I.connStatus = 'live';
    I.liveViewer = resp.viewer || null;
  }

  // Decode an ID token payload (no verification — backend verifies).
  function emailFromToken(token) {
    try {
      const b = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(atob(b).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      return (JSON.parse(json).email || '').toLowerCase();
    } catch (e) { return null; }
  }

  /* JSONP loader — avoids CORS entirely (Apps Script can't send CORS headers). */
  function jsonp(url, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var cb = '__inc_cb_' + Math.random().toString(36).slice(2);
      var s = document.createElement('script');
      var timer = setTimeout(function () { cleanup(); reject(new Error('timeout')); }, timeoutMs || 90000);
      function cleanup() { clearTimeout(timer); try { delete window[cb]; } catch (e) { window[cb] = undefined; } if (s.parentNode) s.parentNode.removeChild(s); }
      window[cb] = function (data) { cleanup(); resolve(data); };
      s.onerror = function () { cleanup(); reject(new Error('network/script error')); };
      s.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + cb;
      document.head.appendChild(s);
    });
  }

  /* Portal connect (NO AUTH) — fetches all computed data; everyone sees
     everyone. Resolves to { ok } or { ok:false }. Always safe. */
  I.connectPortal = async function () {
    if (!I.backendUrl) { I.connStatus = 'sample'; return { ok: false, reason: 'no_backend' }; }
    I.connStatus = 'connecting';
    try {
      const data = await jsonp(I.backendUrl, 90000);
      if (!data || !data.ok) { I.connStatus = 'error'; I.connError = (data && data.error) || 'unknown'; return { ok: false, reason: (data && data.error) || 'unknown' }; }
      ingest(data);
      return { ok: true };
    } catch (e) {
      I.connStatus = 'error'; I.connError = String(e);
      return { ok: false, reason: String(e) };
    }
  };
})();
