# loop.md — Agent Loops 표준 프로젝트

AI 에이전트가 선언된 목표를 독립 검증 통과까지 반복하는 `LOOP.md` 표준을 설계하는 프로젝트.

## 디렉터리

- `spec/SPECIFICATION.md` — 표준 명세 (현재 v0.3 Draft). 이 프로젝트의 최종 산출물. 비판 리뷰 기록은 `spec/reviews/`
- `wiki/` — **llm-wiki**: 외부 리서치를 구조화해 축적하는 위키. 스펙 설계의 지식 기반
- `design/` — 설계 문서 (llm-wiki 설계, 루프 메커니즘, UX 시나리오)
- `research/` — 초기 리서치 원문

## 위키 사용법 (모든 세션 공통)

- **조회:** 스펙·리서치 관련 작업 전에 `wiki/INDEX.md`를 먼저 읽고, 관련 엔티티 페이지(`wiki/entities/`)를 따라가라. 과거 ingest에서 도출된 결론과 스펙 v0.2 검토 후보가 여기 있다.
- **Ingest:** 사용자가 소스(URL·논문·영상)를 주면 `wiki/WIKI.md`의 Ingest 절차를 따르라 — 소스 레코드 → 요약 → 엔티티 생성/갱신 → 모순 점검 → INDEX 갱신.
- **규칙:** `wiki/WIKI.md`가 스키마다. 소스 레코드는 ingest 후 수정 금지, 모든 주장에 출처, 크로스-참조는 `[[엔티티-이름]]`.

## 언어

문서 정본은 한국어 (공개 시 영어판이 canonical, 스펙 헤더 참조).
