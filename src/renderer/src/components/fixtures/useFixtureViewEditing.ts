import {useEffect, useState} from 'react';

import type {Chase, Fixture, Scene} from '@shared/ipc';

import {useAppStore} from '@/state/store';

/** the editor open in the fixture view; one at a time */
export type FixtureViewEditing =
  | {type: 'none'}
  | {type: 'adding'}
  | {type: 'editing'; fixture: Fixture}
  | {type: 'adding-scene'}
  | {type: 'editing-scene'; scene: Scene}
  | {type: 'adding-chase'}
  | {type: 'editing-chase'; chase: Chase};

export const NOT_EDITING: FixtureViewEditing = {type: 'none'};

/**
 * which editor the fixture view shows. Locking (the Lock button, being idle) drops an unsaved edit, and the store
 * knows while one is open: a double-clicked .glp asks before it drops the draft
 */
export function useFixtureViewEditing(setupMode: boolean) {
  const setHasOpenDraft = useAppStore((state) => state.setHasOpenDraft);
  const [editing, setEditing] = useState<FixtureViewEditing>(NOT_EDITING);
  const hasOpenDraft = editing.type !== 'none';

  // set during render, React re-renders right away
  if (hasOpenDraft && !setupMode) {
    setEditing(NOT_EDITING);
  }

  // the main process pushes the open request outside React, so the store holds the flag
  useEffect(() => {
    setHasOpenDraft(hasOpenDraft);
    return () => setHasOpenDraft(false);
  }, [hasOpenDraft, setHasOpenDraft]);

  return [editing, setEditing] as const;
}
