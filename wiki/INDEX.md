# Loop.md Wiki Index

> 스키마: [WIKI.md](WIKI.md) · 최종 갱신: 2026-07-06 (Ingest 004)

## 엔티티 그래프

```
[[loopy-era]] ─── 시대 논제 (←[[self-improvement-failure-modes]]로 조건화됨)
   ├── [[autoresearch]] ─── 살아있는 선례 (LOOP.md 동형물, greedy 진영)
   │      ├── [[single-metric-verification]] ── verify.score 실증
   │      ├── [[fixed-time-budget]] ────────── budget 실증 → v0.2 채택
   │      └── [[mutation-surface]] ─────────── mutable/§7.3 실증
   ├── [[darwin-goedel-machine]] ── §7.2 근거 원출처, archive 진영
   ├── [[ai-scientist]] ─────────── verify.agent 앙상블 실증 → v0.2 채택
   ├── [[ale-agent]] ────────────── in-loop 증류 + 비용 기준점 ($1,300)
   ├── [[meta-harness]] ─────────── §5.3 실행 모델의 정면 실증, Pareto 추적
   ├── [[orchestration-as-skill]] ── 인간 역할 논제 (←[[meta-harness]] 반론으로 정련됨)
   └── [[evolution-substrate]] ──── 가중치 vs 컨텍스트 진화 (AReaL 2.0)

반대 증거·종합 축 (Ingest 004):
   ├── [[self-improvement-failure-modes]] ── 실패 모드 목록 (loopy-era의 시험대)
   ├── [[loop-economics]] ────────────────── 경제성 논제 대차대조표 (조건부 성립)
   ├── [[ratcheting-quality-gates]] ──────── 래칫의 산업 선례 (Notion)
   └── [[file-standard-adoption]] ────────── 파일 표준의 생사 조건 (소비자 선행)

✅ 해소된 모순: [[greedy-vs-archive]] (스펙 결정: 선형+parent 예약) · [[harness-automation-tension]] (층위 이동)
```

## 엔티티 목록

| 엔티티 | 한 줄 | 스펙 연결 |
|---|---|---|
| [autoresearch](entities/autoresearch.md) | Karpathy의 최소 Agent Loop 구현 | §전체 동형 매핑 |
| [loopy-era](entities/loopy-era.md) | 자기개선 루프가 표준이 되는 시대 논제 | 시장 타이밍 근거 |
| [darwin-goedel-machine](entities/darwin-goedel-machine.md) | 아카이브 진화 + objective hacking 실증 | §7.2 원출처, §4.2.7 실증 |
| [ai-scientist](entities/ai-scientist.md) | 피어리뷰 통과 AI 논문, Automated Reviewer | §4.2.5 `verify.agent` |
| [ale-agent](entities/ale-agent.md) | AHC058 우승, in-loop 증류 | §7.5, §7.6 비용 기준점 |
| [evolution-substrate](entities/evolution-substrate.md) | 가중치 공간 vs 컨텍스트 공간 진화 | §4.2.8, §7 |
| [single-metric-verification](entities/single-metric-verification.md) | 단일 스칼라 지표 판정 패턴 | §4.2.5 `verify.score` |
| [fixed-time-budget](entities/fixed-time-budget.md) | iteration당 고정 예산 = 비교 가능성 장치 | §4.2.6 → v0.2 채택 |
| [mutation-surface](entities/mutation-surface.md) | 변이 가능 영역의 명시적 제한 | §7.3 `mutable` |
| [orchestration-as-skill](entities/orchestration-as-skill.md) | 하네스 설계가 곧 핵심 역량 | 표준 포지셔닝 |
| [meta-harness](entities/meta-harness.md) | 하네스 자동 최적화, 수동 설계 초과 | §5.3 실증, §4.2.8 근거 |
| [self-improvement-failure-modes](entities/self-improvement-failure-modes.md) | 자기개선 실패 모드 목록 (반대 증거 축) | 안전 필드 전반의 존재 이유 |
| [loop-economics](entities/loop-economics.md) | 경제성 논제 대차대조표 — 조건부 성립 | §7.5–7.6, budget 기준점 |
| [ratcheting-quality-gates](entities/ratcheting-quality-gates.md) | 래칫의 산업 선례 (Notion ESLint) | §7.3–7.4 실증 |
| [file-standard-adoption](entities/file-standard-adoption.md) | 파일 표준의 생사 = 소비자 선행 | §6 Level 0, 채택 전략 |

## 모순 (Contradictions)

| ID | 내용 | 상태 |
|---|---|---|
| [001-greedy-vs-archive](contradictions/001-greedy-vs-archive.md) | greedy vs 아카이브 탐색 — 이력 보존/계보 분기 구분으로 축소, 스펙 결정(선형+parent)으로 해소 | **RESOLVED** (v0.3 재검토 이관) |
| [002-harness-automation-tension](contradictions/002-harness-automation-tension.md) | "하네스는 인간 스킬" vs "하네스도 자동 최적화" — 층위 이동으로 재정의 | RESOLVED |

`[[greedy-vs-archive]]`·`[[harness-automation-tension]]` 링크는 해당 모순 문서로 해석한다.

## 소스 레코드

| 소스 | 유형 | Ingest |
|---|---|---|
| [AReaL 2.0 (arXiv 2607.01120)](sources/2026-areal2-self-evolving-agents.md) | 논문 | 001 |
| [Karpathy No Priors 인터뷰](sources/2026-karpathy-no-priors-interview.md) | 인터뷰 | 001 |
| [karpathy/autoresearch](sources/2026-karpathy-autoresearch-repo.md) | 저장소 | 001 |
| [Darwin Gödel Machine](sources/2025-sakana-dgm.md) | 발표 페이지 | 002 |
| [ALE-Agent AHC058](sources/2025-sakana-ale-agent-ahc058.md) | 발표 페이지 | 002 |
| [AI Scientist Nature](sources/2026-sakana-ai-scientist-nature.md) | 발표 페이지 | 002 |
| [Meta-Harness (arXiv 2603.28052)](sources/2026-meta-harness.md) | 논문 | 003 |
| [LOOP.md 딥리서치 1차](sources/2026-loopmd-deep-research-round1.md) | 내부 리포트 (3표 검증) | 004 |
| [LOOP.md 딥리서치 2차](sources/2026-loopmd-deep-research-round2.md) | 내부 리포트 (3표 검증) | 004 |

## 스펙 v0.2 검토 후보 — 처리 완료 (소유자 결정 2026-07-06)

| # | 후보 | 결정 |
|---|---|---|
| 1 | iteration당 예산 필드 — [[fixed-time-budget]] | ✅ **채택** (`budget.per-iteration`) |
| 5 | 유전자 `parent` — [[greedy-vs-archive]] | ✅ **채택** (선형 + parent 예약) |
| 6 | `verify.agent` 앙상블 — [[ai-scientist]] | ✅ **채택** (`n`/`consensus` 옵션) |
| 2 | 점수 정규화 가이드 — [[single-metric-verification]] | ⏸ 연기 (마켓플레이스 시점) |
| 3 | 로그 스키마 RL 궤적 호환 — [[evolution-substrate]] | ⏸ 연기 (대응 표준 미성숙) |
| 4 | PR 기반 결과 공유 — [[autoresearch]] | ⏸ 연기 (비규범 예시 검토) |
| 7 | Pareto/다중 점수 stagnation — [[meta-harness]] | ⏸ 연기 (v0.3, Core 단순성 보존) |

## 최근 변경

- 2026-07-06 · [Ingest 004](summaries/2026-07-06-ingest-004.md): 내부 딥리서치 1·2차 소화 — **반대 증거 축 신설**, 엔티티 4 신규, **모순 001 해소(스펙 결정)**, v0.2 후보 7건 처리 완료
- 2026-07-06 · [Ingest 003](summaries/2026-07-06-ingest-003.md): Meta-Harness 소화 — §5.3 실행 모델의 정면 실증, 모순 002 발견 즉시 해소, v0.2 후보 +1
- 2026-07-06 · [Ingest 002](summaries/2026-07-06-ingest-002.md): Sakana 3부작 소화, 엔티티 3 신규, **첫 모순 발견(greedy vs archive)**, v0.2 후보 +2
- 2026-07-06 · [Ingest 001](summaries/2026-07-06-ingest-001.md): 소스 3개 소화, 엔티티 7개 신규, v0.2 후보 4건

## 통계

- 소스: 9 · 엔티티: 15 · 요약: 4 · 모순: 2 (미해결 **0**, 해소 2)
- 다음 Lint 예정: Ingest 005 후
