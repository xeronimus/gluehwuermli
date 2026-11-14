import {chaseErrors, chaseStepErrors, chasesAreValid, passCount, referenceBpmOf, setupChases} from './chases';
import type {Chase, ChaseStep, Fixture, FixtureSetup} from './ipc';

const stepOf = (overrides: Partial<ChaseStep> = {}): ChaseStep => ({
  id: 'one',
  holdMs: 500,
  values: [
    {channel: 1, value: 255},
    {channel: 10, value: 0}
  ],
  ...overrides
});

const chaseOf = (overrides: Partial<Chase> = {}): Chase => ({
  id: 'chorus',
  name: 'Chorus flash',
  repeat: {type: 'times', count: 8},
  steps: [
    stepOf(),
    stepOf({
      id: 'two',
      values: [
        {channel: 1, value: 0},
        {channel: 10, value: 255}
      ]
    })
  ],
  ...overrides
});

const gobo: Fixture = {
  id: 'gobo',
  name: 'Gobo',
  startAddress: 1,
  channels: [{name: 'Wheel', offset: 0, values: {mode: 'positions', positions: [{value: 0}, {value: 128}]}}]
};

const setupOf = (chases: Chase[] | undefined): FixtureSetup => ({version: 1, fixtures: [gobo], chases});

describe('setupChases', () => {
  test('none in a setup from before chases', () => {
    expect(setupChases(setupOf(undefined))).toEqual([]);
    expect(setupChases(setupOf([chaseOf()]))).toEqual([chaseOf()]);
  });
});

describe('referenceBpmOf', () => {
  test('120 for a chase without one, else its own', () => {
    expect(referenceBpmOf(chaseOf())).toBe(120);
    expect(referenceBpmOf(chaseOf({referenceBpm: 140}))).toBe(140);
  });
});

describe('chaseErrors', () => {
  test('a chase of steps on absolute channels is valid, whatever repeat', () => {
    expect(chaseErrors(chaseOf())).toEqual([]);
    expect(chaseErrors(chaseOf({repeat: {type: 'once'}}))).toEqual([]);
    expect(chaseErrors(chaseOf({repeat: {type: 'forever'}}))).toEqual([]);
  });

  test('a reference tempo from 20 to 300 BPM is valid', () => {
    expect(chaseErrors(chaseOf({referenceBpm: 20}))).toEqual([]);
    expect(chaseErrors(chaseOf({referenceBpm: 300}))).toEqual([]);
  });

  test('accepts the limits', () => {
    const chase = chaseOf({
      name: 'x'.repeat(40),
      repeat: {type: 'times', count: 99},
      steps: Array.from({length: 100}, (_, index) =>
        stepOf({
          id: `step-${index}`,
          fadeMs: index % 2 === 0 ? 0 : 3_600_000,
          holdMs: index % 2 === 0 ? 50 : 3_600_000,
          values: [{channel: 512, value: 255}]
        })
      )
    });

    expect(chaseErrors(chase)).toEqual([]);
  });

  test.each([
    ['chase-name-missing', chaseOf({name: '  '})],
    ['chase-name-too-long', chaseOf({name: 'x'.repeat(41)})],
    ['chase-repeat-invalid', chaseOf({repeat: {type: 'times', count: 1}})],
    ['chase-repeat-invalid', chaseOf({repeat: {type: 'times', count: 100}})],
    ['chase-repeat-invalid', chaseOf({repeat: {type: 'times', count: 2.5}})],
    ['chase-reference-bpm-invalid', chaseOf({referenceBpm: 19})],
    ['chase-reference-bpm-invalid', chaseOf({referenceBpm: 301})],
    ['chase-reference-bpm-invalid', chaseOf({referenceBpm: 120.5})],
    ['chase-steps-missing', chaseOf({steps: []})],
    ['chase-steps-too-many', chaseOf({steps: Array.from({length: 101}, (_, index) => stepOf({id: `step-${index}`}))})],
    ['chase-step-id-twice', chaseOf({steps: [stepOf(), stepOf()]})],
    ['chase-step-hold-invalid', chaseOf({steps: [stepOf({holdMs: 49})]})],
    ['chase-step-hold-invalid', chaseOf({steps: [stepOf({holdMs: 3_600_001})]})],
    ['chase-step-hold-invalid', chaseOf({steps: [stepOf({holdMs: 100.5})]})],
    ['chase-step-fade-invalid', chaseOf({steps: [stepOf({fadeMs: -1})]})],
    ['chase-step-fade-invalid', chaseOf({steps: [stepOf({fadeMs: 3_600_001})]})],
    ['chase-step-fade-invalid', chaseOf({steps: [stepOf({fadeMs: 100.5})]})],
    ['chase-step-fade-invalid', chaseOf({steps: [stepOf({fadeMs: Number.NaN})]})],
    ['chase-step-values-missing', chaseOf({steps: [stepOf({values: []})]})],
    ['chase-step-channel-invalid', chaseOf({steps: [stepOf({values: [{channel: 0, value: 1}]})]})],
    ['chase-step-channel-invalid', chaseOf({steps: [stepOf({values: [{channel: 513, value: 1}]})]})],
    [
      'chase-step-channel-twice',
      chaseOf({
        steps: [
          stepOf({
            values: [
              {channel: 3, value: 1},
              {channel: 3, value: 2}
            ]
          })
        ]
      })
    ],
    ['chase-step-value-invalid', chaseOf({steps: [stepOf({values: [{channel: 3, value: 256}]})]})],
    ['chase-step-value-invalid', chaseOf({steps: [stepOf({values: [{channel: 3, value: -1}]})]})]
  ])('%s', (type, chase) => {
    expect(chaseErrors(chase).map((error) => error.type)).toEqual([type]);
  });

  test('a problem of some values names their rows', () => {
    const step = stepOf({
      values: [
        {channel: 3, value: 1},
        {channel: 0, value: 300},
        {channel: 3, value: 2},
        {channel: 0, value: 4}
      ]
    });

    expect(chaseStepErrors(step)).toEqual([
      {type: 'chase-step-channel-invalid', valueIndexes: [1, 3]},
      {type: 'chase-step-channel-twice', valueIndexes: [0, 2]},
      {type: 'chase-step-value-invalid', valueIndexes: [1]}
    ]);
  });

  test('a problem on several steps is named once', () => {
    const chase = chaseOf({
      steps: [stepOf({holdMs: 10}), stepOf({id: 'two', holdMs: 20})]
    });

    expect(chaseErrors(chase)).toEqual([{type: 'chase-step-hold-invalid'}]);
  });

  test("a step value isn't checked against the value rules of a fixture on that address", () => {
    const chase = chaseOf({steps: [stepOf({values: [{channel: 1, value: 37}]})]});

    expect(chasesAreValid(setupOf([chase]))).toBe(true);
  });
});

describe('chasesAreValid', () => {
  test('valid chases, or none at all', () => {
    expect(chasesAreValid(setupOf(undefined))).toBe(true);
    expect(chasesAreValid(setupOf([chaseOf(), chaseOf({id: 'intro', name: 'Laser intro'})]))).toBe(true);
  });

  test('not with two chases sharing an id, or an invalid chase', () => {
    expect(chasesAreValid(setupOf([chaseOf(), chaseOf({name: 'Laser intro'})]))).toBe(false);
    expect(chasesAreValid(setupOf([chaseOf({name: ''})]))).toBe(false);
  });

  test("doesn't depend on the fixtures: a chase on an address no fixture has is valid", () => {
    const chase = chaseOf({steps: [stepOf({values: [{channel: 400, value: 12}]})]});

    expect(chasesAreValid({version: 1, fixtures: [], chases: [chase]})).toBe(true);
  });
});

test('a chase plays once, its count of passes, or without end', () => {
  expect(passCount({type: 'once'})).toBe(1);
  expect(passCount({type: 'times', count: 8})).toBe(8);
  expect(passCount({type: 'forever'})).toBe(Number.POSITIVE_INFINITY);
});
