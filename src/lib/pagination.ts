export const PAGE_SIZE = 20;

export function readPage(value: string | string[] | undefined) {
  const n = Number(typeof value === "string" ? value : "1");
  return Number.isInteger(n) && n >= 1 && n <= 10000 ? n : 1;
}
