# Agent Loops를 위한 LLM-Wiki 설계

> **작성일:** 2026-07-06  
> **기반:** [Karpathy llm-wiki gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)

---

## 1. 개요

### 1.1 문제 정의

Agent Loops는 반복 실행을 통해 지식을 축적하지만, 현재 명세(LOOP.md v0.1)의 `playbook/` 구조는:
- 어떤 형식으로 지식을 저장할지 명시하지 않음
- 크로스-참조와 일관성 유지 메커니즘 부재
- "증류(Distillation)"의 구체적 방법 미정의

### 1.2 해법: llm-wiki 적용

Karpathy의 llm-wiki를 Agent Loops에 맞게 조정:

```
Raw Sources (state/logs) → The Wiki (playbook/wiki) → The Schema (LOOP.md)
       ↓                           ↓                        ↓
    읽기 전용            LLM이 유지보수              인간이 정의
```

**핵심 차이점:**
- 전통 RAG: 검색 → 생성
- llm-wiki for Loops: **구조화된 위키 유지 → 조회 → 점검(lint)**

---

## 2. 디렉터리 구조 확장

```
loop-name/
├── LOOP.md                    # 스키마 (인간이 정의)
├── scripts/                   # 공식 (결정론 실행물)
├── playbook/
│   ├── wiki/                  # ★ 새로 추가: LLM이 유지하는 구조화된 지식
│   │   ├── INDEX.md          # 위키 목차 + 엔티티 그래프
│   │   ├── summaries/        # 각 iteration의 요약
│   │   ├── entities/         # 개념·도구·패턴 페이지
│   │   ├── contradictions/   # 발견된 모순들
│   │   └── meta/             # 위키 통계 + lint 결과
│   ├── generic/              # 이식 가능한 규칙/휴리스틱
│   └── local/                # 인스턴스 전용 (배포 금지)
└── state/
    ├── logs/                  # Raw Sources (append-only)
    ├── genes/
    └── holdout/
```

---

## 3. 세 가지 계층

### 3.1 Raw Sources — `state/logs/`

**LOOP.md의 기존 개념**: append-only 로그 (§4.2.7)

- **역할**: 불변의 진실(ground truth)
- **LLM 권한**: 읽기 전용, **절대 수정 금지**
- **내용**: iteration별 시도·검증 결과·Δ(방향 전환)
- **스키마** (§4.2.8):
  ```json
  {"iteration": 42, "gene": "v3", "action": "...", "verify": {...}, "delta": "..."}
  ```

### 3.2 The Wiki — `playbook/wiki/`

**새로 도입**: LLM이 자동 생성·유지하는 구조화된 마크다운 위키

#### 3.2.1 구성 요소

**A. INDEX.md — 위키의 엔트리포인트**

```markdown
# Loop Wiki Index

## Entities Graph
- [[lighthouse-optimization]] → [[image-compression]], [[font-preloading]]
- [[verification-strategy]] → [[visual-regression]], [[lighthouse-ci]]

## Recent Changes
- 2026-07-05: [[image-compression]] 업데이트 (iteration 42)
- 2026-07-04: [[contradiction-001]] 발견 및 해결

## Stats
- Total pages: 23
- Entities: 12
- Summaries: 45
- Unresolved contradictions: 1
```

**B. summaries/ — Iteration 요약**

각 iteration(또는 5-iteration 단위)의 압축 요약:

```markdown
# Iteration 40-45 요약

## 시도한 것
- WebP 변환 시도 → 실패 (Safari 호환성)
- AVIF 대안 적용 → 성공

## 배운 것
- Safari는 AVIF를 지원하지만 iOS < 16은 미지원
- Fallback cascade 필요: AVIF → WebP → JPEG

## 관련 페이지
- [[image-compression]]
- [[browser-compatibility]]
```

**C. entities/ — 개념·도구·패턴 페이지**

각 엔티티는 독립 파일:

```markdown
# Image Compression

## 현재 전략
AVIF (기본) → WebP (fallback) → JPEG (legacy)

## 효과 실증
- Iteration 42-45: Lighthouse Performance +12점
- 검증: 홀드아웃 visual diff < 0.1% 유지

## 관련 도구
- [[sharp]] (Node.js 라이브러리)
- [[lighthouse-ci]]

## 상호참조
- 이 전략을 사용하는 iteration: 42, 43, 45
- 관련 모순: [[contradiction-002]] (해결됨)
```

**D. contradictions/ — 모순 추적**

```markdown
# Contradiction 001

## 발견
- Iteration 23: "폰트 preload가 성능 향상"
- Iteration 38: "폰트 preload가 오히려 blocking 증가"

## 조건 차이
- 23: 2개 폰트, 총 40KB
- 38: 5개 폰트, 총 180KB → 임계값 초과

## 해결
- [[font-preloading]] 페이지에 "2개 이하일 때만" 규칙 추가
- Iteration 40에서 재검증 → 통과

## 상태
RESOLVED (2026-07-04)
```

**E. meta/ — 위키 건강도**

```markdown
# Wiki Health Report

## Lint 결과 (2026-07-06)
- ✅ 고아 페이지 없음
- ⚠️  [[browser-compatibility]] 30일 이상 미참조
- ⚠️  [[contradiction-003]] 미해결 (10 iterations)

## 권장 조치
1. [[browser-compatibility]] 최신 iteration에서 재검증
2. contradiction-003 해결 우선순위 상승
```

#### 3.2.2 유지보수 규칙

| 작업 | 시점 | 주체 |
|---|---|---|
| 요약 작성 | 매 iteration 종료 후 | Improver Agent (증류 단계) |
| 엔티티 업데이트 | 새 패턴 발견 시 | Improver Agent |
| 크로스-참조 갱신 | 엔티티 변경 시 **자동** | Improver Agent |
| Lint 실행 | 5-iteration마다 또는 수동 | Improver Agent |
| 모순 발견 | Lint 시 | Improver Agent |
| 모순 해결 | 다음 iteration에서 재검증 | Implementation Agent |

### 3.3 The Schema — `LOOP.md`

**LOOP.md의 기존 역할** 그대로 유지:
- `goal`: 불변 코어
- `verify`: 판정 기준
- `mutable`: 진화 가능 영역
- 본문: 운영 지침 (일부는 `<!-- LOOP:FREE -->` 마커로 진화 가능)

**위키와의 연결:**

```markdown
<!-- LOOP.md 본문 예시 -->

## 반복당 절차
1. **위키 조회**: `playbook/wiki/INDEX.md`에서 현재 상황과 매칭되는 엔티티 탐색
2. **전략 선택**:
   - 공식(scripts/)이 있으면 결정론 실행
   - 없으면 엔티티 페이지의 "현재 전략" 참고해 LLM 구현
3. **시도 기록**: 로그에 append
4. **위키 갱신**: (Improver Agent가 담당, 구현 에이전트는 하지 않음)
```

---

## 4. 세 가지 핵심 동작

### 4.1 Ingest — 새 Iteration 소화

**트리거**: 매 iteration 종료 후

**프로세스:**

```
state/logs/raw.jsonl (새 항목) 
  → Improver Agent 읽기
  → 요약 생성 (summaries/)
  → 관련 엔티티 페이지 업데이트
  → INDEX.md 크로스-참조 갱신
  → 모순 가능성 표시(flag)
```

**예시:**

Iteration 45에서 "AVIF fallback으로 Safari 대응" 성공

→ Improver Agent가:
1. `summaries/iteration-40-45.md` 생성
2. `entities/image-compression.md` 업데이트:
   - "현재 전략" 섹션에 AVIF fallback 추가
   - "효과 실증" 섹션에 iteration 45 결과 추가
3. `entities/browser-compatibility.md` 생성 (존재하지 않았다면)
4. `INDEX.md`에 `[[image-compression]] → [[browser-compatibility]]` 링크 추가

### 4.2 Query — 구현 에이전트의 조회

**트리거**: 새 iteration 시작 시

**프로세스:**

```
Implementation Agent가 LOOP.md 읽기
  → "위키 조회" 지시 발견
  → playbook/wiki/INDEX.md 읽기
  → 현재 Δ와 관련된 엔티티 찾기
  → 해당 엔티티 페이지 읽기
  → 전략 적용 또는 새 시도
```

**RAG와의 차이:**
- RAG: 벡터 검색 → 파편적 청크 조합
- llm-wiki: **구조화된 탐색** → 엔티티 그래프를 따라 이동

### 4.3 Lint — 위키 건강도 점검

**트리거**: 
- 5-iteration마다 자동
- Evolution 단계에서 유전자 변이 전

**검사 항목:**

| 항목 | 의미 | 조치 |
|---|---|---|
| Orphan pages | 어떤 INDEX.md 링크에도 없는 페이지 | 재연결 또는 삭제 제안 |
| Stale entities | 20+ iterations 참조 없음 | 재검증 또는 아카이브 |
| Broken links | [[존재하지-않는-페이지]] | 링크 제거 또는 페이지 생성 |
| Contradictions | 상충하는 전략 2개 이상 | 조건 분기 또는 A/B 재검증 |
| Schema drift | 엔티티 페이지 형식 불일치 | 자동 재포맷 |

**Lint 결과 저장:**
`playbook/wiki/meta/lint-YYYYMMDD.md`

---

## 5. Evolution 확장과의 통합

### 5.1 위키가 돕는 증류(Distillation)

**LOOP.md §7.5 플레이북 승격 사다리:**

```
휴리스틱 → 규칙 → 공식
```

**llm-wiki가 제공하는 증거:**

| 승격 단계 | 필요한 증거 | 위키가 제공 |
|---|---|---|
| 휴리스틱 | 1회 이상 효과 | `summaries/`의 "배운 것" |
| 규칙 | k회 에피소드 유효 | 엔티티 페이지의 "효과 실증" + 참조 iteration 목록 |
| 공식 | 홀드아웃 통과 | 검증 로그 + 엔티티의 "홀드아웃 통과" 태그 |

**예시:**

```markdown
# entities/image-compression.md

## 효과 실증
- Iteration 42: +12점 (train)
- Iteration 43: +8점 (train)
- Iteration 45: +10점 (train)
- **Holdout 2026-07-05: +9점 ✓ PASSED**

## 승격 상태
FORMULA (scripts/optimize-images.sh로 컴파일됨)
```

### 5.2 모순 발견이 막는 Objective Hacking

**DGM node 114 사례** (§7.2 근거):
> "은닉 하에서도 명시적 지시를 어기고 검출 우회"

**llm-wiki의 방어:**

1. **자동 모순 탐지:**
   - Lint가 "동일 조건, 다른 결과" 패턴 발견
   - 예: "폰트 preload 항상 좋다" vs "폰트 preload가 blocking 증가"

2. **조건 명시화 강제:**
   - 모순 해결 = 조건 분기 규칙 생성
   - 예: "폰트 2개 이하 → preload, 3개 이상 → lazy"

3. **재검증 트리거:**
   - 모순 발견 시 홀드아웃에서 양쪽 전략 A/B 비교
   - 조건 경계 실험 (2개 vs 3개 폰트)

---

## 6. 구현 로드맵

### Phase 1: 최소 구현 (MVP)

- [ ] `playbook/wiki/INDEX.md` 자동 생성
- [ ] `summaries/` 매 iteration 후 Improver Agent가 작성
- [ ] `entities/` 수동 생성 (템플릿 제공)
- [ ] Implementation Agent가 INDEX.md 조회하도록 LOOP.md 수정

**시간**: 1-2 iterations (실험용 루프 1개)

### Phase 2: 자동 엔티티 관리

- [ ] Improver Agent가 로그에서 반복 패턴 발견 → 자동 엔티티 생성
- [ ] 크로스-참조 자동 갱신
- [ ] 기본 Lint (orphan pages, broken links)

**시간**: 3-5 iterations

### Phase 3: 모순 추적

- [ ] `contradictions/` 자동 생성
- [ ] Lint가 상충 전략 탐지
- [ ] 조건 분기 제안 워크플로

**시간**: 5-10 iterations

### Phase 4: 승격 자동화

- [ ] 엔티티의 "효과 실증" 카운트 자동화
- [ ] 규칙 → 공식 승격 시 자동 `scripts/` 컴파일
- [ ] 홀드아웃 통과 시 엔티티에 FORMULA 태그

**시간**: 전체 Evolution 확장 구현과 함께

---

## 7. LOOP.md 명세 수정 제안

### 7.1 §2 디렉터리 구조에 추가

```diff
 playbook/
+│   ├── wiki/                # LLM이 유지하는 구조화된 지식
+│   │   ├── INDEX.md        # 위키 목차 + 엔티티 그래프
+│   │   ├── summaries/      # Iteration 요약
+│   │   ├── entities/       # 개념·도구·패턴 페이지
+│   │   └── meta/           # 위키 통계 + lint 결과
 │   ├── generic/            # 이식 가능한 증류 지식
 │   └── local/              # 인스턴스 전용
```

### 7.2 §7.5에 위키 참조 추가

```diff
 증류된 지식은 3단계 지위를 갖는다:
 
 | 지위 | 진입 조건 | 실행 방식 |
 |---|---|---|
-| 휴리스틱 | 증류에서 후보로 식별 | LLM이 참고 자료로 활용 |
+| 휴리스틱 | `playbook/wiki/summaries/`에 기록 | LLM이 참고 자료로 활용 |
-| 규칙 | k회 에피소드에서 유효 (k는 루프 정의) | LLM이 우선 적용 |
+| 규칙 | `playbook/wiki/entities/`에서 k회 실증 | LLM이 우선 적용 |
 | 공식 | 홀드아웃 통과 | `scripts/`로 컴파일, 결정론 실행 |
```

### 7.3 새 절 추가: §4.2.10 `wiki` (선택적)

```markdown
#### 4.2.10 `wiki` (선택적)

| 하위 필드 | 타입 | 기본값 |
|---|---|---|
| `enabled` | boolean | `false` |
| `ingest-frequency` | `per-iteration` \| `per-N` | `per-iteration` |
| `lint-frequency` | int | 5 (매 5 iterations) |
| `entity-schema` | string | 내장 기본 스키마 |

- `enabled: true`일 때 Improver Agent는 `playbook/wiki/`를 유지보수해야 한다(MUST).
- 엔티티 페이지는 최소한 다음을 포함해야 한다(MUST): 제목, "현재 전략", "효과 실증", "관련 도구", "상호참조".
```

---

## 8. 기대 효과

### 8.1 인간에게

- **큐레이션에만 집중**: 로그 → 위키 변환을 LLM이 대신
- **투명성**: 엔티티 페이지로 "루프가 무엇을 배웠는가" 한눈에 파악
- **신뢰**: 모순 추적으로 "왜 이전과 다르게 행동하는가" 설명 가능

### 8.2 LLM에게

- **점진적 로딩**: 수백 iteration 로그를 매번 읽지 않고, INDEX.md → 관련 엔티티만
- **구조화된 탐색**: 벡터 검색의 불확실성 없이 그래프 탐색
- **지속적 학습**: 새 iteration이 위키에 통합되며 이전 지식과 연결

### 8.3 표준에게

- **증명 가능한 학습**: "반복될수록 싸진다" 가설을 `playbook/wiki/meta/`의 통계로 실증
- **재현 가능성**: 엔티티 페이지 + scripts/가 있으면 다른 인스턴스가 재현 가능
- **배포 가능**: `playbook/wiki/` 중 `generic/` 엔티티는 다른 인스턴스에 배포 가능

---

## 9. 참고문헌

1. Karpathy, A. (2025). *llm-wiki: incrementally persistent wiki maintained by LLM*.  
   https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f

2. Agent Loops Specification v0.1 (2026-07-03).  
   `spec/SPECIFICATION.md`

3. Related research (LOOP.md 근거):
   - Voyager, ADAS, AlphaEvolve, DGM, SICA (생성-검증 분리)
   - ACE (context collapse 실증, ICLR 2026)
   - Dynamic Cheatsheet (결정론 재실행의 정확도 향상)

---

## 10. 다음 단계

1. **실험용 루프 선택**: 기존 `lighthouse-perf-optimizer` 또는 새 루프
2. **MVP 구현** (Phase 1):
   - `playbook/wiki/INDEX.md` 템플릿 작성
   - Improver Agent 프롬프트에 "Ingest" 절차 추가
   - 수동으로 3-5 iterations 실행 후 위키 품질 평가
3. **결과 보고**: 
   - "위키 있음 vs 없음" 비교 (iteration 속도, 성공률, 토큰 사용량)
   - 위키 구조 개선점 피드백
4. **명세 반영**: 검증된 패턴을 LOOP.md 명세에 통합

---

**End of Document**
