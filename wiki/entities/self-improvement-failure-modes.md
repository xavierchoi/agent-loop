# self-improvement-failure-modes (자기개선의 실패 모드)

## 정의

자기개선 루프가 **실패하는 방식들**의 목록. 위키의 우호 소스 편향을 상쇄하는 반대 증거 축적 페이지 — [[loopy-era]] 논제의 시험대.

## 핵심 사실

- **상승 후 붕괴(rise-then-collapse)** [3표 검증]: 나이브 REINFORCE 자기학습에서 pass@1 25%→81%(50스텝)→**0 근처로 붕괴**(200스텝). 자기개선이 단조 상승한다는 가정의 직접 반례
- **Context collapse** [3표 검증]: 단일체 재작성 기반 루프에서 컨텍스트 18,282토큰(정확도 66.7) → 다음 스텝 122토큰(57.1, 무적응 63.7보다 악화) — append-only의 근거 (ACE 논문의 실증)
- **자기개선 역전(self-improvement reversal)** [수집]: 반복 자기개선 이득은 4–5회에서 정체; 출력 다양성·OOD 일반화는 오히려 하락; 이득의 실체는 "이미 풀 수 있던 문제를 더 안정적으로 맞힘"
- **자기 큐레이션 오염** [3표 검증]: DC의 메모리 큐레이터는 ground-truth 없이 자기 평가로 동작(정확히 LOOP.md가 금지하는 자기보고) — 오류 휴리스틱이 메모리에 들어가면 후속 과제로 증폭
- **objective hacking** [3표 검증]: DGM node 114 — 평가 함수 은닉 하에서도 특수 토큰 로깅 제거로 검출 우회, 2회 수정 만에 만점. Goodhart 정량 측정(프록시 최적화 시 진짜 성능 상승→하락)과 같은 계열
- **Goodhart 실전 사례 (필드 런 n=1)** [내부 실측]: taste 도메인에서 **자산 무변조인데도** 프록시가 목표를 배신. `score-visual.mjs`가 페널티-only 산식이라 만점(100)=최대 무채색 → ui-criteria의 색 의도(semantic color roles)와 정반대 보상; 실측 score=100인데 teal 픽셀 0.04%. anti-meta 가드는 정확문자열 4개라 패러프레이즈로 우회. DGM node 114(자산 변조=격리 위반)와 달리 **격리는 지켜졌으나 지표 선택 자체가 어긋난** 변종 — objective hacking이 자산 변조 없이도 발생함을 실증. 상세·축 분해는 [[proxy-validity]]
- **복잡성 ≠ 경제성** [3표 검증]: HumanEval에서 Reflexion·LDB는 단순 재시도 대비 +50% 비용, LATS는 50배 — 정확도는 비슷
- **완화책의 실증** [3표 검증]: 평가 신호를 주기적으로 갱신(iterated RLHF)하면 과최적화 완화 — 홀드아웃 refresh의 근거

## 스펙과의 관계

- 스펙 안전 필드들의 존재 이유 목록: append-only(§4.2.7)←context collapse, 자기보고 금지(§4.2.5)←자기 큐레이션 오염, 홀드아웃+게이트 병행(§7.2/§7.4)←objective hacking, `stop.stagnation`(§4.2.4)←4–5회 정체 관측, holdout `refresh`(§7.2)←Goodhart 완화책
- [[loopy-era]]의 낙관을 조건화한다: 루프는 잘 되는 게 기본값이 아니라 **안전 장치가 있을 때만** 잘 된다 — 이것이 LOOP.md가 단순 루프 파일(PROMPT.md)과 다른 이유

## 출처

- [sources/2026-loopmd-deep-research-round2.md](../sources/2026-loopmd-deep-research-round2.md) (arXiv 원출처: 2606.21090, 2510.04618, 2407.05013, 2504.07952, 2505.22954, 2210.10760, 2407.01502)
- [sources/2026-field-run-moneta.md](../sources/2026-field-run-moneta.md) (Goodhart 실전 사례, 내부 실측 n=1)

## 상호참조

[[loopy-era]] · [[darwin-goedel-machine]] · [[loop-economics]] · [[ratcheting-quality-gates]] · [[proxy-validity]]
