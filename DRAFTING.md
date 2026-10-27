# 초안 작성 절차 (Claude 클라우드 루틴용)

루틴은 화·목·토 09:00 KST에 이 파일을 따라 **그날 19:00 KST** 게시물 1개를 쓴다.
Instagram 토큰은 없고 필요 없다. 게시·렌더링은 GitHub Actions가 한다. 루틴은 `data/posts/`에 JSON 하나를 쓰고 push만 한다.

1. `git pull --rebase`.
2. 읽기: `cards/config/guide.md` (전부, 그대로 따른다), `cards/config/design.md` (Note 디자인: 장 종류·필드·그림 목록, 전부), `cards/config/design-pano.md` (가로 잇기 디자인, 전부), `cards/config/hooks.md` (후킹 라이브러리, 전부), `cards/config/review.md` (게시 전 자체평가 지침, 전부), `cards/config/facts.md` (센터 정보는 여기 있는 것만), `cards/config/schedule.md` (날짜별 일정표), `remotion/src/art/Art.tsx` 맨 아래 `CODE_PROPS` (쓸 수 있는 그림 이름, design.md 목록과 같다), `data/posts/`의 최근 게시물 10개 (`python -m cards list`).
3. 오늘 날짜(KST)로 `data/posts/YYYY-MM-DD-*.json`이 이미 있으면 새로 쓰지 않는다. 그 글에 `review`가 없거나 통과 기준 미달이고 상태가 `published`가 아니면 7번(자체평가)만 하고, 아니면 8번으로 간다.
4. 주제 고르기: **schedule.md에 오늘 날짜(KST) 항목이 있으면 그 주제·유형·디자인·각도를 그대로 쓴다** (훅 후보 3개 중 하나는 일정표의 훅으로, 장 구성은 일정표를 따르되 규칙에 맞게 다듬는다). 항목이 없을 때만: guide 1장의 비율(tip 4 · gym 2 · fun 1 / 7개)과 최근 게시물을 보고 부족한 유형을 고른다. 최근 주제·첫 문장과 겹치지 않게.
   - **훅 세트(1·2장) 후보를 3개** 쓴다. 각각 guide 2장 표의 서로 다른 공식 + hooks.md 8유형 중 하나로, 직전 게시물의 공식·유형은 제외. 후보마다 쓴 유형과 3가지 금기 적용을 적는다.
   - 후보마다 1~5점으로 매긴다: ① 1장만 보고 '어? 뭐지?'가 드는가 ② 2장이 답을 주지 않고 궁금증을 더 키우는가 ③ 금호동 운동하는 사람이 "나 얘기네" 할 만큼 구체적인가 ④ 1·2장 어디에도 답이 새지 않았는가.
   - 합계가 가장 높은 후보로 쓴다. 15점 미만이면 후보를 다시 쓴다.
   - 다 쓴 뒤 hooks.md 맨 아래 '초안 체크' 8개를 전부 통과하는지 확인하고, 안 되면 고친다.
5. `data/posts/YYYY-MM-DD-<영문 slug>.json`을 쓴다.
   - 디자인 고르기: 주제가 "1 → 2 → 3" 단계(2~5개)로 말할 수 있고, 직전 2개 게시물에 가로 잇기가 없으면 `"design": "pano"`(design-pano.md 2·4장 형식). 그 밖에는 `"design": "note"`(design.md 3장 형식).
   - `id`는 파일 이름과 같게, `scheduled`는 `YYYY-MM-DDT19:00:00+09:00`, `topic` 기입. 장마다 고른 디자인의 필드를 쓴다.
   - `status`: 처음엔 항상 `pending` + `"note": "자체평가 중"` (평가를 통과하기 전에 게시되지 않게). 7번에서 통과하면 `approved`로 바꾼다. 통증·질환·다이어트 효과·가격·이벤트·센터 공지처럼 사실 확인이 필요한 글은 통과해도 `pending`으로 두고 `note`에 사람이 확인할 것을 적는다.
   - Note: 장마다 연출(`scene`)은 design.md 3-2. 기본값으로 충분하면 적지 않아도 되고, 바꿀 땐 같은 연출이 2장 연속되지 않게. 모든 장(마지막 제외)에 `next`. 가로 잇기: `next` 없음, 게시물에 `label`·`handle`. 공통: 1장은 답을 주지 않고, 마지막 장(`cta`)은 공유 대상 + 한 글자 댓글 질문. 같은 type 3장 연속 금지.
   - 그림(`prop`, `left_prop`)은 헤드라인 내용과 맞는 것만. 맞는 그림이 없으면 그 장을 `punch`/`checklist`로 바꾸거나, 꼭 필요하면 design.md 3-1대로 `Art.tsx`에 새 그림을 코드로 그려 `CODE_PROPS`에 등록한다 (게시물 하나에 새 그림 1개까지). 새 그림을 넣었으면 그 게시물은 `status: pending` + `note`에 "새 그림: ○○ — 렌더된 영상 확인"을 적는다.
   - `python -m cards check data/posts/<파일>.json`이 OK가 될 때까지 문구를 줄이거나 고친다. 통과 못 하면 커밋하지 않는다.
   - 캡션은 guide 5장 형식. em dash(—)·"완벽 가이드" 같은 AI 티 나는 표현 금지.
6. 커밋은 `data/posts/`만 (새 그림을 그렸으면 `remotion/src/art/Art.tsx`도): `git add data/posts remotion/src/art/Art.tsx && git commit -m "routine: card draft <id>"`, `git pull --rebase && git push` (거절되면 한 번 더). 그 밖의 코드·설정·워크플로·`media/`는 건드리지 않는다. push되면 Actions가 Remotion으로 영상과 평가용 `media/<id>/review.jpg`를 렌더한다 (보통 5~10분).
7. **자체평가와 자동 수정** (`cards/config/review.md` 그대로):
   - 렌더 기다리기: `for i in $(seq 40); do git pull -q --rebase; python -m cards rendered data/posts/<파일>.json && break; sleep 45; done`. 30분이 지나도 안 되면 `pending` + `note`("렌더 실패, 확인 필요")로 두고 8번으로.
   - `media/<id>/review.jpg`와 `media/<id>/01.jpg`를 **이미지로 열어서 보고**, review.md 2장의 14개 항목을 1~10점으로 매긴다. "피드에 떴을 때 멈출까 / 어디까지 넘길까 / 어디서 이탈할까"를 먼저 쓴다.
   - 통과 기준(평균 8.0 이상, 7점 미만 없음, 사실 위반 0)에 못 미치면 가장 낮은 항목부터 게시물 JSON을 고치고 `python -m cards check`를 통과시킨 뒤 6번처럼 커밋·push, 렌더를 다시 기다려 다시 평가한다. 최대 3번.
   - 게시물 JSON에 `review`(review.md 4장 형식)를 적는다. 통과하면 `status: approved`, `note` 삭제 (사실 확인이 필요한 글은 `pending` 유지). 3번째에도 못 미치면 `pending` + `note`에 남은 문제. 커밋·push (`routine: card review <id>`).
8. 마지막 메시지(한국어): 일정표 항목을 썼는지(바꾼 점이 있으면 이유), 파일 이름, 상태(approved/pending), 고른 훅 공식과 점수(버린 후보 2개도 한 줄씩), 장별 한 줄 요약, pending이면 운영자가 확인할 것 (새 그림을 그렸으면 그 이름), 그리고 review.md 5장 형식의 자체평가 보고 (멈출까/넘길까/이탈 지점, 14개 점수 표와 평균, 라운드별로 고친 것, 남은 약점).
