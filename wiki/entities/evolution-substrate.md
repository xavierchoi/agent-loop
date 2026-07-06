# evolution-substrate (진화 기질)

## 정의

자가진화 에이전트가 **무엇을** 갱신하며 개선되는가의 축. 크게 두 진영:

| 기질 | 갱신 대상 | 대표 |
|---|---|---|
| **가중치 공간(weight-space)** | 모델 파라미터 (온라인 RL) | AReaL 2.0 |
| **컨텍스트 공간(context-space)** | 프롬프트·코드·플레이북·문서 | [[autoresearch]], [[darwin-goedel-machine]], [[ai-scientist]], [[meta-harness]], LOOP.md, ACE, Dynamic Cheatsheet |

## 핵심 사실

AReaL 2.0 (arXiv 2607.01120)이 지적하는 세 가지 결핍은 가중치 공간 진화의 인프라 요구사항:

1. 이기종 에이전트 패러다임에 step-level RL 신호를 전달할 **궤적 데이터 프로토콜**
2. 실제 워크로드를 학습 기질로 바꾸는 **데이터 프록시**
3. 정책 업데이트 시점을 자동 결정하는 **진화 제어 평면(evolution control plane)**

## 스펙과의 관계

LOOP.md는 의도적으로 **컨텍스트 공간 진화**를 선택했다 — 파일시스템 기반, 모델 불가지론(model-agnostic), 재학습 불필요. 그러나 AReaL 2.0의 세 결핍은 컨텍스트 공간에도 대응물이 있고, LOOP.md가 이미 부분적으로 답한다:

| AReaL 2.0 결핍 (가중치 공간) | LOOP.md 대응물 (컨텍스트 공간) |
|---|---|
| 궤적 데이터 프로토콜 | 로그 항목 스키마 (§4.2.8) — iteration·gene·action·verify·delta |
| 데이터 프록시 | 증류 파이프라인 (§7.5) — 로그 → 플레이북 |
| 진화 제어 평면 | Evolution 확장 (§7) — 게이트·래칫·홀드아웃 |

**시사점:** 두 진영은 경쟁이 아니라 층위가 다르다. 가중치 진화가 표준화되어도, "무엇을 목표로 언제까지 반복하고 무엇으로 판정하는가"의 선언(LOOP.md의 역할)은 여전히 필요하다. 오히려 `refresh: on-model-change`(§7.2)처럼 기반 모델이 계속 변하는 세계일수록 컨텍스트 계층의 재검증 규칙이 중요해진다.

**미해결 질문:** AReaL 2.0식 온라인 RL 루프와 LOOP.md 루프가 한 시스템에 공존할 때, 로그 스키마(§4.2.8)가 RL 궤적 프로토콜과 호환되도록 확장해야 하는가? → 스펙 v0.2 검토 후보.

## 출처

- [sources/2026-areal2-self-evolving-agents.md](../sources/2026-areal2-self-evolving-agents.md)
- [sources/2026-karpathy-autoresearch-repo.md](../sources/2026-karpathy-autoresearch-repo.md)

## 상호참조

[[autoresearch]] · [[loopy-era]]
