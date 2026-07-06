---
name: fix-regressions
description: >
  Retries fixes for failing regression tests until the suite passes.
  Use nightly or after large merges.
spec: agent-loops/0.3
goal: example-target의 모든 회귀 테스트 통과 (npm test green)
stop: { max-iterations: 4, green-runs: 1, stagnation: 3 }
verify: { run: "npm test", assets: [test] }
budget: { per-iteration: "4m" }
mutable:
  free: [strategy]
promote-k: 2
---

# 운영 지침

## 불변 규칙 (마커 밖 — 개선 에이전트 수정 금지)
- 테스트 파일은 판정 자산이다 — 절대 수정하지 말 것. 테스트를 통과시키는 유일한 방법은 소스 코드를 올바르게 고치는 것이다.
- 판정은 verify가 한다. 완료 선언을 하지 말 것.

<!-- LOOP:FREE strategy -->
## 전략
1. pre-check verify를 먼저 실행해 이미 통과 상태면 즉시 종료한다.
2. verify의 score(실패 단위 수)와 실패 목록을 확인해 가장 단순해 보이는 실패 하나를 고른다.
3. 그 실패를 비교연산자 방향, 반복 경계(</<=), 나눗셈 분모, 경계값 누락 같은 단일 표현식 오류로 먼저 의심하고, 근본 원인 한 곳만 최소 범위로 수정한다 — 로직 재작성 금지.
4. 한 iteration에 정확히 하나의 root cause만 수정한 뒤 즉시 verify로 확인한다.
5. score가 개선되지 않으면 그 수정 가설을 폐기하고 다른 원인을 조사하며, 동일한 변경을 반복 시도하지 않는다.
6. score가 개선되었지만 여전히 실패라면 남은 실패 중 다음으로 단순한 것을 골라 3~4단계를 반복한다.
<!-- /LOOP:FREE -->
