// 실험용 소스 (Run B). Run A와 같은 3계열의 다른 함수 — off-by-one, 정렬 비교자, 경계 미처리.
// 테스트는 정확하다. 통과시키려면 src만 올바르게 고쳐라.

// [off-by-one] xs[start..end] 를 end 포함으로 곱해야 한다. 버그: i < end (end 미포함).
export function productInclusive(xs, start, end) {
  let p = 1;
  for (let i = start; i < end; i++) p *= xs[i];
  return p;
}

// [정렬 비교자] 절댓값 기준 오름차순 정렬이어야 한다. 버그: 절댓값이 아닌 부호값 기준.
export function sortByAbs(xs) {
  return [...xs].sort((a, b) => a - b);
}

// [경계 미처리] 원소가 2개 미만이면 NaN 을 반환해야 한다. 버그: 경계 미처리로 undefined 반환.
export function secondLargest(xs) {
  const s = [...xs].sort((a, b) => b - a);
  return s[1];
}
