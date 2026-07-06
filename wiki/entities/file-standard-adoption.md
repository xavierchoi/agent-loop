# file-standard-adoption (파일 표준의 채택 조건)

## 정의

마크다운/파일 기반 크로스-에이전트 표준이 확산되거나 죽는 조건. SKILL.md(확산)·AGENTS.md(확산)·llms.txt(정체)의 비교에서 도출.

## 핵심 사실

- **SKILL.md** [3표 검증]: 필수 필드 2개(name·description), 구현(anthropics/skills)과 표준(agentskills.io) 분리, 2026 중반 42개 클라이언트(경쟁사 포함). 단 "중립 거버넌스" 주장은 반증됨(aspirational) — AAIF에 포함되지 않음
- **AGENTS.md** [수집, 1차 출처 다중]: 2025-08 출시 → 4개월 만에 60,000+ 프로젝트. 채택 인과는 OpenAI 자술로 "Codex가 프로젝트 지시문을 찾을 예측 가능한 위치가 필요해서" — **킬러 앱(소비자) 선행, 표준화 후행**. 2025-12-09 AAIF(Linux Foundation directed fund)에 기증
- **llms.txt** [수집, 다중 확인]: 주요 플랫폼 어느 곳도 파일을 소비하지 않음. 서버 로그상 AI 크롤러가 요청조차 안 함(Google Mueller). Anthropic조차 발행만 하고 소비 안 함 — **생산자-측 채택 ≠ 소비자-측 채택**
- **AAIF 실체** [수집]: Linux Foundation 산하 directed fund(2025-12-09), 공동설립 Anthropic·Block·OpenAI, 창립 프로젝트 MCP·AGENTS.md·goose. 발표문에 구체적 의사결정 구조(TSC·투표) 없음 — 기증은 거버넌스 이전이라기보다 중립성 신호. MCP도 채택 완료 **후** 기증

## 스펙과의 관계

- **파일 표준의 생사 = "그 파일을 읽고 행동하는 소비자가 출시일에 존재하는가."** LOOP.md의 채택 필요조건은 스펙 문서가 아니라 **레퍼런스 런타임 동시 출시** (§6 준수 수준의 Level 0 존재 이유이기도 함 — 런타임 없이도 문서로 유효해야 점진 채택 가능)
- 중립 기구 기증은 채택 이후의 마지막 수순(MCP·AGENTS.md 경로) — 초기부터 거버넌스 기구를 만드는 것은 순서 역행
- 최소 필수 필드(§1.2 원칙 1)와 구현/표준 분리는 SKILL.md 경로의 재사용

## 출처

- [sources/2026-loopmd-deep-research-round1.md](../sources/2026-loopmd-deep-research-round1.md)
- [sources/2026-loopmd-deep-research-round2.md](../sources/2026-loopmd-deep-research-round2.md)

## 상호참조

[[loopy-era]] (시장 타이밍) · [[orchestration-as-skill]] (포지셔닝 문장)
