import type {FixtureError} from '@shared/fixtures';

/** the tabs of the fixture editor: what the fixture is, what it can do, its presets */
export const FIXTURE_EDITOR_TABS = ['general', 'channels', 'presets'] as const;

export type FixtureEditorTab = (typeof FIXTURE_EDITOR_TABS)[number];

/** the tab with the field the error is about, so that tab can carry a warning mark */
export function tabOfFixtureError(error: FixtureError): FixtureEditorTab {
  switch (error.type) {
    case 'name-missing':
    case 'start-address-invalid':
    case 'description-too-long':
    case 'hint-too-long':
      return 'general';
    case 'channels-missing':
    case 'channel-name-missing':
    case 'offset-invalid':
    case 'offset-used-twice':
    case 'lock-max-invalid':
    case 'color-invalid':
    case 'values-invalid':
    case 'values-min-above-max':
    case 'values-step-invalid':
    case 'values-positions-too-few':
    case 'values-position-twice':
    case 'values-position-name-too-long':
    case 'shared-address-rules-differ':
    case 'past-universe-end':
      return 'channels';
    case 'preset-name-missing':
    case 'preset-name-too-long':
    case 'preset-id-used-twice':
    case 'preset-channels-missing':
    case 'preset-channel-unknown':
    case 'preset-channel-twice':
    case 'preset-value-invalid':
    case 'preset-color-invalid':
      return 'presets';
  }
}

/** the tabs with at least one of the errors */
export const tabsWithErrors = (errors: readonly FixtureError[]): ReadonlySet<FixtureEditorTab> =>
  new Set(errors.map(tabOfFixtureError));
