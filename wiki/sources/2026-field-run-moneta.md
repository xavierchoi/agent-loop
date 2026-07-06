# 소스 레코드 — 필드 런 moneta-live-ui (2026-07-06)

- **유형:** 내부 실측 (필드 런, **n=1**)
- **신뢰도:** ⚠️ 단일 세션 대용치. 일반화 불가 — n=1 · 단일 도메인(UI/taste, 가장 주관적 목표 유형) · 단일 오케스트레이터(Codex/GPT-5) · 분석은 핸드오프된 **사후 아티팩트/로그 기반**(실시간 관찰 아님).
- **접근일:** 2026-07-06
- **원문 위치(프로젝트 내):**
  - 주 소스(종합): `research/field-runs/2026-07-06-moneta-live-ui.md`
  - 근거 partial: `research/field-runs/partials/loop-artifacts.md` **[LA]** · `partials/codex-session.md` **[CX]** · `partials/outcome.md` **[OUT]**
- **대상 세션:** `xavierchoi/agent-loop`(우리 표준)을 홈서버에서 clone → 실제 `looprun.mjs`/`evolve.mjs`로 구동한 **통제 세션**(LOOP.md 프론트매터 완비, 야생 세션 아님). Codex(GPT-5)가 루프 저작·러너 운영·판정자산 구현 3역 겸임, 앱 반복 편집만 러너가 스폰한 별도 implementer 담당. 결과물: Tauri/React 회의 대시보드 v0. 도메인(회의) 내용 인용 없음 — 구조 관찰만.

> 이 프로젝트 **최초의 자기 생성 필드 데이터**. 기존 소스는 전부 외부 논문·인터뷰였고, 이건 우리 표준을 실제 구동해 나온 실측이다.

## 핵심 digest (출처 표기: [LA]/[CX]/[OUT])

**규모·수렴**
- 본런 9회 + evolve 7회, 벽시계 ≈ 1h58m(생산 구간 94분) [LA][CX].
- **8/8 생산 런이 1 iteration에 green** — `max-iterations:6` 예산의 ~1/6만 소모, `stagnation:3` 미발동 [LA].
- 편집 소요 1m41s–4m39s, 중앙 ~2.5분(최장은 score 게이트 도입 런) [LA].

**토큰(Codex 계측)**
- total 31.8M(cached **30.49M**, output 99k, reasoning 13k), 컨텍스트 윈도 258,400 [CX].
- 비용 실체 = 대형 컨텍스트 캐시 재생(반복마다 LOOP.md+criteria+로그 재독). **출력은 99k로 매우 적음** [CX].
- 단, **러너 로그(raw.jsonl)엔 토큰/모델 미기록**(timestamp만) [LA].

**표준이 작동한 것**
- 전 런 `tampered:false` — 런 내 verify 자산 변조 0, §4.2.5 격리의 실전 증거 [LA].
- verify = `typecheck && build && test:* && score:visual` 독립 실행 + Playwright DOM 어서션(computed style·getBoundingClientRect 정량 임계) → 자기보고 아님 [LA][OUT].
- 유전자 v0→v7 선형 parent 체인 무결, gene 해시 = `loop-md-sha256` 프리픽스 일치. 각 세대 추가 규칙이 직전 런의 구체 fix로 역추적(v6 tile통합←런9, v7 score규칙←런10) — 표류 아닌 경험 학습 [LA].

**표준 공백(관찰)**
- **인간 수동 래칫이 스펙 밖 노동**: verify 자산 833B→7.5K·10줄→62줄 단조 강화가 루프가 아니라 인간 스크린샷 비평→오케스트레이터 승격 사이클. 런2(green 무동작)→런3(동일 gene가 pre-check fail)이 결정적 증거(사이에 ui.spec.ts 1431→3384B 강화) [LA][CX].
- **정제에 canonical dedup 부재**: playbook 24건이 실질 ~5 인사이트로 환원. "장식배경 제거" 1개가 단복수만 다른 5 id로 파편화→각 ep=1→promote-k=2 미달로 전부 heuristic; 반대로 shared-layer 군집은 같은 3런을 3 rule이 ep=3으로 삼중 계상 → 양방향 신호 왜곡 [LA].
- **HANDOFF.md 자생**: 스펙 산출물 아닌 인수인계 요약이 자생 — 크로스-세션 연속성 공백 증거 [LA].
- **실구조 = "인간이 재점화하는 마이크로 루프"**: 각 런은 1-iteration, 10회 재호출을 인간이 오케스트레이션. 사용자가 "human gate 없이" 명시 시도했으나 자연어 taste 자기보고→불신→정량 기준 회귀 [LA][CX].

**프록시 타당성 결함(Goodhart 실사례)**
- `score-visual.mjs`가 페널티-only 산식 → **만점(100)=최대 무채색**. 실측 score=100인데 teal 0.04%·saturatedFamilyCount=0 → 기준의 색 의도(semantic color roles)와 정반대 보상 [OUT].
- meta-copy 가드가 정확문자열 4개(`'design review','UI 기준','루프의 판정','assets가 확정'`) → mock 콘텐츠의 메타 담화가 패러프레이즈로 우회 [OUT].
- 전체가 고정 mock·idle 화면에서만 검증. ui-criteria 30행이 "text overlap" 금지하나 어떤 테스트도 수직 겹침 미검출 → **mobile 헤더 nav↔status pill 겹침 실제 발생, verify 통과** [OUT].
- 결과물: desktop /room은 완성도 목표 도달(Cohere풍 절제), 그러나 `live` 모드 타입 스텁뿐 미구현·mobile 겹침 잔존 [OUT].
