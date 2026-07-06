# meta-harness

## 정의

Stanford/MIT/KRAFTON의 하네스 자동 최적화 시스템(2026). 코딩 에이전트가 파일시스템에 축적된 전체 이력(코드·실행 추적·점수)을 읽고 하네스를 반복 개선 — **수동 설계 하네스를 능가한 첫 체계적 실증.**

## 핵심 사실

- 제안 에이전트가 grep/cat으로 이전 후보 전체를 선택적 진단 — 기억은 대화가 아니라 **파일시스템**
- 스칼라 점수가 아닌 **풍부한 실행 추적**(평가당 최대 1천만 토큰)이 개선의 원료. 기존 방법의 "memoryless, 스칼라만, 짧은 요약" 한계를 명시적 비판
- 진행 추적은 **Pareto 지배 관계** — 모든 이전 후보를 디렉터리로 보존
- 6회 연속 회귀에서 인과 가설 형성("cleanup 지시가 상태 삭제 유발") → 전략 전환 실증
- 발견된 하네스는 본 적 없는 모델 5개에 전이
- TerminalBench-2에서 수동 설계 Terminus-KIRA 초과 (76.4% vs 74.7%)

## 스펙과의 관계

- **§5.3의 정면 실증:** "구현 컨텍스트는 신선하게, 기억은 로그·플레이북(파일시스템)이 담당" — Meta-Harness의 제안 단계가 정확히 이 구조로 SOTA 달성
- **§4.2.7–8 로그 설계 지지:** "스칼라 점수만으로는 부족, 실행 추적이 필요"는 로그 항목에 `action`·`delta`(풍부한 기록)를 MUST로 둔 설계의 근거. 회귀 6회에서의 인과 추론은 append-only 이력이 있어야 가능했던 것
- **[[greedy-vs-archive]]의 archive 진영 증거 추가:** 모든 후보 디렉터리 보존 + Pareto 지배 — 스펙 `state/genes/` 스냅샷 구조와 동형
- **Pareto(다목적) 진행 추적은 스펙에 없음:** `verify.score`는 단일 스칼라 가정 → 다중 점수/Pareto 기반 stagnation 판정, v0.2 검토 후보
- **모델 전이 실증** → `playbook/generic/` 배포(§8.1)와 `refresh: on-model-change`(§7.2)의 근거 보강
- **[[orchestration-as-skill]]과 긴장:** 하네스 설계가 인간의 스킬이라는 Karpathy 논제 vs 하네스 자체를 루프가 최적화 → [[harness-automation-tension]]

## 출처

- [sources/2026-meta-harness.md](../sources/2026-meta-harness.md)

## 상호참조

[[orchestration-as-skill]] · [[harness-automation-tension]] · [[greedy-vs-archive]] · [[evolution-substrate]] · [[autoresearch]]
