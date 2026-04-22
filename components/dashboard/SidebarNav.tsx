import type { PageName } from "./types";

type SidebarNavProps = {
  activePage: PageName;
  setActivePage: (page: PageName) => void;
};

const navItems: Array<{ page: PageName; label: string; icon: JSX.Element }> = [
  {
    page: "fleet",
    label: "Fleet Overview",
    icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="9" height="9" /><rect x="13" y="3" width="9" height="9" /><rect x="2" y="14" width="9" height="9" /><rect x="13" y="14" width="9" height="9" /></svg>,
  },
  {
    page: "detail",
    label: "Truck Detail",
    icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>,
  },
  {
    page: "acoustic",
    label: "Acoustic Lab",
    icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
  },
  {
    page: "analytics",
    label: "Analytics",
    icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  },
  {
    page: "maintenance",
    label: "Predictive Maintenance",
    icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  },
  {
    page: "config",
    label: "System Config",
    icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
  },
];

export function SidebarNav({ activePage, setActivePage }: SidebarNavProps) {
  return (
    <nav className="sidebar">
      {navItems.map(({ page, label, icon }) => (
        <button
          key={page}
          className={`nav-btn ${activePage === page ? "active" : ""}`}
          onClick={() => setActivePage(page)}
        >
          {icon}
          <div className="nav-tooltip">{label}</div>
        </button>
      ))}
    </nav>
  );
}
