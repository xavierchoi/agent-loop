# Agent Skills(SKILL.md) 심층 리서치 — 그리고 LOOP.md 표준 설계에 주는 시사점

> 조사 방식: fan-out 웹검색 5각도 → 23개 소스 원문 수집 → 115개 주장 추출 → 상위 25개 주장 3표 적대적 검증(24 확증 / 1 반증) → 종합.
> 조사일 2026-07-03. 신뢰도 태그: **[High]** 다수 1차 출처 만장일치 · **[Med]** 단일/비-피어리뷰 또는 부분 매핑 · **[Low]** 해석적 도출·미검증.

---

## TL;DR (핵심 결론 6가지)

1. **SKILL.md의 본질은 "극단적 미니멀리즘 + 지연 로딩"이다.** 스킬은 `SKILL.md` 파일 하나를 담은 디렉터리이고, YAML frontmatter에서 **필수 필드는 `name`·`description` 단 두 개**뿐이다. 나머지(본문 마크다운, `scripts/`, `references/`, `assets/`)는 전부 선택이다. **[High]**

2. **작동의 핵심은 3단계 progressive disclosure다.** 시작 시 name+description(~100토큰/스킬)만 로드 → 요청이 description과 매칭되면 모델이 스스로 bash로 SKILL.md 본문(<5k토큰 권고)을 읽음 → 참조 파일·스크립트는 필요할 때만. 덕분에 스킬을 아무리 많이 설치해도 컨텍스트 페널티가 거의 없다. **[High]**

3. **Anthropic이 공식적으로 밝힌 설계 근거는 "컨텍스트 경제학"이다.** 컨텍스트는 유한·소모 자원이고 토큰이 늘수록 회상 정확도가 떨어진다(context rot, n² 어텐션). 그래서 "식별자만 컨텍스트에 두고 런타임에 도구로 동적 로드"하는 just-in-time 전략을 SKILL.md가 형식화했다. **[High]**

4. **SKILL.md은 선언문이 아니라 결정론적 실행 코드를 번들할 수 있다.** `scripts/`의 코드는 컨텍스트에 로드되지 않고 실행 출력만 토큰을 쓴다. "코드는 결정론적이라 일관·재현 가능"이 명시적 설계 논거다 — 이게 LOOP.md의 "공식(결정론 실행) vs LLM 폴백" 구조의 직접 선례다. **[High]**

5. **채택은 사실상의 크로스-에이전트 표준 수준이다.** Anthropic은 자사 구현(`anthropics/skills`)과 벤더 중립 표준(`agentskills.io`)을 의도적으로 분리했고, 2026년 중반 기준 쇼케이스에 **약 42개 클라이언트**(OpenAI Codex, Gemini CLI, GitHub Copilot, Cursor, JetBrains Junie, Goose 등 경쟁사 포함)가 올라 있다. **[High]** — 단, "중립 거버넌스 기구"는 aspirational이며 세부 주장 일부는 검증에서 반증됨.

6. **LOOP.md에 직접 쓸 4대 교훈:** (a) 최소 필수 필드를 극단적으로 줄일 것, (b) progressive disclosure로 토큰 경제성 확보, (c) 결정론적 실행 컴포넌트 번들, (d) 구현/표준 거버넌스 분리. LOOP.md 고유의 "재귀적 자기개선 플레이북" 축은 **ACE(Agentic Context Engineering)** 가 가장 가까운 학술 선례다. **[Med]**

---

## 1. Agent Skills 스펙 해부

### 1.1 최소 스펙 — 필수는 두 필드뿐 **[High]**

`agentskills.io/specification`, Anthropic 엔지니어링 블로그, `github.com/anthropics/skills`, `platform.claude.com` 공식 docs가 **만장일치**로 확인한 사실(7개 독립 주장이 3-0 검증 통과):

- 스킬 = **`SKILL.md` 파일을 담은 디렉터리**. "최소한으로, 스킬은 `SKILL.md` 파일을 포함하는 디렉터리다."
- `SKILL.md`은 **YAML frontmatter + 마크다운 본문** 구조.
- **필수 필드 2개:**
  - `name` — 최대 64자, 소문자·숫자·하이픈만, 앞뒤/연속 하이픈 금지, **부모 디렉터리명과 일치**해야 함.
  - `description` — 비어있지 않은 최대 1024자.
- **선택 필드:** `license`, `compatibility`(최대 500자), `metadata`, `allowed-tools`(실험적).
- **본문:** "형식 제약 없음(no format restrictions)". 권고 사항은 500줄 미만 유지, 참조 파일은 SKILL.md에서 한 단계 깊이까지.

| 필드 | 필수 | 제약 |
|---|---|---|
| `name` | ✅ | ≤64자, 소문자·숫자·하이픈, 부모 디렉터리명과 일치 |
| `description` | ✅ | ≤1024자, 비어있지 않음, "무엇을 + 언제" 둘 다 기술 |
| `license` | ❌ | — |
| `compatibility` | ❌ | ≤500자 |
| `metadata` | ❌ | — |
| `allowed-tools` | ❌ | 실험적 |

> ⚠️ **미묘한 차이:** XML 태그 금지 및 예약어(`anthropic`, `claude`) 금지 제약은 **Claude 플랫폼 docs 한정**이고, 벤더 중립 오픈 스펙(`agentskills.io`)에는 없다. 구현 검증 규칙과 표준을 혼동하지 말 것.

### 1.2 폴더 구조

```
my-skill/
├── SKILL.md          # 필수: frontmatter + 지시문
├── scripts/          # 선택: 실행 가능 코드 (결정론적 도구)
├── references/       # 선택: 상세 문서 (지연 로딩)
└── assets/           # 선택: 템플릿·리소스
```

Anthropic은 스킬을 "지시문·스크립트·리소스의 **폴더**(단일 파일이 아님)"로 공식 정의한다 — 즉 포맷은 **파일시스템 네이티브**이며 SKILL.md 텍스트 너머의 번들 실행 리소스를 지원한다. **[High]**

---

## 2. 작동 메커니즘 (로딩·트리거·실행)

### 2.1 3단계 Progressive Disclosure — 정량 토큰 예산 **[High]**

`platform.claude.com`이 제시하는 로딩 표(5개 독립 주장 3-0 확증):

| 레벨 | 무엇 | 로드 시점 | 토큰 비용 |
|---|---|---|---|
| **Level 1** 메타데이터 | name + description | 항상 (시작 시, 전 스킬) | **~100토큰/스킬** |
| **Level 2** 지시문 | SKILL.md 본문 | 트리거될 때만 | **<5k토큰** (권고) |
| **Level 3+** 리소스 | 번들 파일·스크립트 | 필요 시에만 | **사실상 무제한** (접근 전 0토큰) |

`agentskills.io`는 이를 **Discovery → Activation → Execution** 3단계로 명명한다.

> ⚠️ **주의:** `~100토큰`, `<5k` 등은 권고·근사치다. 스킬 수가 많으면 시작 메타데이터 총량이 커진다(대형 라이브러리에서 22k+ 토큰 프리로드 사례 존재). 한 측정에서는 중앙값 ~80토큰/스킬, Anthropic 공식 17개 스킬 합계 ~1,700토큰.

### 2.2 트리거링 — 모델 주도 description 매칭 **[High]**

> "Claude는 시작 시 이 메타데이터를 로드해 시스템 프롬프트에 포함시킨다. … 사용자가 스킬의 description과 매칭되는 것을 요청하면, **Claude가 bash로 파일시스템에서 SKILL.md를 읽는다. 그때 비로소 그 내용이 컨텍스트 창에 진입한다.**"
> — platform.claude.com

핵심: **트리거는 별도 라우터가 아니라 모델의 자체 판단**이다. 그래서 스펙은 `description`에 "무엇을 하는지 + 언제 쓰는지 + 매칭용 키워드"를 함께 담으라고 지시한다. `description`의 품질이 곧 스킬의 발견 가능성을 결정한다.

### 2.3 실행 — 결정론적 스크립트 번들 **[High]**

> "스킬은 Claude가 재량껏 **도구로 실행할 코드**도 포함할 수 있다. … Claude는 스크립트도 PDF도 컨텍스트에 로드하지 않고 이 스크립트를 실행할 수 있다. 그리고 **코드는 결정론적이므로 이 워크플로는 일관되고 재현 가능하다.**"
> — Anthropic 엔지니어링 블로그 + platform.claude.com

즉 스크립트 코드는 컨텍스트에 안 들어가고 **출력만 토큰을 소비**한다 → "모델이 즉석에서 동등 코드를 생성하는 것보다 훨씬 효율적"이다. Microsoft Agent Framework 등 제3자 구현도 스크립트 실행을 지원하므로 blog-only 열망이 아니다.

---

## 3. 왜 LLM 에이전트에게 잘 작동하는가 (증거 기반)

### 3.1 공식 설계 근거: 컨텍스트 경제학 **[High]**

Anthropic의 두 블로그가 타임라인으로 인과를 뒷받침한다:

- **2025-09-29 "Effective context engineering for AI agents":** "컨텍스트는 유한 자원으로 취급되어야 한다(finite resource)", "**context rot**", 트랜스포머의 "**n² pairwise relationships**", "attention budget", just-in-time 전략("가벼운 식별자만 유지하고 런타임에 데이터를 동적 로드").
- **2025-10-16 "Equipping agents… with Agent Skills"(17일 뒤):** "스킬에 번들할 수 있는 컨텍스트 양은 **사실상 무한하다**", "**Progressive disclosure가 핵심 설계 원리**다."

먼저 원리를 세우고 뒤에 SKILL.md로 형식화한 순서. 독립 문헌(Chroma 파생 연구, arXiv 2505.13353)도 컨텍스트 길이에 따른 회상 저하를 확증.

> ⚠️ "attention budget"은 측정량이 아닌 **은유**이고, 근거가 서로 다른 두 포스트에 걸쳐 있다.

### 3.2 실증 증거: "구조 > 지능" 시그널 **[Med]**

arXiv 2604.14572 "Don't Retrieve, Navigate" (단일 비-피어리뷰 preprint):

- 동일 스킬 트리에서 서빙 LLM을 Sonnet 4.6 → 저가 Haiku 4.5로 교체 시 **비용 −39%** ($0.153→$0.093), F1은 모든 flat retrieval 베이스라인을 여전히 **2~6점** 앞섬.
- "검색 성능을 이끄는 것은 **네비게이터의 정교함이 아니라 컴파일된 트리(아티팩트)**다."
- 시작 시 **~200토큰**만 보고 점증 로딩.

> ⚠️ **강한 유보:** (a) 단일 preprint, (b) Haiku는 Sonnet F1의 92%·Factuality 87%만 유지하고 **환각률은 4배**라 컴플라이언스 민감 배포엔 Sonnet 권장(네비게이터 지능이 무의미하진 않음), (c) 트리 자체가 Sonnet으로 컴파일돼 지능이 "서빙 시점→컴파일 시점"으로 전이된 것, (d) `~200토큰`은 6개 스킬 배포 특화 수치. → **방향성 시사로만** 취급.

### 3.3 자기보고 경계

성능향상·토큰절감 서술 상당수는 **Anthropic 자기보고**(엔지니어링 블로그·자사 docs)이며 독립 재현 데이터는 제한적이다. LOOP.md 백서를 쓸 때 이 점을 명시하는 게 신뢰도에 유리하다.

---

## 4. 생태계·표준 채택 분석

### 4.1 채택 현황 **[High]**

- `anthropics/skills` README: **"이 레포는 Claude를 위한 Anthropic의 구현이다. Agent Skills **표준**에 대해서는 agentskills.io를 보라."** → **구현과 표준을 구조적으로 분리**.
- 표준은 별도 GitHub org + 오픈 라이선스(코드 Apache-2.0 / 문서 CC-BY-4.0), 자체 CONTRIBUTING.
- `agentskills.io` 쇼케이스에 **실제 42개 제품** 등재: OpenAI Codex, Google Gemini CLI, GitHub Copilot/VS Code, Cursor, JetBrains Junie, Goose(Block), Mistral Vibe, Kiro(AWS), Databricks, Snowflake 등 **직접 경쟁사 포함**. OpenAI Codex·Copilot 자체 문서가 "agentskills.io 오픈 표준을 따른다"고 확인.
- 출시 타임라인: **2025년 10월** Claude 기능으로 출시(API 베타 헤더 `skills-2025-10-02`) → **2025-12-18** 오픈 표준으로 스펙 공개(일부 소스는 "Agentic AI Foundation"을 스튜어드로 언급).

> ⚠️ **반증된 주장:** "커뮤니티 개발이 github.com/agentskills/agentskills + 공개 Discord에서 이뤄지는 중립 거버넌스"라는 구체적 주장은 검증에서 **1-2로 반증**됐다. "벤더 중립 거버넌스"는 현재로선 **aspirational**이며 공식 스티어링 위원회·다자 거버넌스 기구는 문서화돼 있지 않다. 실제 개수는 42이고 페이지 자체가 "explore some of them"으로 비-완전 열거임을 밝힘.

### 4.2 파일 기반 표준의 채택 조건 (비교 프레임)

| 표준 | 유형 | 채택 | 시사 |
|---|---|---|---|
| **SKILL.md** | 파일 포맷 | 빠른 크로스-벤더 확산 | 최소 스펙 + 즉시 유용(킬러 유즈케이스) + 오픈 라이선스 |
| **AGENTS.md** | 파일 포맷 | 광범위 채택 | "에이전트 네이티브 레포"의 사실상 표준, Agentic AI Foundation 거버넌스 |
| **MCP** | 프로토콜 | 광범위 | 프로토콜은 구현 부담이 크지만 상호운용성 강력 |
| **llms.txt** | 파일 포맷 | 제한적 | 명확한 즉시 유용성/킬러앱 부재가 확산 제약 요인으로 지목 |

**교훈:** 파일 포맷 표준이 빠르게 퍼지려면 ① **최소 스펙**(작성 장벽 최소화), ② **점진적 채택 가능성**(기존 워크플로에 얹기), ③ **명확한 킬러 유즈케이스**, ④ **오픈 라이선스 + 구현/표준 분리**가 필요하다. (이 인과 비교는 본 검증셋에서 직접 확립되지 않은 **[Low]** 해석이며, LOOP.md 백서용으로 별도 심화 조사 권장.)

---

## 5. LOOP.md 설계에 주는 시사점 (선행 연구 매핑 + 권고)

### 5.1 당신의 설계 요소 ↔ 선행 연구 매핑

> 아래 선행 연구 중 ACE만 최종 3표 검증셋에 포함(3-0)됐고, 나머지(reward hacking 연구, SICA, 자기진화 서베이, Ralph)는 **fetch 단계에서 수집됐으나 top-25 적대 검증셋에는 미포함**이다. 인용 시 원문 재확인 권장. 신뢰도 **[Med~Low]**.

| LOOP.md 요소 (당신 다이어그램) | 가장 가까운 선행 연구/실무 | 매핑 강도 |
|---|---|---|
| **로그→증류→플레이북 진화 루프** | **ACE** (Agentic Context Engineering, arXiv 2510.04618): 컨텍스트를 "축적·정제·조직되는 플레이북"으로 다루고 generation→reflection→curation 루프로 개선, **가중치 갱신이 아닌 컨텍스트 적응** | 부분 일치 (핵심 개념 대응) |
| **재귀적 자기개선 (유전자 v0→v1→v2)** | **SICA** (Self-Improving Coding Agent, arXiv 2504.15228): 에이전트가 자기 코드베이스를 편집해 SWE-Bench Verified 부분셋 **17%→53%** | 실증 선례 |
| **불변 코어/인간 게이트/래칫/자유 변이 (변이 권한 계층)** | **자기진화 에이전트 서베이** (arXiv 2507.21046): "무엇을 진화시키나" 분류(파라미터·컨텍스트·도구·아키텍처). 당신의 "자유 변이"(프롬프트·전략·검증·도구)는 Context/Tools 축에 대응 | 개념 프레임 대응 |
| **자기보고 금지 + 독립 검증** | generator-verifier 분리 패턴; **reward hacking 연구**(OpenReview ikrQWGgxYg, ICLR 2026 워크숍): 자기보고 프록시 지표는 게이밍된다 | 강력한 동기 근거 |
| **홀드아웃 격리 + 개선 에이전트 읽기 금지** | 위 reward hacking 연구: KernelBench 최적화 **73.8%**·ALE-Bench **46.8%** 가 프록시 지표는 올렸지만 **홀드아웃 실작업 성능은 안 올림** | 설계 정당화 |
| **승격 사다리(휴리스틱→규칙→공식) + 결정론 라우터** | **SKILL.md scripts**(결정론 실행) 철학 = "공식 실행 vs LLM 폴백" | 직접 대응 |
| **반복 재사용 루프 파일 자체** | **Ralph Wiggum 루프**(ghuntley.com, 2025-07): `while :; do cat PROMPT.md \| agent; done`. Anthropic도 `ralph-wiggum` 플러그인 배포 | 실무 선례 (아래 5.3 경고) |

**중요한 공백:** 당신 설계의 **"래칫(기준 강화는 자동·단방향)"과 "홀드아웃 읽기 금지"** 는 위 선행 연구에서 직접 대응물을 찾지 못했다 — 이게 LOOP.md의 **독창적 기여점**일 가능성이 높다. 백서에서 이 둘을 전면에 내세우는 걸 권장한다.

### 5.2 SKILL.md에서 도출한 4대 실전 권고

1. **최소 필수 필드를 극단적으로 줄여라.** SKILL.md는 `name`+`description` 둘뿐이라 진입 장벽이 낮았다. LOOP.md도 필수를 `goal`(최상위 목표) + `stop-condition`(정지조건) + `verification`(검증 방식/자기보고 금지) 정도로 압축하고 나머지(불변 코어 세부, 래칫 규칙, 플레이북)는 전부 선택·번들 파일로 미뤄라.

2. **Progressive disclosure로 토큰 경제성을 확보하라.** 당신의 "불변 코어 + append-only 원시 로그"는 컨텍스트에 상주시키지 말고 **파일시스템에 두고 식별자만 노출**(just-in-time). LOOP.md 메타데이터는 SKILL.md처럼 ~100토큰 수준으로.

3. **결정론적 실행 컴포넌트를 번들하라.** "공식(라우터 결정론 실행) vs LLM 폴백"은 SKILL.md `scripts/`의 결정론 원리와 정확히 대응한다. 승격된 "공식"을 실행 가능 코드로 번들하는 걸 스펙에 넣어라. 이건 LOOP.md의 경제성 주장(결정론 비율↑, 한계비용↓)의 기술적 실현 수단이기도 하다.

4. **구현과 표준 거버넌스를 분리하라.** Anthropic의 `anthropics/skills`(구현) vs `agentskills.io`(표준) 분리가 크로스-에이전트 채택을 유도했다. 단, "중립 거버넌스"는 실제로 aspirational이었으니(§4.1 반증), **과장하지 말고** 처음부터 오픈 라이선스 + 명시적 스튜어드십 계획을 세워라.

### 5.3 ⚠️ 이름·포지셔닝 리스크 (직접 검증됨)

- **네임스페이스 충돌 실재:** GitHub `sdwolf4103/loop.md`(2026-06-16 생성, ⭐1, *"LOOP.md: a Markdown-native while loop for AI agents"*)가 **정확히 같은 이름·같은 목적**으로 이미 존재한다(2026-07-03 API 직접 확인). 별 1개짜리 초기 실험이라 **확립된 표준은 아니고 하드 블로커도 아니지만**, 선점 실사와 차별화 서사가 필요하다. (무관한 `yoshoku/loop.md`는 MS Loop→마크다운 변환 유틸.)
- **"루프 파일" 카테고리엔 사실상 기존 강자(PROMPT.md)가 있다.** Ralph Wiggum 관행에서 루프 프롬프트 파일 이름은 **PROMPT.md가 사실상 표준**이다. 따라서 LOOP.md는 단순히 "반복 실행 프롬프트 파일"로 포지셔닝하면 후발 중복이 된다. **차별점을 "목표 지향 + 재귀적 자기개선 + 독립 검증 + 홀드아웃 게이팅"이라는 완결된 루프 거버넌스**에 두어야 한다 — 여기가 PROMPT.md·SKILL.md 어느 쪽도 커버하지 않는 빈 자리다.
- **SKILL.md와의 역할 분담은 자연스럽다.** SKILL.md = 무상태·선언적 **능력**(what I can do), LOOP.md = 유상태·시간축(버저닝 v0→v1, append-only 로그)의 **목표 달성형 반복 과정**(how I repeatedly achieve & self-improve). **LOOP.md가 SKILL.md를 대체가 아니라 조합(루프가 스킬을 호출)** 하도록 설계할 것을 권장.

### 5.4 정직하게 남는 리스크

- **경제성 주장(고객 A 12회→B 5회→C 2회, 한계비용 하락)은 본 리서치에서 직접 실증 근거를 찾지 못했다.** "Don't Retrieve, Navigate"의 "구조>지능, 저가 모델로도 성능 유지"가 방향적으로만 지지한다. **검증해야 할 가설**로 명시하라.
- **재귀적 자기개선은 실재하지만(SICA) reward hacking이 만연하다(73.8%).** 당신의 홀드아웃 읽기 금지 + 인간 게이트는 옳은 직관이나, **엄밀한 구현이 성패를 가른다.** 홀드아웃 오염 방지·평가 과적합 방어를 스펙의 1급 요소로.

---

## 부록: 출처 (검증 통과 핵심)

**1차 출처 (스펙·메커니즘·근거):**
- Agent Skills 공식 스펙 — https://agentskills.io/specification , https://agentskills.io/home
- Anthropic "Equipping agents for the real world with Agent Skills" (2025-10-16) — https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- Anthropic "Effective context engineering for AI agents" (2025-09-29) — https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- `anthropics/skills` — https://github.com/anthropics/skills
- Claude 플랫폼 docs (Agent Skills overview) — https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview

**실증·선행 연구:**
- "Don't Retrieve, Navigate" (preprint, 구조>지능) — https://arxiv.org/pdf/2604.14572 **[Med]**
- ACE: Agentic Context Engineering — https://arxiv.org/abs/2510.04618
- Self-Improving Coding Agent (SICA) — https://arxiv.org/abs/2504.15228
- 자기진화 에이전트 서베이 — https://arxiv.org/html/2507.21046v4
- Reward hacking in self-improving loops (ICLR 2026 워크숍) — https://openreview.net/forum?id=ikrQWGgxYg
- Ralph Wiggum 루프 (Geoffrey Huntley) — https://ghuntley.com/ralph/

**채택·표준:**
- OpenAI Codex skills — https://developers.openai.com/codex/skills/
- "Agent-native repo / AGENTS.md" — https://www.harness.io/blog/the-agent-native-repo-why-agents-md-is-the-new-standard

**네임스페이스 (본 세션 직접 확인, 2026-07-03):**
- `sdwolf4103/loop.md` (⭐1, 2026-06-16) — 이름·목적 충돌
- `yoshoku/loop.md` (무관, MS Loop→MD 변환)

---

## 통계

- 검색 각도 5 · 소스 수집 23 · 주장 추출 115 · 검증 25 (확증 24 / 반증 1 / 미검증 0) · 에이전트 호출 105 · 서브에이전트 토큰 ~4.1M.
