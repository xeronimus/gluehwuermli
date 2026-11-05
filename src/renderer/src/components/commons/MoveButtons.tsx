import {type MoveDirection, canMove} from '@/data/listOrder';

import Button from './Button';
import {MoveEarlierIcon, MoveLaterIcon} from './icons';

interface MoveButtonsProps {
  /** where the item is in its list, of `count` items */
  index: number;
  count: number;
  onMove: (direction: MoveDirection) => void;
  /** the buttons' tooltips, naming what is moved */
  titles: Record<MoveDirection, string>;
  disabled?: boolean;
}

/** a left and a right arrow moving an item one place in a list shown left to right; disabled at either end */
const MoveButtons = ({index, count, onMove, titles, disabled = false}: MoveButtonsProps) => (
  <>
    <Button
      variant="icon"
      onClick={() => onMove('earlier')}
      disabled={disabled || !canMove(count, index, 'earlier')}
      title={titles.earlier}
    >
      <MoveEarlierIcon />
    </Button>
    <Button
      variant="icon"
      onClick={() => onMove('later')}
      disabled={disabled || !canMove(count, index, 'later')}
      title={titles.later}
    >
      <MoveLaterIcon />
    </Button>
  </>
);

export default MoveButtons;
