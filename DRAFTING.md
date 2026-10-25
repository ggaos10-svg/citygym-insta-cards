# 초안 작성 절차 (Claude 클라우드 루틴용)

루틴은 화·목·토 09:00 KST에 이 파일을 따라 **그날 19:00 KST** 게시물 1개를 쓴다.
Instagram 토큰은 없고 필요 없다. 게시·렌더링은 GitHub Actions가 한다. 루틴은 `data/posts/`에 JSON 하나를 쓰고 push만 한다.

1. `git pull --rebase`.
2. 읽기: `cards/config/guide.md` (전부, 그대로 따른다), `cards/config/facts.md` (센터 정보는 여기 있는 것만), `assets/` 목록 (쓸 수 있는 사진), `data/posts/`의 최근 게시물 10개 (`python -m cards list`).
3. 오늘 날짜(KST)로 `data/posts/YYYY-MM-DD-*.json`이 이미 있으면 아무것도 쓰지 않고 6번으로 간다.
4. 주제 고르기: guide 1장의 비율(tip 4 · gym 2 · fun 1 / 7개)과 최근 게시물을 보고 부족한 유형을 고른다. 최근 주제·표지 공식·첫 문장과 겹치지 않게. 표지 공식은 guide 2장의 5가지 중 직전과 다른 것.
5. `data/posts/YYYY-MM-DD-<영문 slug>.json`을 쓴다.
   - `id`는 파일 이름과 같게, `scheduled`는 `YYYY-MM-DDT19:00:00+09:00`, `topic` 기입.
   - `status`: 기본 `approved`. 통증·질환·다이어트 효과·가격·이벤트·센터 공지처럼 사실 확인이 필요한 글은 `pending`과 `"note": "<사람이 확인할 것>"`.
   - 모든 장(마지막 제외)에 `next`. 표지는 답을 주지 않고, 마지막 장은 공유 대상 + 한 글자 댓글 질문.
   - `assets/`에 주제와 맞는 사진이 있으면 표지 `image`에 쓴다. 없으면 생략.
   - `python -m cards check data/posts/<파일>.json`이 OK가 될 때까지 문구를 줄이거나 고친다. 통과 못 하면 커밋하지 않는다.
   - 캡션은 guide 5장 형식. em dash(—)·"완벽 가이드" 같은 AI 티 나는 표현 금지.
6. 커밋은 `data/posts/`만: `git add data/posts && git commit -m "routine: card draft <id>"`, `git pull --rebase && git push` (거절되면 한 번 더). 코드·설정·워크플로·`media/`는 건드리지 않는다. push되면 Actions가 이미지를 렌더하고 19:00 이후 게시한다.
7. 마지막 메시지(한국어): 파일 이름, 상태(approved/pending), 표지 제목, 장별 한 줄 요약, pending이면 운영자가 확인할 것.
