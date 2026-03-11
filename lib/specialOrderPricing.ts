type SpecialOrderPricedProduct = {
  id?: string | number | null;
  weight?: string | number | null;
  dimensions?: {
    length?: string | number | null;
    width?: string | number | null;
    height?: string | number | null;
  } | null;
};

export type { SpecialOrderPricedProduct };

export function calculateSpecialOrderFee(product: SpecialOrderPricedProduct) {
  const weight = parseFloat(String(product.weight || 0));

  const length = parseFloat(String(product.dimensions?.length || 0));
  const width = parseFloat(String(product.dimensions?.width || 0));
  const height = parseFloat(String(product.dimensions?.height || 0));

  const volume = length * width * height;

  const weightFee = weight * 0.75;
  const sizeFee = (volume / 5000) * 0.5;

  return Number((weightFee + sizeFee).toFixed(2));
}
