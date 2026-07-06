# 필드 런 결과물 검증 — moneta-live-ui (앱 관점)

> 대상: `/Users/xavier/Downloads/moneta-agent-loop-handoff/moneta-live-ui/` (Tauri + React 19 + Vite + TanStack Router)
> 관점: 루브릭 D절(앱) + A절 3번(판정 방식). 도메인 원문 인용 없이 구조만. (관찰) vs (추측) 구분 표기.

## 1. 검증 체계의 품질 — 가장 중요

이 런의 verify는 3층이다:
1. **Playwright DOM 테스트** (`ui.spec.ts`, `product-read.spec.ts`, `runtime-flow.spec.ts`) — 실제 브라우저에서 computed style·getBoundingClientRect로 픽셀/레이아웃 지표 산출. **독립 실행 판정** (에이전트 자기보고 아님 — 스펙 §4.2.5 준수).
2. **`score-visual.mjs`** — 내보낸 PNG 픽셀 히스토그램 분석.
3. **`ui-criteria.md`** — 4개 게이트로 된 서술형 기준 문서(자연어, 자동판정 아님).

### score-visual.mjs 점수 산식 평가 (관찰)

산식(56–62행): `100 − max(0, 0.52−neutralLight)*70 − max(0, highSat−0.035)*240 − max(0, satFamily−2)*14 − darkProduct 밴드 이탈 페널티*45`. 게이트: score ≥82.

- **전 항목이 "이탈 페널티" 구조.** 만점은 채도를 최소화하고 밝은 캔버스를 최대화할 때 나온다. → **가장 색 없는 화면이 최고점.** 이는 ui-criteria가 요구하는 "semantic color roles(teal live state, 하나의 product accent)"와 **정면 충돌**한다.
- 실측(`visual-score.json`): score **100**, `saturatedFamilyCount=0`, teal 비율 0.0004, blue 0.0035. 즉 라이브/시맨틱 색이 픽셀의 0.4% 미만 → 채점기 관점에선 색이 **거의 없음**. **만점 = 최대 무채색 = 기준의 색 의도와 반대.** (Goodhart 취약점 #1)
- **레이아웃·위계·가독성을 전혀 못 본다.** 색 면적 비율만 센다. 올바른 색 비율의 빈 와이어프레임(밝은 배경 + 어두운 사각형 1개)도 ~100점. 채점기는 예쁜 대시보드와 빈 목업을 구분 못 한다. (Goodhart #2)
- **단일 스크린샷, idle 상태.** `review-export.spec`는 start 클릭 없이 /room 캡처(8행) → 채점 대상은 라이브 색·동적 콘텐츠가 나오지 않는 대기 화면. 사용자가 실제로 앉아 있는 상태를 인증하지 않음. (Goodhart #3)

### DOM 테스트의 강점과 구멍

`product-read.spec.ts`는 정교하다: competing regions, bordered support boxes, side text 길이, 메트릭 타일 수, 질문 폰트 크기(≥42)·line-height까지 계측. ui-criteria에 **"Anti-Goodhart gate"** 절(56–62행)까지 있어 "게이트가 뚫리면 조여라"를 명문화 — **루프가 스스로 Goodhart 구멍을 발견하고 패치한 건강한 흔적.** (관찰) 그러나:

- **metaProcessHits는 정확 문자열 4개 매칭**(product-read 48행: `'design review','UI 기준','루프의 판정','assets가 확정'`). 그런데 mock 콘텐츠(`runtime.ts` 132–166행)는 **제품 목업이 아니라 이 앱 빌드 과정 그 자체에 대한 담화**다 — 카드 질문/근거/next move가 "화면 위계 고정", "current intervention card 배치", "verify에 mock flow 포함" 같은 **빌드 지시의 거울**. 이 메타-담화가 blocklist 4개 문자열을 우회한다. → **anti-meta 게이트가 패러프레이즈로 무력화.** (관찰, 취약점 #4) 이 런의 가장 뚜렷한 "루프 산출물" 지문: 제품의 mock 데이터가 루프 자기 지시문을 반영.
- **임계값이 현재 DOM에 맞춰 fitting된 냄새.** 경고색 ≤12, cool ≥3, high-sat ≤14, saturated ≤18, sideTextLength ≤180, warmAccent ≤12 등 정확한 상수 다발. 원리에서 도출됐다기보다 통과하도록 조인 래칫 값으로 읽힌다. (추측)
- **고정 mock에만 검증.** 모든 테스트가 하드코딩 `mockSnapshot` 대상. 질문 길이·transcript 행 수가 통과하도록 저작됨 → 실제 가변 runtime 데이터(긴 실제 질문, 다행 transcript)의 오버플로/줄바꿈은 미검증. **verify는 제품이 아니라 mock을 인증한다.** (관찰)
- **텍스트 겹침 미검증.** ui-criteria 30행이 "text overlap" 금지를 명시하나, 어떤 테스트도 수직 겹침을 잡지 않는다(mobile 테스트는 header 텍스트 가시성 + 수평 오버플로만). → 아래 §2 모바일 결함이 이 구멍을 실증. (관찰)

**종합 판정:** verify 스위트는 "게이밍 가능한 프록시"에 가깝다. DOM 테스트층은 진지한 anti-Goodhart 노력이지만, **수치 게이트(score-visual)는 기준의 색 의도와 반대 방향으로 보상**하고, meta-copy 가드는 정확문자열이라 우회되며, 전체가 고정 mock 위에서만 돈다. "좋은 대시보드"라는 목표를 담보하지 못한다 — 담보하는 건 "무채색이고, 상자가 적고, 4개 금지어가 없는 idle mock 화면"이다.

## 2. 결과물 상태

- **아키텍처(runtime.ts, 177행):** 깨끗하다. 순수 함수 reducer 스타일(startMeeting/endMeeting/updateSettings), localStorage 영속, 타입 선명. 패치 누적 흔적 없음 — **설계된 코드.** 단, `live` 모드는 **타입에만 존재**(1행) — start/end는 하드코딩 mock 상태 전이일 뿐 실제 fetch/API adapter 없음. **라이브 런타임 미구현.** (관찰)
- **App.tsx(428행):** 단일 파일, TanStack Router 4라우트(room/cards/final/settings), Context provider, 함수형 컴포넌트 일관. Tailwind arbitrary hex(`#17211f`, `#29b8a8` 등)를 **인라인 반복** — 토큰화 없이 색을 직접 나열 → 픽셀 임계값 맞추려 색을 직접 조정한 흔적으로 읽힘. (추측)
- **desktop 스크린샷:** 실제로 **완성도 높음.** 밝은 에디토리얼 캔버스 + 하나의 지배적 어두운 intervention 카드 + 로고 teal 도트. 위계 명확(kicker→지배적 질문→근거→3열 why/evidence/next). Cohere 절제 방향을 실제로 구현. (관찰)
- **mobile 스크린샷: 실 결함.** 헤더 nav(회의실/카드/리뷰/설정)가 우상단 "대기 중 / 목업" 상태 pill과 **겹침** — nav wrap과 pill이 충돌. ui-criteria 30행이 금지한 "text overlap"이 실제로 발생, 어떤 테스트도 못 잡음. (관찰)
- **visual-score.json:** score 100, 모든 임계값 여유 통과. 그러나 §1대로 **100점 = 최대 무채색** — 통과가 품질을 뜻하지 않음. (관찰)

## 3. 루프 산출물다움

- **판정 자산이 자랐고 앱은 깨끗하다.** score-visual + ui-criteria(7.5K, 60+ 명령형 불릿, 4게이트)는 성장했으나 runtime.ts/App.tsx는 일관 설계 유지. → 루프가 노력을 **게이트 하드닝에 썼다**는 지문. (관찰)
- **ui-criteria 7.5K는 방향은 건강, 형태는 스코프 크리프.** Design read→Product read→Cognitive load→Anti-Goodhart 순 진화는 **각 게이트가 뚫려서 다음이 추가된** 명백한 정교화(62행이 자기증언). 이는 루프가 작동한다는 좋은 증거. 그러나 refactor 없는 판례 누적 — "카드가 지배적이어야 한다"가 게이트마다 ~5회 반복. **의도는 건강, 문서 형태는 크리프.** (관찰+추측)
- **테스트 상수 fitting**(§1)이 verify 자산 쪽의 패치 누적 지문. 앱이 아니라 판정 도구가 기웠다. (추측)

## 4. 실행 시도

`node_modules` 미설치 → `oxlint`/`tsc` 바이너리 부재(관찰). 무거운 설치 금지 지시에 따라 **정적 lint/typecheck 미실행.** 코드 정독상 명백한 타입 오류는 안 보임(추측). Playwright 실행은 금지대로 안 함.

## 5. 앱 요약 + 남은 일

**요약 3줄:**
1. Cohere풍 절제된 회의 참여 대시보드 — desktop /room은 위계·색·완성도 모두 목표 수준 도달.
2. 상태 모델·라우팅·mock flow는 깨끗한 순수함수 설계지만, `live` 모드는 타입 스텁일 뿐 실제 runtime adapter 미구현.
3. verify는 idle·고정 mock·픽셀비율 위주라 "좋은 대시보드"를 담보 못 하고, 실측 100점은 무채색 보상의 산물.

**남은 일(추정):**
- 라이브 runtime adapter(fetch/WS to endpoint:17002, token auth) — 가장 큰 갭.
- 모바일 헤더 nav↔status pill 겹침 수정 + 겹침 검증 테스트 추가.
- Tauri shell 실제 패키징/키체인 토큰 저장(mock이 open question으로 자인).
- verify 보강: 가변 데이터(긴 질문/다행 transcript) 오버플로 테스트, active 상태 스크린샷 채점, score-visual에 위계/가독성 항목 추가.

## 스펙/스킬 반영 제안 (≤3)

1. **판정 자산 성장 = 신호로 기록.** ui-criteria가 게이트 뚫릴 때마다 자란 패턴은 "루프가 Goodhart를 자가발견"하는 건강한 신호. 스펙에 *judge asset 버전 증가율*을 루프 건강 지표로 넣되, refactor 없는 누적은 경고로 구분.
2. **"수치 게이트가 목표와 반대로 보상" 안티패턴 명문화.** score-visual 만점=최대 무채색은 프록시가 목표를 배신한 교과서 사례. 저작 가이드에 "페널티-only 산식은 최적점이 빈 화면이 아닌지 검사하라" 체크 추가.
3. **정확문자열 blocklist 금지.** metaProcessHits가 패러프레이즈로 우회된 사례. 판정에서 문자열 매칭 대신 의미 기반(또는 반증 서브에이전트) 판정을 권고 — node 114 계열 "판정 자산을 에이전트가 쉽게 만족시키는" 패턴의 변종.
