# autoresearch

## 정의

Karpathy가 2026년 3월 공개한, AI 에이전트가 LLM 훈련 실험을 자율 반복하는 최소(~630줄) 시스템. **LOOP.md 표준의 가장 유명한 살아있는 선례.**

## 핵심 사실

- 루프: `train.py` 수정 → 5분 훈련 → `val_bpb` 측정 → keep/discard → 반복 (하룻밤 ~100회)
- 실증: 2일간 700 실험 → 20개 유효 최적화, val_bpb 0.9979 → 0.9697 (126 실험)
- 수년간 손으로 튜닝한 설정에서도 인간이 놓친 최적화를 발견

## 스펙과의 관계 — 구조 동형성

autoresearch는 사실상 **Level 1 Runner에서 실행되는 루프 인스턴스**다:

| autoresearch | LOOP.md 스펙 |
|---|---|
| `program.md` (인간 작성 전략+규칙) | `LOOP.md` frontmatter + 본문 |
| `val_bpb` 단일 지표 | `verify.score` → [[single-metric-verification]] |
| 5분 고정 훈련 예산 | `budget.max-duration` → [[fixed-time-budget]] |
| keep/discard 판정 | `verify` 게이트 (자기보고 금지 §1.2) |
| `train.py`만 수정 가능 | `mutable` 변이 표면 → [[mutation-surface]] |
| `prepare.py` 수정 금지 | 불변 코어 (`goal`·`verify` 불변, §4.2.3) |
| 실험별 로그 | append-only 로그 (§4.2.7) |

**스펙에 없는 것을 autoresearch가 보여주는 것:** PR 기반 결과 공유 워크플로 → §8 배포(Distribution)의 "집계 지표 동봉" 아이디어와 연결.

**autoresearch에 없는 것을 스펙이 더하는 것:** 홀드아웃 격리(§7.2), 승격 사다리(§7.5), 진화 게이트(§7.4). autoresearch는 유전자(`program.md`) 자체는 진화시키지 않는다 — 인간만 수정.

## 출처

- [sources/2026-karpathy-autoresearch-repo.md](../sources/2026-karpathy-autoresearch-repo.md)
- [sources/2026-karpathy-no-priors-interview.md](../sources/2026-karpathy-no-priors-interview.md)

## 상호참조

[[loopy-era]] · [[single-metric-verification]] · [[fixed-time-budget]] · [[mutation-surface]] · [[evolution-substrate]] · [[greedy-vs-archive]] (greedy 진영의 대표)
