# citygym-insta-cards

인스타 카드뉴스 자동 운영 (@citygym_geumho, 시티짐 금호점). 주 3회 화·목·토 19:00.

- `cards/config/guide.md` — 카드 구성·말투·캡션 규칙
- `cards/config/facts.md` — 확정된 센터 정보 (여기 없는 가격·이벤트는 안 씀)
- `data/posts/*.json` — 게시물 (status: pending / approved / published / failed)
- `DRAFTING.md` — 클라우드 루틴(화·목·토 09:00 KST)이 따르는 초안 작성 절차
- `media/<id>/NN.mp4` (모션, 기본) / `NN.jpg` (미리보기·정적) — 렌더된 1080x1350 카드 (Instagram이 raw URL로 가져가므로 이 저장소는 공개)

흐름
1. Claude 클라우드 루틴이 다음 게시 슬롯의 글을 `data/posts/`에 쓰고 push.
2. push되면 GitHub Actions가 카드 이미지를 렌더해서 `media/`에 커밋 (미리보기 가능).
3. 매시 :23 Actions가 시간이 지난 `approved` 글을 캐러셀로 게시하고, 7일마다 토큰 갱신.

수정하고 싶으면 게시 전에 JSON을 고치거나 `status`를 `pending`으로 바꾸면 된다.

비밀값 (Settings → Secrets and variables → Actions)
- `INSTAGRAM_ACCESS_TOKEN` — Instagram 장기 토큰 (Instagram 로그인 방식)
- `GH_PAT` — 이 저장소 Secrets 쓰기 권한 fine-grained 토큰 (토큰 갱신 저장용)

로컬: `pip install -r requirements.txt && python -m playwright install chromium` 후
`python -m cards render data/posts/<id>.json`, `python -m cards list`, `python -m cards publish-due --dry-run`
