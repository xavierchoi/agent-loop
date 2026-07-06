# LOOP.md 필드 참조 (Agent Loops v0.4 요약)

정본은 저장소의 `spec/SPECIFICATION.md`. 여기는 저작 시 필요한 요약만.

## 필수 5필드

| 필드 | 규칙 |
|---|---|
| `name` | ≤64자, 소문자·숫자·하이픈, 디렉터리명과 일치 |
| `description` | ≤1024자, "무엇을 반복 달성 + 언제 쓰는지" |
| `goal` | 검증 가능한 한 문장. 생성 후 어떤 자동 프로세스도 수정 불가 |
| `stop` | `max-iterations` 또는 `max-duration` 중 최소 1개 필수. 단축: `stop: 15` |
| `verify` | `run`(명령) 또는 `agent`(비평가 지시문) 최소 1개. 단축: `verify: "npm test"` |

## 자주 쓰는 선택 필드

| 필드 | 언제 채우나 |
|---|---|
| `verify.assets` | **Level 1 러너로 돌릴 거면 사실상 필수** — 판정 자산(테스트·채점 스크립트) 경로. 러너가 매 검증 전 원복해 조작을 무효화 |
| `verify.score` | 진행도를 숫자로 잴 수 있으면: `{ command: "...", direction: higher-better\|lower-better }` — 정체 감지가 정확해짐 |
| `stop.green-runs` | 불안정한(flaky) 검증이면 2로 — 연속 2회 통과해야 완료 |
| `stop.stagnation` | 기본 3 권장 — 무진전 반복 시 조기 종료 |
| `stop.progress-paths` | 진행도 해시 대상을 좁힐 때. 판정 자산 경로와 겹치지 않게 |
| `budget.per-iteration` | 무인 실행이면 필수급 — iteration당 시간 상한 + 점수 비교 공정성 |
| `budget.max-duration` | run 전체 벽시계 상한 (run 시작 기준) |
| `spec` | `agent-loops/0.4` — 이 파일이 어떤 규격의 방언인지 선언 |
| `skills` | 루프가 소비할 Agent Skills 이름 목록 |

## 러너(Level 1)가 거부하는 것 — 저작 시 피할 것

- 판정 자산 미선언 (`verify.assets` 없음) → 격리 불가로 거부
- `verify.agent` (비평가 에이전트) → 레퍼런스 러너 미지원 (스펙 v0.4에 프로토콜은 정의됨)
- `budget.max-cost-usd` / `per-iteration.cost-usd` → 비용 계측 미구현으로 거부

## 종료 상태 6종 (보고 시 사용)

`completed`(검증 통과) · `stalled`(정체) · `max-iterations` · `max-duration` · `budget-exceeded` · `aborted`(인간 중단)

## Evolution(§7)은 저작 단계에서 켜지 마라

플레이북·유전자 진화(`mutable`, `holdout`)는 루프가 여러 번 돌아 로그가 쌓인 뒤의 이야기다. 첫 저작에서는 Core 필드만. 켜고 싶어지면 스펙 §7과 `runtime/looprun/evolve.mjs`를 참조.
