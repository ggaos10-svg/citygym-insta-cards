"""Save reactions for recent posts to data/stats.json (run by .github/workflows/stats.yml).

python -m cards.stats   (needs INSTAGRAM_ACCESS_TOKEN)
"""
import json
import os
from datetime import datetime, timezone
from pathlib import Path

from cards.api import IGError, Instagram

METRICS = ["views", "reach", "likes", "comments", "saved", "shares"]


def insights(ig, media_id):
    out = {}
    try:
        data = ig.get(f"{media_id}/insights", metric=",".join(METRICS))["data"]
        out = {m["name"]: m["values"][0]["value"] for m in data}
    except IGError:
        for m in METRICS:  # one unsupported metric fails the whole call, so retry one by one
            try:
                out[m] = ig.get(f"{media_id}/insights", metric=m)["data"][0]["values"][0]["value"]
            except IGError:
                pass
    return out


def main():
    ig = Instagram(os.environ.get("INSTAGRAM_ACCESS_TOKEN", ""))
    me = ig.get("me", fields="username,followers_count,media_count")
    media = ig.get("me/media", fields="id,caption,timestamp,permalink,like_count,comments_count", limit=25)["data"]
    posts = []
    for m in media:
        row = {"id": m["id"], "when": m["timestamp"], "url": m.get("permalink", ""),
               "title": (m.get("caption") or "").strip().split("\n")[0][:80],
               "likes": m.get("like_count"), "comments": m.get("comments_count")}
        row.update(insights(ig, m["id"]))
        posts.append(row)
    out = {"updated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
           "followers": me.get("followers_count"), "posts": posts}
    Path("data/stats.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"saved {len(posts)} posts")


if __name__ == "__main__":
    main()
