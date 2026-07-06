# [저장소] karpathy/autoresearch

- **URL:** https://github.com/karpathy/autoresearch
- **공개:** 2026년 3월 초
- **접근일:** 2026-07-06
- **보조 소스:** [Kingy AI 분석](https://kingy.ai/ai/autoresearch-karpathys-minimal-agent-loop-for-autonomous-llm-experimentation/), [mager.co 패턴 분석](https://www.mager.co/blog/2026-03-14-autoresearch-pattern), [Launchberg](https://launchberg.com/karpathy-autoresearch/)

## Digest

AI 에이전트가 단일 GPU에서 nanochat 훈련 실험을 자율 수행하는 최소 시스템 (~630줄).

**3개 핵심 파일:**

| 파일 | 역할 | 수정 권한 |
|---|---|---|
| `prepare.py` | 데이터 준비·유틸리티 | 수정 금지 (불변) |
| `train.py` | 모델·옵티마이저·훈련 루프 전체 | 에이전트가 수정 |
| `program.md` | 인간이 작성한 전략 + 게임의 규칙 | 인간만 수정 |

**루프 구조:** 에이전트가 `train.py` 수정 → 5분 훈련 → `val_bpb` 측정 → 개선이면 유지, 아니면 폐기 → 반복. 시간당 ~12회, 하룻밤 ~100회 실험.

**핵심 설계 결정:**
- **고정 시간 예산** — 실험당 5분 (훈련 벽시계 시간, 시작/컴파일 제외). 플랫폼 무관 비교 가능성 확보.
- **단일 지표** — `val_bpb`(validation bits per byte, 낮을수록 우수). vocab-size 독립적이라 아키텍처 변경도 공정 비교.
- **단일 파일 수정 원칙** — 변이 표면을 `train.py` 하나로 제한해 범위 관리.

**실증 결과 (repo Discussions/PRs):** H100에서 val_bpb 0.9979 → 0.9773 (89 실험), 0.9979 → 0.9697 (126 실험). 실험별 로그와 PR 기반 결과 공유 워크플로 제안 포함.
