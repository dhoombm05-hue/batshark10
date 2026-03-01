/**
 * Utility formatters only — NO fake data.
 * All data comes from the database exclusively.
 */

export const formatCurrency = (amount: number) => {
  const formatted = new Intl.NumberFormat('ar-SA').format(Math.abs(amount));
  return amount < 0 ? `-${formatted} ريال` : `${formatted} ريال`;
};

export const formatPercent = (value: number) => `${value > 0 ? '+' : ''}${value}%`;
