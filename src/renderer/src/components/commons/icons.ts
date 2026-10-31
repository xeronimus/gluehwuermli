/**
 * The app's icons, under names that say what they mean. The only module that imports from `@tabler/icons-react`
 * (enforced by architecture.test.ts), so changing an icon or the whole set touches this file only.
 * Size and alignment are set once for all of them, on the `tabler-icon` class (global.css.ts).
 */
export {
  IconPlugConnected as ConnectIcon,
  IconPlugConnectedX as DisconnectIcon,
  IconRefresh as RefreshPortsIcon
} from '@tabler/icons-react';
