# single-metric-verification (단일 지표 검증)

## 정의

루프의 판정을 **하나의 스칼라 지표**로 환원하는 패턴. [[autoresearch]]의 `val_bpb`가 대표 사례.

## 핵심 사실

- `val_bpb` (validation bits per byte): 낮을수록 우수, vocab-size 독립적 → 아키텍처 변경 간 공정 비교 가능
- keep/discard 판정이 완전 자동 — 에이전트의 자체 평가가 개입할 여지 없음
- 지표 선택 자체가 하네스 설계의 핵심 (잘못 고르면 Goodhart)

## 스펙과의 관계

- `verify.score`(§4.2.5)의 실증 사례 — stagnation 판정과 진행도 추적에 스칼라 점수가 필요하다는 설계를 지지
- **자기보고 금지**(§1.2 원칙 2)의 가장 깨끗한 구현: 판정이 측정이므로 자기보고가 원천 배제됨
- **주의점:** 단일 정적 지표의 무한 최적화는 Goodhart 위험(스펙 §7.2 근거 (c)) — autoresearch는 단기 실험(하룻밤)이라 노출이 적지만, 장기 운행 루프는 홀드아웃 갱신(`refresh`)이 필요
- vocab-size 독립성 같은 **"비교 가능성을 위한 지표 정규화"** 개념은 스펙에 없음 — 루프 간 성능 비교가 필요해지면(마켓플레이스 §8.2) 검토 후보

## 출처

- [sources/2026-karpathy-autoresearch-repo.md](../sources/2026-karpathy-autoresearch-repo.md)

## 상호참조

[[autoresearch]] · [[fixed-time-budget]] · [[proxy-validity]] (Goodhart 주의점의 실전 확증 — taste 프록시가 목표를 배신한 n=1)
