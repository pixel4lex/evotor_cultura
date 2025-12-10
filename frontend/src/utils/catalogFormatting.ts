const PLACEHOLDER_COLORS = ['#0F172A', '#1E3A8A', '#7C3AED', '#047857', '#DC2626', '#B45309'];

export const formatPrice = (value: number) => {
  if (Number.isNaN(value)) {
    return '—';
  }

  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatQuantity = (quantity: number, measure?: string | null) => {
  if (!Number.isFinite(quantity)) {
    return '—';
  }

  const formatted = Number.isInteger(quantity)
    ? quantity.toLocaleString('ru-RU')
    : quantity.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 2 });

  return measure ? `${formatted} ${measure}` : formatted;
};

export const hashString = (input: string) => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const buildPlaceholderImage = (id: string, name: string) => {
  const paletteIndex = hashString(id || name) % PLACEHOLDER_COLORS.length;
  const background = PLACEHOLDER_COLORS[paletteIndex];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <defs>
      <radialGradient id="glow" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.25"/>
        <stop offset="60%" stop-color="#FFFFFF" stop-opacity="0.1"/>
        <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="200" height="200" fill="${background}" rx="32" ry="32"/>
    <circle cx="40" cy="40" r="80" fill="url(#glow)"/>
    <circle cx="160" cy="160" r="60" fill="url(#glow)" opacity="0.6"/>
    <rect x="20" y="120" width="40" height="4" fill="#FFFFFF" opacity="0.15" rx="2"/>
    <rect x="80" y="40" width="80" height="4" fill="#FFFFFF" opacity="0.1" rx="2"/>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const selectCatalogGradient = (id: string, gradients: string[]) => {
  if (gradients.length === 0) {
    return '';
  }
  const index = hashString(id) % gradients.length;
  return gradients[index];
};
