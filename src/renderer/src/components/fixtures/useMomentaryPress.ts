import {PointerEvent, useEffect, useEffectEvent, useState} from 'react';

import {createMomentaryPress} from '@/data/momentaryPress';
import {selectChannelValue} from '@/state/channels/channelsSelectors';
import {selectChannelLimit} from '@/state/lock/lockSelectors';
import {useAppStore} from '@/state/store';

/** `PointerEvent.button` of the left mouse button, a pen tip or a touch */
const PRIMARY_BUTTON = 0;

export interface MomentaryButtonHandlers {
  onPointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
}

/**
 * The pointer handlers of a channel's momentary position buttons: a press sets the position, a release, leaving the
 * button or the window losing focus puts back the value from before. Also released when the buttons disappear
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

  const release = () => {
    const state = useAppStore.getState();
    const restored = press.released(selectChannelValue(state, channel), selectChannelLimit(state, channel));
    if (restored !== undefined) {
      onChange(channel, restored);
    }
  };
  const releaseOutsideRender = useEffectEvent(release);

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
      if (event.button !== PRIMARY_BUTTON) {
        return;
      }
      // a touch captures the pointer to the button, so sliding the finger off it would never leave it
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      const pressed = press.pressed(position, shown, limit);
      if (pressed !== undefined) {
        onChange(channel, pressed);
      }
    },
    onPointerUp: release,
    onPointerLeave: release,
    onPointerCancel: release
  });
}
