# loop-economics (루프 경제성)

## 정의

"루프가 반복될수록 한계비용이 하락하고 반복 횟수가 준다"는 LOOP.md의 경제성 논제에 대한 증거 대차대조표. 결론: **조건부 성립**.

## 핵심 사실

**성립 조건: 개선이 재사용 가능한 결정론 아티팩트로 응고될 때**
- DC: 발견한 공식(Python 풀이)의 결정론 재실행으로 Game of 24 정확도 10%→99% [3표 검증]
- ACE: 오프라인 적응 GEPA 대비 지연 −82.3%·롤아웃 −75.1% [3표 검증]
- Voyager: 스킬 라이브러리로 새 월드 과제 제로샷(베이스라인은 50회에도 0과제) [수집]
- AlphaEvolve: 커널 엔지니어링 수개월→며칠 [수집]

**불성립 조건: 자기개선이 재학습·무제한 메타탐색일 때**
- DGM 런 $22k = 베이스라인 2.2배 [3표 검증] · SICA 반복당 비용 비단조($1.58–2.70) [수집] · [[self-improvement-failure-modes]]의 붕괴 사례들

**비용 회계의 3분할 (지지·반박 증거의 종합)**
1. 선행 발견 비용 — 상각 대상 (DC "초기 비용 non-trivial") [3표 검증]
2. 메모리 상주 비용 — DC 질의당 토큰 ×4.95 [3표 검증] → progressive disclosure로 완화
3. 검증 비용 — 지배 항 (ADAS: 비용 대부분이 발견된 에이전트의 평가) [수집]

**주의: 검증에서 사망한 오독 패턴** — "ACE FiNER −91.5%/−83.6%가 반복-축 비용 하락 증명"은 2/3 반증됨. 방법 대 방법의 1회성 비교를 반복-축 곡선으로 읽으면 안 된다. **반복-축 하락 곡선의 직접 공개 실증은 아직 없다** — 백서에서 검증 대상 가설로 명시할 것.

**첫 내부 실측 (필드 런, n=1 — moneta-live-ui)** [출처: [sources/2026-field-run-moneta.md](../sources/2026-field-run-moneta.md)]
- **벽시계** ≈ 1h58m(생산 iteration 구간 94분), 편집 소요 1m41s–4m39s·중앙 ~2.5분.
- **수렴**: 8/8 생산 런이 1 iteration에 green — 상한 6 대비 예산의 ~1/6만 소모(진단이 정밀할 때 단발 수렴). `stagnation:3` 미발동.
- **토큰**: total 31.8M 중 cached **30.49M**, output **99k**, reasoning 13k. Pro 5시간창 primary 30% 소진.
- **관찰: 반복 비용의 실체는 컨텍스트 재생** — 출력 토큰(99k)은 극소, 비용의 지배 항은 반복마다 LOOP.md+criteria+로그를 다시 읽는 대형 컨텍스트의 캐시 재생(30M cached input). 위 "비용 회계 3분할"의 항목 2(메모리 상주 비용)가 taste 도메인에서 지배적임을 시사하는 n=1 데이터.
- **계측 공백**: 러너 raw.jsonl엔 timestamp만 — **런당 토큰/모델/iteration-내부 Δ 필드 부재**. 경제성·stagnation 판정 입력이 빈약(v0.5 백로그 #8 근거). ⚠️ n=1·단일 도메인(taste)·단일 오케스트레이터라 일반화 불가.

## 스펙과의 관계

- 승격 사다리(§7.5)와 결정론 라우터는 증거가 지지하는 쪽(응고형)의 설계
- 경제 텔레메트리(§7.6 SHOULD)의 존재 이유: 미실증 가설이므로 각 인스턴스가 자기 데이터로 곡선을 그려 증명/반증하게 함
- `budget`(§4.2.6) 자릿수 기준점: ALE-Agent 대회 우승 1회 $1,300, DGM 런 $22k, ADAS 런 $300–500

## 출처

- [sources/2026-loopmd-deep-research-round2.md](../sources/2026-loopmd-deep-research-round2.md)
- [sources/2026-field-run-moneta.md](../sources/2026-field-run-moneta.md) (내부 실측, n=1)

## 상호참조

[[self-improvement-failure-modes]] · [[ale-agent]] · [[fixed-time-budget]] · [[autoresearch]] · [[human-reignited-micro-loop]]
