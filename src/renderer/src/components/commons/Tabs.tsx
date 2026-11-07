import {KeyboardEvent, ReactNode, useId, useRef} from 'react';

import {tabAfterKey} from '@/data/tabs';

import {tabList, tabPanel, tabVariants, tabWarning, tabs as tabsClass} from './Tabs.css';
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
  activeId: Id;
  onSelect: (id: Id) => void;
}

/**
 * Tabs as the WAI-ARIA pattern has them: the arrow keys, Home and End switch tabs. Every panel stays mounted, the
 * inactive ones hidden, so what is typed or folded in one survives switching to another.
 */
const Tabs = <Id extends string>({label, tabs, activeId, onSelect}: TabsProps<Id>) => {
  const idPrefix = useId();
  const tabButtons = useRef<(HTMLButtonElement | null)[]>([]);
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
