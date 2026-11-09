import {useState} from 'react';

import {Trans, useLingui} from '@lingui/react/macro';

import type {ChaseError} from '@shared/chases';
import type {SetChannelRequest} from '@shared/ipc';

import {
  type ChaseDraft,
  type ChaseStepDraft,
  isSortedByChannel,
  withNewStepValue,
  withStepValuesSorted
} from '@/data/chaseDraft';
import {type StepFillEffect, stepFillEffect, withStepValuesTaken} from '@/data/chaseStepFill';
import {type ChannelBeingTyped, chaseStepGroups, stepWideErrors} from '@/data/chaseStepTable';
import {chaseErrorMessage} from '@/i18n/messages/chaseMessages';
import {selectFixtures} from '@/state/fixtures/fixturesSelectors';
import {useAppStore} from '@/state/store';

import Button from '../commons/Button';
import {AddIcon} from '../commons/icons';
import ChaseFillPanel from './ChaseFillPanel';
import {emptyStepHint, errorList, stepEditor, stepMain} from './ChaseStepEditor.css';
import ChaseStepHeader from './ChaseStepHeader';
import ChaseStepTable from './ChaseStepTable';
import type {StepRowMark} from './ChaseStepTable.css';
import {useFocusKept} from './useFocusKept';

interface ChaseStepEditorProps {
  step: ChaseStepDraft;
  /** where the step is in the chase, of `count` steps */
  index: number;
  count: number;
  /** what is wrong with this step */
  errors: readonly ChaseError[];
  onChange: (change: (draft: ChaseDraft) => ChaseDraft) => void;
  /** the tabs pick the step shown after these */
  onDuplicate: () => void;
  onDelete: () => void;
}

/** the rows the last take changed or added, and how many takes so far: each take starts their flash again */
interface LastTake {
  readonly valueIds: readonly string[];
  readonly count: number;
}

/** a row a hovered button would change is marked; else it flashes if the last take changed it */
function rowMarkOf(valueId: string, preview: StepFillEffect | undefined, lastTake: LastTake): StepRowMark {
  if (preview) {
    return preview.changedIds.includes(valueId) ? 'affected' : 'none';
  }
  if (!lastTake.valueIds.includes(valueId)) {
    return 'none';
  }
  return lastTake.count % 2 === 0 ? 'flashEven' : 'flashOdd';
}

/**
 * one step of the chase, the panel of its tab: its header, the channels it sets as a table grouped by fixture, and the
 * fill panel beside it
 */
const ChaseStepEditor = ({step, index, count, errors, onChange, onDuplicate, onDelete}: ChaseStepEditorProps) => {
  const {i18n} = useLingui();
  const fixtures = useAppStore(selectFixtures);
  const {editorRef, keepFocusOn} = useFocusKept<HTMLDivElement>();
  const [beingTyped, setBeingTyped] = useState<ChannelBeingTyped | undefined>(undefined);
  const [preview, setPreview] = useState<StepFillEffect | undefined>(undefined);
  const [lastTake, setLastTake] = useState<LastTake>({valueIds: [], count: 0});
  const groups = chaseStepGroups(fixtures, step.values, beingTyped);
  const ownErrors = stepWideErrors(errors);

  // a channel is sorted in and grouped once it is left, not while it is typed
  const onChannelLeft = (nextFocus: EventTarget | null) => {
    keepFocusOn(nextFocus);
    setBeingTyped(undefined);
    if (!isSortedByChannel(step.values)) {
      onChange((draft) => withStepValuesSorted(draft, index));
    }
  };

  const onTake = (values: readonly SetChannelRequest[]) => {
    const effect = stepFillEffect(step.values, values);
    // made here, not in the change: a change may run twice (React's strict mode), and must add the same rows each time
    const addedIds = Array.from({length: effect.addedCount}, () => crypto.randomUUID());
    onChange((draft) => {
      let next = 0;
      return withStepValuesTaken(draft, index, values, () => addedIds[next++] ?? crypto.randomUUID());
    });
    setPreview(undefined);
    setLastTake((last) => ({valueIds: [...effect.changedIds, ...addedIds], count: last.count + 1}));
  };

  return (
    <div className={stepEditor} ref={editorRef}>
      <ChaseStepHeader
        hold={step.hold}
        index={index}
        count={count}
        onChange={onChange}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />
      <div className={stepMain}>
        {step.values.length === 0 ? (
          <p className={emptyStepHint}>
            <Trans>This step sets no channel yet: fill it from the panel, or add a channel.</Trans>
          </p>
        ) : (
          <ChaseStepTable
            groups={groups}
            stepIndex={index}
            errors={errors}
            markOf={(valueId) => rowMarkOf(valueId, preview, lastTake)}
            onChange={onChange}
            onChannelFocus={({id, channel}) => setBeingTyped({id, channel})}
            onChannelLeft={onChannelLeft}
          />
        )}
        <Button size="compact" onClick={() => onChange((draft) => withNewStepValue(draft, index, crypto.randomUUID()))}>
          <AddIcon />
          <Trans>Add channel</Trans>
        </Button>
        {ownErrors.length > 0 && (
          <ul className={errorList}>
            {ownErrors.map((error) => (
              <li key={error.type}>{i18n._(chaseErrorMessage(error))}</li>
            ))}
          </ul>
        )}
      </div>
      <ChaseFillPanel
        preview={preview}
        onTake={onTake}
        onPreview={(values) => setPreview(values && stepFillEffect(step.values, values))}
      />
    </div>
  );
};

export default ChaseStepEditor;
