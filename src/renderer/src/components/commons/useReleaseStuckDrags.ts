import {useEffect} from 'react';

import {createDragReleaseTracker} from '@/data/dragRelease';

/** capture on the window: seen before react-range's listeners on the document, so a stuck move never reaches them */
const CAPTURE = {capture: true} as const;

/**
 * Ends a fader drag whose mouseup got lost (released outside the window, focus lost while dragging). react-range only
 * ends a drag on a mouseup on the document; without one, the fader follows the pointer with no button pressed and
 * keeps sending DMX values. This sends it the missing mouseup.
 */
export function useReleaseStuckDrags(): void {
  useEffect(() => {
    const tracker = createDragReleaseTracker();
    const releaseDrag = () => document.dispatchEvent(new MouseEvent('mouseup'));
    const onMouseDown = (event: MouseEvent) => tracker.pressed(event.button);
    const onMouseUp = (event: MouseEvent) => {
      if (event.isTrusted) {
        tracker.released();
      }
    };
    const onMouseMove = (event: MouseEvent) => {
      if (tracker.isStuckOnMove(event.buttons)) {
        // this move is from a released button: the fader must not follow it
        event.stopPropagation();
        releaseDrag();
      }
    };
    const onBlur = () => {
      if (tracker.isStuckOnBlur()) {
        releaseDrag();
      }
    };

    window.addEventListener('mousedown', onMouseDown, CAPTURE);
    window.addEventListener('mouseup', onMouseUp, CAPTURE);
    window.addEventListener('mousemove', onMouseMove, CAPTURE);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('mousedown', onMouseDown, CAPTURE);
      window.removeEventListener('mouseup', onMouseUp, CAPTURE);
      window.removeEventListener('mousemove', onMouseMove, CAPTURE);
      window.removeEventListener('blur', onBlur);
    };
  }, []);
}
