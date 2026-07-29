#!/usr/bin/env python3
"""Build task_data.json for the HITS Incentive app (Input metrics: Task + Callback).

Source: Metabase card 10181 ("All Tasks (Pawan) - for website built").
Keeps only GC-bucket rows whose sub_type is used by the incentive engine, from
START_DATE onward. Emits a compact snapshot the browser reads directly (no auth).

Fields per task: st=sub_type, gc=assignee_name, status, cr=task_created_at(YYYY-MM-DD),
sla=sla_in_min (allowed), tat=tat (actual minutes), s=seller_id.
'within SLA' is computed client-side as: done AND tat <= sla_in_min.

Run:  python3 ~/metabase-arr-refresh/incentive_task_refresh.py [--push]
Env:  REPO_DIR (default ~/Incentive-Automation), START_DATE (default 2026-01-01)
"""
import json, os, sys, subprocess, urllib.request, datetime

CARD = 10181
REV_CARD = 11911
GM_CARD = 12101
MM_CARD = 12100      # HITS team mapping — 1k-5k GLs
TGT_CARD = 11322     # hits_target_incentive_automation
REPO = os.path.expanduser(os.environ.get("REPO_DIR", "~/Incentive-Automation"))
OUT  = os.path.join(REPO, "task_data.json")
REV_OUT = os.path.join(REPO, "revival_data.json")
GM_OUT = os.path.join(REPO, "gm_mapping.json")
MM_OUT = os.path.join(REPO, "midmarket_data.json")
START_DATE = os.environ.get("START_DATE", "2026-01-01")
CRED_CACHE = os.path.expanduser("~/metabase-arr-refresh/.mbcreds")
DESKTOP_CFG = os.path.expanduser("~/Library/Application Support/Claude/claude_desktop_config.json")

# Must mirror engine.js / sheets.js
TASK_SUBS = ['internal_seller_escalation_general_request', 'pre-live-call', 'troubleshoot_manual_action']
CALL_SUBS = ['schedule_call']
KEEP_SUBS = set(TASK_SUBS + CALL_SUBS)


def creds():
    if os.environ.get('METABASE_URL'):
        return os.environ['METABASE_URL'].rstrip('/'), os.environ['METABASE_USER_EMAIL'], os.environ['METABASE_PASSWORD']
    e = json.load(open(CRED_CACHE)) if os.path.exists(CRED_CACHE) else json.load(open(DESKTOP_CFG))['mcpServers']['metabase']['env']
    return e['METABASE_URL'].rstrip('/'), e['METABASE_USER_EMAIL'], e['METABASE_PASSWORD']


def req(url, method='GET', body=None, H=None):
    import time as _t
    data = json.dumps(body).encode() if body is not None else None
    last = None
    for attempt in range(4):
        try:
            r = urllib.request.Request(url, data=data, method=method, headers=H or {})
            with urllib.request.urlopen(r, timeout=600) as resp:
                return json.loads(resp.read().decode())
        except Exception as e:
            last = e; _t.sleep(3 * (attempt + 1))
    raise last


def d10(v):
    return str(v)[:10] if v else ''


def main():
    url, email, pw = creds()
    tok = req(url + "/api/session", 'POST', {"username": email, "password": pw}, {'Content-Type': 'application/json'})['id']
    H = {'Content-Type': 'application/json', 'X-Metabase-Session': tok}
    rows = req(f"{url}/api/card/{CARD}/query/json", 'POST', {}, H)
    print(f"[task] card {CARD}: {len(rows)} rows")

    out = []
    for r in rows:
        st = str(r.get('sub_type') or '').strip().lower()
        if st not in KEEP_SUBS:
            continue
        if str(r.get('assignee_bucket') or '').strip().upper() != 'GC':
            continue
        cr = d10(r.get('task_created_at'))
        if not cr or cr < START_DATE:
            continue
        out.append({
            'id': str(r.get('id') or ''),
            's': str(r.get('seller_id') or ''),
            'st': st,
            'gc': str(r.get('assignee_name') or '').strip(),
            'status': str(r.get('status') or '').strip().lower(),
            'cr': cr,
            'sla': r.get('sla_in_min'),
            'tat': r.get('tat'),
        })

    data = {
        'generatedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
        'startDate': START_DATE,
        'card': CARD,
        'tasks': out,
    }
    json.dump(data, open(OUT, 'w'), separators=(',', ':'))
    call = [t for t in out if t['st'] in CALL_SUBS]
    task = [t for t in out if t['st'] in TASK_SUBS]
    done = lambda t: t['status'] in ('completed', 'closed')
    within = lambda t: done(t) and t['sla'] is not None and t['tat'] is not None and t['tat'] <= t['sla']
    print(f"[out] {OUT} ({os.path.getsize(OUT)} bytes) · {len(out)} rows kept")
    print(f"      task rows: {len(task)} ({sum(1 for t in task if done(t))} done)")
    print(f"      callback(schedule_call): {len(call)} · {sum(1 for t in call if done(t))} done · {sum(1 for t in call if within(t))} done within SLA")

    # ---- Revival log (card 11911) -> revival_data.json ----------------
    # Each row is one revival event. gc = submitted_by, ts = "May 22, 2026, 06:01:23".
    # The app counts revivals per GC per 20th->19th cycle and applies the band rate.
    rev_rows = req(f"{url}/api/card/{REV_CARD}/query/json", 'POST', {}, H)
    print(f"[revival] card {REV_CARD}: {len(rev_rows)} rows")
    revivals, bad_ts = [], 0
    for r in rev_rows:
        gc = str(r.get('submitted_by') or '').strip()
        if not gc:
            continue
        raw_ts = str(r.get('timestamp') or '').strip()
        try:
            dt = datetime.datetime.strptime(raw_ts, '%b %d, %Y, %H:%M:%S')
            cr = dt.strftime('%Y-%m-%d')
        except ValueError:
            bad_ts += 1
            continue
        if cr < START_DATE:
            continue
        revivals.append({
            'gc': gc,
            'sid': str(r.get('seller_id') or ''),
            'seller': str(r.get('seller_name') or '').strip(),
            'amt': str(r.get('funds_added_amount_in_rupees') or '').strip(),
            'cr': cr,
        })
    rev_data = {
        'generatedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
        'startDate': START_DATE,
        'card': REV_CARD,
        'revivals': revivals,
    }
    json.dump(rev_data, open(REV_OUT, 'w'), separators=(',', ':'))
    import collections as _c
    by_gc = _c.Counter(x['gc'] for x in revivals)
    print(f"[out] {REV_OUT} ({os.path.getsize(REV_OUT)} bytes) · {len(revivals)} revivals · {len(by_gc)} GCs" + (f" · {bad_ts} bad timestamps skipped" if bad_ts else ""))

    # ---- GM → core-GC mapping (card 12101) -> gm_mapping.json ----------
    # One row per (GM, core GC). Drives the GM incentive's GC-ops multiplier + team size.
    gm_rows = req(f"{url}/api/card/{GM_CARD}/query/json", 'POST', {}, H)
    mappings = []
    for r in gm_rows:
        gm = str(r.get('gm') or '').strip(); gc = str(r.get('core_gc') or '').strip()
        if not gm or not gc:
            continue
        mappings.append({
            'gm': gm, 'gmEmail': str(r.get('gm_email_id') or '').strip().lower(),
            'gc': gc, 'gcEmail': str(r.get('core_gc_email_id') or '').strip().lower(),
            'cl': str(r.get('cl') or '').strip(), 'clEmail': str(r.get('cl_email_id') or '').strip().lower(),
        })
    gm_data = {'generatedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'), 'card': GM_CARD, 'mappings': mappings}
    json.dump(gm_data, open(GM_OUT, 'w'), separators=(',', ':'))
    gmset = {m['gmEmail'] or m['gm'] for m in mappings}
    print(f"[out] {GM_OUT} ({os.path.getsize(GM_OUT)} bytes) · {len(mappings)} GM→GC rows · {len(gmset)} GMs")

    # ---- 1k-5k mapping (card 12100) + HITS targets (card 11322) -------
    # Powers the HITS 1k-5k team: who the GLs are, and their monthly HITS target.
    mm_rows = req(f"{url}/api/card/{MM_CARD}/query/json", 'POST', {}, H)
    mm_map = []
    for r in mm_rows:
        gl = str(r.get('1k_5k_gl') or '').strip()
        if not gl:
            continue
        mm_map.append({
            'gl': gl, 'glEmail': str(r.get('1k_5k_gl_email_id') or '').strip().lower(),
            'gm': str(r.get('gm') or '').strip(), 'gmEmail': str(r.get('gm_email_id') or '').strip().lower(),
        })
    tgt_rows = req(f"{url}/api/card/{TGT_CARD}/query/json", 'POST', {}, H)
    targets = []
    for r in tgt_rows:
        role = str(r.get('Role') or '').strip().upper()
        if role != '1K-5K':
            continue
        try:
            mo, yr = int(r.get('Target_Month')), int(r.get('Target_Year'))
        except (TypeError, ValueError):
            continue
        targets.append({'name': str(r.get('Name') or '').strip(), 'target': r.get('HITS_Target'), 'month': mo, 'year': yr})
    mm_data = {'generatedAt': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
               'cards': {'mapping': MM_CARD, 'targets': TGT_CARD}, 'mapping': mm_map, 'targets': targets}
    json.dump(mm_data, open(MM_OUT, 'w'), separators=(',', ':'))
    print(f"[out] {MM_OUT} ({os.path.getsize(MM_OUT)} bytes) · {len(mm_map)} GLs · {len(targets)} 1k-5k target rows")

    if '--push' in sys.argv:
        subprocess.run(['git', '-C', REPO, 'add', 'task_data.json', 'revival_data.json', 'gm_mapping.json', 'midmarket_data.json'], check=True)
        r = subprocess.run(['git', '-C', REPO, 'commit', '-m', 'Refresh task/callback + revival + GM + 1k-5k data (cards 10181, 11911, 12101, 12100, 11322)'], capture_output=True, text=True)
        print(r.stdout.strip() or r.stderr.strip())
        if r.returncode == 0:
            subprocess.run(['git', '-C', REPO, 'push', 'origin', 'main'], check=True); print("[push] deployed")


if __name__ == '__main__':
    main()
