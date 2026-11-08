/** what the view toggle follows: whether Setup mode is unlocked, and how many projects were opened */
export interface ViewTriggers {
  readonly setupMode: boolean;
  readonly projectSwitches: number;
}

/**
 * whether the app goes to the Show view: Setup mode was just unlocked (with the right password), or a project was
 * created or opened; both are used there next. Locking or nothing changing keeps the view
 */
export const leadsToShowView = (before: ViewTriggers, now: ViewTriggers): boolean =>
  (now.setupMode && !before.setupMode) || now.projectSwitches !== before.projectSwitches;
