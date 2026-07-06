# Evolution 확장(§7) 최소 슬라이스 — 구현 및 실험 보고

> 일자: 2026-07-06 · 대상 스펙: `spec/SPECIFICATION.md` v0.3.1 Draft, §7(Evolution)
> 러너: `runtime/looprun/looprun.mjs`(Level 1) + `runtime/looprun/evolve.mjs`(Level 2 부분)
> 대상 루프: `runtime/loops/fix-regressions` · 실험 대상: `runtime/example-target`
>
> **결론 요약:** "로그 → 정제 → 플레이북 → 유전자 → 다음 run" 파이프라인 4단계가 모두 실측으로 작동했다.
> 단, 이번 n=1 일화에서 **경제성 개선(iteration 감소)은 관측되지 않았다** — 이유는 §4.3에 정직히 기록. 이 실험은
> 경제성 곡선의 "증명"이 아니라 **메커니즘 작동 확인**이다.

---

## 1. 구현 요약

Level 1 러너(`looprun.mjs`)의 "자기보고 금지·판정 자산 격리" 원칙을 훼손하지 않기 위해, 진화 로직은 별도
프로세스 `evolve.mjs`로 분리했다. 러너 본체에는 §5.3 MAY 조항을 쓰는 **최소 연결 2곳**만 추가했다.

### 1.1 `evolve.mjs` (신설) — §7.1 파이프라인
1. **정제(refinement, §7.1):** 개선 에이전트를 `claude -p --model sonnet --allowedTools ""`(도구 0개)로 호출.
   구현 에이전트와 **분리된 프로세스 = 분리된 컨텍스트**(§7.1 MUST). 도구가 0개라 **파일시스템 접근이 원천 차단**되며,
   유일한 입력은 프롬프트에 인라인된 `state/logs/raw.jsonl` 전체다 — target 소스는 물론 어떤 파일도 못 읽는다(§7.1/§7.2 정신).
2. **승격(promotion, §7.5):** 개선 에이전트가 후보와 함께 준 `match` 정규식을 로그 `action`에 적용하되, **episodes는
   러너가 결정론적으로 재계산**한다(자기보고 금지 정신). match가 히트한 **distinct run-id 수 ≥ k**(루프 정의, 기본 2)이면
   `heuristic → rule` 승격. **공식(formula) 승격은 시도하지 않음** — 홀드아웃 인프라 부재로 §7.5의 "홀드아웃 통과 + 승격
   검토" MUST를 충족할 수 없으므로 범위 밖(임무 지시대로).
3. **유전자 진화(§7.3):** 개선 에이전트가 `<!-- LOOP:FREE strategy -->` 블록 **내부만** 재작성 제안. 채택 로직은
   FREE 마커 안쪽만 스플라이싱하고, **마커 밖 바이트 동일성을 사후 검증**해 free 구역 밖 변경을 거부한다(§7.3 MUST).
   추가로 verify·판정 자산 무력화 지시를 정규식으로 스캔해 거부(§7.3/§7.4). 채택 시 `state/genes/<v>.json`에
   `{version, parent, timestamp, loop-md-sha256}` 기록 + `state/genes/<v>.LOOP.md` 스냅샷 + `HEAD` 갱신(§7.1 MUST).

### 1.2 `looprun.mjs` (최소 수정 2곳)
- **gene 태깅:** `state/genes/HEAD`가 있으면 그 버전으로 로그 `gene` 필드를 태깅(§4.2.8), 없으면 기존 `v0-<hash>`.
- **플레이북 주입(§5.3 MAY):** `playbook/generic/*.json`을 로드해 rule 우선 정렬한 요약을 iteration 입력에 포함.
  Level 1 거부 원칙(자기보고 금지·판정 자산 격리·검증 분리)은 그대로 — 주입은 구현 주체에게 주는 참고 지식일 뿐 판정에 무관.

### 1.3 LOOP.md 변이 표면 선언 (§7.3)
`fix-regressions/LOOP.md`에 `mutable: { free: [strategy] }`와 `promote-k: 2`를 추가하고, 본문을 **불변 규칙(마커 밖)**과
**`<!-- LOOP:FREE strategy -->` 블록**으로 분리했다. `goal`·`verify`·`stop`은 마커 밖·비-free = 불변(§7.3 MUST).

---

## 2. 실험 프로토콜 (전부 실측)

같은 대상 `example-target`에 **동일 계열의 서로 다른 버그 3개**를 두 세트 준비했다(`experiment-fixtures/runA`, `runB`).
세 계열은 매 세트 동일: **① off-by-one 반복 경계(`i<end` vs `i<=end`) · ② 정렬 비교자 오류 · ③ 길이<2 경계 미처리**.
버그는 소스에만, 테스트는 정확. 각 run 전 `reset-target.sh`로 baseline 리셋 후 해당 세트를 주입(판정 자산=테스트가 세트마다
교체되므로 러너가 매 run 시작 시 `state/verify-assets/<run-id>/`에 새로 스냅샷 → 격리 유지).

| | Run A | 정제(evolve) | Run B |
|---|---|---|---|
| 버그 세트 | runA: `sumInclusive`/`sortDescending`/`secondSmallest` | (Run A 포함 전체 로그) | runB: `productInclusive`/`sortByAbs`/`secondLargest` |
| 유전자 | `v0-d6633436` | v0 → **v1** 채택 | `v1-0e1f4df4` |
| 플레이북 | 없음 | generic 4항목 생성 | rule 2 + heuristic 2 주입 |

---

## 3. 실험 수치 비교표

| 지표 | **Run A** (플레이북 X, gene v0) | **Run B** (플레이북 O, gene v1) | Δ |
|---|---|---|---|
| 종료 상태 | `completed` | `completed` | — |
| **iteration 수** | **3** | **3** | **0** |
| **벽시계 시간** | **134s** | **157s** | +23s (노이즈) |
| pre-check score | −3 | −3 | — |
| iteration별 score 궤적 | −3→−2→−1→0 | −3→−2→−1→0 | 동일 |
| 낭비/오답 iteration | 0 | 0 | — |
| stagnation 발생 | 없음 | 없음 | — |
| 판정 자산 변조 감지 | 없음 | 없음 | — |
| claude 호출 수 | 3 (iter 1–3) | 3 (iter 1–3) | — |

claude CLI 총 호출: Run A 3 + 정제 1 + Run B 3 = **7회** (예산 ~10회 이내). 정제 63s, Run 각 ~2.5분.

---

## 4. 메커니즘 작동 여부

### 4.1 4단계 모두 작동 ✅
1. **정제:** 개선 에이전트가 로그만 보고(도구 0개) 재사용 지식 후보 4개 산출. ✅
2. **승격:** `single-root-cause-per-iteration`, `off-by-one-boundary-bugs-first` → **rule**(episodes=3 ≥ k=2).
   `precheck-…`, `verify-score-delta-…` → **heuristic**(episodes=0). 즉 승격 게이트가 **과잉 승격을 결정론적으로 차단**했다. ✅
3. **유전자 v1:** FREE 블록만 재작성됐고 마커 밖 불변 검증 통과, `state/genes/v1.json`에 `{version:v1, parent:v0, timestamp, sha}`
   기록, `LOOP.md` 갱신. ✅ (거부 검사도 실동작: 무력화 지시·마커 밖 변경이면 거부하도록 구현, 이번엔 해당 없음.)
4. **러너 연결:** Run B 로그가 `gene:"v1-0e1f4df4"`로 태깅됐고, 플레이북 요약(rule 2 + heuristic 2)이 iteration 입력에 주입됨. ✅

### 4.2 정제가 실제로 "학습"한 것
gene v0 전략은 "실패 하나 골라 근본 원인 고침"의 2줄이었다. gene v1은 로그의 성공 패턴에서
**"단일 표현식 오류(비교자 방향, 반복 경계 `</<=`, 분모, 경계값 누락)를 먼저 의심하고 최소 범위만 수정"** 이라는,
실제로 이 버그 계열에 특화된 진단 순서를 6단계로 구체화했다. 이는 정제가 로그에서 **일반화 가능한 진단 지식**을
추출했음을 보여준다(휴리스틱 후보의 insight 문장도 인스턴스 고유값 없이 일반화됨).

### 4.3 그러나 경제성(iteration 감소)은 관측되지 않음 — 정직한 한계
**Run A = Run B = 3 iteration, 시간도 사실상 동일(노이즈 범위 내, B가 오히려 +23s).** 개선 없음. 이유:
- **바닥값이 3이다.** gene v1도 (불변 규칙과 관측된 성공 패턴을 따라) "iteration당 정확히 하나의 root cause"를 유지했다.
  독립 버그가 3개면 3 iteration이 이론적 하한이다. 유전자는 **묶음 처리(batching)가 아니라 진단 순서**로 진화했으므로
  개수를 줄일 수 없다.
- **Run A에 낭비가 없었다.** Run A는 오답·정체 0으로 이미 최적이었다. 플레이북이 제거할 낭비(헛수고 iteration)가
  존재하지 않았으므로 개선 여지(headroom) 자체가 없었다.

→ **경제성 곡선을 관측하려면** Run A가 오답을 내며 헤매는(정체·방향전환 다수) 난이도의 태스크가 필요하다. 이 토이
버그 계열은 sonnet에게 너무 쉬워 baseline이 이미 천장이었다. 이번 실험의 가치는 **파이프라인 배관이 스펙대로
작동함을 실증**한 것이지, "반복될수록 싸진다"(§7.6 가설)를 지지·반증한 것이 아니다. **n=1 일화이며 일반화 불가.**

---

## 5. §7.5 플레이북 항목 스키마 실전 사용성 평가

§7.5 최소 스키마 `{id, status, evidence, episodes, preconditions}`를 실제로 생성·소비해 본 평가:

| 필드 | 실전 사용성 | 비고 |
|---|---|---|
| `id` | 좋음 | kebab-case를 파일명으로 직결 → `playbook/generic/<id>.json`. 충돌·중복 관리 규칙은 스펙에 없음(경미). |
| `status` | 좋음 | heuristic/rule 3값 중 2값만 사용(formula 범위 밖). 러너의 rule 우선 정렬에 바로 쓰임. |
| `evidence` | **모호** | "진입 근거 로그 참조"의 **형식이 미규정**. 본 구현은 `[{run-id, iteration}]` 배열로 정함. 이식하려면 형식 표준 필요. |
| `episodes` | **모호(핵심)** | "유효 카운트 k"의 **카운트 단위**(run? iteration? 성공 검증?)가 스펙에 없음 → §6 SPEC-GAP ①. |
| `preconditions` | 좋음~보통 | 자연어 문장은 LLM 참고용으론 충분하나, 공식 승격 시 "라우터가 전제조건 충족 시 실행"(§7.5)하려면 **기계 판정 가능한 형식**이 별도로 필요. |

추가로 실전에서 **필요했지만 스키마에 없던 필드**: `insight`(지식 본문 — 스키마엔 없으나 이게 없으면 항목이 무의미),
`match`(episodes 재계산용 근거 패턴). 스키마가 "지식 내용"을 담는 필드를 규정하지 않는 것은 공백이다(§6 SPEC-GAP는 아니고
스키마 보강 제안). 배포 대상(`playbook/generic/`)의 이식성을 위해 **insight/본문 필드의 표준화**를 권한다.

---

## 6. SPEC-GAP 목록 (스펙 수정은 하지 않음 — 기록만)

**핵심 3개:**

1. **[§7.5] `episodes`의 조작적 정의 부재 + 자기보고 위험 (최우선).**
   "k회 에피소드에서 유효"에서 **에피소드의 단위**(distinct run? iteration? 검증 통과?)가 정의되지 않는다. 나아가
   개선 에이전트가 `episodes`를 **자기보고**하면 §1.2 원칙 2(자기보고 금지)의 정신과 충돌한다 — 승격은 능력 변화를
   낳으므로. 본 구현은 "match가 히트한 distinct run-id 수를 **러너가 결정론적으로 재계산**"으로 두 문제를 함께 해결했으나,
   **스펙이 (a) 단위 정의와 (b) '카운트는 런타임이 로그에서 재계산, 개선 에이전트 자기보고 금지'를 MUST로 명문화**해야
   이식 가능·안전한 승격이 된다.

2. **[§7.3] FREE 마커 이름과 `mutable.free` 목록의 대응 규칙 부재.**
   §7.3은 "본문 대상은 **마커 이름**으로 지정"이라 하지만, 부록 B 예시는 **무명** `<!-- LOOP:FREE -->` 마커에
   `free: [prompts, strategy, tools]`(3개 이름)를 선언한다 — 마커가 여럿일 때 어느 free 항목이 어느 마커에 대응하는지,
   무명 마커가 허용되는지가 모순·미정의. 본 구현은 `<!-- LOOP:FREE strategy -->` **명명 마커**로 대응을 명시해 해결했다.
   스펙은 **명명 마커 문법(`LOOP:FREE <name>`)을 규범화**하고 부록 B 예시를 이에 맞춰 정정할 것을 권한다.

3. **[§7.5/frontmatter] 승격 임계 `k`의 선언 위치 미규정.**
   §7.5는 "k는 루프 정의"라고만 하고 **어느 frontmatter 필드**에 두는지 규정이 없다. 본 구현은 임시로 top-level
   `promote-k`를 도입. 표준 필드(예: `mutable.promote-k` 또는 `evolution: { k: 2 }`)의 지정이 필요.

**부가(경미):**

4. **[§7.1/§7.2] 개선 에이전트의 입력 격리가 target 소스에 대해선 약한 SHOULD.**
   §7.2는 **홀드아웃** 접근을 기술적 차단(MUST)하지만, 일반 target 소스에 대한 개선 에이전트의 접근 차단은 §7.1이
   "로그에서 지식 추출"이라 서술할 뿐 명시적 MUST가 없다. 임무는 "로그 외 파일 금지"를 요구했고 구현은
   `--allowedTools ""`로 강제했다. 정제 입력을 **로그로 한정하는 것을 §7.2처럼 MUST로 승격**하면 정제-주입(§9.2) 표면이 준다.

5. **[§4.2.5 재확인] 판정 자산 선언 필드 부재(F4, 기존 백로그).** verify가 참조하는 판정 자산을 선언하는 표준 필드가
   없어 러너가 `verify[].assets` 확장 필드를 씀. Evolution 실험에서도 그대로 의존 → v0.4 필드 표준화 필요.

---

## 7. 산출물 경로

- 러너 최소 연결: `runtime/looprun/looprun.mjs` (gene 태깅 + 플레이북 주입)
- 진화 스크립트: `runtime/looprun/evolve.mjs`
- 변이 표면 선언: `runtime/loops/fix-regressions/LOOP.md` (`mutable.free`, FREE 마커)
- 생성된 플레이북: `runtime/loops/fix-regressions/playbook/generic/*.json` (rule 2 + heuristic 2)
- 유전자 이력: `runtime/loops/fix-regressions/state/genes/{HEAD, v1.json, v1.LOOP.md}`
- 실험 픽스처/리셋: `runtime/experiment-fixtures/{runA,runB}/`, `runtime/reset-target.sh`
- 전체 실행 로그: `runtime/loops/fix-regressions/state/logs/raw.jsonl` (run-id `…05-47-…`=A, `…05-52-…`=B)
