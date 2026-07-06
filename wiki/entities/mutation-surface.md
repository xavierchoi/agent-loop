# mutation-surface (변이 표면)

## 정의

자기개선 시스템에서 **에이전트가 수정할 수 있는 영역을 명시적으로 제한**하는 패턴.

## 핵심 사실

[[autoresearch]]의 "단일 파일 수정 원칙":

| 파일 | 권한 | 의미 |
|---|---|---|
| `train.py` | 에이전트 수정 가능 | 변이 표면 |
| `prepare.py` | 수정 금지 | 불변 인프라 |
| `program.md` | 인간만 수정 | 스키마/유전자 |

효과: 범위 관리(에이전트가 데이터 준비·측정 코드를 건드려 지표를 오염시키는 것 방지) + 실험 간 비교 가능성 유지.

선례 계보: AlphaEvolve `# EVOLVE-BLOCK` 마커 → autoresearch 파일 단위 분리 → LOOP.md `<!-- LOOP:FREE -->` 마커.

## 스펙과의 관계

- `mutable` 필드(§7.3)와 본문 `<!-- LOOP:FREE -->` 마커의 실증 사례
- autoresearch에서 `prepare.py`(측정·데이터 코드) 보호는 스펙의 "`verify`를 `free`/`ratchet`에 넣어서는 안 된다(MUST NOT)"와 정확히 같은 동기 — **측정 장치를 변이 표면에서 제외해야 objective hacking을 구조적으로 막는다**
- 차이: autoresearch는 유전자(`program.md`)를 인간 전용으로 고정 (Evolution 확장 없는 Level 1 상당). LOOP.md는 §7에서 유전자 일부의 자동 진화까지 선언 가능

## 출처

- [sources/2026-karpathy-autoresearch-repo.md](../sources/2026-karpathy-autoresearch-repo.md)

## 상호참조

[[autoresearch]] · [[evolution-substrate]]
