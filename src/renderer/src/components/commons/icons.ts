/**
 * The app's icons, under names that say what they mean. The only module that imports from `@tabler/icons-react`
 * (enforced by architecture.test.ts), so changing an icon or the whole set touches this file only.
 * Size and alignment are set once for all of them, on the `tabler-icon` class (global.css.ts).
 */
export {
  IconPlus as AddIcon,
  IconChevronUp as CollapseIcon,
  IconPlugConnected as ConnectIcon,
  IconTrash as DeleteIcon,
  IconPlugConnectedX as DisconnectIcon,
  IconPencil as EditIcon,
  IconChevronDown as ExpandIcon,
  IconHelpCircle as HelpIcon,
  IconX as RemoveIcon,
  IconRefresh as RefreshPortsIcon,
  IconAlertTriangle as WarningIcon
} from '@tabler/icons-react';
