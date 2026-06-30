function normalizeProductName(product = {}) {
  return String(product?.name || '').trim().toLowerCase();
}

export function getProductFallbackImage(product = {}) {
  const productName = normalizeProductName(product);

  if (productName.includes('margherita')) {
    return 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80';
  }

  if (productName.includes('alfredo')) {
    return 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=400&q=80';
  }

  if (productName.includes('tiramisu')) {
    return 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80';
  }

  if (productName.includes('classic beef')) {
    return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80';
  }

  if (productName.includes('crispy fries')) {
    return 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=400&q=80';
  }

  if (productName.includes('crispy chicken')) {
    return 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&q=80';
  }

  if (productName.includes('salmon avocado')) {
    return 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80';
  }

  if (productName.includes('spicy tuna')) {
    return 'https://images.unsplash.com/photo-1648146298904-d58a8c79e0a7?w=400&q=80';
  }

  if (productName.includes('edamame')) {
    return 'https://plus.unsplash.com/premium_photo-1666318300348-a4d0226d81ad?w=400&q=80';
  }

  return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80';
}

export function getProductImage(product = {}) {
  const customImage =
    typeof product?.image === 'string' ? product.image.trim() : '';

  return customImage || getProductFallbackImage(product);
}
