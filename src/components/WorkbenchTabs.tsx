import type { ReactNode } from "react";

export type WorkbenchTabId =
  | "files"
  | "lyrics"
  | "visual"
  | "filters"
  | "motion";

const workbenchTabs: Array<{ id: WorkbenchTabId; label: string }> = [
  { id: "files", label: "Files" },
  { id: "lyrics", label: "Lyrics" },
  { id: "visual", label: "Visual" },
  { id: "filters", label: "Filters" },
  { id: "motion", label: "Ken Burns" },
];

type WorkbenchTabsProps = {
  activeTab: WorkbenchTabId;
  children: ReactNode;
  onTabChange: (tabId: WorkbenchTabId) => void;
};

export function WorkbenchTabs({
  activeTab,
  children,
  onTabChange,
}: WorkbenchTabsProps) {
  return (
    <section className="workbench" aria-label="Workbench">
      <div className="workbench-tabs" role="tablist" aria-label="Workbench tabs">
        {workbenchTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`workbench-tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls="workbench-panel"
            className={activeTab === tab.id ? "is-active" : undefined}
            data-testid={`workbench-tab-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        id="workbench-panel"
        className="workbench-panel"
        role="tabpanel"
        aria-labelledby={`workbench-tab-${activeTab}`}
        data-testid="workbench-panel"
      >
        {children}
      </div>
    </section>
  );
}
