# LOOP.md 작동 모델 — 배포·구성·실행의 명료한 스토리

> Agent Skills의 "폴더 + SKILL.md + progressive disclosure + 모델 주도 트리거" 스토리에 대응하는, LOOP.md의 등가 스토리.
> 근거: 1·2차 리서치 (`research/agent-skills-and-loop-md.md`, `research/loop-md-round2-deep-dive.md`)

---

## 0. 한 문장 정의

**루프는 "LOOP.md 파일을 담은 디렉터리"이며, 그 디렉터리는 프로그램(유전자)인 동시에 실행 상태(로그·플레이북)가 자라나는 그릇이다.**

SKILL.md와의 근본 차이는 하나다: **스킬은 무상태(읽고 버림), 루프는 유상태(실행할수록 폴더가 자란다).** 이 차이에서 배포·버저닝·격리의 모든 설계가 파생된다.

## 1. 한눈 비교 — 작동 스토리

| | **Agent Skills** | **Agent Loops (LOOP.md)** |
|---|---|---|
| 디스크 규격 | SKILL.md를 담은 폴더 | LOOP.md를 담은 폴더 |
| 파일 구조 | frontmatter(name, description) + 자유 본문 + scripts/ | frontmatter(name, description, goal, stop, verify …) + 자유 본문 + playbook/ + state/ |
| 발견 | 시작 시 name+description(~100토큰)만 시스템 프롬프트에 주입 | 동일 — 루프 카탈로그로 name+description+goal만 주입 |
| 트리거 | **모델 주도**: 요청이 description과 매칭되면 모델이 스스로 본문을 읽음 | **명시적 기동**: 사용자 호출("돌려줘") / 스케줄(cron) / 상위 에이전트의 잡 위임. 모델이 대화 중 임의로 루프를 기동하지 않음 |
| 실행 주체 | 모델이 지침을 읽고 그대로 수행 | **런타임이 루프 제어를 소유**(반복·정지·게이트), 모델은 각 iteration 안에서 수행 |
| 상태 | 없음 (매번 동일) | 폴더 안에 축적 (append-only 로그, 플레이북, 유전자 이력) |
| 종료 | 태스크 끝나면 끝 | stop 조건(반복 상한·완료 신호·정체 감지) 충족 시 |
| 자기개선 | 없음 (사람이 SKILL.md를 고침) | **내장** (진화 루프가 LOOP.md의 변이 허용 구역을 다시 씀) |
| 배포물 | 폴더 전체 | **유전자만** (LOOP.md + generic playbook + scripts) — 상태는 배포되지 않음 |

## 2. 디스크 위 규격 (폴더 스펙)

```
nightly-regression-fixer/          # 루프 = 폴더 (name = 디렉터리명, SKILL.md 규칙 계승)
├── LOOP.md                        # ★ 유전자 그 자체. frontmatter + 운영 지침
├── scripts/                       # 승격된 "공식" = 결정론 실행물 (SKILL.md scripts/와 동형)
│   └── triage-failures.py
├── playbook/
│   ├── generic/                   # 증류된 범용 전략 — 배포 가능
│   └── local/                     # 이 인스턴스/고객 전용 — 배포 금지 (격리 경계)
└── state/                         # ★ 인스턴스 상태 — 절대 배포되지 않음
    ├── logs/raw.jsonl             # append-only 원시 로그 (모든 iteration 기록)
    ├── genes/                     # LOOP.md 과거 버전 스냅샷 (v0, v1, …) — git 사용 시 생략 가능
    └── holdout/                   # 홀드아웃 평가 자산 — 개선 에이전트 접근 차단 구역
```

**핵심 설계 결정 3가지:**

1. **유전자 = LOOP.md 그 자체.** 별도 설정 파일이 아니라, 진화 루프가 LOOP.md의 "변이 허용 구역"을 다시 쓰고 커밋한다. 버저닝은 git 히스토리가 공짜로 제공 (v0→v1→v2 = 커밋 계보). *선례: AlphaEvolve의 `# EVOLVE-BLOCK-START/END` — 변이 가능한 코드 블록을 마커로 선언. LOOP.md는 이를 frontmatter의 `mutable:` 필드로 일반화.*
2. **유전자/상태 분리 = 클래스/인스턴스 분리.** 배포되는 것은 유전자(템플릿), 실행하면 인스턴스가 자기 state/를 만든다. 같은 루프를 고객 A·B·C에 설치하면 유전자는 공유하되 state와 playbook/local은 각자 격리.
3. **홀드아웃은 디렉터리 = 접근 제어 단위.** "개선 에이전트는 홀드아웃 읽기 금지"를 프롬프트 지시가 아니라 **파일시스템 권한/샌드박스로 강제**한다. *선례: DGM이 평가 함수를 에이전트로부터 은닉("은닉하지 않으면 objective hacking이 더 잦다" 실증).*

## 3. LOOP.md 파일 자체 (frontmatter + 본문)

```yaml
---
# ── 필수 3 + 식별 2 (SKILL.md 미니멀리즘 계승) ──
name: nightly-regression-fixer          # 디렉터리명과 일치, 소문자-하이픈
description: >                          # 무엇을 반복 달성하는지 + 언제 쓰는지 (카탈로그 매칭용)
  Fixes failing regression tests until the suite is green. Use nightly or after big merges.
goal: "All regression tests pass on main"        # 불변 코어 (진화 루프도 못 건드림)
stop: { max-iterations: 20, completion: "suite green 2 consecutive runs", stagnation: 3 }
verify: { by: command, run: "npm test", self-report: forbidden }

# ── 안전 필드 (선언 시 런타임이 강제) ──
holdout: { path: state/holdout/, improver-access: none, refresh: on-model-change }
mutable:                                # 변이 권한 동심원의 선언
  free:    [prompts, strategy, tools]   # 자유 변이
  ratchet: [pass-threshold]             # 자동·단방향 강화만
  gated:   [stop, verify, structure]    # 변경 시 인간 게이트
budget: { max-cost-usd: 50, max-hours: 8 }
log: { path: state/logs/raw.jsonl, mode: append-only }
skills: [pdf-report, git-bisect-helper] # 이 루프가 소비하는 Agent Skills
---

# 운영 지침 (자유 마크다운 — 진화 루프의 주요 변이 표면)

## 반복당 절차
1. state/logs/에서 직전 Δ 확인 → playbook/generic/과 playbook/local/에서 매칭 전략 검색
2. 전제조건 충족 시 scripts/의 공식을 결정론 실행, 아니면 LLM으로 구현
3. 산출물을 verify에 넘긴다. 구현 주체는 달성 여부를 선언하지 않는다.

## 미달성 시
- 이유 분석 → 방향 설정 → Δ와 함께 로그 기록 후 다음 iteration
...
```

## 4. 라이프사이클 — 6단계

```
[발견] → [기동] → [반복 실행] → [독립 검증] → (게이트) → [진화]
```

1. **발견 (Discovery):** 런타임이 설치된 루프들의 frontmatter만 스캔해 카탈로그 구성(~100토큰/루프). 에이전트는 "어떤 루프가 있는지" 알지만 본문은 로드하지 않음. — *progressive disclosure Level 1 그대로.*
2. **기동 (Activation):** 명시적 트리거만. ① 사용자 호출, ② 스케줄러(cron), ③ 상위 에이전트가 백그라운드 잡으로 위임. 기동 시 런타임이 LOOP.md 본문 로드(Level 2), 인스턴스 state/ 초기화(또는 기존 상태에 이어붙기).
3. **반복 실행 (Iteration):** **루프 제어는 런타임 소유** — Ralph의 `while :; do cat PROMPT.md | agent; done`을 스펙 주도로 대체한 것. 매 iteration: 로그의 직전 Δ 로드 → 플레이북 조회 → 라우터가 [공식 결정론 실행 | LLM 구현] 선택 → 산출물 생성. 모델의 컨텍스트는 iteration마다 신선하게 시작(파일시스템이 기억을 담당 — Ralph 관행 계승).
4. **독립 검증 (Verification):** 런타임이 verify 선언을 실행(command / critic-agent / evaluator-fn). 구현 세션의 "다 됐어요"는 무효(`self-report: forbidden`). 결과는 로그에 append. — *선례: Voyager의 별도 critic, AlphaEvolve의 평가 함수, SICA의 overseer — 조사한 5개 자기개선 시스템 전부 이 분리를 채택.*
5. **게이트 (Gates):** stop 조건 충족 → 산출물 + "왜 성공/실패" 데이터와 함께 종료. 도중에 `gated:` 항목 변경이 필요해지면 런타임이 **일시정지 후 인간 승인 요청**. `ratchet:` 항목은 좋은 쪽으로만 자동 갱신. — *선례: Notion ESLint 래칫(강화=pre-commit 자동, 완화=승인+CI 차단).*
6. **진화 (Evolution):** 별도 주기(N회 실행마다 / 새 모델 출시 시). 개선 에이전트가 로그를 증류 → 플레이북 갱신(휴리스틱→규칙→공식 승격, 공식은 scripts/로 컴파일) → LOOP.md의 `free:` 구역 수정 → **홀드아웃으로 신구 유전자 비교(동일 잣대)** → 통과 시 커밋(v(N+1)). 개선 에이전트는 state/holdout/ 접근 불가.

## 5. 런타임 계약 — 파일이 선언하고, 호스트가 강제한다

| LOOP.md가 선언 | 호스트 런타임이 강제 |
|---|---|
| goal, stop 조건 | 반복 드라이버, 정지·정체 감지, 예산 킬스위치 |
| verify 방식 + self-report 금지 | 검증을 구현 세션과 분리 실행, 결과만 신뢰 |
| holdout 경로 + 접근 정책 | 파일시스템 ACL/샌드박스로 개선 에이전트 차단 |
| mutable 동심원 | 진화 diff를 검사해 gated 항목 변경 시 인간 승인 UI |
| log 경로 + append-only | 쓰기 전용 append 보장, 변조 방지 |
| skills 참조 | Agent Skills 규격으로 스킬 로드 |

이 표가 곧 "레퍼런스 런타임의 요구사항 명세"다. *(2차 리서치 결론: llms.txt가 죽은 이유는 파일을 읽는 소비자가 없어서 — 스펙과 런타임은 동시 출시가 필요조건.)*

## 6. 배포와 마켓플레이스

- **배포 단위 = 손질된 유전자:** `LOOP.md + playbook/generic/ + scripts/`. state/, playbook/local/, holdout 자산은 매니페스트(.loopignore)로 제외. → 마켓플레이스에서 루프를 받는다 = 검증된 유전자 템플릿을 받는 것. 설치 후 첫 실행부터 자기 인스턴스 상태를 축적.
- **마켓플레이스 메타데이터:** frontmatter가 그대로 카드가 된다 — name/description/goal은 표시용, `verify:`는 "이 루프가 스스로를 어떻게 채점하는지" 공개(신뢰 신호), 선택적 `metadata:`(license, compatibility 등은 SKILL.md 선택 필드 관례 계승).
- **성숙한 루프는 스킬을 낳는다:** 승격 사다리 꼭대기의 "공식"은 SKILL.md `scripts/`와 동형이므로, 루프가 배양한 결정론 실행물을 **스킬로 내보내기(export)** 할 수 있다. LOOP → SKILL 컴파일 경로. 두 마켓플레이스는 자연스럽게 연결된다.

## 7. 점진적 채택 경로 (degraded mode)

SKILL.md 성공 요인 중 하나는 "특별한 런타임 없이도 그냥 읽으면 동작"하는 점진성이다. LOOP.md도 3단계 호환 수준을 정의한다:

- **Level 0 — 아무 에이전트:** LOOP.md를 그냥 읽고 한 세션 안에서 수동으로 따라 함(Ralph처럼). 강제는 없지만 문서로서 유효. *채택 장벽 최소화.*
- **Level 1 — 루프 인식 런타임:** 반복 드라이버 + stop + append-only 로그 + 검증 분리 구현.
- **Level 2 — 완전 준수:** 홀드아웃 ACL, 게이트 UI, 진화 루프, 래칫 강제까지.

스펙 문서에 "준수 수준(conformance levels)"으로 명시하면, 기존 에이전트들이 Level 0부터 점진적으로 올라올 수 있다.

---

## 부록: 왜 이 형태인가 — 리서치 근거 역참조

| 설계 결정 | 근거 |
|---|---|
| 폴더+마크다운+최소 frontmatter | SKILL.md 채택 성공 요인 (1차 [High]) |
| frontmatter만 상시 로드 | progressive disclosure 3단계 (1차 [High]) |
| 공식의 결정론 실행 | SKILL.md scripts 철학 + DC 10%→99% (2차 [검증]) |
| append-only 로그 | ACE context collapse 18,282→122토큰 실증 (2차 [검증]) |
| 검증 분리·자기보고 금지 | 자기개선 5종 전원 채택 + DC 자기큐레이션 오염 실증 (2차 [검증]) |
| 홀드아웃 ACL 강제 | DGM 은닉 실험 + node 114 우회 사례 (2차 [검증]) |
| 래칫/게이트 비대칭 | Notion 프로덕션 래칫 (2차 [검증]) |
| 정체 감지 stop | self-improvement reversal 4–5회 포화 + Ouroboros stagnation (2차) |
| 예산 필드 | SICA 유틸리티(비용 0.25·시간 0.25) + DGM $22k 사례 (2차) |
| 변이 표면 선언 | AlphaEvolve EVOLVE-BLOCK (2차) |
| 런타임 동시 출시 | llms.txt 소비자 부재 사망 사례 (2차) |
