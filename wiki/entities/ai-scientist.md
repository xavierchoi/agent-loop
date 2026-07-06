# ai-scientist

## 정의

Sakana AI의 완전 자동화 연구 시스템. v2가 생성한 논문이 **인간 피어리뷰를 통과한 첫 완전 AI 생성 논문**이 되었고, 시스템 자체에 관한 논문이 Nature에 게재됨(2026-03).

## 핵심 사실

- 입력은 "광범위한 연구 방향"뿐 — 아이디어 생성→문헌 조사→병렬 에이전트 트리 탐색으로 실험 설계·실행→LaTeX 논문 작성까지 루프를 완전히 닫음
- **Automated Reviewer:** NeurIPS 심사 지침 기반, 독립 평가 5개 통합. 인간 대비 균형 정확도 69%로 인간 간 동의도 초과
- 스케일링 법칙: 더 나은 기초 모델 → 더 나은 논문 품질
- 한계: 미발달 아이디어, 방법론적 엄격성 부족, 환각(가짜 인용·중복 그림)
- 윤리 조치: 통과 논문 사전 철회, AI 생성 논문 워터마크

## 스펙과의 관계

- **`verify.agent`(§4.2.5)의 최고 수준 실증:** Automated Reviewer는 "구현과 분리된 컨텍스트의 비평가 에이전트" 그 자체. 특히 **독립 평가 N개 통합**(단일 비평가가 아닌 앙상블) 패턴은 스펙에 없음 → v0.2 검토 후보 (`verify.agent`의 다중 실행/합의 옵션)
- "인간 간 동의도 초과"는 에이전트 검증기가 인간 게이트를 부분 대체할 수 있다는 근거 — 단, 환각 한계는 **에이전트 검증기 단독 의존의 위험**도 동시에 보여줌 (`run`+`agent` 병용이 안전)
- 스케일링 법칙 → `refresh: on-model-change`(§7.2)의 정당화: 기반 모델이 바뀌면 루프의 실질 능력이 바뀌므로 재검증이 필요
- 병렬 에이전트 트리 탐색 → [[greedy-vs-archive]]의 아카이브 진영에 가까움
- [[loopy-era]] 논제의 최상급 증거 — 연구 루프의 완전한 닫힘이 이미 Nature 게재 수준

## 출처

- [sources/2026-sakana-ai-scientist-nature.md](../sources/2026-sakana-ai-scientist-nature.md)

## 상호참조

[[loopy-era]] · [[darwin-goedel-machine]] · [[greedy-vs-archive]] · [[orchestration-as-skill]]
