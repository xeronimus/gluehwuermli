/** `MouseEvent.button` of the left button, the one that drags a fader */
const PRIMARY_BUTTON = 0;

/** the left button's bit in `MouseEvent.buttons` */
const PRIMARY_BUTTON_BIT = 1;

export interface DragReleaseTracker {
  pressed: (button: number) => void;
  released: () => void;
  /** whether a drag is still going on although the left button is no longer down: its mouseup got lost */
  isStuckOnMove: (buttons: number) => boolean;
  /** whether a drag is going on when the window loses focus: its mouseup will never reach the page */
  isStuckOnBlur: () => boolean;
}

/**
 * Tells when a drag lost its mouseup: released outside the window, or the window lost focus while dragging. A slider
 * that waits for the mouseup to end its drag then follows the pointer with no button pressed. Reports a stuck drag
 * once; it counts as released after that.
 */
export function createDragReleaseTracker(): DragReleaseTracker {
  let dragging = false;

  const endIfDragging = (stuck: boolean) => {
    const wasStuck = dragging && stuck;
    if (wasStuck) {
      dragging = false;
    }
    return wasStuck;
  };

  return {
    pressed: (button) => {
      if (button === PRIMARY_BUTTON) {
        dragging = true;
      }
    },
    released: () => {
      dragging = false;
    },
    isStuckOnMove: (buttons) => endIfDragging((buttons & PRIMARY_BUTTON_BIT) === 0),
    isStuckOnBlur: () => endIfDragging(true)
  };
}
