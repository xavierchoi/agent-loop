# human-reignited-micro-loop (인간 재점화 마이크로 루프)

## 정의

필드 런에서 관찰된 실전 사용 패턴: 표준이 상정하는 "자율 다-iteration 루프"가 아니라, **각 런이 1-iteration 마이크로 루프이고 인간이 재호출을 오케스트레이션하는 바깥 루프**가 실질 반복 단위였다. 실제 반복 단위는 `run → evolve → 인간 스크린샷 비평 → run`이고, 방향전환(Δ)의 대부분을 인간 비평이 트리거했다 [LA][CX].

두 겹의 인간 노동으로 구성된다:
- **런 내(자동):** looprun이 implementer를 스폰해 pre-check→편집→verify를 1회 돌림. 진단이 정밀하면 1 iteration에 수렴.
- **런 간(수동, 인간):** ① 재점화 — 10회 재호출을 사람이 손으로 실행 ② **래칫** — 스크린샷 비평을 불변 검증자산으로 승격(verify 기준의 시간적 강화).

## 핵심 사실 (필드 런 n=1)

- **결정적 증거** [LA]: 런2가 `pre-check green` 무동작이었는데 동일 gene(v0-150bce7d)의 런3이 pre-check **fail**로 바뀜 — 사이에 인간이 ui.spec.ts를 1431→3384B로 강화해 "이미 통과하던 앱"을 다시 실패시킴. 래칫 사이클의 각 회전을 사람이 돌린 지문.
- **래칫이 스펙 밖 노동** [LA][CX]: verify 자산이 런 사이 833B→7.5K, 10줄→62줄로 단조 강화(Design read→Product read→Cognitive load→**Anti-Goodhart** 게이트). 이는 루프가 아니라 인간 비평→오케스트레이터 승격의 수동 사이클. 판정자를 시간이 갈수록 속이기 어렵게 만드는 핵심 노동이 루프 밖에 있음.
- **인간 게이트의 불가피성 실증** [CX]: 사용자가 "human gate 꼭 없이 해볼까요 — 자동화 루프가 agent loop의 핵심이라"며 게이트 제거를 **명시 시도**했으나, 자연어 taste 판정을 자기보고로 하려다 불신("왜 메타 판단하면 완벽한 결과가 안 나오나") → 정량 기준(Miller 7±2 / Cowan 4 chunks)으로 회귀. taste/주관 목표에서 인간 게이트가 불가피했던 실전 경로.
- **evolve가 기본 절차 아님** [CX]: 사용자가 "유전자 남겨 진화" 개념을 2회 상기시켜야 evolve가 돌기 시작 — 러너가 `run 후 evolve`를 파이프라인 기본값에 안 넣어 인간이 매 회 트리거.

## 판단 (성급한 결론 경계)

**이는 결함이 아니라 taste/주관 목표의 실전 사용 패턴일 수 있다** [LA]. 그러나 n=1 · 단일 도메인(UI/taste — 가장 주관적 목표 유형) · 사후 로그 기반이라, "루프는 원래 인간이 재점화한다"로 일반화할 수 없다. 객관 지표 도메인([[single-metric-verification]]의 `val_bpb` 같은)에서도 같은지는 미지. → [[loopy-era]]의 "에이전트가 루프를 스스로 닫는다" 논제와의 긴장은 [contradictions/003](../contradictions/003-autonomous-vs-human-reignited.md)에 **OPEN**으로 기록.

## 스펙과의 관계

- **[[orchestration-as-skill]]의 실전 확증**: 작업량의 절반 이상이 러너 밖(스캐폴딩·판정 설계·기준 강화·저작)에서 인간+오케스트레이터 수작업. 인간의 남는 몫이 "판정 기준과 목표의 소유권"이라는 [[harness-automation-tension]] 정리를 실측이 지지 — 단, 여기선 소유권을 넘어 **재점화·래칫 실행**까지 인간이 부담.
- **[[ratcheting-quality-gates]]의 필드 사례**: Notion 래칫은 강화=자동/완화=인간이었으나, 이 세션은 **강화 자체가 인간 수동**. taste 도메인에선 "무엇을 강화할지"의 판단이 아직 자동화 안 됨.
- v0.5 백로그 근거: **#1**(Anti-Goodhart 래칫을 1급 개념화, 런 내 불변 vs 런 간 인간승인 강화를 레이어 분리) · **#5**(HANDOFF형 크로스-세션 연속성 아티팩트 표준화) · **#6**(evolve를 기본 절차로 강제).

## 출처

- [sources/2026-field-run-moneta.md](../sources/2026-field-run-moneta.md) (내부 실측, n=1)

## 상호참조

[[orchestration-as-skill]] · [[ratcheting-quality-gates]] · [[proxy-validity]] · [[loopy-era]]
