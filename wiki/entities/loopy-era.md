# loopy-era

## 정의

Karpathy가 명명한, 에이전트가 코드·연구에 대한 **자기개선 루프를 스스로 닫는(close the loop)** 시대. 실험 설계 → 코드 수정 → 실행 → 측정 → 채택/폐기의 전 과정을 인간 개입 없이 반복한다.

## 핵심 사실

- 에이전트가 2025년 12월경 "coherence threshold"를 넘었다는 것이 Karpathy의 체감 — 이후 그는 코드를 직접 타이핑하지 않음
- 프런티어 랩에서 지속적 자기개선 루프가 표준이 될 것으로 예측
- 인간의 역할 이동: 코드 작성 → **하네스 설계, 검증 루프 설계, 병렬화, 오케스트레이션** → [[orchestration-as-skill]]

## 스펙과의 관계

LOOP.md 표준의 **시장 타이밍 근거.** "루프"가 프런티어 랩 내부의 사유물이 아니라 이식 가능한 패키지 표준이 되어야 한다는 주장 자체가 loopy-era 논제에 올라탄다:

- 루프가 표준이 된다면 → 루프의 **선언 형식**(goal·stop·verify)이 필요하다
- Karpathy의 [[autoresearch]]가 개별 사례를 실증 → LOOP.md는 그 일반화·표준화

## 긴장 (Ingest 005, OPEN)

첫 내부 필드 런(n=1, taste 도메인)에서 실제 반복 단위는 자율 폐쇄 루프가 아니라 **인간이 재점화하는 마이크로 루프**였다 — 10회 재호출과 verify 래칫을 인간이 수동 실행 [[human-reignited-micro-loop]]. "인간 개입 없이 루프를 닫는다"는 논제와 긴장. 반례인지 taste-도메인 한정인지 미결 → [contradictions/003](../contradictions/003-autonomous-vs-human-reignited.md)에 **OPEN**. 잠정: 객관 지표 도메인([[single-metric-verification]])에선 폐쇄가 성립할 수 있으나, 프록시 타당성([[proxy-validity]])이 없는 주관 목표에선 인간 재점화가 구조적으로 남을 가능성.

## 출처

- [sources/2026-karpathy-no-priors-interview.md](../sources/2026-karpathy-no-priors-interview.md)
- [sources/2026-field-run-moneta.md](../sources/2026-field-run-moneta.md) (긴장의 실측 근거, n=1)

## 상호참조

[[autoresearch]] · [[orchestration-as-skill]] · [[evolution-substrate]] · [[ai-scientist]] (논제의 최상급 증거 — Nature 게재 수준의 루프 닫힘) · [[human-reignited-micro-loop]]
