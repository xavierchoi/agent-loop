// 실험용 소스 (Run A). 각 함수에 의도적 버그 1개 — 계열: off-by-one, 정렬 비교자, 경계 미처리.
// 테스트는 정확하다. 통과시키려면 src만 올바르게 고쳐라.

// [off-by-one] xs[start..end] 를 end 포함으로 합산해야 한다. 버그: i < end (end 미포함).
export function sumInclusive(xs, start, end) {
  let sum = 0;
  for (let i = start; i < end; i++) sum += xs[i];
  return sum;
}

// [정렬 비교자] 내림차순 정렬이어야 한다. 버그: a - b (오름차순).
export function sortDescending(xs) {
  return [...xs].sort((a, b) => a - b);
}

// [경계 미처리] 원소가 2개 미만이면 NaN 을 반환해야 한다. 버그: 경계 미처리로 undefined 반환.
export function secondSmallest(xs) {
  const s = [...xs].sort((a, b) => a - b);
  return s[1];
}
