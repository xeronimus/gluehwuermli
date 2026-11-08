import type {Chase, Fixture} from '@shared/ipc';

import {
  type ChaseDraft,
  canSaveChase,
  chaseDraftOf,
  chaseEditErrors,
  chaseOfDraft,
  fixtureChannelsAt,
  holdMsOf,
  newChaseDraft,
  nextFreeChannel,
  withNewStep,
  withNewStepValue,
  withStepDuplicated,
  withStepHold,
  withStepMoved,
  withStepValueChange,
  withoutStep,
  withoutStepValue
} from './chaseDraft';

const chorus: Chase = {
  id: 'chorus',
  name: 'Chorus',
  repeat: {type: 'times', count: 8},
  steps: [
    {id: 'laser', holdMs: 500, values: [{channel: 1, value: 255}]},
    {
      id: 'strobe',
      holdMs: 1250,
      values: [
        {channel: 1, value: 0},
        {channel: 20, value: 200}
      ]
    }
  ]
};

const typedChase = (draft: Partial<ChaseDraft>): ChaseDraft => ({...newChaseDraft(), name: 'Chorus', ...draft});

const stepIds = (draft: ChaseDraft) => draft.steps.map(({id}) => id);

test('a chase survives the round trip through a draft', () => {
  expect(chaseOfDraft('chorus', chaseDraftOf(chorus))).toEqual(chorus);
  const once: Chase = {...chorus, repeat: {type: 'once'}};
  const forever: Chase = {...chorus, repeat: {type: 'forever'}};
  expect(chaseOfDraft('chorus', chaseDraftOf(once))).toEqual(once);
  expect(chaseOfDraft('chorus', chaseDraftOf(forever))).toEqual(forever);
});

test('shows a hold in seconds with two decimals and stores it in milliseconds', () => {
  expect(chaseDraftOf(chorus).steps.map(({hold}) => hold)).toEqual(['0.50', '1.25']);
  expect(holdMsOf('0.05')).toBe(50);
  expect(holdMsOf('3600')).toBe(3_600_000);
  expect(holdMsOf('1.1')).toBe(1100);
  expect(holdMsOf(' 2 ')).toBe(2000);
  expect(holdMsOf('')).toBeNaN();
});

test('trims the name, and keeps the typed count while another repeat is chosen', () => {
  const draft = typedChase({name: ' Chorus ', repeatType: 'times', repeatCount: '5'});

  expect(chaseOfDraft('c', draft).name).toBe('Chorus');
  expect(chaseOfDraft('c', draft).repeat).toEqual({type: 'times', count: 5});
  expect(chaseOfDraft('c', {...draft, repeatType: 'forever'}).repeat).toEqual({type: 'forever'});
  expect({...draft, repeatType: 'forever'}.repeatCount).toBe('5');
});

test('the first step added holds 1 s, a later one as long as the step before it', () => {
  const first = withNewStep(newChaseDraft(), 'a');
  const second = withNewStep(withStepHold(first, 0, '0.25'), 'b');

  expect(first.steps).toEqual([{id: 'a', hold: '1.00', values: []}]);
  expect(second.steps[1]).toEqual({id: 'b', hold: '0.25', values: []});
});

test('duplicates a step with its hold and values right after it, under a new id', () => {
  const draft = withStepDuplicated(chaseDraftOf(chorus), 0, 'copy');

  expect(stepIds(draft)).toEqual(['laser', 'copy', 'strobe']);
  expect(draft.steps[1]).toEqual({...chaseDraftOf(chorus).steps[0], id: 'copy'});
  expect(withStepDuplicated(chaseDraftOf(chorus), 5, 'copy')).toEqual(chaseDraftOf(chorus));
});

test('moves a step, not past either end, and deletes one', () => {
  const draft = chaseDraftOf(chorus);

  expect(stepIds(withStepMoved(draft, 1, 'earlier'))).toEqual(['strobe', 'laser']);
  expect(stepIds(withStepMoved(draft, 1, 'later'))).toEqual(['laser', 'strobe']);
  expect(stepIds(withoutStep(draft, 0))).toEqual(['strobe']);
});

test('edits, adds and removes a step value one by one', () => {
  const draft = chaseDraftOf(chorus);

  const changed = withStepValueChange(draft, 1, 1, {value: '128'});
  expect(changed.steps[1]?.values).toEqual([
    {channel: '1', value: '0'},
    {channel: '20', value: '128'}
  ]);
  expect(withoutStepValue(draft, 1, 0).steps[1]?.values).toEqual([{channel: '20', value: '200'}]);
  expect(withNewStepValue(draft, 1).steps[1]?.values.at(-1)).toEqual({channel: '21', value: '0'});
  expect(withNewStepValue(withNewStep(newChaseDraft(), 'a'), 0).steps[0]?.values).toEqual([{channel: '1', value: '0'}]);
});

test('a channel added by hand follows the highest one, or takes the lowest free one at the end of the universe', () => {
  expect(nextFreeChannel([])).toBe(1);
  expect(
    nextFreeChannel([
      {channel: '7', value: '0'},
      {channel: '3', value: '0'}
    ])
  ).toBe(8);
  expect(nextFreeChannel([{channel: 'x', value: '0'}])).toBe(1);
  expect(
    nextFreeChannel([
      {channel: '1', value: '0'},
      {channel: '512', value: '0'}
    ])
  ).toBe(2);
});

test('a chase needs a name and a step, each step a channel', () => {
  const errors = chaseEditErrors(withNewStep(typedChase({name: ' '}), 'a'));

  expect(errors.chase).toEqual([{type: 'chase-name-missing'}]);
  expect(errors.steps).toEqual([[{type: 'chase-step-values-missing'}]]);
  expect(chaseEditErrors(typedChase({})).chase).toEqual([{type: 'chase-steps-missing'}]);
  expect(canSaveChase(chaseEditErrors(typedChase({})))).toBe(false);
  expect(canSaveChase(chaseEditErrors(chaseDraftOf(chorus)))).toBe(true);
});

test('reports a hold, a repeat count and a step value out of range, at the step they belong to', () => {
  const draft = chaseDraftOf(chorus);
  const errors = chaseEditErrors({
    ...withStepValueChange(withStepHold(draft, 1, '0.04'), 1, 0, {channel: '20'}),
    repeatCount: '100'
  });

  expect(errors.chase).toEqual([{type: 'chase-repeat-invalid'}]);
  expect(errors.steps).toEqual([[], [{type: 'chase-step-hold-invalid'}, {type: 'chase-step-channel-twice'}]]);
  expect(chaseEditErrors(withStepHold(draft, 0, '')).steps[0]).toEqual([{type: 'chase-step-hold-invalid'}]);
  expect(chaseEditErrors(withStepValueChange(draft, 0, 0, {value: '256'})).steps[0]).toEqual([
    {type: 'chase-step-value-invalid'}
  ]);
  expect(chaseEditErrors(withStepValueChange(draft, 0, 0, {channel: '513'})).steps[0]).toEqual([
    {type: 'chase-step-channel-invalid'}
  ]);
});

test('labels an address with every fixture channel on it', () => {
  const par: Fixture = {
    id: 'par',
    name: 'PAR',
    startAddress: 10,
    channels: [
      {name: 'Red', offset: 0},
      {name: 'Green', offset: 1}
    ]
  };
  const wash: Fixture = {id: 'wash', name: 'Wash', startAddress: 11, channels: [{name: 'Dimmer', offset: 0}]};

  expect(fixtureChannelsAt([par, wash], '11')).toEqual([
    {fixtureName: 'PAR', channelName: 'Green'},
    {fixtureName: 'Wash', channelName: 'Dimmer'}
  ]);
  expect(fixtureChannelsAt([par, wash], '10')).toEqual([{fixtureName: 'PAR', channelName: 'Red'}]);
  expect(fixtureChannelsAt([par, wash], '1')).toEqual([]);
  expect(fixtureChannelsAt([par, wash], '')).toEqual([]);
});
