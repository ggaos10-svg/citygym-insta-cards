"""Self-check for the Note post checker: python -m cards.test_check"""

import copy
import json
from pathlib import Path

from .__main__ import check_post

path = next(Path(__file__).resolve().parent.parent.glob("data/posts/test-*-note.json"))
good = json.loads(path.read_text(encoding="utf-8"))
assert check_post(path, good) == [], check_post(path, good)

bad = copy.deepcopy(good)
bad["slides"][3]["type"] = bad["slides"][4]["type"] = "compare"  # slides 3-5 all compare
bad["slides"][3].update(left="a", right="b", rows=[["", "x", "y"], ["", "x", "y"]], left_prop="rack")
bad["slides"][4].update(left="a", right="b", rows=[["", "x", "y"], ["", "x", "y"]], left_prop="rack")
bad["slides"][1]["prop"] = "unicorn"
bad["slides"][0]["headline"] = "강조 단어가 없는 아주아주 긴 헤드라인 문장이 두 줄을 넘어갑니다"
errs = "\n".join(check_post(path, bad))
for needle in ("three compare slides in a row", "'unicorn' has no illustration", "max 24", "key word"):
    assert needle in errs, (needle, errs)
print("check_post self-check OK")
