import {tabVariants, tabs} from './Tabs.css';

export interface Tab<Id extends string> {
  id: Id;
  label: string;
}

interface TabsProps<Id extends string> {
  tabs: readonly Tab<Id>[];
  activeId: Id;
  onSelect: (id: Id) => void;
}

/** a row of tabs; showing the content of the active one is up to the caller */
const Tabs = <Id extends string>({tabs: allTabs, activeId, onSelect}: TabsProps<Id>) => (
  <nav className={tabs} role="tablist">
    {allTabs.map((tab) => (
      <button
        key={tab.id}
        role="tab"
        aria-selected={tab.id === activeId}
        className={tabVariants[tab.id === activeId ? 'active' : 'inactive']}
        onClick={() => onSelect(tab.id)}
      >
        {tab.label}
      </button>
    ))}
  </nav>
);

export default Tabs;
