# looprun — Agent Loops (LOOP.md) 레퍼런스 러너 킷

> **사람에게 가장 쉬운 시작:** YAML을 직접 쓰지 마라. `../skills/loop-authoring/`(Agent Skills 규격)을 에이전트에 설치하고 *"~하는 루프 만들어줘"* 라고 말하면, 에이전트가 목표 협상 → LOOP.md 작성 → 실행까지 대신한다.

Agent Loops 명세 v0.4(`../spec/SPECIFICATION.md`)의 Level 1 레퍼런스 러너 + Evolution(정제) 실험 스크립트 + 데모 세트. **단일 파일, 외부 의존성 0** — Node.js만 있으면 어디서나 돈다.

## 요구 사항 (서버/새 환경)

| 필요 | 확인 명령 | 비고 |
|---|---|---|
| Node.js ≥ 20 | `node --version` | 러너 자체의 유일한 요구 |
| 구현 주체 CLI 1개 이상 | `claude --version` 또는 `codex --version` | 인증 완료 상태여야 함 (`claude login` / `codex login`) |
| git (권장) | `git --version` | 데모 baseline 복원용 |

## 빠른 시작 (데모: 깨진 테스트 자동 수리)

```bash
cd runtime

# Claude Code를 구현 주체로 (기본값)
node looprun/looprun.mjs loops/fix-regressions --target example-target

# Codex를 구현 주체로 (크로스-에이전트 시험 — 같은 LOOP.md, 다른 에이전트)
node looprun/looprun.mjs loops/fix-regressions --target example-target \
  --implementer "codex exec --full-auto --skip-git-repo-check -"
```

`example-target`은 의도적 버그 2개(mean, median)가 심어진 상태로 배포된다. 루프가 iteration마다: 신선한 컨텍스트의 구현 주체 투입 → 독립 검증(`npm test`) → append-only 로그 기록. 판정 자산(`test/`)은 매 검증 전 스냅샷에서 원복되므로 **테스트를 조작해도 통과를 위조할 수 없다** — 직접 시도해보라(러너가 `⚠판정자산 변조 감지`를 찍는다).

데모를 다시 돌리려면 baseline 복원: `git checkout -- runtime/example-target` (저장소 루트에서).

## 구현 주체(implementer) 계약

`--implementer`는 **stdin으로 iteration 입력(명세 §5.3)을 받고 target 작업트리를 수정하는 아무 명령**이다. 이것이 이 표준의 크로스-에이전트 지점이다:

```bash
--implementer "claude -p --model sonnet --allowedTools Read,Edit,Write,Glob,Grep --permission-mode acceptEdits"   # 기본
--implementer "codex exec --full-auto --skip-git-repo-check -"
```

구현 주체의 출력 마지막에 `ACTION: <한 일 요약>`(선택: `DELTA: <방향 전환>`)을 기대하지만, 없어도 판정에는 영향 없다 — **판정은 오직 verify가 한다**.

## Evolution 실험 (Level 2의 최소 슬라이스)

```bash
node looprun/evolve.mjs loops/fix-regressions        # 로그 → 정제 → playbook/generic + gene v(N+1)
```

정제 에이전트는 도구 0개로 격리되어 **로그만** 읽는다. 승격(휴리스틱→규칙)의 episodes는 에이전트 자기보고가 아니라 러너가 로그에서 재계산한다. 실험 기록: `evolution-experiment.md`.

## 새 루프 만들기

1. `loops/<이름>/LOOP.md` 생성 — 필수 5필드(`name`·`description`·`goal`·`stop`·`verify`)는 명세 §1.3의 30초 예시 참조. `name` = 디렉터리명.
2. Level 1 러너는 다음을 **거부**한다(침묵 우회 없음): 판정 자산 미선언(`verify.assets` 필요), `agent` 검증기(판정 프로토콜은 명세 v0.4 §4.2.5 — 이 러너는 미구현), `max-cost-usd`(비용 계측 미구현).
3. 실행: `node looprun/looprun.mjs loops/<이름> --target <작업트리>`

## Level 0 (러너 없이)

LOOP.md는 러너 없이도 유효한 문서다 — 아무 에이전트 세션에 파일을 주고 "이 LOOP.md를 따르라"고 하면 된다. 단 이 경우 정지·검증 분리·로그의 **강제**는 없다(명세 §6). 강제가 필요한 순간이 러너를 쓰는 순간이다.

## 계측 범위 고지 (명세 §4.2.6/§6 문서화 의무)

이 러너는 duration 계열(run·iteration 벽시계)만 계측·강제한다. 비용(cost)은 계측하지 않으며, cost 예산을 선언한 루프는 실행을 거부한다. 환경변수는 러너 프로세스의 것을 그대로 상속하고 추가 주입은 없다(§5.6).
