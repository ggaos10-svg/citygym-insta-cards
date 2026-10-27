"""Minimal Instagram Graph API client (Instagram Login flavour, stdlib only)."""

import json
import time
import urllib.error
import urllib.parse
import urllib.request

BASE = "https://graph.instagram.com/v23.0"
MAX_CAPTION = 2200


class IGError(RuntimeError):
    pass


def warm(urls, tries=4):
    """Fetch every media URL once so the CDN (jsDelivr, a fresh commit) has it cached before
    Instagram asks for it; a slow first fetch can make Instagram fail the container."""
    for url in urls:
        for attempt in range(tries):
            try:
                with urllib.request.urlopen(url, timeout=60) as r:
                    r.read()
                break
            except (urllib.error.URLError, TimeoutError):
                time.sleep(5 * (attempt + 1))
        else:
            raise IGError(f"media not reachable: {url}")


class Instagram:
    def __init__(self, token):
        if not token:
            raise IGError("INSTAGRAM_ACCESS_TOKEN is empty")
        self.token = token

    def _call(self, method, url, params):
        params = dict(params, access_token=self.token)
        data = urllib.parse.urlencode(params)
        if method == "GET":
            req = urllib.request.Request(f"{url}?{data}")
        else:
            req = urllib.request.Request(url, data=data.encode(), method=method)
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            body = e.read().decode(errors="replace")[:500]
            raise IGError(f"HTTP {e.code} {url.replace(BASE, '')}: {body}") from None

    def get(self, path, **params):
        return self._call("GET", f"{BASE}/{path}", params)

    def post(self, path, **params):
        return self._call("POST", f"{BASE}/{path}", params)

    def me(self):
        return self.get("me", fields="user_id,username,account_type")

    def _wait_ready(self, container_id, tries=60):
        for _ in range(tries):
            info = self.get(container_id, fields="status_code,status")
            status = info.get("status_code")
            if status == "FINISHED":
                return
            if status in ("ERROR", "EXPIRED"):
                # "status" carries Instagram's reason (e.g. a media fetch or format error)
                raise IGError(f"container {container_id} status {status}: {info.get('status', '')}")
            time.sleep(5)
        raise IGError(f"container {container_id} not ready")

    def publish_carousel(self, media_urls, caption, alt_text=None):
        """Publish a carousel of JPEG and/or MP4 URLs (Instagram fetches them itself)."""
        if not 2 <= len(media_urls) <= 20:
            raise IGError(f"carousel needs 2-20 items, got {len(media_urls)}")
        if len(caption) > MAX_CAPTION:
            raise IGError(f"caption is {len(caption)} chars (max {MAX_CAPTION})")
        warm(media_urls)
        children = []
        for i, url in enumerate(media_urls):
            if url.endswith(".mp4"):
                # thumb_offset picks a frame after the intro animation for the grid thumbnail.
                params = {"media_type": "VIDEO", "video_url": url, "thumb_offset": "4000"}
            else:
                params = {"image_url": url}
                if alt_text and i == 0:
                    params["alt_text"] = alt_text
            params["is_carousel_item"] = "true"
            children.append(self.post("me/media", **params)["id"])
        for c in children:
            self._wait_ready(c)
        parent = self.post(
            "me/media", media_type="CAROUSEL", children=",".join(children), caption=caption
        )["id"]
        self._wait_ready(parent)
        media_id = self.post("me/media_publish", creation_id=parent)["id"]
        permalink = self.get(media_id, fields="permalink").get("permalink")
        return media_id, permalink

    def refresh_token(self):
        url = "https://graph.instagram.com/refresh_access_token"
        return self._call("GET", url, {"grant_type": "ig_refresh_token"})
