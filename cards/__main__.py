"""Card-news bot CLI.

  python -m cards render-due [--all]      render posts that have no images yet
  python -m cards render <post.json>      (re)render one post
  python -m cards publish-due [--dry-run] publish approved posts whose time has passed
  python -m cards whoami
  python -m cards refresh-token           refresh if older than 7 days (writes $IG_TOKEN_OUT)
  python -m cards list
"""

import argparse
import json
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from .render import MEDIA, ROOT, render_post

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
    return d.exists() and len(list(d.glob("*.jpg"))) == len(post["slides"])


def image_urls(post):
    repo = os.environ.get("GITHUB_REPOSITORY") or os.environ["CARDS_REPO"]
    base = f"https://raw.githubusercontent.com/{repo}/main/media/{post['id']}"
    return [f"{base}/{i:02d}.jpg" for i in range(1, len(post["slides"]) + 1)]


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
        urls = image_urls(post)
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
    sub.add_parser("whoami"); sub.add_parser("refresh-token"); sub.add_parser("list")
    args = ap.parse_args()
    globals()["cmd_" + args.cmd.replace("-", "_")](args)


if __name__ == "__main__":
    main()
