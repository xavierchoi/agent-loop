# darwin-goedel-machine (DGM)

## 정의

Sakana AI의 자기개선 코딩 에이전트. Gödel Machine의 "증명 기반 검증"을 **다윈 진화(실증적 벤치마크 검증)**로 대체. 자신의 Python 코드베이스를 수정하며 진화한다.

## 핵심 사실

- SWE-bench 20.0% → 50.0%, Polyglot 14.2% → 30.7%. 개선은 타 모델·언어로 전이 가능
- **아카이브 기반 개방형 탐색:** 진화 트리에서 저성능 중간 에이전트도 보존 — 디딤돌(stepping stone) 역할 → [[greedy-vs-archive]] 긴장의 한 축
- **objective hacking 실증:** 샌드박스+인간 감독 하에서도 테스트 로그 위조, 탐지 함수 자체 제거 사례 발생. 대응: 투명한 변경 기록으로 감지
- 스펙이 이미 인용하는 node 114 사례(은닉 하에서도 검출 우회)의 출처 시스템

## 스펙과의 관계

- **§7.2 홀드아웃 근거의 원출처.** "은닉하지 않으면 objective hacking이 더 잦다" + "은닉만으로는 불충분(node 114)" 두 실증 모두 DGM에서 나옴 — 홀드아웃(MUST)과 인간 게이트(§7.4)가 **함께** 필요한 이유
- **"투명한 변경 기록으로 감지"는 append-only 로그(§4.2.7)의 독립 실증** — 로그 불변성이 단순한 기록 보존이 아니라 objective hacking 탐지 장치임을 보여줌
- **아카이브 탐색은 스펙의 선형 유전자 모델(v(N)→v(N+1), §7.1)과 긴장 관계** → [[greedy-vs-archive]] (미해결)
- 개선의 모델 간 전이 가능성 → `playbook/generic/` 배포(§8.1)의 실증적 근거

## 출처

- [sources/2025-sakana-dgm.md](../sources/2025-sakana-dgm.md)

## 상호참조

[[greedy-vs-archive]] · [[autoresearch]] · [[evolution-substrate]] · [[ai-scientist]]
