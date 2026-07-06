# [내부 리서치] LOOP.md 딥리서치 1차 — Agent Skills 해부와 표준 채택 분석

- **위치:** `research/agent-skills-and-loop-md.md` (이 저장소)
- **작성일/접근일:** 2026-07-03 / 2026-07-06
- **유형:** 내부 딥리서치 리포트 — fan-out 웹검색 5각도 → 소스 23개 → 주장 115건 추출 → 상위 25건 **3표 적대적 검증** (24 확증 / 1 반증)
- **신뢰도 특성:** 개별 주장에 [High]/[Med]/[Low] 태그. 원 출처는 agentskills.io 스펙, Anthropic 엔지니어링 블로그, anthropics/skills, platform.claude.com 등 1차 출처 다수

## Digest

**주제:** SKILL.md 포맷의 스펙·작동 원리·채택 경로, 그리고 LOOP.md 설계 교훈.

**검증 통과 핵심 사실:**
- SKILL.md 필수 필드는 name+description 둘뿐. 본문 형식 제약 없음. 스킬 = SKILL.md를 담은 디렉터리
- 3단계 progressive disclosure: 메타데이터(~100토큰, 상시) → 본문(<5k, 트리거 시) → 리소스(필요 시, 사실상 무제한)
- 트리거는 별도 라우터가 아닌 모델 주도 description 매칭
- scripts/ 번들 = 결정론 실행물, 코드는 컨텍스트에 로드되지 않고 출력만 소비
- 설계 근거는 컨텍스트 경제학(context rot, n² 어텐션) — 원리 블로그(9/29) → 포맷 발표(10/16) 순서
- 채택: 구현(anthropics/skills)과 표준(agentskills.io) 분리, 2026 중반 쇼케이스 42개 클라이언트(OpenAI Codex·Gemini CLI·Copilot 등 경쟁사 포함)
- **반증된 주장 1건:** "agentskills.io가 중립 거버넌스(별도 org+Discord)로 운영" — 1-2로 기각. 벤더 중립은 aspirational

**네임스페이스 조사:** `sdwolf4103/loop.md`(2026-06-16, ⭐1, "Markdown-native while loop") 실재. 루프 파일 관행의 기존 강자는 PROMPT.md(Ralph).
