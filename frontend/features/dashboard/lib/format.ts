export function formatNumber(value: number) {
  return value.toLocaleString("th-TH");
}

export function formatBaht(value: number) {
  return `${formatNumber(value)} บาท`;
}
