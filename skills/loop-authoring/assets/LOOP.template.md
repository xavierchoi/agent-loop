---
name: CHANGE-ME                      # 소문자-하이픈, 디렉터리명과 일치 (필수)
description: >                       # 무엇을 반복 달성 + 언제 쓰는지 (필수)
  CHANGE-ME.
spec: agent-loops/0.4
goal: CHANGE-ME                      # 검증 가능한 한 문장 (필수, 생성 후 불변)
stop:                                # 상한 최소 1개 필수
  max-iterations: 15
  stagnation: 3                      # 3회 연속 무진전이면 stalled 종료
verify:                              # 판정 — 종료 코드 0 = 통과 (필수)
  run: "CHANGE-ME"
  assets: [CHANGE-ME]                # 판정 자산 경로 — Level 1 러너 실행에 필수
budget:
  per-iteration: "5m"                # iteration당 상한 = 점수 비교 공정성 장치
---

# 운영 지침

1. 직전 상태의 verify 출력에서 실패 원인을 확인한다.
2. 한 iteration에 한 단위 작업만 — 근본 원인 하나를 고친다.
3. 판정 자산(verify.assets)은 절대 수정하지 않는다. 통과의 유일한 경로는 대상을 올바르게 고치는 것이다.
4. 판정은 verify가 한다. 완료 선언을 하지 말 것.

<!-- 도메인 팁을 여기에 2~4줄 추가 -->
