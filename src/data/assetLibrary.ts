const localAssets = Object.fromEntries(
  Object.entries(
    import.meta.glob('/src/assets/*.{jpg,jpeg,png,webp,avif,gif}', {
      eager: true,
      import: 'default',
    })
  ).map(([path, value]) => [path.split('/').pop() ?? path, String(value)])
);

export function resolveTripImage(value?: string | null): string {
  if (!value) {
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) {
    return trimmed;
  }

  const candidates = [
    trimmed,
    trimmed.replace(/^.*[\\/]/, ''),
    trimmed.replace(/^.*\/src\/assets\//, ''),
    trimmed.replace(/^\/src\/assets\//, ''),
    trimmed.replace(/^src\/assets\//, ''),
  ];

  for (const candidate of candidates) {
    if (localAssets[candidate]) {
      return localAssets[candidate];
    }
  }

  return trimmed;
}

export const tripAssetOptions = Object.keys(localAssets)
  .sort()
  .map((name) => ({
    label: name,
    value: name,
  }));
