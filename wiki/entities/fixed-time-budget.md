# fixed-time-budget (고정 시간 예산)

## 정의

모든 iteration에 **동일한 벽시계 시간 상한**을 부여하는 패턴. [[autoresearch]]의 실험당 5분 훈련 예산이 대표 사례.

## 핵심 사실

- 5분 = 훈련 벽시계 시간만 (시작/컴파일 제외) — 측정 대상의 경계를 명확히 정의
- 목적이 비용 통제만이 아니라 **실험 간 공정 비교**: 같은 예산에서의 val_bpb 비교라야 개선 여부 판정이 유효
- 시간당 ~12 iteration의 리듬을 만들어 하룻밤 ~100 실험이라는 처리량 설계가 가능해짐

## 스펙과의 관계

- `budget.max-duration`·`stop.max-duration`(§4.2.6, §4.2.4)의 실증 사례
- **스펙에 없는 관점:** 스펙의 budget은 루프 전체 상한(안전장치)인데, autoresearch의 예산은 **iteration당** 상한이며 목적이 '비교 가능성'이다. iteration-level budget (`per-iteration-duration` 등)은 스펙 v0.2 검토 후보 — 특히 [[single-metric-verification]]과 결합될 때 점수 비교의 전제조건이 된다
- 경제 텔레메트리(§7.6)의 "반복될수록 싸진다" 가설 검증에도 iteration당 고정 예산이 있으면 처리량 변화가 곧 효율 변화로 읽힌다

## 출처

- [sources/2026-karpathy-autoresearch-repo.md](../sources/2026-karpathy-autoresearch-repo.md)

## 상호참조

[[autoresearch]] · [[single-metric-verification]]
