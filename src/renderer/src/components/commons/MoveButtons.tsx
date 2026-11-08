import {type MoveDirection, canMove} from '@/data/listOrder';

import Button from './Button';
import {MoveDownIcon, MoveEarlierIcon, MoveLaterIcon, MoveUpIcon} from './icons';

/** how the list is shown: left to right, or top to bottom */
export type MoveOrientation = 'horizontal' | 'vertical';

const ICONS = {
  horizontal: {earlier: MoveEarlierIcon, later: MoveLaterIcon},
  vertical: {earlier: MoveUpIcon, later: MoveDownIcon}
} as const;

interface MoveButtonsProps {
  /** where the item is in its list, of `count` items */
  index: number;
  count: number;
  onMove: (direction: MoveDirection) => void;
  /** the buttons' tooltips, naming what is moved */
  titles: Record<MoveDirection, string>;
  orientation?: MoveOrientation;
  disabled?: boolean;
}

/**
 * two arrows moving an item one place in a list, disabled at either end: left and right for a list shown left to right
 * (horizontal), up and down for one shown top to bottom (vertical)
 */
const MoveButtons = ({
  index,
  count,
  onMove,
  titles,
  orientation = 'horizontal',
  disabled = false
}: MoveButtonsProps) => {
  const {earlier: EarlierIcon, later: LaterIcon} = ICONS[orientation];
  return (
    <>
      <Button
        variant="icon"
        onClick={() => onMove('earlier')}
        disabled={disabled || !canMove(count, index, 'earlier')}
        title={titles.earlier}
      >
        <EarlierIcon />
      </Button>
      <Button
        variant="icon"
        onClick={() => onMove('later')}
        disabled={disabled || !canMove(count, index, 'later')}
        title={titles.later}
      >
        <LaterIcon />
      </Button>
    </>
  );
};

export default MoveButtons;
