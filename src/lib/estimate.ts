/**
 * Estimativa de ganho (docs/02-definicao/07-processo-to-be.md). Todas as entradas são hipóteses declaradas.
 * horas_liberadas = volume_mes × (min_manual − taxa_revisao × min_por_excecao) / 60
 * valor = horas_liberadas × custo_hora
 */
export interface EstimateInputs {
  ordersPerDay: number;
  businessDaysPerMonth: number;
  manualMinutesPerOrder: number;
  minutesPerException: number;
  hourlyCost: number;
}

export const DEFAULT_INPUTS: EstimateInputs = {
  ordersPerDay: 80,
  businessDaysPerMonth: 22,
  manualMinutesPerOrder: 8,
  minutesPerException: 4,
  hourlyCost: 38,
};

export function estimate(reviewRate: number, inputs: EstimateInputs = DEFAULT_INPUTS) {
  const monthly = inputs.ordersPerDay * inputs.businessDaysPerMonth;
  const residual = reviewRate * inputs.minutesPerException;
  const hours = (monthly * (inputs.manualMinutesPerOrder - residual)) / 60;
  return {
    monthlyOrders: monthly,
    residualMinutesPerOrder: Math.round(residual * 100) / 100,
    hoursFreed: Math.round(hours * 10) / 10,
    value: Math.round(hours * inputs.hourlyCost * 100) / 100,
  };
}
