import {Trans} from '@lingui/react/macro';

/** the manual's topic on a channel's maximum while locked, lifting the channel lock, what it doesn't cover */
const ChannelLocksTopic = () => (
  <>
    <p>
      <Trans>
        A fixture's channel can have a <strong>Max while locked</strong> (in the fixture editor): while the channel lock
        is on, the channel never goes above it, whichever fader, preset, scene or view sets it. A laser gets 0, a macro
        channel running the device's own programs e.g. 50. Its faders show a lock and stop at the maximum (at 0 they are
        greyed out), and a preset that would set it higher is disabled. A scene that would set it higher stays playable,
        so a look of the whole rig still works: the channel only goes up to its maximum, and the scene's button shows a
        lock.
      </Trans>
    </p>
    <p>
      <Trans>
        The channel lock is on after every start, independent of the mode. Lift it in the <strong>Settings</strong>{' '}
        view, e.g. for a show where the laser hangs high enough: in Show mode with the password, in Setup mode with a
        confirmation. It then stays lifted, also in Show mode and after Lock, until{' '}
        <strong>Turn channel lock on</strong> or a restart; the top bar shows <strong>Channel lock lifted</strong>{' '}
        meanwhile. Turned on again, the locked channels drop to their maximum right away.
      </Trans>
    </p>
    <p>
      <Trans>
        The lock only covers what the app sends. A laser can still come on without it: through its infrared remote
        (Laser, Auto, Sound), the programs in its own menu, or on its own when there is no DMX signal. Where it can't be
        mounted high enough, cover the laser opening, put the remote away and leave the device's menu on DMX.
      </Trans>
    </p>
  </>
);

export default ChannelLocksTopic;
