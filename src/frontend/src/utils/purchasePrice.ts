import type { Purchase, Product } from '../backend';

/**
 * Get the most recent purchase price for a given product.
 * Returns the selling price from the latest purchase matching the product name,
 * or falls back to the product's default price if no purchases exist.
 */
export function getLatestPurchasePrice(
  productName: string,
  purchases: Purchase[],
  fallbackPrice: number
): number {
  if (!productName || purchases.length === 0) {
    return fallbackPrice;
  }

  // Filter purchases matching the product name
  const matchingPurchases = purchases.filter(
    (p) => p.item.toLowerCase() === productName.toLowerCase()
  );

  if (matchingPurchases.length === 0) {
    return fallbackPrice;
  }

  // Sort by purchase date descending (most recent first)
  const sortedPurchases = [...matchingPurchases].sort((a, b) => {
    const dateA = Number(a.purchaseDate);
    const dateB = Number(b.purchaseDate);
    return dateB - dateA;
  });

  // Return the selling price from the most recent purchase
  return sortedPurchases[0].sellingPrice;
}
