import {MouseEvent, PointerEvent, useEffect, useEffectEvent, useRef, useState} from 'react';

import {createMomentaryPress} from '@/data/momentaryPress';
import {selectChannelValue} from '@/state/channels/channelsSelectors';
import {selectChannelLimit} from '@/state/lock/lockSelectors';
import {useAppStore} from '@/state/store';

/** `PointerEvent.button` of the left mouse button, a pen tip or a touch */
const PRIMARY_BUTTON = 0;

const MOUSE_POINTER = 'mouse';

export interface MomentaryButtonHandlers {
  onPointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerLeave: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerCancel: (event: PointerEvent<HTMLButtonElement>) => void;
  onContextMenu: (event: MouseEvent<HTMLButtonElement>) => void;
}

/**
 * The pointer handlers of a channel's momentary position buttons: a press sets the position, its release, leaving the
 * button or the window losing focus puts back the value from before. Only the pointer that pressed releases it, so a
 * second finger or the mouse passing over another button doesn't. Also released when the buttons disappear
 * mid-press (mode or project switch), so a value never stays stuck. `shown` and `limit` are the channel's value
 * after the cap and its cap, as rendered; the release reads the current ones from the store, since it can run
 * outside a render.
 */
export function useMomentaryPress(
  channel: number,
  shown: number,
  limit: number | undefined,
  onChange: (channel: number, value: number) => void
): (position: number) => MomentaryButtonHandlers {
  const [press] = useState(createMomentaryPress);
  const lastPointerType = useRef(MOUSE_POINTER);

  const release = (pointerId?: number) => {
    const state = useAppStore.getState();
    const restored = press.released(selectChannelValue(state, channel), selectChannelLimit(state, channel), pointerId);
    if (restored !== undefined) {
      onChange(channel, restored);
    }
  };
  const releaseOutsideRender = useEffectEvent(() => release());
  const releasePointer = (event: PointerEvent) => release(event.pointerId);

  useEffect(() => {
    const onBlur = () => releaseOutsideRender();
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('blur', onBlur);
      releaseOutsideRender();
    };
  }, []);

  return (position) => ({
    onPointerDown: (event) => {
      lastPointerType.current = event.pointerType;
      if (event.button !== PRIMARY_BUTTON) {
        return;
      }
      // a touch captures the pointer to the button, so sliding the finger off it would never leave it
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      const pressed = press.pressed(position, shown, limit, event.pointerId);
      if (pressed !== undefined) {
        onChange(channel, pressed);
      }
    },
    onPointerUp: releasePointer,
    onPointerLeave: releasePointer,
    onPointerCancel: releasePointer,
    // holding a button on a touchscreen is a long press, which opens the context menu: it must not set the lowest
    // value like a right click does; a right click with the mouse still does
    onContextMenu: (event) => {
      if (lastPointerType.current !== MOUSE_POINTER) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  });
}
