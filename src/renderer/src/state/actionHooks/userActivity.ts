import {useEffect} from 'react';

import {createActivityThrottle} from '@/data/activityThrottle';
import {lockService} from '@/data/service/services';

import {selectIsSetupMode} from '../lock/lockSelectors';
import {useAppStore} from '../store';

/** well below the main process's idle timeout (10 minutes), so a user at work is never locked out */
const ACTIVITY_REPORT_INTERVAL_MS = 30_000;

const USER_INPUT_EVENTS = ['pointerdown', 'keydown', 'wheel'] as const;

/**
 * Tells the main process the user is still there while in Setup mode, so it doesn't lock itself for being idle. The
 * main process owns the timer: a hidden or crashed renderer still ends up locked.
 */
export function useUserActivityReporting(): void {
  useEffect(() => {
    const shouldReport = createActivityThrottle(ACTIVITY_REPORT_INTERVAL_MS);
    const onInput = () => {
      if (selectIsSetupMode(useAppStore.getState()) && shouldReport()) {
        lockService.reportActivity();
      }
    };
    USER_INPUT_EVENTS.forEach((event) => window.addEventListener(event, onInput, {passive: true}));
    return () => USER_INPUT_EVENTS.forEach((event) => window.removeEventListener(event, onInput));
  }, []);
}
