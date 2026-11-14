/** what a keydown event says, as far as the tap key cares; `target` is the focused element, if any */
export interface TapKeyEvent {
  readonly key: string;
  readonly repeat: boolean;
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
  readonly metaKey: boolean;
  readonly target: {readonly tagName?: string; readonly isContentEditable?: boolean} | null;
}

/** the elements that take typing: T typed there is a letter, not a tap */
const TEXT_ENTRY_TAGS: readonly string[] = ['INPUT', 'TEXTAREA', 'SELECT'];

/** the T key taps the tempo, lower or upper case; not held down, not with Ctrl, Alt or Meta, not while typing */
export function isTapKey({key, repeat, ctrlKey, altKey, metaKey, target}: TapKeyEvent): boolean {
  if (key.toLowerCase() !== 't' || repeat || ctrlKey || altKey || metaKey) {
    return false;
  }
  const isTyping = TEXT_ENTRY_TAGS.includes(target?.tagName?.toUpperCase() ?? '') || target?.isContentEditable === true;
  return !isTyping;
}
