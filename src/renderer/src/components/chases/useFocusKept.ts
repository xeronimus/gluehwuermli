import {useLayoutEffect, useRef} from 'react';

/** the attribute naming a field across renders: a row moved to another group is a new element, its field the same */
const FOCUS_KEY_ATTRIBUTE = 'data-focus-key';

/**
 * Keeps the focus where it went when a channel field was left. Sorting may move that element in the table (the row's
 * value field, reached with Tab), and a moved element loses its focus in the browser; a row moved to another group is
 * even a new element, found again by its `data-focus-key`.
 */
export function useFocusKept<T extends HTMLElement>() {
  const editorRef = useRef<T>(null);
  const focusAfterRender = useRef<HTMLElement | undefined>(undefined);

  useLayoutEffect(() => {
    const target = focusAfterRender.current;
    focusAfterRender.current = undefined;
    if (!target) {
      return;
    }
    const focusKey = target.getAttribute(FOCUS_KEY_ATTRIBUTE);
    const element =
      target.isConnected || focusKey === null
        ? target
        : editorRef.current?.querySelector<HTMLElement>(`[${FOCUS_KEY_ATTRIBUTE}="${CSS.escape(focusKey)}"]`);
    if (element?.isConnected && document.activeElement !== element) {
      element.focus();
    }
  });

  /** the element that got the focus (null when it went nowhere) keeps it once the rows are sorted and grouped */
  const keepFocusOn = (nextFocus: EventTarget | null) => {
    focusAfterRender.current = nextFocus instanceof HTMLElement ? nextFocus : undefined;
  };

  return {editorRef, keepFocusOn};
}
