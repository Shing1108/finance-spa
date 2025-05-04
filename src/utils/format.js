export function formatCurrency(amount, currency = "HKD", decimals = 2) {
    if (isNaN(amount)) return "0.00";
    return new Intl.NumberFormat("zh-HK", {
      style: "currency",
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  }