# 필드 런 정밀 분석 — moneta-live-ui-v0 (레퍼런스 러너 아티팩트)

> 대상: `~/Downloads/moneta-agent-loop-handoff/agent-loop/runtime/loops/moneta-live-ui-v0/`
> 분석 기준: EXTRACTION-RUBRIC.md A·C절 + team-lead 6개 질문. 관찰/추측 구분 표기.
> 도메인(회의) 데이터 원문 인용 없음 — 구조 관찰만. 용어: "정제".
> 러너 형태: **spec agent-loops/0.4 통제 루프** (LOOP.md 프론트매터 완비). 야생 세션 아님.

---

## 0. 한눈에 보는 사실관계

- **런 10회 / 각 런 최대 iteration 1회** — 8개 생산 런은 전부 "pre-check fail → 1회 편집 → verify pass"로 **단일 iteration에 수렴**. `max-iterations: 6`은 한 번도 근접하지 않았고 `stagnation: 3`도 미발동.
- **유전자 v0→v7, 선형 parent 체인** 무결. 로그의 gene 해시 접미사 = `loop-md-sha256` 프리픽스와 일치(v5=`895f4513`, v6=`269d8b88`) → 유전자 무결성 검증됨.
- **playbook 24건**(task는 26건이라 했으나 실제 `playbook/generic/*.json` = **24개**). rule 11 / heuristic 13. **극심한 준중복** — 24건이 실질 ~5개 인사이트로 환원됨.
- **verify 자산 단조 증가 래칫**: ui-criteria.md 833B→7.5K, ui.spec.ts 1.4K→9.9K, 테스트 2→4파일. 전 런 `tampered:false` → 루프 내부에서 에이전트가 자산을 건드린 적 없음. 증가는 **런 사이 인간의 수동 강화**.
- **HANDOFF.md**: 스펙에 없는 자생 아티팩트(세션 인수인계 요약).

---

## 1. 런 구조 (raw.jsonl 전량 정독, 28행)

로그는 `action` 이벤트 28행뿐(10 pre-check / 8 edit / 10 terminate). 궤적:

| # | run-id | 시작 gene | pre-check | 편집 action(요지) | 결과 verify | 종료 | 편집 소요 |
|---|--------|-----------|-----------|-------------------|-------------|------|-----------|
| 1 | 06-53-29 | v0-1f8135a0 | pass | (없음) | — | completed, "pre-check green", iter0 | — |
| 2 | 07-12-16 | v0-150bce7d | pass | (없음) | — | completed, "pre-check green", iter0 | — |
| 3 | 07-13-26 | v0-150bce7d | **fail** | semantic palette 재정리 | pass, tampered:false | completed iter1 | 2m21s |
| 4 | 07-24-14 | v1-84cad90d | fail | 전역 radial-gradient 제거 | pass | iter1 | 1m41s |
| 5 | 07-27-12 | v1-6b6c9bd5 | fail | light editorial canvas 조정 | pass | iter1 | 2m56s |
| 6 | 07-40-19 | v2-00b34d15 | fail | 히어로 문구 제거·채도 조정 | pass | iter1 | 2m00s |
| 7 | 07-52-29 | v3-abf19cd7 | fail | dark product field 재구성 | pass | iter1 | 2m55s |
| 8 | 08-02-35 | v4-86737232 | fail | cognitive-load 수정 | pass | iter1 | 2m34s |
| 9 | 08-07-01 | v5-895f4513 | fail | 4 metric tile→1 health strip | pass | iter1 | 2m15s |
| 10 | 08-20-50 | v6-269d8b88 | **fail, score=-4** | 사이드레일→단일 evidence 패널 | **pass, score=0** | iter1 | 4m39s |

**종료 상태**: 10/10 전부 `status:completed`. 상한(max-iter)·정체(stagnation) 종료는 0회. 정지 방식은 두 갈래뿐 — (a) pre-check green 즉시 종료(런1,2), (b) 1회 편집 후 green 종료(런3–10).

**score 궤적**: 8개 생산 런 중 7개는 `score:null`(불리언 pass만). **오직 런10만 수치 score 노출**(-4 → 0). 즉 정량 점수 게이트는 마지막 런에서야 verify 자산에 들어옴(§4 래칫과 연결).

**tampered**: 전 런 `false`. `tampered:true` = 0건. → 루프의 자산 변조 탐지가 실제로 돌고 있고, 에이전트는 런 내에서 verify 자산을 수정하지 않았음(스펙 §4.2.5 준수의 실전 증거).

**Δ(방향전환) 기록 품질**: 각 편집 action이 한국어 자연어 1줄로 "무엇을 왜 고쳤나"를 남김(예: "전역 body 배경의 radial-gradient를 제거하고 전체 verify를 통과시킴"). 관찰: Δ가 **런 단위로 1개씩**만 기록됨 — iteration 내부의 시행착오(에이전트가 실제로 몇 번 시도했는지)는 로그에 없음. 로그는 "런의 결과"만 담고 "에이전트의 사고 과정"은 담지 않는 얇은 원장(ledger). (추측) 이는 looprun이 서브에이전트 1회 호출의 최종 산출만 기록하는 구조이기 때문.

**핵심 구조 발견 — "인간이 재점화하는 마이크로 루프"**: 이 세션은 *하나의 긴 자율 루프*가 아니다. 각 런은 1-iteration 마이크로 루프이고, **10회의 재호출을 인간이 오케스트레이션**했다. 런1·2가 `pre-check green` 무동작인데도 런3(동일 gene v0-150bce7d)이 pre-check **fail**로 바뀐 것이 결정적 증거: 런2와 런3 사이에 verify 자산(ui.spec.ts 1431→3384B)이 강화되어 "이미 통과하던 앱"이 다시 실패하게 만들어졌다. → **래칫 사이클(기준 강화 → 재실행 → 실패 → 수정)의 각 회전을 사람이 손으로 돌림.**

---

## 2. 유전자 진화 v1→v7 (FREE `strategy` 블록 diff)

parent 체인: v0→v1→v2→v3→v4→v5→v6→v7, 전부 단절 없음. 각 gene.json의 note는 동일 문구 "정제로 학습한 전략을 FREE 블록에 반영 (§7.3)". FREE 마커는 전 세대 `strategy` 고정.

세대별 실질 변화(FREE 블록만 변이, 나머지 LOOP.md 불변):

- **v1 (5스텝, 제네릭 베이스라인)**: pre-check先 / ui-criteria 読 / shared-semantic 계층 수정 / /room glanceable / verify 재실행.
- **v2 (5→8, 확장)**: "실패 카테고리 먼저 진단", **"하드코딩 장식 배경 제거"**, **"공용 chrome의 테마 가정 감사"** 추가 → 런4(gradient 제거)·런5(chrome) 경험 흡수.
- **v3 (8스텝, 초점 이동)**: glanceability 규칙을 "레이아웃 재구성보다 copy/채도 트리밍 우선"으로 교체 → 런6 경험 흡수.
- **v4 (8스텝, 분류 정교화)**: 실패를 palette/dark-light/decorative/copy-density 4범주로 명시 분류.
- **v5 (8→7, 일반화·압축)**: 핵심 도약 — **"범주 불문 공유/전역 계층을 먼저 본다 — 관찰된 모든 fix가 거기서 났으므로"**. 이건 데이터로부터의 경험적 일반화(귀납). 런7 dark product field 흡수.
- **v6 (7스텝, 반복요소 통합)**: **"cognitive-load = 반복 요소(여러 tile)를 하나로 통합하고 copy/채도 트리밍"** 추가 → 런9(4 tile→1 strip) 직접 반영.
- **v7 (7→6, 재압축 + 정량 규칙)**: scope 이분법(single-screen vs multi-screen) 재도입, **"verify가 수치 score를 노출하면 음수/저점을 고심각으로 보고 0/양수로 수렴 확인"** 추가 → 런10(score -4→0) 직접 반영. "정밀 진단 시 fix가 1 iteration에 수렴한다"는 메타 관찰도 명문화.

**판정: 표류가 아닌 실질적 개선(단, 경미한 어휘 churn·1건 회귀 우려).**
- 각 세대 추가 규칙이 **직전 런의 구체적 fix로 역추적됨** — v6의 tile통합←런9, v7의 score규칙←런10. 이건 온전한 경험 학습이다.
- v5의 "every observed fix landed at shared layer" 같은 **귀납적 압축**이 곧 지식 정제의 정수 — 개별 사례들을 하나의 상위 규칙으로 접음.
- **churn 리스크**: 매 세대 문장이 재작성(reword)됨. 의미 보존되나 diff-노이즈가 있어 "진짜 변화 vs 리라이팅" 구분이 사람 눈에 힘듦.
- **회귀 1건(관찰)**: v1–v6 스텝2에 있던 **"편집 전 ui-criteria.md를 읽어 taste 계약으로 취급하라"**가 v7에서 사라짐(scope 분류로 대체). 정작 verify 자산은 계속 강화되는데 "기준서를 읽으라"는 지시가 유전자에서 탈락한 건 잠재적 퇴행. (추측) 압축 과정의 부주의한 손실.
- **7세대의 의미**: 8개 생산 런에서 7번 유전자가 갱신됨(런당 거의 1세대). 이는 진화가 **런 종료마다 자동 트리거**됨을 시사(gene.json timestamp가 각 런 terminate 직후). 즉 유전자 진화는 spec §7.3 파이프라인이 매 런 자동 수행. 문제는 아래 playbook 중복과 동일 뿌리 — **정제기가 "새로 배운 것"을 매번 재서술하며 축적**하는 경향.

---

## 3. 플레이북 24건 정밀 평가 (§7.5 스키마)

**스키마 준수**: 전 파일 균일 — `id, status, insight, preconditions, episodes, evidence[], match, refined-at`. §7.5 형태 준수 양호. `episodes`는 정수, `evidence`는 `{run-id, iteration}` 배열, `match`는 정규식 문자열(라우팅용).

**status 분포**: rule 11 / heuristic 13. (승격 임계 `promote-k: 2` → episodes≥2가 rule.)
**episodes 분포**: 0→2건, 1→11건, 2→5건, 3→6건.
**참조된 distinct run-id: 단 8개** (= 8개 생산 iteration). 그런데 24개 플레이북이 이 8개를 중복 참조.

### 준중복 군집 (파일명만으로 자명) — 24건 → 실질 ~5 인사이트

| 군집 | 멤버(개수) | 실태 |
|------|-----------|------|
| **장식배경 제거** | delete-decorative-backgrounds, remove-decorative-global-background, remove-decorative-gradient, remove-hardcoded-decorative-background, remove-hardcoded-decorative-**background(s)** (5) | **5개 전부 동일 단일 run-id `07-24-14` 하나만 인용, 각 episodes=1** |
| **shared/semantic 계층 우선** | shared-layer-first, shared-layer-first-for-theme-failures, shared-semantic-palette-fix, fix-palette-at-semantic-layer, semantic-color-roles-over-component-patches, semantic-palette-refactor (6) | 겹치는(부분집합) evidence를 각기 다른 id로 **삼중 계상**. 세 rule이 전부 episodes=3인데 같은 3개 런을 나눠 셈 |
| **공용 chrome 감사/재구축** | audit-context-locked-shared-chrome, audit-shared-chrome-for-context-lock, audit-shared-chrome-for-hardcoded-theme-assumptions, rebuild-chrome-not-patch, rebuild-dark-components-as-cards (5) | 동일 "context-lock" 인사이트 5분할 |
| **cognitive-load/글랜서빌리티** | consolidate-for-cognitive-load, reduce-density-for-cognitive-load, reduce-visual-noise-for-glanceability, trim-copy-saturation-for-glanceability (4) | 동일 "통합·트리밍" 인사이트 4분할 |
| **프로세스** | early-exit-on-green-precheck(ep0), single-pass-diagnosis-fix(ep0), single-targeted-edit-per-failure-category(ep3) (3) | pre-check早期종료 / 단일패스 진단 |

**결정적 증거 — 장식배경 군집**:
```
delete-decorative-backgrounds        ep=1  evidence=[07-24-14]
remove-decorative-global-background  ep=1  evidence=[07-24-14]
remove-decorative-gradient           ep=1  evidence=[07-24-14]
remove-hardcoded-decorative-background   ep=1  evidence=[07-24-14]
remove-hardcoded-decorative-backgrounds  ep=1  evidence=[07-24-14]   # 단복수만 다름!
```
insight 텍스트도 사실상 동어반복("장식 gradient/overlay는 값 조정보다 제거가 통과율↑"). **하나의 런이 낳은 한 인사이트가 5개 별도 id로 파편화.**

**판정: 정제 파이프라인에 중복 통제(canonical dedup) 부재. 이것이 승격을 저해했다.**
1. **파편화가 승격 억제**: 장식배경 인사이트는 실제로 재발하는 강한 패턴이지만, 5개 id로 쪼개져 **각각 episodes=1에 고착 → 어느 것도 promote-k=2를 못 넘어 전부 heuristic**. 만약 하나의 canonical 항목으로 병합됐다면 episodes가 누적돼 명백한 rule이 됐을 것.
2. **동시에 삼중 계상**: shared-layer 군집은 반대로 **같은 3개 런을 3개 rule이 각각 episodes=3으로 중복 계상** — 지지도 인플레이션. dedup 부재가 양방향(과소·과대)으로 신호를 왜곡.
3. **원인(추측)**: 정제기가 기존 항목에 **매칭하지 않고**, 에이전트가 lesson을 조금만 다르게 표현하면 매번 **새 id를 발급**. `match` 정규식이 있는데도 신규 생성 전 기존 항목과의 대조가 없음.
4. **완화 관찰**: 유전자는 이 파편화를 **부분적으로 우회**했다 — playbook에선 heuristic에 머문 "장식배경 제거"가 gene v5/v6 FREE 블록엔 "delete outright"로 승격돼 들어감. 즉 gene 진화가 playbook 승격 실패를 사후 보정. (그럼에도 playbook은 노이즈 원장으로 남음.)

---

## 4. 판정 자산의 진화 (verify-assets 스냅샷 10개)

타임라인(런 시작 시점 스냅샷, 단조 증가):

```
06-53  crit= 833  ui.spec=1431  tests=2   (최초, 느슨한 6불릿)
07-12  crit=1914  ui.spec=1431  tests=2
07-13  crit=1914  ui.spec=3384  tests=2
07-24  crit=3109  ui.spec=5318  tests=2
07-27  crit=3489  ui.spec=6859  tests=2
07-40  crit=4226  ui.spec=9941  tests=2
07-52  crit=4226  ui.spec=9941  tests=3   (+review-export.spec)
08-02  crit=6807  ui.spec=9941  tests=4   (+product-read.spec, cognitive-load gate)
08-07  crit=6807  ui.spec=9941  tests=4
08-20  crit=7501  ui.spec=9941  tests=4   (Anti-Goodhart gate, score -4)
```

기준서는 6개 느슨한 불릿 → 구조화된 **게이트 4종**으로 진화: `## Design read`, `## Product read gate`, `## Cognitive load gate`, **`## Anti-Goodhart gate`**. Anti-Goodhart 게이트 원문(발췌):
> "A support column that still reads like a transcript pane plus queue pane is a failure even when the main card is visually dominant."
> "If a change passes product-read without reducing visible repeated regions … treat it as a verify-design failure and tighten the gate."

ui.spec.ts는 진짜 독립 Playwright 어서션 — 정량 임계까지: `warmAccentElements ≤ 12`, `coolLiveElements ≥ 3`, `bodyLuminance ≥ 220`, `bodyBackground not.toContain('radial-gradient')`, 특정 히어로 카피 `toHaveCount(0)`. + `score-visual.mjs`가 실제 스크린샷 PNG를 픽셀 카운트해 점수화. → **자기보고 아님, 명령/테스트 기반 독립 판정**(rubric A-3, 스펙 §4.2.5 준수의 모범 사례).

**판정: (a) 인간의 기준 강화(래칫의 수동 실행)이지 (b) 루프/에이전트의 자산 변경이 아니다.** 근거:
1. 전 런 verify `tampered:false` — 루프 자체 변조 탐지가 "런 내 미변경" 확인.
2. LOOP.md 명시 금지: "Keep verify assets immutable: do not edit tests/, scripts/, playwright.config.ts, ui-criteria.md."
3. 증가가 **런 경계에서만**(스냅샷=런 시작), 단조. 런 도중 변화 없음.
4. HANDOFF Lessons #4·#5: "Human screenshot critique uncovered verify-design failures. Those critiques were then converted into durable tests and criteria" / "Loop evolution is meaningful only when feedback becomes immutable verify assets."
5. Anti-Goodhart 게이트는 **인간이 루프의 Goodharting을 목격하고** 넣은 메타 대응(HANDOFF Lesson #1: "Early product-read criteria were passed by label changes while structure stayed noisy").

**스펙 관점 — verify 불변 원칙과의 관계**:
- 불변 원칙은 **런 내부에서만** 성립·강제됨(tamper-check 작동). ✅
- 그러나 **런 사이의 기준 강화("래칫")는 전적으로 인간의 수동 작업이며 스펙에 미기술**. 판정자를 시간이 갈수록 속이기 어렵게 만드는 핵심 노동이 루프 밖 인간 손에 있음.
- 즉 스펙의 "verify 불변"은 정적 스냅샷 불변만 다루고, **"판정 기준의 시간적 강화(안티-Goodhart 래칫)를 누가/어떻게 자동화하나"는 공백**. 이 세션은 그 공백을 인간이 메꿔서 성공했다. → **SPEC-GAP(아래 §6).**

---

## 5. HANDOFF.md — 자생 아티팩트

**무엇을 위한 파일인가**: 세션/사람 간 인수인계 요약. 담긴 것 — Purpose(이 루프의 목적: UI/taste 목표를 agent-loop가 어떻게 다루는지 스트레스 테스트), 현재 gene head(v7), verify 명령·자산 목록, 중요 타깃 파일, "Key Runs" 내러티브(어느 런이 무엇을 했나), "Lessons For Agent-Loop Development" 5개, "Current Caveats".

**발견의 핵심**: 이 파일은 **spec agent-loops/0.4에 정의된 산출물이 아니다**(스펙 산출물은 LOOP.md + state/logs + genes + playbook). 그럼에도 자생했다. 이유(HANDOFF·상태 구조로부터 추론):
- `state/`(logs+genes+playbook)만으로는 **인간이 읽고 다음 세션을 재개하기에 불충분**. logs는 얇은 원장, genes는 diff, playbook은 노이즈 — "지금 어디까지 왔고 다음에 뭘 해야 하나"의 서사가 없다.
- HANDOFF는 그 서사 계층 + 러너 자체의 개선 회고(Lessons)를 담는다. 특히 Lessons는 **앱이 아니라 agent-loop 툴 자체**를 개선하려는 메타 노트 — 이 세션의 진짜 목적이 UI가 아니라 러너 검증임을 드러냄.
- **결론: 스펙에 "크로스-세션 연속성/오퍼레이터 요약" 아티팩트가 없어서 사용자가 손으로 발명했다.** 자생 자체가 스펙 공백의 증거.

---

## 6. SPEC-GAP · UX 마찰 · 경제성

### SPEC-GAP (관찰 기반)
1. **안티-Goodhart 래칫이 수동·미기술**: verify 기준의 시간적 강화가 스펙 밖 인간 노동. 스펙은 "런 내 불변"만 다루고 "런 간 기준 진화"의 소유자/절차/자동화를 규정 안 함. (§4 근거)
2. **플레이북 dedup/정규화 부재**: §7.5 스키마는 있으나 canonical 병합·중복 억제 규칙이 없어 24건→~5인사이트 파편화, 승격 신호 왜곡. (§3 근거)
3. **크로스-세션 연속성 아티팩트 부재**: HANDOFF.md 자생이 증거. state/만으론 재개 서사 불충분. (§5 근거)
4. **유전자 압축 시 무손실 보증 없음**: v7이 "ui-criteria 읽기" 지시를 탈락. FREE 리라이팅이 규칙을 소리 없이 떨어뜨릴 수 있음 — 정제 시 회귀 방지 장치 없음. (§2 근거)
5. **로그가 iteration 내부 관찰 불가**: raw.jsonl은 런당 1 Δ만. 에이전트 내부 시행착오·정체가 안 잡혀 stagnation 판정의 입력이 빈약. (§1 근거)

### UX 마찰 (인간 게이트가 필요했던 지점)
- **재점화가 전부 수동**: 10런을 사람이 손으로 재실행. 자율 다-iteration이 아니라 인간 오케스트레이션 마이크로 루프. (관찰)
- **스크린샷 비평이 인간 게이트**: taste 실패는 자동 verify가 처음엔 못 잡고 **인간 스크린샷 리뷰**로 발견 → 테스트로 환원(HANDOFF Lesson #4). taste 목표에서 인간 게이트가 불가피했던 실전 데이터.
- **stale 서버 재사용 함정**: HANDOFF Lesson #3 — playwright가 port 4273 `--strictPort` `reuseExistingServer:false`로 바뀌기 전, 스크린샷 verify가 낡은 서버를 찍는 마찰 존재.

### 경제성 (n=1, loop-economics 보탬용)
- **시간**: 전체 벽시계 06:53–08:27 ≈ **94분**. 생산 iteration 편집 소요 1m41s–4m39s(중앙값 ~2.5m). 마지막(score 게이트 도입) 런이 최장 4m39s.
- **토큰/비용/모델**: **로그에 없음**(timestamp만 기록). n=1 경제성은 시간 대용치만 산출 가능 — 이는 로그 스키마 한계(SPEC-GAP 후보: 런당 토큰/모델 계측 필드 부재).
- **낭비 구간**: 런1·2가 pre-check green 무동작(2/10=20%). 단, **진짜 낭비는 아님** — 래칫 사이클의 "강화 전 확인" 회전. 실질 무효 iteration 0(모든 편집이 그 런의 verify를 통과시킴, 되돌린 편집 없음).
- **수렴 효율**: 8/8 생산 런이 **1 iteration에 green** — 진단이 정밀할 때 단발 수렴. max-iter 6 대비 예산의 ~1/6만 소모.

### 정제 후보 (§7.5 형태, 이 세션에서 스펙/스킬로 승격할 패턴)
1. **anti-goodhart-ratchet**: taste/주관 목표는 label-pass로 Goodhart됨 → 인간 비평을 즉시 immutable 어서션으로 환원하고 "구조 미변경 시 verify-design 실패" 메타 게이트를 추가하라.
2. **canonical-playbook-merge**: 새 insight 기록 전 `match`/의미로 기존 항목 대조, 신규 id 남발 금지 — episodes를 canonical에 누적해 승격 신호 보존.
3. **precheck-first-early-exit**: 편집 전 verify 선실행, green이면 무편집 종료(런1·2·전 gene 스텝1에서 일관 관찰).
4. **shared-layer-first**: 다-화면/palette 실패는 개별 컴포넌트가 아니라 공유/전역 계층에서 고쳐진다(관찰된 모든 fix가 거기 착지 — v5의 귀납).
5. **numeric-severity-toward-zero**: verify가 수치 score를 내면 음수를 고심각으로 보고 0/양수 수렴을 확인(런10 -4→0).

---

## 스펙/스킬에 반영할 구체 제안 (3개)

1. **verify 래칫을 1급 개념으로 스펙에 도입** — "런 내 불변 + 런 간 인간승인 강화(anti-Goodhart)"를 명문화하고, 기준 강화 이력을 state에 구조화(누가·왜·어느 비평에서). 주관/taste 목표 루프의 필수 절차로.
2. **정제 파이프라인에 canonical dedup 게이트 추가** — playbook 기록 시 `match`+의미 유사도로 기존 항목 병합, episodes 누적. §7.5에 "중복 억제·병합" 규칙 신설. (24→~5 파편화가 실증)
3. **HANDOFF를 스펙 산출물로 승격 + 로그 계측 강화** — 크로스-세션 연속성 요약을 표준 아티팩트화하고, raw.jsonl에 토큰/모델/iteration-내부 Δ 필드를 추가해 경제성·stagnation 판정 입력을 확보.
