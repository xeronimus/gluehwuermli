import {cappedValue, isWithinCap} from './channelLocks';

export interface MomentaryPress {
  /**
   * the value to send on press, or undefined: a press is already held, the channel already has it, or it is above
   * the cap. `shown` is the channel's value after the cap (what the buttons show), the one a release puts back;
   * `pointerId` is the pointer pressing, the only one that releases it
   */
  pressed: (position: number, shown: number, limit: number | undefined, pointerId: number) => number | undefined;
  /**
   * the value to send on release, once per press; undefined if nothing is held, or if the channel no longer has the
   * pressed value: something else set it meanwhile (a chase step, Emergency off), and that newer value stays.
   * `stored` is the store's value before the cap: with the channel lock turned on during the press, the shown value
   * drops to the cap while the stored one is still the pressed value. A `pointerId` other than the pressing one
   * (another finger, the mouse passing over another button) releases nothing; without one (the window losing focus,
   * the buttons disappearing) any press is released
   */
  released: (stored: number, limit: number | undefined, pointerId?: number) => number | undefined;
}

interface HeldPress {
  readonly position: number;
  readonly before: number;
  readonly pointerId: number;
}

/**
 * A momentary position button: it sets its value while held and puts back the value from before on release. One per
 * button group, so a second press doesn't start while one is held.
 */
export function createMomentaryPress(): MomentaryPress {
  let held: HeldPress | undefined;

  return {
    pressed: (position, shown, limit, pointerId) => {
      if (held !== undefined || position === shown || !isWithinCap(position, limit)) {
        return undefined;
      }
      held = {position, before: shown, pointerId};
      return position;
    },
    released: (stored, limit, pointerId) => {
      const press = held;
      if (press === undefined || (pointerId !== undefined && pointerId !== press.pointerId)) {
        return undefined;
      }
      held = undefined;
      if (stored !== press.position) {
        return undefined;
      }
      const restored = cappedValue(press.before, limit);
      return restored === stored ? undefined : restored;
    }
  };
}
