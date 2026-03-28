export const formatKoboToNaira = (amount: number | string): string => {
  const value = Number(amount) / 100;

  return value.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};