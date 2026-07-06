// 간단한 통계 유틸리티. 의도적으로 심어둔 버그 2개가 있다 (러너 실험용).

export function mean(xs) {
  if (!Array.isArray(xs) || xs.length === 0) return NaN;
  let sum = 0;
  for (const x of xs) sum += x;
  // BUG 1: length - 1 로 나눔 (올바른 평균이 아님)
  return sum / (xs.length - 1);
}

export function median(xs) {
  if (!Array.isArray(xs) || xs.length === 0) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  // BUG 2: 짝수 길이일 때 두 중앙값의 평균을 내지 않고 한쪽만 반환
  return s[mid];
}

export function range(xs) {
  if (!Array.isArray(xs) || xs.length === 0) return NaN;
  return Math.max(...xs) - Math.min(...xs);
}
