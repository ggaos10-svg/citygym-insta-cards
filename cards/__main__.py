"""Card-news bot CLI.

  python -m cards render-due [--all] [--pending]  render (or list) posts without videos yet (Remotion)
  python -m cards render <post.json>      (re)render one post
  python -m cards publish-due [--dry-run] publish approved posts whose time has passed
  python -m cards whoami
  python -m cards refresh-token           refresh if older than 7 days (writes $IG_TOKEN_OUT)
  python -m cards list
  python -m cards check [post.json ...]   validate copy lengths and structure
"""

import argparse
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from .render import MEDIA, PROPS, ROOT, render_post

POSTS = ROOT / "data" / "posts"
STATE = ROOT / "data" / "state.json"
KST = timezone(timedelta(hours=9))


def load_env():
    env = ROOT / ".env"
    if env.exists():
        for line in env.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.lstrip().startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())


def client():
    from .api import Instagram

    return Instagram(os.environ.get("INSTAGRAM_ACCESS_TOKEN"))


def posts():
    for path in sorted(POSTS.glob("*.json")):
        yield path, json.loads(path.read_text(encoding="utf-8"))


def save(path, post):
    path.write_text(json.dumps(post, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def rendered(post):
    d = MEDIA / post["id"]
    return d.exists() and len(list(d.glob("*.mp4"))) == len(post["slides"])


def media_urls(post):
    # jsDelivr, pinned to the current commit: raw.githubusercontent.com serves MP4 as
    # application/octet-stream, which Instagram may reject; jsDelivr sends video/mp4.
    repo = os.environ.get("GITHUB_REPOSITORY") or os.environ["CARDS_REPO"]
    sha = subprocess.run(["git", "rev-parse", "HEAD"], cwd=ROOT, capture_output=True,
                         text=True, check=True).stdout.strip()
    base = f"https://cdn.jsdelivr.net/gh/{repo}@{sha}/media/{post['id']}"
    return [f"{base}/{i:02d}.mp4" for i in range(1, len(post["slides"]) + 1)]


def cmd_render_due(args):
    for path, post in posts():
        if post.get("status") == "published" and not args.all:
            continue
        if not (args.all or not rendered(post)):
            continue
        errs = check_post(path, post)
        if errs:  # a broken draft must not stop the others; it stays unrendered and unpublished
            print(f"skip {path.name}: " + "; ".join(errs), file=sys.stderr)
            continue
        if args.pending:
            print(post["id"])
            continue
        for p in render_post(post, path):
            print(p.relative_to(ROOT))


def cmd_render(args):
    post = json.loads(Path(args.file).read_text(encoding="utf-8"))
    for p in render_post(post, args.file):
        print(p)


def cmd_publish_due(args):
    now = datetime.now(KST)
    ig = None
    for path, post in posts():
        if post.get("status") != "approved":
            continue
        if datetime.fromisoformat(post["scheduled"]) > now:
            continue
        if not rendered(post):
            print(f"skip {post['id']}: not rendered yet")
            continue
        urls = media_urls(post)
        if args.dry_run:
            print(f"would publish {post['id']} ({len(urls)} slides)\n  {urls[0]}")
            continue
        ig = ig or client()
        try:
            media_id, link = ig.publish_carousel(urls, post["caption"], post.get("alt"))
        except Exception as e:  # keep going with other posts; record the error
            post["status"] = "failed"
            post["error"] = str(e)[:500]
            save(path, post)
            print(f"FAILED {post['id']}: {e}", file=sys.stderr)
            continue
        post.update(status="published", ig_media_id=media_id, permalink=link,
                    published_at=now.isoformat(timespec="seconds"))
        post.pop("error", None)
        save(path, post)
        print(f"published {post['id']} -> {link}")


def cmd_whoami(args):
    print(client().me())


def cmd_refresh_token(args):
    state = json.loads(STATE.read_text(encoding="utf-8")) if STATE.exists() else {}
    last = state.get("token_refreshed_at")
    if last and datetime.fromisoformat(last) > datetime.now(KST) - timedelta(days=7):
        print("token refreshed recently; skip")
        return
    token = client().refresh_token()["access_token"]
    out = os.environ.get("IG_TOKEN_OUT")
    if out:
        Path(out).write_text(token, encoding="utf-8")
    state["token_refreshed_at"] = datetime.now(KST).isoformat(timespec="seconds")
    STATE.write_text(json.dumps(state, indent=2) + "\n", encoding="utf-8")
    print("token refreshed")


# Note design (cards/config/design.md): fields each slide type needs, and copy budgets
# (characters without spaces) that keep text readable on a phone.
FIELDS = {
    "hook": ("lines", "reveal", "prop"), "highlight": ("lines", "prop"), "section": ("num", "title", "prop"),
    "compare": ("left", "right", "rows", "left_prop", "prop"), "stat": ("value", "caption", "prop"),
    "punch": ("word",), "checklist": ("title", "items"), "cta": ("line", "location"),
}
MARK = re.compile(r"\{(hl|red)\|([^}]*)\}")


def visible(text):
    """Text as shown: {hl|x}/{red|x} markup removed, spaces not counted."""
    return MARK.sub(lambda m: m.group(2), text or "").replace(" ", "")


def check_post(path, post):
    """Return a list of problems that would make the slides hard to read or break publishing."""
    errs = []
    for key in ("id", "scheduled", "status", "slides", "caption"):
        if key not in post:
            errs.append(f"missing {key}")
    if errs:
        return errs
    if post.get("design") != "note":
        errs.append('design must be "note"')
    if post["id"] != path.stem:
        errs.append(f"id {post['id']!r} != file name {path.stem!r}")
    try:
        if datetime.fromisoformat(post["scheduled"]).tzinfo is None:
            errs.append("scheduled needs a timezone (+09:00)")
    except ValueError:
        errs.append("scheduled is not ISO 8601")
    slides = post["slides"]
    if not 6 <= len(slides) <= 12:
        errs.append(f"{len(slides)} slides (guide: 6-12)")
    if slides and slides[0].get("type") != "hook":
        errs.append("slide 1 must be a hook")
    if slides and slides[-1].get("type") != "cta":
        errs.append("last slide must be a cta")
    types = [s.get("type") for s in slides]
    for i in range(len(types) - 2):
        if types[i] == types[i + 1] == types[i + 2]:
            errs.append(f"slides {i + 1}-{i + 3}: three {types[i]} slides in a row (vary the layout)")
    for i, s in enumerate(slides, 1):
        t = s.get("type")
        if t not in FIELDS:
            errs.append(f"slide {i}: unknown type {t!r}")
            continue
        for field in ("headline",) + FIELDS[t]:
            if not s.get(field) and s.get(field) != 0:
                errs.append(f"slide {i} ({t}): missing {field}")
        head = s.get("headline", "")
        if len(visible(head)) > 24:
            errs.append(f"slide {i}: headline is {len(visible(head))} chars (max 24, two lines)")
        if not MARK.search(head):
            errs.append(f"slide {i}: headline needs one {{hl|..}} or {{red|..}} key word")
        for pill in s.get("lines", []) + s.get("items", []):
            if len(visible(pill)) > 10:
                errs.append(f"slide {i}: pill {pill!r} is over 10 chars")
        for row in s.get("rows", []):
            if len(row) != 3:
                errs.append(f"slide {i}: compare row needs [label, left, right]")
            elif max(len(visible(v)) for v in row[1:]) > 9:
                errs.append(f"slide {i}: compare row {row!r} has a value over 9 chars")
        if t in ("hook", "highlight") and not 2 <= len(s.get("lines", [])) <= 3:
            errs.append(f"slide {i}: {t} needs 2-3 lines")
        if t == "compare" and not 2 <= len(s.get("rows", [])) <= 3:
            errs.append(f"slide {i}: compare needs 2-3 rows")
        if t == "checklist" and not 3 <= len(s.get("items", [])) <= 4:
            errs.append(f"slide {i}: checklist needs 3-4 items")
        for key, limit in (("reveal", 10), ("next", 12), ("value", 4), ("word", 5)):
            if s.get(key) and len(visible(str(s[key]))) > limit:
                errs.append(f"slide {i}: {key} {s[key]!r} is over {limit} chars")
        for key in ("prop", "left_prop"):
            if s.get(key) and s[key] not in PROPS:
                errs.append(f"slide {i}: {key} {s[key]!r} has no illustration (see design.md prop list)")
        if i < len(slides) and not s.get("next"):
            errs.append(f"slide {i}: missing next teaser")
    if len(post["caption"]) > 2200:
        errs.append("caption over 2200 chars")
    if "http" in post["caption"]:
        errs.append("caption has a URL (not clickable on Instagram)")
    return errs


def cmd_check(args):
    files = [Path(f) for f in args.files] or [p for p, _ in posts()]
    bad = 0
    for path in files:
        post = json.loads(path.read_text(encoding="utf-8"))
        errs = check_post(path, post)
        print(f"{'OK  ' if not errs else 'FAIL'} {path.name}")
        for e in errs:
            print(f"     - {e}")
        bad += bool(errs)
    sys.exit(1 if bad else 0)


def cmd_list(args):
    for _, p in posts():
        print(f"{p['scheduled'][:16]}  {p.get('status', '?'):9}  {p['id']}  {p.get('permalink') or ''}")


def main():
    load_env()
    ap = argparse.ArgumentParser(prog="cards")
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("render-due"); s.add_argument("--all", action="store_true")
    s.add_argument("--pending", action="store_true", help="only list the posts that would be rendered")
    s = sub.add_parser("render"); s.add_argument("file")
    s = sub.add_parser("publish-due"); s.add_argument("--dry-run", action="store_true")
    s = sub.add_parser("check"); s.add_argument("files", nargs="*")
    sub.add_parser("whoami"); sub.add_parser("refresh-token"); sub.add_parser("list")
    args = ap.parse_args()
    globals()["cmd_" + args.cmd.replace("-", "_")](args)


if __name__ == "__main__":
    main()
