---
name: loop-authoring
description: >
  Create and run Agent Loops (LOOP.md) — declare a goal, stop conditions, and
  independent verification, then let an agent iterate until verification passes.
  Use when the user wants something done "until it passes / 될 때까지", wants to
  automate a recurring fix-and-verify task, asks to create, author, or run a
  LOOP.md / agent loop, or says 루프 만들어줘, 반복 작업 자동화, 될 때까지 고쳐줘.
license: Apache-2.0
compatibility: 파일 도구(read/write)와 셸 실행이 가능한 코딩 에이전트. Level 1 실행은 Node.js ≥ 20 필요
---

# Agent Loop 저작·실행 가이드

**Agent Loop = "목표를, 독립 검증이 통과할 때까지, 선언된 한도 안에서 반복 시도하라"는 선언 파일(LOOP.md).**
당신(에이전트)이 지켜야 할 단 하나의 핵심 원칙: **판정은 오직 verify가 한다. 구현한 자의 "다 됐다"는 무효다 — 당신 자신의 것도.**

사용자는 YAML을 몰라도 된다. 당신이 인터뷰하고, 당신이 작성하고, 당신이 실행을 준비한다.

## 1단계 — 목표 협상 (질문은 한 번에, 쉬운 말로)

사용자에게 아래 4가지를 **한 번에** 물어라. 각 질문에 합리적 기본값을 제안하라:

1. **무엇이 달성되면 끝인가요?** (검증 가능한 문장으로 유도. 나쁜 예: "백업이 잘 되게" / 좋은 예: "백업 복원 테스트 스크립트가 성공 종료")
2. **성공을 무엇으로 판정하나요?** — 실행 가능한 명령 하나 (예: `npm test`, `./scripts/verify-backup.sh`). 종료 코드 0 = 성공. 그런 명령이 없다면 함께 만들어라 — 이것이 루프 설계의 진짜 작업이다.
3. **그 판정 도구(테스트·스크립트·기댓값)는 어디에 있나요?** — 이 경로들이 "판정 자산"이 된다. 루프가 절대 수정하면 안 되는 것들.
4. **언제 포기할까요?** — 최대 반복 횟수(기본 15)와 시간(선택). 무인 실행 예정이면 iteration당 시간 상한도(기본 5m).

## 2단계 — LOOP.md 작성

1. `loops/<이름>/` 디렉터리 생성 — **이름은 소문자-하이픈, 디렉터리명 = name 필드** (필수 규칙).
2. [assets/LOOP.template.md](assets/LOOP.template.md)를 복사해 인터뷰 답으로 채워라.
3. 고급 필드(stagnation, green-runs, progress-paths 등)는 **사용자에게 묻지 말고 당신이 판단해 채워라**. 기본값과 필드 정의는 [references/fields.md](references/fields.md) 참조.
4. 본문(운영 지침)에는 도메인 팁을 2~4줄로 — 당신이 이 작업을 직접 한다면 알고 싶을 것들.

작성 후 자가 검사: name=디렉터리명? stop에 상한(max-iterations 또는 max-duration) 있음? verify.assets 선언됨? goal이 verify로 판정 가능한 문장?

## 3단계 — 검증기 예행

verify 명령을 **직접 1회 실행**해 확인하라: 명령이 실제로 돌고, 현재 상태에서 예상대로 실패(또는 통과)하는가. 검증기가 안 도는 루프는 배포하지 마라.

## 4단계 — 실행

**러너가 있으면 (Level 1 — 강제 있음, 권장):** 저장소의 `runtime/looprun/looprun.mjs`를 찾아 실행하라. 구현 주체 어댑터는 설치된 CLI에 맞춰:

```bash
node <repo>/runtime/looprun/looprun.mjs loops/<이름> --target <작업트리>            # Claude Code 기본
node <repo>/runtime/looprun/looprun.mjs loops/<이름> --target <작업트리> \
  --implementer "codex exec --full-auto --skip-git-repo-check -"                    # Codex
```

**러너가 없으면 (Level 0 — 강제 없음, 당신이 규율을 대신):** 세션 안에서 직접 루프를 돌리되 다음을 지켜라 — ① iteration마다 한 단위 작업만, ② 판정은 반드시 verify 명령을 실행해서(당신의 판단으로 통과 선언 금지), ③ 판정 자산 수정 금지, ④ stop 상한을 스스로 세고 도달하면 멈춰 상태를 보고, ⑤ 매 iteration의 시도·판정 결과를 파일(`state/logs/manual.md`)에 append. 사용자에게 "Level 0 실행이라 강제 장치는 없다"고 명시하라.

## 5단계 — 보고

종료 시 사람 언어로: 상태(완료/정체/상한 도달), 몇 회 만에, 무엇을 바꿔서, 로그 위치. JSONL을 들이밀지 마라.

## 금지 사항 (스펙의 불변 규칙)

- `goal`과 `verify`는 루프 생성 후 자동 수정 금지 — 바꾸려면 인간의 명시적 지시 필요.
- 판정 자산을 고쳐서 통과시키는 것은 언제나 반칙이다. 통과의 유일한 경로는 대상을 올바르게 고치는 것.
- 무인(스케줄) 실행을 설정할 때는 반드시 budget이 선언된 루프만.
- 전체 규격이 필요하면 저장소의 `spec/SPECIFICATION.md`(Agent Loops v0.4)를 읽어라.
