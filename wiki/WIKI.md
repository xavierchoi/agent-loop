# WIKI.md — loop.md 프로젝트 위키 스키마

> 이 파일은 llm-wiki의 **Schema 계층**이다. 위키를 유지보수하는 LLM은 이 규칙을 따른다.
> 설계 근거: `design/llm-wiki-for-agent-loops.md`, [Karpathy llm-wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)

## 목적

Agent Loops 표준(`spec/SPECIFICATION.md`) 설계에 필요한 외부 지식을 구조화된 위키로 축적한다.
사용자가 Raw Source를 큐레이션하고, LLM이 위키를 유지보수한다.

## 계층

| 계층 | 위치 | 권한 |
|---|---|---|
| Raw Sources | `sources/` | 사용자가 URL 큐레이션. ingest 시 1회 기록 후 **수정 금지** |
| The Wiki | `summaries/` `entities/` `contradictions/` `INDEX.md` | LLM이 생성·유지 |
| The Schema | 이 파일 | 인간만 수정 |

## Ingest 절차

사용자가 소스(URL·논문·영상)를 주면:

1. 소스를 가져와 `sources/`에 소스 레코드 작성 — 파일명: `<연도>-<slug>.md`. 원본 URL, 접근일, 핵심 내용 digest 포함.
2. `summaries/`에 ingest 요약 작성 — 파일명: `<날짜>-ingest-<NNN>.md`. 이번 배치에서 배운 것과 스펙에 대한 시사점.
3. 관련 `entities/` 페이지 생성 또는 갱신. 엔티티 페이지 필수 섹션: **정의 · 핵심 사실 · 스펙과의 관계 · 출처 · 상호참조**.
4. 기존 위키·스펙과 **모순되는 내용** 발견 시 `contradictions/NNN-<slug>.md` 생성.
5. `INDEX.md`의 엔티티 그래프·최근 변경·통계 갱신.

## 규칙

- 모든 주장에는 출처를 남긴다 (소스 레코드 링크 또는 URL).
- 크로스-참조는 `[[엔티티-이름]]` 형식. 깨진 링크를 만들지 않는다 — 링크하면 페이지를 만들거나 기존 페이지를 확인한다.
- 엔티티 이름: 소문자-하이픈 슬러그.
- 스펙(`spec/SPECIFICATION.md`)과의 관계를 항상 명시한다 — 이 위키의 존재 이유는 스펙 설계 지원이다.
- 위키 페이지는 요약이지 복사가 아니다. 소스 원문을 통째로 붙여넣지 않는다.

## Lint (5회 ingest마다 또는 수동)

- 고아 페이지(INDEX에서 미참조), 깨진 `[[링크]]`, 미해결 contradiction 점검.
- 결과는 `meta/lint-YYYYMMDD.md`에 기록.
