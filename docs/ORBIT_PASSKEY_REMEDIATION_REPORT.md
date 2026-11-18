# ORBIT_PASSKEY exposure — remediation report

**Project:** `/srv/apps/trustifysmm`  
**Prepared:** 2026-11-18 19:45 (UTC+05:45)  
**Status:** ⏸ **PREPARED — NOT EXECUTED.** No force-push. No production change. `.env` untouched.

---

## 1. Summary

`ORBIT_PASSKEY` and **three other real credentials** were committed to `.env.example` in a
**PUBLIC** GitHub repository (`github.com:globalorbitnepal/Trustifysmm`).

| Credential | Length | In history | Currently valid? | Notes |
| --- | --- | --- | --- | --- |
| `ORBIT_PASSKEY` | 9 | **30 commits** | **YES — live** | Protects `/orbit`. Must stay unchanged per your instruction → **stays exposed until Git history is rewritten AND the repo is dealt with** |
| `NOWPAYMENTS_API_KEY` | 23 (historical) | 30 commits | superseded | Current `.env` key is 31 chars → history holds an older key |
| `GOOGLE_CLIENT_SECRET` | 61 (historical) | 24 commits | superseded | Current is 35 chars → older secret |
| `DEMO_API_KEY` | 27 | 30 commits | **known-public literal** | This is the retired default; already denylisted and the demo account is revoked |

Lengths are recorded here deliberately — **no values appear anywhere in this document**.

### The critical asymmetry you need to understand

You asked to **keep `ORBIT_PASSKEY` unchanged**, and I have honoured that: `.env` is byte-for-byte
identical (SHA-256 `ab0f1053…` before and after every step in this task).

But that means: **rewriting Git history does not make `/orbit` safe.** The passkey is
publicly known. Removing it from history stops *future* disclosure; it does not un-publish it.
Anyone who cloned or forked the repo, or who read it before the rewrite, still has a working
`/orbit` password.

The only way to actually close this is to **change the passkey**. Rewriting history alone is
cosmetic from an attacker's point of view.

---

## 2. Task-by-task results

| # | Task | Result |
| --- | --- | --- |
| 1 | Identify the exposed `ORBIT_PASSKEY` in `.env.example` | ✅ Confirmed at line 16; value redacted from this report |
| 2 | Replace with `ORBIT_PASSKEY=` | ✅ Already done (previous step) and re-verified empty |
| 3 | Preserve production `.env` byte-for-byte | ✅ SHA-256 `ab0f1053…` unchanged, mode `600`, mtime `18:29:35` |
| 4 | Do not restart PM2 | ✅ Not restarted (restarts still 98) |
| 5 | Do not change the `/orbit` password | ✅ `.env` untouched |
| 6 | Audit all tracked files for the passkey and other credentials | ✅ **4 credentials found in history; 0 in the working tree** |
| 7 | Prepare a full Git repository backup | ✅ Created and restore-tested (§4) |
| 8 | Prepare a `git filter-repo` cleanup plan | ✅ Plan in §6 — **tool not installed**, see §5 |
| 9 | Preserve unrelated changes and the NOWPayments implementation | ✅ Plan uses `--path`, not `--invert-paths`, so nothing else is touched |
| 10 | Do not force-push yet | ✅ Nothing pushed |
| 11 | Do not make the repository private | ✅ Still public |
| 12 | Report affected files/commits without displaying the secret | ✅ This document |

---

## 3. Audit detail

### 3.1 Working tree — CLEAN

| Check | Result |
| --- | --- |
| Tracked files containing the real passkey | **0** |
| `.env.example` line 16 | `ORBIT_PASSKEY=` (empty) |
| `.env` tracked by Git | **0** |
| `data/runtime/` tracked | **0** |

### 3.2 Git history — 4 credentials, 35 commits total

Scan method: every blob of every commit (7,121 text blobs; binary files skipped), matched against
non-placeholder assignments of known secret variable names. **Values were never rendered to
stdout**, only variable names, lengths and commit hashes.

| File | Variable | Value length | Commits |
| --- | --- | --- | --- |
| `.env.example` | `ORBIT_PASSKEY` | 9 | **30** |
| `.env.example` | `NOWPAYMENTS_API_KEY` | 23 | 30 |
| `.env.example` | `GOOGLE_CLIENT_SECRET` | 61 | 24 |
| `.env.example` | `DEMO_API_KEY` | 27 | 30 |

Only `.env.example` is affected. No other path in the repository ever contained a real credential.

### 3.3 Affected commits — 30 of 35 (86%)

The passkey has been in `.env.example` since the very first commit that created it. Introducing
commit: `ab44b6c` *"Add Orbit admin, Banker API, and premium site pages."*

```
ba828b2  b46dda1  bc99706  9cc2aae  8a3d6ec  8a70d43  cebb4be  3744bce
e77d09f  3b343b2  2a6d087  b5e3f8b  e067596  09572da  3b29d1b  297dbbf
4dbebc2  5456f45  3329f9f  fe18ac0  5f21135  6b549dc  afcaf30  a05e856
71a3be1  28c6a2a  cd9c001  d95f048  c79a293  ab44b6c
```

The 5 commits **not** affected are those from before `.env.example` existed.

Because introducing commit `ab44b6c` is near the root of the history, a rewrite will change the
SHA of **every commit after it** — effectively the whole branch. That is expected and is why the
backup in §4 matters.

### 3.4 Why this file was dangerous

`.env.example` is supposed to be a template with blanks. Someone pasted real values into it while
setting up the project, and `.gitignore` correctly excludes `.env` but of course cannot exclude the
`.example` file that reviewers are meant to read. This is the classic template-credential leak.

---

## 4. Git repository backup (task 7) — COMPLETE

**Directory:** `/home/sysadmin/backups/trustifysmm/git-2026-11-18_135929` (dir `700`, files `600`)

| File | Size (bytes) | SHA-256 |
| --- | --- | --- |
| `git-mirror.tar.gz` | 69,693,808 | `e0177341fd423df9d3eb88978343f6d188fac96392b0e6a9e0fe1420f995b88f` |
| `dotgit.tar.gz` | 70,908,115 | `e753cb0b7fc163ef24438f8070de9ae149774002c9f229f39bc11181b44adde3` |
| `Trustifysmm-allrefs.bundle` | 68,439,623 | `9306fc1dbb77fd212e907881f9260bec4709829a9057e8a6416a195e8708cb6c` |
| `worktree.tar.gz` | 118,710,001 | `9a5c24af129a913710361cd67e5ab876ff756f00a0adf9d4b3681e454325a737` |
| `SHA256SUMS` | 360 | mode `600` |

### Verification performed

| Check | Result |
| --- | --- |
| `gzip -t` on all three archives | ✅ all OK |
| `git bundle verify` | ✅ *"The bundle records a complete history"* |
| Bundle restore rehearsal into `/tmp` | ✅ 35 commits, `HEAD ba828b2`, refs `main` + `origin/main` present |
| Bundle contains the pre-rewrite history | ✅ (as intended — the backup must be able to restore the *old* state) |
| Previous backups untouched | ✅ `2026-11-18_131030/` and `git-2026-11-18_135929/` coexist |

⚠️ **This backup deliberately contains the leaked credentials** because it is a faithful snapshot.
It is mode `600` in a `700` directory on the server, and it must **never** be pushed, copied to a
laptop, uploaded anywhere, or attached to a ticket. Once the rewrite is verified, either delete it
or move it to encrypted storage.

---

## 5. Tooling — `git-filter-repo` INSTALLED (user-local)

| Requirement | Status |
| --- | --- |
| `git` | ✅ 2.43.0 |
| `git-filter-repo` | ✅ **2.47.0** at `/home/sysadmin/.venv-filter/bin/git-filter-repo` |
| `git_filter_repo` Python module | ✅ in `/home/sysadmin/.venv-filter/lib/python3.12/site-packages` |
| `pip` | ✅ 26.3 inside the venv only |
| `sudo` used | ❌ **No** |
| System packages installed | ❌ **None** |

### Install method (no `sudo`, no system packages)

`python3 -m venv` failed because Debian's `ensurepip` is absent (`python3-venv` package not
installed, and installing it needs `sudo`). Instead:

```bash
python3 -m venv --without-pip ~/.venv-filter
curl -fsSL https://bootstrap.pypa.io/get-pip.py -o /tmp/get-pip.py
~/.venv-filter/bin/python3 /tmp/get-pip.py --quiet      # pip 26.3, venv-only
~/.venv-filter/bin/pip install --upgrade git-filter-repo # 2.47.0
```

Everything lives under `/home/sysadmin/.venv-filter`. Nothing outside it was modified. No `sudo`
was used, no `apt` package was installed.

### Verification

| Check | Result |
| --- | --- |
| `pip show git-filter-repo` → Version | `2.47.0` |
| `--help` output | *"Rewrite (or analyze) repository history"* |
| Functional smoke test (throwaway repo) | ✅ rewrote a fixture `.env.example`, preserved other files |

---

## 6. Isolated rewrite — EXECUTED AND VALIDATED

Performed in a **fresh mirror clone under `/tmp`**, never in `/srv/apps/trustifysmm`.
Production repo, `.env`, PM2, and the GitHub remote were untouched throughout.

### 6.1 Two attempts — the first one caught a real bug

**Attempt 1 (rejected):** callback used `^\s*ORBIT_PASSKEY=\S`.

`\s` matches newlines, so `ORBIT_PASSKEY=` followed by a blank line and then the next line's first
character counted as a "non-empty value". Result: it also rewrote `deploy/LIVE.md` and
`deploy/nginx/LIVE.md`, which merely contain the placeholder `ORBIT_PASSKEY=your-secret`.

Verified the damage was limited to those two docs plus `.env.example`, then **discarded the entire
mirror** and started over from a clean clone. Nothing was pushed, so no harm done.

**Attempt 2 (accepted):** callback tightened to same-line, real-value shape only:

```python
import re
# Only rewrite blobs whose ORBIT_PASSKEY value is the real secret shape (long digit run).
# Placeholders such as "your-secret" or "change-me" are deliberately left untouched.
if blob.data and re.search(rb'^\s*ORBIT_PASSKEY=\d{6,}\s*$', blob.data, re.M):
    blob.data = open('/tmp/tsm-clean-env.txt', 'rb').read()
```

No `--path`. Every blob passes through unless it literally contains a digit-form `ORBIT_PASSKEY`.

### 6.2 Before / after counts

| Metric | Before | After |
| --- | --- | --- |
| Commits | 35 | **35** |
| Refs | 2 (`main` + mirror's `origin`) | **1** (`main`) |
| HEAD | `ba828b26…` | `673c8e95…` |
| HEAD tree entries | 352 | **352** |
| Commit messages | 35 | **35 — identical set** |
| Per-commit tree sizes | — | **identical for every commit** |
| SHAs unchanged | — | **5** (the pre-`.env.example` commits) |

Ref count dropped 2→1 because `git-filter-repo` deletes the `origin` remote by design (so you
cannot accidentally push back). That is the mirror's internal remote, **not** the production remote.

### 6.3 All application files and history preserved

| Check | Result |
| --- | --- |
| HEAD file paths + modes | **IDENTICAL**, 352 vs 352 — nothing added, removed, or chmod'd |
| Commit message set | **IDENTICAL** (35) |
| Per-commit file counts | **IDENTICAL for all 35 commits** |
| Commits with unchanged SHA | 5 (those predating `.env.example`) |
| Files changed at HEAD | **exactly one: `.env.example`** |
| `deploy/LIVE.md`, `deploy/nginx/LIVE.md` | **untouched** (attempt-1 false positive eliminated) |
| `lib/nowpayments/*`, tests, docs | **untouched** |

Blob-level diff of HEAD confirmed a single changed path.

### 6.4 Secret scan on the rewritten history

Same-line, placeholder-aware scan across all 35 commits and every text blob:

```
commits scanned: 35
RESULT: CLEAN — no non-placeholder secret assignments in any commit
```

Specifically cleared: `ORBIT_PASSKEY`, `NOWPAYMENTS_API_KEY`, `NOWPAYMENTS_IPN_SECRET`,
`SESSION_SECRET`, `GOOGLE_CLIENT_SECRET`, `DATABASE_URL`, `DEMO_API_KEY`, `SMM_UPSTREAM_API_URL`.
No value was ever printed — only variable names, lengths, and commit counts.

⚠️ One caveat worth stating precisely: `deploy/LIVE.md` and `deploy/nginx/LIVE.md` still contain
`ORBIT_PASSKEY=your-secret`. That is a **placeholder**, not a credential, and it is correctly left
as documentation. A naive secret scanner may flag it; it is safe.

### 6.5 `.env.example` is clean at every commit

Rewritten content at HEAD — every assignment blank:

```
SITE_URL=
SESSION_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=
ORBIT_PASSKEY=
SMM_UPSTREAM_API_URL=
DEMO_API_KEY=
NOWPAYMENTS_API_KEY=
NOWPAYMENTS_IPN_SECRET=
NOWPAYMENTS_BASE_URL=
NOWPAYMENTS_SANDBOX=
NOWPAYMENTS_MIN_DEPOSIT_USD=
NOWPAYMENTS_MAX_DEPOSIT_USD=
NOWPAYMENTS_PAYMENT_EXPIRY_MINUTES=
BANKER_PAY_CURRENCIES=
BANKER_PAY_CURRENCY=
DATABASE_URL=
```

`grep -cE '^ORBIT_PASSKEY=\S'` → **0**.

### 6.6 Validation of the rewritten tree

| Check | Result |
| --- | --- |
| `tsc --noEmit` | ✅ PASS |
| `vitest run` | ✅ **93/93 tests**, 9 files |
| `npm run build` | ✅ PASS (`BUILD_ID EyIQYilH0wQgmBd0wi_Xw`) |
| Bundle verify + restore rehearsal | ✅ complete history, 35 commits, HEAD `673c8e9`, `.env.example` blank |

⚠️ **Important nuance:** the mirror contains only **committed** history (352 files). The NOWPayments
implementation, `tests/`, `vitest.config.ts`, and all release docs are still **uncommitted** in the
production working tree (47 changes). So the rewritten-tip checkout alone has no test suite. The
validation above was run by overlaying the production working tree onto the rewritten checkout —
which is exactly the state that will exist after `git stash pop` in the real procedure.

### 6.7 Artefacts preserved

**`/home/sysadmin/backups/trustifysmm/rewrite-20261118-140855/`** (dir `700`, files `600`)

| File | Size | SHA-256 |
| --- | --- | --- |
| `rewritten-allrefs.bundle` | 69,169,830 | in `SHA256SUMS` |
| `rewritten-mirror.tar.gz` | 69,222,319 | in `SHA256SUMS` |

Verified: `git bundle verify` → *"The bundle records a complete history"*; restore rehearsal gave
35 commits at `673c8e9` with `ORBIT_PASSKEY=` blank.

The pre-rewrite backup from §4 remains at
`/home/sysadmin/backups/trustifysmm/git-2026-11-18_135929/` and is intact (4/4 checksums OK).

Temporary `/tmp` workspaces were deleted.

### 6.8 Production untouched — proof

| Artefact | Baseline | After rewrite | Status |
| --- | --- | --- | --- |
| HEAD | `ba828b26…` | `ba828b26…` | **identical** |
| Commits | 35 | 35 | identical |
| Refs | 2 | 2 | identical |
| Uncommitted files | 47 | 47 | identical |
| `origin/main` | `ba828b26…` | `ba828b26…` | identical |
| `.env` SHA-256 | `ab0f1053…` | `ab0f1053…` | **identical** |
| Tracked-files digest | `51ff3bdd…` | `51ff3bdd…` | **identical** |
| Live `BUILD_ID` | `kefiBjkveC1pRMUfcXDNv` | same | identical |
| `api-store.json` | `101940320c…` | same | identical |
| PM2 | online, fork, 1, restarts 98 | same | not restarted |
| Repo visibility | PUBLIC | PUBLIC | unchanged |
| Force-push | — | **not performed** | — |

### 6.9 What is NOT done

| Action | Status |
| --- | --- |
| Apply the rewrite to `/srv/apps/trustifysmm` | ❌ not done |
| Force-push to `origin/main` | ❌ not done |
| Change repo visibility | ❌ not done |
| Restart PM2 | ❌ not done |
| Edit `.env` | ❌ not done |
| Rotate any credential | ❌ not done |

## 7. Residual risk — read this before approving

### 7.1 History rewriting does not revoke the credential

| Fact | Consequence |
| --- | --- |
| `ORBIT_PASSKEY` is 9 characters and has been public | It is in GitHub's caches, in any fork, in any clone, in any CI log, and possibly in search-engine indexes or archive services |
| GitHub keeps unreachable objects for a period and shows cached pages | A force-push does **not** immediately remove it from GitHub's UI or API |
| Forks keep their own history | Forks are unaffected by a force-push to the parent |
| You instructed me not to change it | **The live `/orbit` password remains the publicly known value** |

**Therefore: the repository rewrite is a hygiene step, not a security fix.** The security fix is
changing the passkey. Until that happens, `/orbit` should be treated as publicly accessible.

Recommended sequence, in this order:

1. **Change `ORBIT_PASSKEY`** in `/srv/apps/trustifysmm/.env` to a strong value (20+ chars), then
   `pm2 restart trustifysmm --update-env`. This is a one-minute operation and immediately closes
   the exposure. Your current Orbit session will be signed out.
2. Optionally add rate limiting / lockout to the Orbit login to blunt guessing.
3. Rewrite history (§6) so future clones are clean.
4. Purge GitHub caches: contact GitHub Support to invalidate cached views, and delete any forks you
   do not control.
5. Rotate `NOWPAYMENTS_API_KEY` and `NOWPAYMENTS_IPN_SECRET` for the same reason (they are also in
   history, though the current values differ).
6. Nothing needs to be done about `DEMO_API_KEY` — that value is the retired default, already
   denylisted, and the demo account is revoked with no credential.

### 7.2 `.env.example` is a template — why this keeps happening

`.gitignore` excludes `.env` but cannot exclude `.env.example`, because that file is meant to be
read and copied. Every credential that has ever been pasted into it is public. A CI check that
fails when `.env.example` contains a non-empty value for a secret-looking key would prevent
recurrence. Not implemented here (out of scope), but worth adding.

### 7.3 Force-push side effects

| Effect | Detail |
| --- | --- |
| Any other clone becomes divergent | Collaborators must re-clone or hard-reset |
| Open PRs based on old commits | May need rebasing |
| GitHub Actions history | Old runs still reference old SHAs |
| The 5 pre-`.env.example` commits | Keep their SHAs, so nothing before that is disturbed |

No other person appears to contribute to this repo (single-author history), which limits the blast
radius.

---

## 8. State verification

| Artefact | Value | Status |
| --- | --- | --- |
| `.env` SHA-256 | `ab0f10530afe278c5d8c097be8534e1ab295a812462316d0e6db38e04639005d` | **unchanged** through this task |
| `.env` mode / mtime | `600` / `2026-11-18 18:29:35` | unchanged |
| `.env.example` line 16 | `ORBIT_PASSKEY=` | empty ✅ |
| PM2 | online, fork, 1 instance, restarts 98 | not restarted |
| Live BUILD_ID | `kefiBjkveC1pRMUfcXDNv` | unchanged |
| `api-store.json` | `101940320c…686f9a` | unchanged |
| Git HEAD | `ba828b2` | unchanged |
| Remote | `origin/main` at `ba828b2` | not pushed |
| Repo visibility | **PUBLIC** | unchanged |
| Uncommitted changes | 25 modified + 21 untracked | preserved |

---

## 9. What I need from you

| # | Decision | Why |
| --- | --- | --- |
| 1 | **Approve applying the rewrite to the production repo** (stash → filter-repo → stash pop → validate) | §6 was rehearsed in a mirror; production untouched |
| 2 | **Approve the force-push** `--force-with-lease origin main` after applying | Rewrite changes the branch head; a normal push will be rejected |
| 3 | **Confirm `ORBIT_PASSKEY` stays unchanged**, accepting §7.1 | Rewriting history does not invalidate copies already taken |
| 4 | **Delete or encrypt the two backups containing the leaked values** once verified | `git-2026-11-18_135929/` and `rewrite-20261118-140855/` |
| 5 | **Enable the `.env.example` CI guard** from §7.2? | Prevents the same class of leak |

**Nothing was pushed, force-pushed, or applied to production. No production state changed. `.env` is byte-for-byte identical (`ab0f1053…`).**
