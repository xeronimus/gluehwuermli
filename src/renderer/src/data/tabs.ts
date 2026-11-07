/** the keys that switch between tabs (the WAI-ARIA tabs pattern): the arrows wrap around, Home and End go to the ends */
const TAB_KEY_TARGETS: Partial<Record<string, (current: number, count: number) => number>> = {
  ArrowRight: (current, count) => (current + 1) % count,
  ArrowLeft: (current, count) => (current - 1 + count) % count,
  Home: () => 0,
  End: (_current, count) => count - 1
};

/** the index of the tab a key press switches to, or undefined for a key that doesn't switch tabs */
export function tabAfterKey(current: number, key: string, count: number): number | undefined {
  const target = TAB_KEY_TARGETS[key];
  return target && count > 0 ? target(current, count) : undefined;
}
