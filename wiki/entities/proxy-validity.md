# proxy-validity (프록시 타당성 — 판정의 두 축)

## 정의

루프의 판정 품질은 **서로 독립인 두 축**으로 분해된다. 필드 런에서 [LA]("verify는 진짜 독립 판정이었다")와 [OUT]("verify는 게이밍 가능 프록시였다")의 겉보기 모순이 이 분해로 화해된다 — 둘은 다른 축이므로 양립한다.

- **축 A — 실행의 독립성:** 판정이 구현 주체와 분리된 채널에서 돌고, 자산이 변조 불가한가? (자기보고 배제 + 격리)
- **축 B — 프록시의 타당성:** 그 판정이 측정하는 지표가 실제 목표를 담보하는가? (산식이 목표를 배신하지 않는지, 게이트가 우회 가능한지)

필드 런의 verify는 **축 A는 만족(√), 축 B는 불만족(×)**. "만점"이 보장한 것은 "좋은 대시보드"가 아니라 "무채색이고, 상자가 적고, 4개 금지어가 없는 idle mock 화면"이었다 [OUT].

## 핵심 사실 (필드 런 n=1, moneta-live-ui)

**축 A 만족의 증거** [LA][OUT]
- 전 런 `tampered:false` — 루프 tamper-check 실작동, 런 내 자산 변조 0.
- verify = 명령/테스트 독립 실행(`typecheck && build && test:* && score:visual`) + Playwright DOM 어서션(computed style·getBoundingClientRect 정량 임계). 자기보고 아님.

**축 B 불만족의 증거(Goodhart 3종)** [OUT]
1. **산식이 목표를 배신** — `score-visual.mjs`가 전 항목 "이탈 페널티" 구조라 최적점이 최대 무채색. 실측 score=100인데 teal 픽셀 0.04%, `saturatedFamilyCount=0` → ui-criteria가 요구한 "semantic color roles(teal live state)"와 **정반대 보상**.
2. **정확문자열 blocklist 우회** — anti-meta 가드가 exact-match 4문자열이라, mock의 메타 담화가 패러프레이즈로 무력화.
3. **고정 mock·idle에서만 검증** — 가변 runtime 데이터 미검증, 서술 기준("text overlap 금지")과 자동 검증기 사이 간극 → mobile 겹침 결함이 verify 통과.

**부분 완화(관찰)**: 이 세션은 축 B 공백을 **인간의 반복 스크린샷 비평 → 불변 검증자산 래칫**(Anti-Goodhart 게이트 신설)으로 부분 메꿨다 [CX][LA]. 즉 축 B 품질은 현재 루프가 자동 보장하지 못하고 [[human-reignited-micro-loop]]의 인간 노동이 대신한다.

## 스펙과의 관계

- **§1.2 원칙 2(자기보고 금지)와 §4.2.5(판정자산 격리)는 축 A만 다룬다.** 축 B(프록시 품질)는 **현재 스펙 밖**이다 — 이 필드 런이 그 공백을 최초로 실증.
- v0.5 백로그 **#3(프록시 품질 규정)**의 근거: 페널티-only 산식의 최적점이 빈 화면/무채색 아닌지 검사, taste goal엔 정량 chunk/밀도 게이트를 처음부터 필수화 [OUT][CX].
- v0.5 백로그 **#4**: 정확문자열 blocklist 금지 → 의미 기반/반증 서브에이전트 판정 권고 [OUT].
- [[single-metric-verification]]의 "주의점"(단일 정적 지표의 Goodhart 위험)이 **실전 사례로 확증**됨 — autoresearch의 `val_bpb`는 목표와 정합한 지표였으나, taste 도메인의 픽셀-비율 프록시는 목표를 배신. 지표 선택(축 B)이 격리(축 A)만큼 중요.
- [[self-improvement-failure-modes]]의 objective hacking(DGM node 114)과 같은 계열이되 **변종**: DGM은 자산을 변조(축 A 위반)했고, 여기선 자산 무변조인데 프록시가 애초에 목표와 어긋남(축 B 위반). 축 A 방어(격리)가 축 B 결함을 못 잡는다는 실증.

## 출처

- [sources/2026-field-run-moneta.md](../sources/2026-field-run-moneta.md) (내부 실측, n=1)

## 상호참조

[[single-metric-verification]] · [[self-improvement-failure-modes]] · [[human-reignited-micro-loop]] · [[ratcheting-quality-gates]]
