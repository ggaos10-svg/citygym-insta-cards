# 카드뉴스 디자인 가이드 2: 가로 잇기 (Pano)

두 번째 디자인. 가로로 긴 화면 하나(1080 × 장 수)에 그리고 1080씩 잘라 장마다 8초 영상으로 만든다. 주황 길이 모든 장을 관통하고, 나무·표지판·길 위 화살표가 장 경계에 걸쳐 있어서 **넘길 때 그림이 이어진다.** 문구 규칙(후킹, 사실, 캡션)은 `guide.md`와 `hooks.md`, 그림 목록과 새 그림 그리는 법은 `design.md` 3장·3-1장을 그대로 따른다.

## 1. 언제 쓰나

- **순서가 있는 주제**일 때만: 운동 순서, 루틴 단계, 처음 온 날 동선, 기구 사용 순서처럼 "1 → 2 → 3"으로 말할 수 있는 것 (단계 2~5개).
- 비교·반전·숫자 하나가 핵심인 주제는 Note(`design.md`)로 쓴다.
- 직전 2개 게시물에 가로 잇기가 없을 때만 쓴다 (연속 3개 중 1개까지. 같은 그림이 반복되면 피드가 지루해진다).

## 2. 장 구성 (6~9장, 순서 고정)

| 장 | `kind` | 하는 일 | 필드 |
|---|---|---|---|
| 1 | `cover` | 후킹. 6단어 안팎, 답을 주지 않는다. 찹쌀떡이 START에 서 있다 | `headline`, `sub`, `prop`, `pose`(기본 worried) |
| 2 | `stake` | 왜 중요한지 한 문장. 2장만 보고도 말이 되게 (인스타가 2장부터 다시 보여줄 때가 있다) | `headline`, `sub`, `pose`(기본 wow) |
| 3~ | `station` | 단계 하나씩. 길 위에 번호 정거장 ①②③ | `headline`, `sub`, `station`(1부터), `prop`, `side`(선택: 두 번째 그림, 예 `squat_good`) |
| 끝-1 | `recap` | 캡처용 정리. 단계 이름 + 그림 아이콘, 예외 한 줄 | `headline`, `items`([{`title`, `prop`}] 단계 수만큼), `note`(선택) |
| 끝 | `cta` | 공유 대상 + 숫자 댓글 질문. 길 끝 GOAL에 센터 건물 | `headline`, `sub`, `prop`(기본 building), `pose`(기본 wave), `location` |

- `headline`은 **줄 목록** (`["러닝머신부터", "타면 {red|손해}"]`), 1~2줄, 한 줄 11자 이내(띄어쓰기 포함). 핵심 단어 하나를 `{hl|..}`(노란 형광펜) 또는 `{red|..}`(주황 글자)로.
- `sub` 26자 이내(띄어쓰기 포함). recap `items.title` 6자 이내, `note` 24자 이내.
- 게시물에 `"label"`(모든 장 왼쪽 위에 나오는 주제, 10자 이내)과 `"handle": "@citygym_geumho"`.
- `next` 예고 스티커는 없다. 이어지는 길이 넘길 이유다.
- `pose`: `wave` `point` `wow` `thumbs` `worried` `cheer`.

## 3. 모션 규칙 (Playful 하나로 통일)

- 헤드라인은 줄마다 아래 가림막에서 올라온다 (줄 간격 0.08초), 핵심 단어 뒤로 노란 형광펜이 지나간다. 부제는 0.7초에 떠오른다.
- 튀어나오는 움직임은 살짝 튕기는 스프링 하나 (오버슈트 10~20%). 한 장에 주인공 하나: 표지는 글씨, 2장은 찹쌀떡, 정거장은 기구, 정리는 카드.
- 그림과 찹쌀떡은 첫 프레임부터 화면에 있다 (글씨만 나타난다). 넘기는 중에 다음 장이 첫 프레임으로 보이므로, 비어 보이면 안 된다.
- **장 경계에 걸친 것(길, 나무, 표지판, 화살표)은 움직이지 않는다.** 움직이는 것은 경계에서 120px 이상 안쪽에만.
- 장 번호 `03 / 07`(오른쪽 위)과 계정(오른쪽 아래)은 모든 장에.

## 4. 파일 형식 예시

```json
{
  "id": "2026-11-05-workout-order",
  "design": "pano",
  "scheduled": "2026-11-05T19:00:00+09:00",
  "status": "approved",
  "topic": "tip",
  "label": "운동 순서",
  "handle": "@citygym_geumho",
  "slides": [
    { "kind": "cover", "headline": ["러닝머신부터", "타면 {red|손해}"], "sub": "순서만 바꿔도 드는 무게가 달라져요", "prop": "treadmill", "pose": "worried" },
    { "kind": "stake", "headline": ["땀은 나는데", "무게가 {hl|그대로}?"], "sub": "순서 문제예요" },
    { "kind": "station", "station": 1, "headline": ["워밍업", "가볍게 {hl|5~10분}"], "sub": "몸만 데우기, 지치면 안 돼요", "prop": "stopwatch" },
    { "kind": "station", "station": 2, "headline": ["근력운동", "{hl|무거운 것}부터"], "sub": "힘 남았을 때", "prop": "rack", "side": "squat_good" },
    { "kind": "station", "station": 3, "headline": ["유산소", "{hl|마지막}에 땀 빼기"], "sub": "천국의계단 8대라 마무리도 대기 없이", "prop": "stairs" },
    { "kind": "recap", "headline": ["캡처해두세요", "운동 {red|순서}"], "items": [{ "title": "워밍업", "prop": "stopwatch" }, { "title": "근력운동", "prop": "rack" }, { "title": "유산소", "prop": "stairs" }], "note": "예외: 달리기 대회 준비면 유산소 먼저" },
    { "kind": "cta", "headline": ["러닝머신부터 타는", "친구한테 {hl|보내주세요}"], "sub": "오늘 몇 번부터 했는지 댓글로 1·2·3", "location": "금호역 1번 출구 앞" }
  ],
  "caption": "..."
}
```

검사: `python -m cards check data/posts/<파일>.json`. 렌더러: `remotion/src/CardPano.tsx`.
