// Composants dont les deux bornes permettent une insertion non ambigue dans
// un cable existant. Les tableaux multi-sorties restent volontairement exclus.
export const SPLICEABLE_COMPONENT_TYPES = new Set([
  "fuse",
  "circuit-breaker",
  "switch",
  "battery-switch",
  "battery-protect",
  "relay",
  "busbar",
  "splice",
]);
