import {Trans} from '@lingui/react/macro';

interface SafetyNoticeProps {
  paragraphClassName?: string;
}

/**
 * what the app is made for and what it doesn't promise, above all that the channel lock doesn't make a laser safe; in
 * the Help view and on the landing page
 */
const SafetyNotice = ({paragraphClassName}: SafetyNoticeProps) => (
  <>
    <p className={paragraphClassName}>
      <Trans>
        Glühwürmli comes without any warranty. It is made for private use, such as a living room, a party or a small
        band, not for professional shows or anything safety-critical.
      </Trans>
    </p>
    <p className={paragraphClassName}>
      <Trans>
        The channel lock is not a laser safety system: it only caps what the app sends. Mount and aim a laser so that it
        can never hit anyone's eyes, whatever the app does.
      </Trans>
    </p>
  </>
);

export default SafetyNotice;
