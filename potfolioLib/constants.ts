export const CURRENCY = "₹";
export const PERCENT_PRECISION = 2;
export const MONEY_PRECISION = 2;

export const formatMoney = (value?: number) =>
  value === undefined ? "—" : `${CURRENCY}${value.toFixed(MONEY_PRECISION)}`;

export const formatPercent = (value?: number) =>
  value === undefined ? "—" : `${value.toFixed(2)}%`;
