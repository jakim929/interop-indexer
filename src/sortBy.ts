// Sorts array ascending by the score returned by scoreFn
export const sortBy = <T, S extends number | bigint>(
  arr: T[],
  scoreFn: (item: T) => S,
): T[] => {
  return [...arr].sort((a, b) => {
    if (scoreFn(a) < scoreFn(b)) {
      return -1
    } else if (scoreFn(a) > scoreFn(b)) {
      return 1
    } else {
      return 0
    }
  })
}
