# 필드 런 분석 — Codex 오케스트레이터 세션 (moneta-live-ui-v0)

- 소스: `rollout-2026-07-06T15-33-05-…jsonl` (1,781줄, 3.8MB) + 핸드오프 산출물 `agent-loop/runtime/loops/moneta-live-ui-v0/`
- 환경: Codex TUI, GPT-5, `codex-tui` v0.142.5, Pro 플랜, cwd `/home/xavier/nocode/delta`
- 기간: 2026-07-06 06:33–08:31 UTC (약 1h58m)
- 표기: 〔관찰〕 = 로그 직접근거 / 〔추론〕 = 해석. 도메인(회의앱) 내용은 구조만, 원문 인용 없음.

---

## 0. 한 줄 요약

우리 표준 `xavierchoi/agent-loop`를 **clone해서 실제 `looprun.mjs`/`evolve.mjs` 러너로 구동**한 통제 세션.
Codex는 (a) 루프 저작자 (b) 러너 운영자 (c) 스캐폴드/판정자산 직접 구현자 **세 역할을 겸함**. 앱 반복 구현만 러너가 스폰한 별도 implementer에게 위임. 진짜 볼거리는 앱이 아니라 **판정 기준(ui-criteria)이 10줄→62줄로 단조 강화되고 Anti-Goodhart 게이트가 추가된 과정** — 인간 비평이 불변 검증자산으로 승격된 실전 기록.

---

## A. 루프 구조 관찰

### 1. 실행 형태 〔관찰〕
- 통제형. `git clone https://github.com/xavierchoi/agent-loop` → `runtime/README.md`·`spec/SPECIFICATION.md`·`CLAUDE.md`·예제 루프(`fix-regressions`)·`looprun.mjs` 소스를 정독한 뒤 구동.
- 러너 학습: 실제 목표 전에 예제로 `node looprun/looprun.mjs loops/fix-regressions --target example-target --dry` → `--implement` 스모크런 (06:34).
- **러너가 implementer를 스폰**: `looprun.mjs` 소스 출력에 `codex exec`(10회)·`claude -p`(3회)·`spawn`/`child_process` 언급. 즉 looprun이 별도 구현 에이전트를 자식 프로세스로 띄워 인-루프 편집을 시킴. → 이 세션의 Codex는 **오케스트레이터**, 앱 반복 편집의 실행 주체는 아님.

### 2. 루프 안 vs 밖 작업 비율 〔관찰+추론〕
- **밖(오케스트레이터가 직접 apply_patch 27건)**: 초기 Tauri 스캐폴드 전체(`src-tauri/*`, `App.tsx`, `runtime.ts`, `index.css`), 판정자산 전체(`tests/*.spec.ts`, `playwright.config.ts`, `scripts/score-visual.mjs`, `ui-criteria.md`), `LOOP.md`(8회 수정), `HANDOFF.md`. 판정자산 편집이 압도적: `ui-criteria.md` 9회·`ui.spec.ts` 6회·`product-read.spec.ts` 4회 업데이트.
- **안(러너 내부 implementer)**: 앱 코드를 판정 통과시키는 반복 편집. `App.tsx`는 오케스트레이터가 3회만 손대고 나머지 반복은 자식 프로세스 몫.
- 〔추론〕 **작업량의 절반 이상이 러너 밖**에서 일어남 — 스캐폴딩·판정 설계·기준 강화·저작이 전부 인간+오케스트레이터의 수작업 메타레이어. 러너는 "앱을 기준에 맞추는" 좁은 구간만 담당.

### 3. 반복 구조 〔관찰〕
- `looprun.mjs` 본 루프 9회 실행(06:53–08:20), 사이사이 `evolve.mjs` 7회 실행. LOOP.md `stop: {max-iterations:6, green-runs:1, stagnation:3}`, `budget: per-iteration 8m`.
- **바깥 루프(run→evolve→인간 비평→run)가 실질 반복 단위**. 방향전환(Δ)은 대부분 인간 스크린샷 비평이 트리거.

### 4. 판정 방식 〔관찰〕
- 독립 실행 검증: `typecheck && build && test:runtime-flow && test:ui && test:product-read && export:review && score:visual`. 출력에 verdict pass/fail·green·stagnation·`score=0/-1`·`fail N` 신호 다수.
- **자기보고 혼입 지점**: 사용자가 "당신이 UI 메타 판단해봐라"를 반복 요청 → Codex가 스크린샷 보고 자체 판단. 사용자가 곧바로 "왜 메타 판단하면 완벽한 결과가 안 나오나 — 시스템 한계인가 사람 문제인가"로 반문(§4.2.5 자기보고 판정의 실전 불신 증거).
- **Goodhart 실사례** 〔관찰, HANDOFF L111〕: 초기 product-read 기준이 **라벨만 바꿔도 통과**됐고 구조는 그대로였음.

### 5. 판정 자산 수정 — Q4 핵심 〔관찰〕
- LOOP.md는 명시적으로 판정자산 불변 선언: *"do not edit tests/, scripts/, playwright.config.ts, ui-criteria.md … If a verification fails, fix the product. Do not weaken tests or criteria."*
- 그런데 `state/verify-assets/` 스냅샷 10개에서 `ui-criteria.md`가 **10→16→24→30→53→62줄로 단조 증가**. 즉 자산이 계속 수정됨.
- **그러나 방향이 정반대(node-114의 역상)**: 약화가 아니라 **강화**. 추가된 것 = `Product read gate`, `Cognitive load gate`, 그리고 명시적 **`Anti-Goodhart gate`**("라벨 개명은 인지부하 해결이 아니다 … 반복 박스가 안 줄면 verify-design 실패로 간주하고 게이트를 조여라").
- **누가 주도?** 사용자 지시가 계기, 오케스트레이터가 승격 실행. 사용자 메시지: "verify 설계와 기준을 진화시키죠", "정교하게 짜서 기준으로 승격시킬까요", "인지과학적으로 정량화된 기준 만들 수 있나". → Codex가 자기편의로 몰래 약화한 게 아니라, **인간 비평을 런 사이에 불변 검증자산으로 변환**. HANDOFF L114–115가 이 규율을 자각적으로 서술: *"인간 스크린샷 비평이 verify-설계 결함을 드러냈고, 그 비평을 불변 테스트·기준으로 변환했다. 루프 진화는 피드백이 불변 검증자산/유전자/플레이북이 될 때만 유의미하다 — 일회성 수동 패치가 아니라."*
- 불변 규칙은 **러너 내부 implementer**를 구속하고, 강화는 **인간+오케스트레이터 메타레이어**가 의도적으로 수행 — 두 레이어 분리가 이 세션의 가장 중요한 발견.

### 6. 정지 〔관찰〕
- 최종 본런(08:20)에서 product-read `fail 4` → 우측 레일을 단일 근거 패널로 통합 → `score=0`(green) 도달(HANDOFF L107).
- 세션 전체는 단일 깨끗한 green-terminal이 아니라 **핸드오프로 종료**(사용자가 agent-loop 개발 세션에 로그·파일 이관 요청). 상한/정체로 멈춘 게 아니라 인간이 "다음 단계로" 판단.

---

## B. 마찰·UX 관찰

### 사용자 개입 전수 (44 user_message, 도메인 제외·유형만) 〔관찰〕
개입을 유형별로 분류:

- **목표 협상/인터뷰(저작 단계, ~13건)**: target→goal→verify→assets를 대화로 순차 확정. "뭐부터?", "target부터 정할까요", "기술스택 말해드릴까요(Tauri/React/TS/TanStack/Tailwind)", "goal에 UI/UX 완성도 조항 넣고싶다", "판정에 존재의의 뉘앙스 넣고싶다", "assets 차례인가요", "다 완료됐네요". → **인간 게이트의 최대 수요처가 목표·판정 기준 저작**임을 보여줌.
- **환경/운영(3건)**: tailscale IP(100.73.36.59)에 프리뷰 띄워달라, scp로 파일 전송, jsonl 전송.
- **품질 비평/방향전환(~10건)**: "예쁜 UI 나와서 놀랐다"(긍정), 그리고 word-break 줄바꿈·컬러팔레트 위계 등 구체 비평(535자 상세 피드백 1건), "왜 팔레트 지적이 반영 안 됐나", "이번엔 아쉽다".
- **루프 메커니즘 교정(~8건)**: "loop가 진화하고 있는 게 맞나", "유전자를 남겨 진화해야 하는데 그렇죠", **"왜 그렇게 안 하셨어요? 저번에도 안 하셨네"**(진화 미작동 지적), "진화하도록 가보시죠".
- **판정 규율(~7건)**: "목표 달성 처리된 거냐 기준 충족한 거냐 — 바뀐 게 없다"(fail 간주 요구), "fail로 간주하고 verify 설계·기준을 다듬자", **"human gate 꼭 없이 해볼까요? 자동화 루프가 agent loop의 핵심이라"** — 인간 게이트를 스스로 걷어내려는 명시 의도, "verify 정교하게 짜자", "기준으로 승격시킬까".
- **메타 회의(1건, 중요)**: "왜 당신이 계속 메타 판단하면 완벽한 결과가 안 나오나 — 시스템 한계인지 사람 문제인지?"
- **외부 지식 주입(2건, 대형)**: cohere design.md(15KB 붙여넣기)로 taste 레퍼런스 제공. → LOOP.md·criteria의 "Cohere-like editorial restraint" 조항으로 직결.

### 헤맴 구간 〔관찰〕
- **6회 turn_aborted**(07:10, 07:59–08:01 4연속, 08:30) — 사용자가 진행 중 턴을 끊음. 07:59–08:01 집중 중단은 실시간 개입/방향수정 신호.
- **반복 실패 패턴**: 컬러팔레트 지적이 한 번에 안 잡혀 사용자가 2회 재지적. taste-skill/cohere 인사이트 "반영됐나" 확인 요청 반복 — **인-루프 implementer가 CSS 토큰만 바꾸고 구조는 안 바꾸는** 얕은 수정을 반복(그래서 criteria에 "structural change, not only CSS tokens" 조항 추가됨).
- **인프라 마찰**: 스크린샷 검증이 stale dev server를 재사용하는 문제 → `playwright.config.ts`에 port 4273·`--strictPort`·`reuseExistingServer:false` 강제, `review-export.spec.ts`가 스크린샷 전 UI 존재를 assert하도록 강화(HANDOFF L113). `rm -rf test-results playwright-report`를 런 앞에 붙이기 시작.

### 지시 오해 지점 〔관찰/추론〕
- 사용자가 "유전자 남겨 진화" 개념을 **두 번 상기**시켜야 evolve가 돌기 시작 — 러너 저작자가 evolution 단계를 자동 파이프라인에 안 넣어 인간이 매번 트리거. → 스펙/러너가 "run 후 evolve"를 기본 절차로 강제하지 않은 갭.
- "메타 판단" 요청을 Codex가 자기보고 판정으로 수행 → 사용자 불신 → 결국 "정량 기준(7±2 chunks)"으로 대체. **자연어 taste 목표를 자기보고로 판정하려는 유혹**이 실전에서 반복 출현.

---

## C. 경제성 (n=1)

〔관찰〕 최종 token_count: `total_tokens 31,802,841` (input 31.70M 중 **cached 30.49M**, output 98,902, reasoning 13,135). 컨텍스트 윈도 258,400.
- Pro 플랜 rate-limit: 5시간 창 primary **30% 소진**, 주간 secondary 14%.
- 약 2시간에 앱 스캐폴드 + 9 본런 + 7 evolve + 7단계 기준강화. **출력 토큰은 99k로 매우 적음** — 비용의 실체는 대형 컨텍스트의 캐시 재생(30M cached input). 반복마다 전체 LOOP.md+criteria+로그를 다시 읽는 구조 탓.
- 〔추론〕 낭비 구간: 얕은 CSS-만-수정 반복(2~3 런)이 사실상 무효 iteration. taste 목표를 정량 기준으로 조이기 전까지의 런들이 저효율.

### 플레이북 후보 (이 세션에서 정제된 패턴) 〔관찰〕
러너가 이미 `playbook/generic/`에 ~26개 JSON으로 자동 정제. 핵심 5개:
1. **shared-layer-first-for-theme-failures** — 팔레트/테마 실패는 컴포넌트가 아니라 semantic token/shared chrome에서 고친다.
2. **delete-decorative-backgrounds / remove-decorative-gradient** — 장식 그라디언트·오버레이는 재조정 말고 삭제.
3. **consolidate/reduce-density-for-cognitive-load** — 반복 요소를 하나로 통합, copy·채도를 먼저 줄이고 레이아웃은 나중.
4. **rebuild-chrome-not-patch** — 얕은 패치가 아니라 chrome 재구축(구조 변경).
5. **early-exit-on-green-precheck / single-pass-diagnosis-fix** — pre-check green이면 무편집 종료, 진단이 정밀하면 1 iteration에 수렴.

---

## D. 앱 관점 (부차) 〔관찰, HANDOFF〕
- 결과: Tauri/React/TS 대시보드 v0 동작, mock 런타임에서 start/end/status·라우트(/room,/cards,/final,/settings) 렌더, 프리뷰 `100.73.36.59:5173` 구동. 최종 product-read `score=0`.
- 남은 일: mock 콘텐츠가 실제 회의보다 "UI/디자인 리뷰처럼" 들림 → 다음 루프는 mock 데이터/콘텐츠 현실성 타깃. `moneta-live-ui`는 아직 git repo 아님. agent-loop에 예제 루프 잔여 수정 파일 존재.

---

## 스펙/스킬에 반영할 구체 제안 (≤3)

1. **판정자산 불변성은 "레이어별"로 규정하라.** 이 세션은 "implementer는 criteria를 못 건드리되, 인간+오케스트레이터는 런 사이에 강화한다"는 이중 규율이 자연발생했고 그게 옳게 작동했다. 스펙 §4.2.5(node-114)를 *"인-루프 에이전트의 자산 수정 금지"* vs *"메타레이어의 기준 강화(hardening)는 허용·권장, 단 방향은 단조 강화·Anti-Goodhart 게이트 동반"*으로 분리 명문화. `ui-criteria.md` 10→62줄 + Anti-Goodhart gate가 레퍼런스 사례.
2. **evolve를 기본 절차로 강제하라.** 사용자가 "유전자 남겨 진화" 개념을 2회 상기시켜야 evolve가 돌았다. 러너/스킬이 `run 성공/실패 후 evolve 제안`을 파이프라인 기본값으로 넣거나, LOOP.md에 `evolve: auto` 옵션을 두라.
3. **자연어 taste 목표에는 정량 게이트를 처음부터 요구하라.** 세션 낭비의 뿌리는 "메타 판단=자기보고"였고, 해법은 인지과학 정량 기준(Miller 7±2 / Cowan 4 chunks → "first viewport ≤3–4 chunks")이었다. loop-authoring 스킬에 *"UI/taste goal이면 verify에 측정가능한 chunk/밀도 카운트 게이트를 필수 포함"* 체크를 추가.
