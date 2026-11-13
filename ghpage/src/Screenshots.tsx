import {useLingui} from '@lingui/react/macro';

/** the file names in doc/screenshots/, which build.mts copies to assets/screenshots/ */
const SCREENSHOT_FILES = {
  showMode: 'show-mode.png',
  setupMode: 'setup-mode.png',
  fixtureEditor: 'fixture-editor.png',
  chaseEditor: 'chase-editor.png',
  channels: 'channels.png'
} as const;

/** the width and height the screenshots were taken at, so the page doesn't jump while they load */
const SCREENSHOT_WIDTH = 1920;
const SCREENSHOT_HEIGHT = 1127;

interface ScreenshotsProps {
  rootPath: string;
}

/** the app's views, each a screenshot with a caption; a click opens it in full size */
const Screenshots = ({rootPath}: ScreenshotsProps) => {
  const {t} = useLingui();

  const screenshots = [
    {
      file: SCREENSHOT_FILES.showMode,
      caption: t`Show mode: scenes on top, a fixture each with its faders and presets, the chases below.`
    },
    {
      file: SCREENSHOT_FILES.setupMode,
      caption: t`Setup mode: the same view, with buttons to add, edit, arrange and delete.`
    },
    {
      file: SCREENSHOT_FILES.fixtureEditor,
      caption: t`The fixture editor: channels with their address, color and named positions.`
    },
    {
      file: SCREENSHOT_FILES.chaseEditor,
      caption: t`The chase editor: a step's channel values, filled from the current values, a scene or a preset.`
    },
    {
      file: SCREENSHOT_FILES.channels,
      caption: t`The Channels view: 16 raw faders, moved across all 512 channels.`
    }
  ];

  return (
    <section className="section screenshots" aria-label={t`Screenshots`}>
      {screenshots.map(({file, caption}) => {
        const src = `${rootPath}assets/screenshots/${file}`;
        return (
          <figure key={file}>
            <a href={src}>
              <img src={src} alt={caption} width={SCREENSHOT_WIDTH} height={SCREENSHOT_HEIGHT} loading="lazy" />
            </a>
            <figcaption>{caption}</figcaption>
          </figure>
        );
      })}
    </section>
  );
};

export default Screenshots;
