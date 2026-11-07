import {SyntheticEvent} from 'react';

import {useLingui} from '@lingui/react/macro';
import {assignInlineVars} from '@vanilla-extract/dynamic';

import {DMX_MAX_VALUE} from '@shared/dmx';
import type {ChannelPosition} from '@shared/ipc';

import {tickLabelOffsets, tickOffset} from '@/data/faderTicks';

import {FADER_HEIGHT_PX} from '../themes.css';
import {
  TICK_CONNECTOR_WIDTH_PX,
  tickConnectors,
  tickLabel,
  tickLabelBottom,
  tickMark,
  tickMarkBottom
} from './FaderTicks.css';

/** about the height of a label's line: closer labels are pushed apart */
const TICK_LABEL_GAP_PX = 13;

interface FaderTicksProps {
  /** the fader's label, for the labels' accessible names */
  faderLabel: string;
  /** lowest first */
  positions: readonly ChannelPosition[];
  disabled: boolean;
  onSelect: (value: number) => void;
}

/** the slider must not start a drag where a label is clicked: the click moves the fader to the label's position */
const keepFromSlider = (event: SyntheticEvent) => event.stopPropagation();

/**
 * the positions of a positions fader, inside its track: a tick at each position's value, and beside the track its
 * name (or its value without one), joined to its tick by a line when it had to move away from it. Clicking a label
 * moves the fader there
 */
const FaderTicks = ({faderLabel, positions, disabled, onSelect}: FaderTicksProps) => {
  const {t} = useLingui();
  const ticks = positions.map(({value}) => tickOffset(value, DMX_MAX_VALUE, FADER_HEIGHT_PX));
  const labels = tickLabelOffsets(ticks, FADER_HEIGHT_PX, TICK_LABEL_GAP_PX);
  return (
    <>
      <svg className={tickConnectors} width={TICK_CONNECTOR_WIDTH_PX} height={FADER_HEIGHT_PX} aria-hidden>
        {positions.map(({value}, index) => (
          <line
            key={value}
            x1={0}
            y1={FADER_HEIGHT_PX - (ticks[index] ?? 0)}
            x2={TICK_CONNECTOR_WIDTH_PX}
            y2={FADER_HEIGHT_PX - (labels[index] ?? 0)}
          />
        ))}
      </svg>
      {positions.map(({value, name}, index) => {
        const positionLabel = name ?? String(value);
        return (
          <span key={value}>
            <span className={tickMark} style={assignInlineVars({[tickMarkBottom]: `${ticks[index] ?? 0}px`})} />
            <button
              className={tickLabel}
              style={assignInlineVars({[tickLabelBottom]: `${labels[index] ?? 0}px`})}
              disabled={disabled}
              title={t`Channel ${faderLabel}: ${positionLabel} (${value})`}
              onMouseDown={keepFromSlider}
              onTouchStart={keepFromSlider}
              onClick={() => onSelect(value)}
            >
              {positionLabel}
            </button>
          </span>
        );
      })}
    </>
  );
};

export default FaderTicks;
