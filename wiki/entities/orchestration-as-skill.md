# orchestration-as-skill (오케스트레이션이 곧 스킬)

## 정의

Karpathy의 "Skill Issue" 논제: 에이전트 시대에 인간의 핵심 역량은 코드 작성이 아니라 **하네스 설계, 에이전트 성격·메모리 설계, 병렬화, 검증 루프 설계**다. 일이 안 되면 모델 능력의 한계가 아니라 설계자의 "skill issue"다.

## 핵심 사실

- Karpathy는 2025년 12월 이후 코드를 직접 타이핑하지 않고, 하루 16시간 에이전트에게 의지를 "manifest"
- 병목의 이동: 타이핑 → 오케스트레이션 (무엇을, 어떤 검증으로, 어떤 예산에서 반복시킬 것인가)
- 부작용 개념 "AI psychosis": 최전선 불안 + 무한 가능성 + 모든 실패가 자기 설계 탓이라는 감각

## 스펙과의 관계

LOOP.md 표준은 "오케스트레이션 스킬"을 **파일 포맷으로 물화(reify)한 것**이다:

| 오케스트레이션 스킬 | LOOP.md 대응 |
|---|---|
| 검증 루프 설계 | `verify` (§4.2.5) |
| 예산·정지 설계 | `stop`·`budget` (§4.2.4–6) |
| 에이전트 메모리 설계 | 로그·플레이북·wiki (§4.2.7, §7.5) |
| 하네스 재사용·공유 | 배포 (§8) |

즉, 잘 설계된 LOOP.md는 오케스트레이션 스킬의 **저장·배포 가능한 단위**가 된다. "skill issue를 패키징한다"가 표준의 마케팅 문장 후보.

인간의 남는 역할(큐레이션·방향 설정)은 llm-wiki 설계(`design/llm-wiki-for-agent-loops.md`)의 인간 역할과 동일한 구도.

## 출처

- [sources/2026-karpathy-no-priors-interview.md](../sources/2026-karpathy-no-priors-interview.md)

## 반론 (Ingest 003)

[[meta-harness]]가 하네스 설계 자체를 자동화해 수동 설계를 초과 — "인간의 스킬" 층이 이미 자동화 대상. [[harness-automation-tension]]에서 층위 이동으로 정리: 인간 몫은 설계 노동이 아니라 **판정 기준(`goal`·`verify`)과 목표의 소유권**으로 좁혀진다.

## 상호참조

[[loopy-era]] · [[autoresearch]] · [[meta-harness]] · [[harness-automation-tension]]
