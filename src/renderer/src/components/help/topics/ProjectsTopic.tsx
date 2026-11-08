import {Trans} from '@lingui/react/macro';

/** the manual's topic on the .glp file of a rig: creating, opening, switching */
const ProjectsTopic = () => (
  <>
    <p>
      <Trans>
        The fixtures and scenes of a rig live in a <strong>project</strong>: a .glp file you keep wherever you like, in
        Documents, on the Desktop or on a USB stick. Keep one project per venue or show. Every change to a fixture or
        scene is saved to the file right away; there is no Save button.
      </Trans>
    </p>
    <p>
      <Trans>
        Without a project, the <strong>Show</strong> view offers <strong>Create project</strong> and{' '}
        <strong>Open project</strong>; later they are in the <strong>Project</strong> section of the{' '}
        <strong>Settings</strong> view, with the recent projects. Creating a project needs Setup mode (in Show mode, the
        password is asked first), opening one doesn't. A double-click on a .glp file opens it in the app, also while the
        app is running. The app opens the last project again on its next start.
      </Trans>
    </p>
    <p>
      <Trans>
        Opening another project sets all channels to 0 first, then applies the new project's channel locks. A fixture or
        scene being edited is dropped, the app asks first. A file that is no valid project, or one saved by a newer
        version of the app, is not opened and left exactly as it is. To back up a project or take it to another
        computer, copy the file; its path is shown in the Help view.
      </Trans>
    </p>
  </>
);

export default ProjectsTopic;
