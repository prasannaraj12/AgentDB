import {
  LayoutDashboard, Sparkles, Lightbulb, FileText, History,
  Database, Table2, Network, Settings,
} from 'lucide-react';
import { ROUTES } from './router';

export const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { to: ROUTES.workspace, label: 'AI Workspace', icon: Sparkles },
      { to: ROUTES.dashboard, label: 'Dashboard', icon: LayoutDashboard },
      { to: ROUTES.insights, label: 'Insights', icon: Lightbulb },
      { to: ROUTES.reports, label: 'Reports', icon: FileText },
      { to: ROUTES.history, label: 'Query History', icon: History },
    ],
  },
  {
    label: 'Database',
    items: [
      { to: ROUTES.explorer, label: 'Database Explorer', icon: Database },
      { to: ROUTES.schema, label: 'Tables & Schema', icon: Table2 },
      { to: ROUTES.er, label: 'ER Diagrams', icon: Network },
    ],
  },
  {
    label: 'Tools',
    items: [{ to: ROUTES.settings, label: 'Settings', icon: Settings }],
  },
];

export const NAV_PAGES = NAV_SECTIONS.flatMap((s) => s.items);
