import {useEffect, useState} from 'react';

import {Trans, useLingui} from '@lingui/react/macro';
import {assignInlineVars} from '@vanilla-extract/dynamic';

import type {TempoStatus} from '@shared/ipc';

import {isTapKey} from '@/data/tapKey';
import {beatAnimation, shownBpm} from '@/data/tempoPad';
import {useActionTapTempo} from '@/state/actionHooks/tapTempo';
import {useAppStore} from '@/state/store';

import Button from '../commons/Button';
import {TapTempoIcon} from '../commons/icons';
import {beatDelay, beatDuration, beatMarkBlinking, beatMarkIdle, bpm, tapTempo} from './TapTempoPad.css';

/** the focused element, as far as the tap key cares: typing into it isn't tapping */
const focusedTarget = (target: EventTarget | null) => (target instanceof HTMLElement ? target : null);

/**
 * The tap pad: a click or the T key is one tap, main works out the tempo from the gaps (doc/chases.md). Shows the
 * BPM and a mark blinking on the beat, by a CSS animation one beat long, restarted for each new tempo, no timer. Works
 * in Show and Setup mode: tapping is playing
 */
const TapTempoPad = () => {
  const {t} = useLingui();
  const status = useAppStore((state) => state.tempoStatus);
  const receivedAtMs = useAppStore((state) => state.tempoReceivedAtMs);
  const tap = useActionTapTempo();

  // a key anywhere in the window (external event, so useEffect is right here)
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const {key, repeat, ctrlKey, altKey, metaKey} = event;
      if (isTapKey({key, repeat, ctrlKey, altKey, metaKey, target: focusedTarget(event.target)})) {
        tap();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [tap]);

  const tempoBpm = shownBpm(status);

  return (
    <div className={tapTempo}>
      <Button onClick={tap} title={t`Tap the tempo (T)`}>
        <TapTempoIcon />
        <span className={bpm}>{tempoBpm === undefined ? <Trans>Tap</Trans> : <Trans>{tempoBpm} BPM</Trans>}</span>
      </Button>
      {status.type === 'set' ? (
        <BeatMark key={receivedAtMs} status={status} receivedAtMs={receivedAtMs} />
      ) : (
        <span className={beatMarkIdle} aria-hidden />
      )}
    </div>
  );
};

interface BeatMarkProps {
  status: TempoStatus;
  receivedAtMs: number;
}

/**
 * the mark blinking on the beat, mounted anew for each tempo (keyed by when it arrived). The animation's phase is taken
 * once, at mount: the running animation keeps its own time, so a later render (a chase step re-rendering the list)
 * must not move its delay, or the blink would jump by however far into the beat that render came
 */
const BeatMark = ({status, receivedAtMs}: BeatMarkProps) => {
  const [animation] = useState(() => beatAnimation(status, receivedAtMs, performance.now()));
  if (!animation) {
    return <span className={beatMarkIdle} aria-hidden />;
  }
  return (
    <span
      className={beatMarkBlinking}
      style={assignInlineVars({
        [beatDuration]: `${animation.durationMs}ms`,
        [beatDelay]: `${animation.delayMs}ms`
      })}
      aria-hidden
    />
  );
};

export default TapTempoPad;
