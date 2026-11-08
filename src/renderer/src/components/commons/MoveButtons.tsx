import {useEffect, useRef} from 'react';

import {type MoveDirection, arrowAfterMove, canMove} from '@/data/listOrder';

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

const focusIsLost = () => document.activeElement === null || document.activeElement === document.body;

/**
 * gives the focus back to an arrow once its item has moved, so the arrows can be pressed again from the keyboard. The
 * browser drops it when React moves the focused element in the DOM (an item moved later), when the pressed arrow is
 * disabled at an end, and while a list being saved disables its arrows. Only a lost focus is taken back: a move that
 * failed doesn't take it from wherever it went since
 */
function useFocusAfterMove(index: number, count: number) {
  const buttons = useRef<Record<MoveDirection, HTMLButtonElement | null>>({earlier: null, later: null});
  const pressed = useRef<MoveDirection>(undefined);
  useEffect(() => {
    const direction = pressed.current;
    if (!direction) {
      return;
    }
    pressed.current = undefined;
    if (focusIsLost()) {
      buttons.current[arrowAfterMove(count, index, direction)]?.focus();
    }
  }, [index, count]);
  return {
    buttonRef: (direction: MoveDirection) => (button: HTMLButtonElement | null) => {
      buttons.current[direction] = button;
    },
    pressedArrow: (direction: MoveDirection) => {
      pressed.current = direction;
    }
  };
}

/**
 * two arrows moving an item one place in a list, disabled at either end: left and right for a list shown left to right
 * (horizontal), up and down for one shown top to bottom (vertical). The focus stays on the arrows after a move
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
  const {buttonRef, pressedArrow} = useFocusAfterMove(index, count);
  const move = (direction: MoveDirection) => {
    pressedArrow(direction);
    onMove(direction);
  };
  return (
    <>
      <Button
        ref={buttonRef('earlier')}
        variant="icon"
        onClick={() => move('earlier')}
        disabled={disabled || !canMove(count, index, 'earlier')}
        title={titles.earlier}
      >
        <EarlierIcon />
      </Button>
      <Button
        ref={buttonRef('later')}
        variant="icon"
        onClick={() => move('later')}
        disabled={disabled || !canMove(count, index, 'later')}
        title={titles.later}
      >
        <LaterIcon />
      </Button>
    </>
  );
};

export default MoveButtons;
