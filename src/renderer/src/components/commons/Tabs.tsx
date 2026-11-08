import {KeyboardEvent, ReactNode, Ref, useId, useImperativeHandle, useRef} from 'react';

import {tabAfterKey} from '@/data/tabs';

import {tabAdd, tabHeader, tabList, tabPanel, tabVariants, tabWarning, tabs as tabsClass} from './Tabs.css';
import {WarningIcon} from './icons';

export interface Tab<Id extends string> {
  id: Id;
  label: ReactNode;
  /** a warning mark beside the label, with this text as its tooltip and accessible name; none without */
  warning?: string | undefined;
  panel: ReactNode;
}

interface TabsProps<Id extends string> {
  /** the accessible name of the tab list */
  label: string;
  tabs: readonly Tab<Id>[];
  /** none while there are no tabs */
  activeId: Id | undefined;
  onSelect: (id: Id) => void;
  /** a button after the last tab that adds one (not a tab itself, so outside the tab list); none without */
  addTab?: AddTab;
  ref?: Ref<TabsHandle<Id>>;
}

export interface TabsHandle<Id extends string> {
  /** focuses the tab with this id, or the add button for none (e.g. when the focused tab's content goes away) */
  focus: (id: Id | undefined) => void;
}

interface AddTab {
  label: ReactNode;
  onAdd: () => void;
  disabled?: boolean;
}

/**
 * Tabs as the WAI-ARIA pattern has them: the arrow keys, Home and End switch tabs. Every panel stays mounted, the
 * inactive ones hidden, so what is typed or folded in one survives switching to another.
 */
const Tabs = <Id extends string>({label, tabs, activeId, onSelect, addTab, ref}: TabsProps<Id>) => {
  const idPrefix = useId();
  const tabButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const addButton = useRef<HTMLButtonElement>(null);
  useImperativeHandle(
    ref,
    () => ({
      focus: (id) => {
        const index = tabs.findIndex((tab) => tab.id === id);
        (index === -1 ? addButton.current : tabButtons.current[index])?.focus();
      }
    }),
    [tabs]
  );
  const tabIdOf = (id: Id) => `${idPrefix}-tab-${id}`;
  const panelIdOf = (id: Id) => `${idPrefix}-panel-${id}`;

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const next = tabAfterKey(index, event.key, tabs.length);
    const nextTab = next === undefined ? undefined : tabs[next];
    if (next === undefined || !nextTab) {
      return;
    }
    event.preventDefault();
    onSelect(nextTab.id);
    tabButtons.current[next]?.focus();
  };

  return (
    <div className={tabsClass}>
      <div className={tabHeader}>
        <div className={tabList} role="tablist" aria-label={label}>
          {tabs.map((tab, index) => {
            const active = tab.id === activeId;
            return (
              <button
                key={tab.id}
                ref={(button) => {
                  tabButtons.current[index] = button;
                }}
                id={tabIdOf(tab.id)}
                role="tab"
                aria-selected={active}
                aria-controls={panelIdOf(tab.id)}
                tabIndex={active ? 0 : -1}
                className={tabVariants[active ? 'active' : 'inactive']}
                onClick={() => onSelect(tab.id)}
                onKeyDown={(event) => onKeyDown(event, index)}
              >
                {tab.label}
                {tab.warning !== undefined && (
                  <span className={tabWarning} role="img" aria-label={tab.warning} title={tab.warning}>
                    <WarningIcon />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {addTab && (
          <button ref={addButton} type="button" className={tabAdd} onClick={addTab.onAdd} disabled={addTab.disabled}>
            {addTab.label}
          </button>
        )}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={panelIdOf(tab.id)}
          role="tabpanel"
          aria-labelledby={tabIdOf(tab.id)}
          hidden={tab.id !== activeId}
          className={tabPanel}
        >
          {tab.panel}
        </div>
      ))}
    </div>
  );
};

export default Tabs;
