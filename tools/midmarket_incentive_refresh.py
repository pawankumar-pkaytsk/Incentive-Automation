#!/usr/bin/env python3
"""Compute the HITS 1k-5k (midmarket) incentive inputs → midmarket_incentive.json.

Per GL per month it emits ARR target/achieved, Meta & Google Spend/Live (day-wise
weighted), Google go-live (frozen at cycle end), churn, and the HIT2 seller list.
The browser maps HIT2 sellers → GL via the HITS-2 handover sheet (OAuth-only) and
applies the pool tier + gates.

Cards: 11020 (per-age ARR TARGET) · 7336 (seller×month ARR) · 10453 (cohort/hit2)
       10469 (daily spend, 135MB) · 7401 (google ad account) · 7753 (seller→GC)
       12100/11322 come in via midmarket_data.json.

Run: python3 ~/metabase-arr-refresh/midmarket_incentive_refresh.py [--push]
"""
import json, os, sys, re, math, datetime, collections, subprocess, urllib.request

REPO = os.path.expanduser(os.environ.get("REPO_DIR", "~/Incentive-Automation"))
OUT = os.path.join(REPO, "midmarket_incentive.json")
MM_IN = os.path.join(REPO, "midmarket_data.json")
CRED = os.path.expanduser("~/metabase-arr-refresh/.mbcreds")
MONTHS_BACK = 6
WINDOW_START_DAY = 20
CHURN_SPEND = 11800.0          # revenue spend >= ₹11,800 …
CHURN_IDLE_DAYS = 21           # … then no spend for > 21 days


def creds():
    e = json.load(open(CRED))
    return e['METABASE_URL'].rstrip('/'), e['METABASE_USER_EMAIL'], e['METABASE_PASSWORD']


def req(url, method='GET', body=None, H=None, timeout=900):
    import time as _t
    data = json.dumps(body).encode() if body is not None else None
    last = None
    for attempt in range(3):
        try:
            r = urllib.request.Request(url, data=data, method=method, headers=H or {})
            with urllib.request.urlopen(r, timeout=timeout) as resp:
                return json.loads(resp.read().decode())
        except Exception as ex:
            last = ex; _t.sleep(5 * (attempt + 1))
    raise last


cn = lambda s: re.sub(r'\s+', ' ', str(s or '').strip().lower())
def toks(s): return [t for t in re.sub(r'[^a-z\s]', '', cn(s)).split(' ') if t]


def make_resolver(names):
    """Fuzzy resolve a loose name (e.g. 'Parth') to a canonical GL name."""
    canon = {cn(n): n for n in names}
    def resolve(name):
        t = toks(name)
        if not t: return None
        for v in canon.values():
            if toks(v) == t: return v
        for v in canon.values():
            g = toks(v)
            if g and g[0] == t[0] and (all(x in g for x in t[1:]) or all(x in t for x in g[1:])):
                return v
        return None
    return resolve


def cycle_for(mo, yr):
    s = datetime.date(yr, mo, WINDOW_START_DAY)
    em, ey = (1, yr + 1) if mo == 12 else (mo + 1, yr)
    return s, datetime.date(ey, em, WINDOW_START_DAY - 1)


def mdiff(a, b): return (b // 100 - a // 100) * 12 + (b % 100 - a % 100)


def main():
    url, email, pw = creds()
    tok = req(f"{url}/api/session", 'POST', {"username": email, "password": pw}, {'Content-Type': 'application/json'})['id']
    H = {'Content-Type': 'application/json', 'X-Metabase-Session': tok}
    q = lambda cid: req(f"{url}/api/card/{cid}/query/json", 'POST', {}, H)

    mm = json.load(open(MM_IN))
    gl_names = [x['gl'] for x in mm['mapping']]
    targets_by_period = collections.defaultdict(dict)
    for t in mm['targets']:
        key = f"{t['year']}-{str(t['month']).zfill(2)}"
        targets_by_period[key][cn(t['name'])] = int(t.get('target') or 0)
        if t['name'] not in gl_names:
            gl_names.append(t['name'])          # past GLs with a target for that month
    resolve_gl = make_resolver(gl_names)

    print("[pull] 11020 / 10453 / 7336 / 7753 / 7401 …")
    tgt_row = [r for r in q(11020) if r.get('hit_year_month') == 'TARGET'][0]
    TARGET = [float(tgt_row['m%d' % i] or 0) for i in range(6)]
    master = q(10453)
    arr = q(7336)
    m7753 = {str(r['seller_id']): r for r in q(7753)}
    g7401 = {str(r['seller_id']): r for r in q(7401)}
    print("[pull] 10469 daily spend (large) …")
    daily = q(10469)
    print(f"[pull] done · daily rows={len(daily)}")

    isgood = lambda r: str(r.get('good_seller')).lower() in ('1', 'true', 'yes')
    gcof = lambda sid: cn((m7753.get(sid) or {}).get('growth_consultant_name'))

    # Assigned universe for Spend/Live + go-live: team='HITS', not good_seller, GC is a known GL.
    assigned = {}
    for r in master:
        sid = str(r['seller_id'])
        if str(r.get('team')).upper() == 'HITS' and not isgood(r):
            gl = resolve_gl(gcof(sid))
            if gl: assigned[sid] = gl

    # ARR cohort (targets accrue): team HITS or hit2, not good_seller, HIT1 >= 2025-10.
    def hm(r):
        try: return int(r['hit_year']) * 100 + int(r['hit_month'])
        except (TypeError, ValueError): return None
    cohort = [r for r in master
              if (str(r.get('team')).upper() == 'HITS' or str(r.get('hit2')) == '1')
              and not isgood(r) and (hm(r) or 0) >= 202510]

    def convmonth(r):
        if str(r.get('hit2')) != '1': return None
        yw = str(r.get('hit2_year_week') or '')
        try:
            y, w = int(yw[:4]), int(yw[-2:])
            f = datetime.date.fromisocalendar(y, w, 5)
            return f.year * 100 + f.month
        except (ValueError, TypeError): return None

    alut = {}
    for a in arr:
        try: alut[(str(a['seller_id']), int(a['year_month']))] = float(a.get('arr') or 0)
        except (TypeError, ValueError): pass

    # Index daily spend for assigned sellers; track market-wide day totals for "settled days".
    byseller = collections.defaultdict(dict); daytot = collections.Counter()
    for d in daily:
        dt = str(d.get('date'))[:10]
        so = float(d.get('spend_overall') or 0)
        daytot[dt] += so
        sid = str(d['seller_id'])
        if sid in assigned:
            byseller[sid][dt] = (float(d.get('spend_meta') or 0), float(d.get('spend_google') or 0), so)

    today = datetime.date.today()
    months = []
    y, mo = today.year, today.month
    for _ in range(MONTHS_BACK):
        months.append((mo, y)); mo -= 1
        if mo == 0: mo, y = 12, y - 1
    months.reverse()

    out_months = {}
    for mo, yr in months:
        key = f"{yr}-{str(mo).zfill(2)}"
        s, e = cycle_for(mo, yr)
        last = min(e, today - datetime.timedelta(days=1))
        days = []
        d = s
        while d <= last:
            if daytot.get(d.isoformat(), 0) > 0: days.append(d.isoformat())
            d += datetime.timedelta(days=1)
        nd = len(days)
        eiso = e.isoformat()

        # Google-live FROZEN at cycle end: has ad account AND cumulative google spend to date > ₹1.
        cumg = collections.Counter(); lastspend = {}
        cumall = collections.Counter()
        for sid, mp in byseller.items():
            for dt, (sm, sg, so) in mp.items():
                if dt <= eiso:
                    cumg[sid] += sg; cumall[sid] += so
                    if so > 0 and (sid not in lastspend or dt > lastspend[sid]): lastspend[sid] = dt

        per = collections.defaultdict(lambda: {'assigned': 0, 'glive': 0, 'mdays': 0, 'gdays': 0, 'churn': 0,
                                               'arrTarget': 0.0, 'arrAch': 0.0, 'sellers': 0, 'frozen': 0})
        for sid, gl in assigned.items():
            p = per[gl]; p['assigned'] += 1
            has_acct = bool((g7401.get(sid) or {}).get('google_ad_account_id'))
            glive = has_acct and cumg.get(sid, 0) > 1
            if glive: p['glive'] += 1
            mp = byseller.get(sid, {})
            for dt in days:
                sm, sg, so = mp.get(dt, (0, 0, 0))
                if sm > 0: p['mdays'] += 1
                if glive and sg > 0: p['gdays'] += 1
            # churn: spent >= threshold historically, then idle > 21 days as of cycle end
            if cumall.get(sid, 0) >= CHURN_SPEND:
                ls = lastspend.get(sid)
                if ls:
                    idle = (e - datetime.date.fromisoformat(ls)).days
                    if idle > CHURN_IDLE_DAYS: p['churn'] += 1
                else:
                    p['churn'] += 1

        ym = yr * 100 + mo
        for r in cohort:
            h1 = hm(r); sid = str(r['seller_id'])
            if not h1 or h1 > ym: continue
            cm = convmonth(r)
            if cm is not None and not (h1 <= cm <= ym): cm = None      # bad-data guard
            if cm is not None and cm < ym: continue                    # dropped after HIT2 handover
            gl = assigned.get(sid) or resolve_gl(gcof(sid))
            if not gl: continue
            frozen = (cm == ym)
            age = mdiff(h1, cm if frozen else ym)
            p = per[gl]
            p['arrTarget'] += TARGET[min(max(age, 0), 5)]
            p['arrAch'] += alut.get((sid, ym), 0.0)
            p['sellers'] += 1
            if frozen: p['frozen'] += 1

        # HIT2 conversions in this CALENDAR month — browser maps these to a GL via the handover sheet.
        hit2 = []
        for r in master:
            if str(r.get('hit2')) != '1' or isgood(r): continue
            try:
                if int(r['hit2_year']) != yr or int(r['hit2_month']) != mo: continue
            except (TypeError, ValueError): continue
            hit2.append({'sid': str(r['seller_id']), 'name': str(r.get('seller_name') or '').strip()})

        gls = {}
        for gl, p in per.items():
            a, gl_ct = p['assigned'], p['glive']
            gls[gl] = {
                'assigned': a, 'glive': gl_ct, 'days': nd, 'sellers': p['sellers'], 'frozen': p['frozen'],
                'arrTarget': round(p['arrTarget'], 2), 'arrAch': round(p['arrAch'], 2),
                'arrPct': round(p['arrAch'] / p['arrTarget'] * 100, 2) if p['arrTarget'] else None,
                'metaSL': round(p['mdays'] / (nd * a) * 100, 2) if nd and a else None,
                'googleSL': round(p['gdays'] / (nd * gl_ct) * 100, 2) if nd and gl_ct else None,
                'golive': round(gl_ct / a * 100, 2) if a else None,
                'churn': p['churn'],
            }
        out_months[key] = {'cycle': [s.isoformat(), e.isoformat()], 'settledDays': nd,
                           'gls': gls, 'hit2': hit2, 'targets': targets_by_period.get(key, {})}
        print(f"[{key}] cycle {s}→{e} · days={nd} · GLs={len(gls)} · hit2={len(hit2)}")

    data = {'generatedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
            'target': TARGET, 'assignedTotal': len(assigned), 'months': out_months,
            'cards': {'arrTarget': 11020, 'arr': 7336, 'master': 10453, 'daily': 10469, 'google': 7401, 'map': 7753}}
    json.dump(data, open(OUT, 'w'), separators=(',', ':'))
    print(f"[out] {OUT} ({os.path.getsize(OUT)} bytes) · assigned={len(assigned)}")

    if '--push' in sys.argv:
        subprocess.run(['git', '-C', REPO, 'add', 'midmarket_incentive.json'], check=True)
        r = subprocess.run(['git', '-C', REPO, 'commit', '-m', 'Refresh 1k-5k incentive inputs'], capture_output=True, text=True)
        print(r.stdout.strip() or r.stderr.strip())
        if r.returncode == 0:
            subprocess.run(['git', '-C', REPO, 'push', 'origin', 'main'], check=True); print("[push] deployed")


if __name__ == '__main__':
    main()
