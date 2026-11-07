import {useLingui} from '@lingui/react/macro';

import {faderMode} from '@/data/faderStops';
import Fader from '@/domain/Fader';

/** the step of a fader without rules, shown in the step buttons' tooltips */
const DMX_STEP = 1;

interface FaderLimits {
  /** the cap while the channel lock is on, if the channel has one */
  limit: number | undefined;
  /** the cap the channel has while the channel lock is lifted */
  liftedLimit: number | undefined;
}

/**
 * the tooltips of a fader: of its step buttons (+1 and -1 on a fader without rules, the next and the previous value
 * on one with steps or positions), and why it is capped or not
 */
export function useFaderTitles(fader: Fader, {limit, liftedLimit}: FaderLimits) {
  const {t} = useLingui();
  const label = fader.label;
  const byOne = faderMode(fader) === 'continuous';
  const locked = t`Channel ${label} is capped at ${limit} by the channel lock`;
  const lifted = t`Channel ${label} is not capped at ${liftedLimit}: the channel lock is lifted`;

  const raiseUnlocked = byOne ? t`Channel ${label} +${DMX_STEP}` : t`Channel ${label}: next value`;
  const raiseCapped = byOne
    ? t`Channel ${label} +${DMX_STEP}, capped at ${limit} by the channel lock`
    : t`Channel ${label}: next value, capped at ${limit} by the channel lock`;
  const raiseLifted = byOne
    ? t`Channel ${label} +${DMX_STEP}, not capped at ${liftedLimit}: the channel lock is lifted`
    : t`Channel ${label}: next value, not capped at ${liftedLimit}: the channel lock is lifted`;
  const raise = limit !== undefined ? raiseCapped : liftedLimit !== undefined ? raiseLifted : raiseUnlocked;
  const lower = byOne ? t`Channel ${label} -${DMX_STEP}` : t`Channel ${label}: previous value`;

  return {locked, lifted, raise, lower, thumb: t`Channel ${label}`};
}
