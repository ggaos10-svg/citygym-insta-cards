"""Card-news bot CLI.

  python -m cards render-due [--all]      render posts that have no images yet
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
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from .render import MEDIA, ROOT, is_motion, render_post

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


def ext(post):
    return "mp4" if is_motion(post) else "jpg"


def rendered(post):
    d = MEDIA / post["id"]
    return d.exists() and len(list(d.glob(f"*.{ext(post)}"))) == len(post["slides"])


def media_urls(post):
    # jsDelivr, pinned to the current commit: raw.githubusercontent.com serves MP4 as
    # application/octet-stream, which Instagram may reject; jsDelivr sends video/mp4.
    repo = os.environ.get("GITHUB_REPOSITORY") or os.environ["CARDS_REPO"]
    sha = subprocess.run(["git", "rev-parse", "HEAD"], cwd=ROOT, capture_output=True,
                         text=True, check=True).stdout.strip()
    base = f"https://cdn.jsdelivr.net/gh/{repo}@{sha}/media/{post['id']}"
    return [f"{base}/{i:02d}.{ext(post)}" for i in range(1, len(post["slides"]) + 1)]


def cmd_render_due(args):
    for path, post in posts():
        if post.get("status") == "published" and not args.all:
            continue
        if args.all or not rendered(post):
            for p in render_post(post):
                print(p.relative_to(ROOT))


def cmd_render(args):
    post = json.loads(Path(args.file).read_text(encoding="utf-8"))
    for p in render_post(post):
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


# Per-line character budgets from guide.md section 3 (== markers not counted).
LIMITS = {
    "cover": {"title": (7, 3), "sub": (16, 2), "kicker": (10, 1)},
    "point": {"title": (8, 2), "body": (20, 2)},
    "list": {"title": (14, 1)},
    "quiz": {"title": (8, 2), "kicker": (10, 1)},
    "cta": {"title": (10, 2), "body": (30, 3)},
}


def check_post(path, post):
    """Return a list of problems that would make the slides hard to read or break publishing."""
    errs = []
    for key in ("id", "scheduled", "status", "slides", "caption"):
        if key not in post:
            errs.append(f"missing {key}")
    if errs:
        return errs
    if post["id"] != path.stem:
        errs.append(f"id {post['id']!r} != file name {path.stem!r}")
    try:
        if datetime.fromisoformat(post["scheduled"]).tzinfo is None:
            errs.append("scheduled needs a timezone (+09:00)")
    except ValueError:
        errs.append("scheduled is not ISO 8601")
    slides = post["slides"]
    if not 6 <= len(slides) <= 8:
        errs.append(f"{len(slides)} slides (guide: 6-8)")
    if slides and slides[0].get("type") not in ("cover", "quiz"):
        errs.append("slide 1 must be a cover or quiz")
    if len(slides) > 1 and slides[1].get("type") not in ("point", "quiz"):
        errs.append("slide 2 must be a point or quiz (the second half of the hook)")
    if slides and slides[-1].get("type") != "cta":
        errs.append("last slide must be a cta")
    for i, s in enumerate(slides, 1):
        for field, (width, lines) in LIMITS.get(s.get("type", "point"), {}).items():
            text = (s.get(field) or "").replace("==", "")
            rows = text.split("\n") if text else []
            if len(rows) > lines and field not in ("body", "sub"):
                errs.append(f"slide {i} {field}: {len(rows)} lines (max {lines})")
            if field in ("body", "sub"):
                # Body text wraps by itself, so only its total length matters.
                if len(text.replace(" ", "").replace("\n", "")) > width * lines:
                    errs.append(f"slide {i} {field}: over {width * lines} chars")
                continue
            for row in rows:
                if len(row.replace(" ", "")) > width:
                    errs.append(f"slide {i} {field}: {row!r} is over {width} chars per line")
        if s.get("type") == "quiz":
            if not 2 <= len(s.get("options", [])) <= 3:
                errs.append(f"slide {i}: quiz needs 2-3 options")
            for o in s.get("options", []):
                if len(o.replace(" ", "")) > 12:
                    errs.append(f"slide {i} option {o!r} is over 12 chars")
        if s.get("type") == "list":
            if not 3 <= len(s.get("items", [])) <= 5:
                errs.append(f"slide {i}: list needs 3-5 items")
            for it in s.get("items", []):
                if len(it.replace(" ", "")) > 14:
                    errs.append(f"slide {i} item {it!r} is over 14 chars")
        if i < len(slides) and not s.get("next"):
            errs.append(f"slide {i}: missing next teaser")
        if s.get("image") and not s["image"].startswith("http") and not (ROOT / s["image"]).exists():
            errs.append(f"slide {i}: image {s['image']} not found")
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
    s = sub.add_parser("render"); s.add_argument("file")
    s = sub.add_parser("publish-due"); s.add_argument("--dry-run", action="store_true")
    s = sub.add_parser("check"); s.add_argument("files", nargs="*")
    sub.add_parser("whoami"); sub.add_parser("refresh-token"); sub.add_parser("list")
    args = ap.parse_args()
    globals()["cmd_" + args.cmd.replace("-", "_")](args)


if __name__ == "__main__":
    main()
