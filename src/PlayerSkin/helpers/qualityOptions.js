// Quality options fed to `playerstack-settings` (defaults preserved from `qualities`).
export const mapQualityOptions = (qualities) =>
  qualities.map((quality) => ({
    label: quality.label,
    value: quality.value,
    isFullHD: quality.isFullHD,
  }));
