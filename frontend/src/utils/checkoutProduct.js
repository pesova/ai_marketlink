/**
 * Normalize chat/API product shapes for checkout & product modal.
 */
export function normalizeCheckoutProduct(p, qty = 1) {
  if (!p) return null;
  const id = p._id ?? p.id;
  const stock = p.quantity ?? p.stock ?? 0;
  const vendorLabel =
    typeof p.vendor === "string"
      ? p.vendor
      : p.vendor?.businessName ||
        [p.vendor?.firstName, p.vendor?.lastName].filter(Boolean).join(" ").trim() ||
        p.vendorName ||
        "Vendor";
  const cat =
    typeof p.category === "string"
      ? p.category
      : p.category != null
        ? String(p.category)
        : "—";
  return {
    _id: id,
    id,
    name: p.name || "Product",
    category: cat,
    price: Number(p.price) || 0,
    stock: Number(stock),
    qty: Math.min(Math.max(1, Number(qty) || 1), Math.max(1, Number(stock) || 99)),
    description: p.description || "",
    imageUrl: p.imageUrl || "",
    vendor: vendorLabel,
    rating: p.rating,
    reviews: p.reviews,
    images: p.images,
  };
}

export function formatDeliveryAddressLines(a) {
  if (!a) return "";
  const parts = [
    [a.fullName, a.phone].filter(Boolean).join(" · "),
    a.street,
    [a.city, a.state].filter(Boolean).join(", "),
  ].filter(Boolean);
  if (a.landmark) parts.push(`Landmark: ${a.landmark}`);
  return parts.join("\n");
}
