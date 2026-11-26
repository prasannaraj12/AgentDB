import { useState } from 'react';
import { Check, Eraser, MessageSquareText, Pin, Server } from 'lucide-react';
import { useApp } from '../lib/appContext';
import { useQueryHistory, clearHistory } from '../lib/queryHistory';
import { PageHeader, Panel, Button } from '../components/ui/Primitives';

function Row({ icon: Icon, title, text, action }) {
  return (
    <div className="ag-setting-row">
      <span className="ag-setting-icon"><Icon size={15} /></span>
      <div className="ag-setting-text">
        <p>{title}</p>
        <span>{text}</span>
      </div>
      <div className="ag-setting-action">{action}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { displayName, setDisplayName, chat, pinnedCharts, clearPinned, db } = useApp();
  const history = useQueryHistory();
  const [name, setName] = useState(displayName);
  const [saved, setSaved] = useState(false);

  const save = (e) => {
    e.preventDefault();
    setDisplayName(name.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  return (
    <div className="ag-page ag-settings">
      <PageHeader title="Settings" subtitle="Preferences are stored in this browser only." />

      <Panel title="Profile" subtitle="Used for the dashboard greeting and your avatar.">
        <form className="ag-form-row" onSubmit={save}>
          <label className="ag-field">
            <span>Display name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Prasanna" maxLength={40} />
          </label>
          <Button variant="dark" type="submit" icon={saved ? Check : undefined}>{saved ? 'Saved' : 'Save'}</Button>
        </form>
      </Panel>

      <Panel title="Workspace data">
        <Row icon={Eraser} title="Query history" text={`${history.length} saved ${history.length === 1 ? 'question' : 'questions'} used by the dashboard and history page.`}
          action={<Button className="ag-btn-danger" disabled={!history.length}
            onClick={() => { if (window.confirm('Delete all saved queries from this browser? This cannot be undone.')) clearHistory(); }}>Clear</Button>} />
        <Row icon={MessageSquareText} title="Conversation" text={`${chat.messages.length} messages in the current AI Workspace session, including the server-side memory.`}
          action={<Button disabled={!chat.messages.length || chat.isLoading} onClick={chat.clearChat}>Reset</Button>} />
        <Row icon={Pin} title="Pinned charts" text={`${pinnedCharts.length} charts on the Insights board.`}
          action={<Button disabled={!pinnedCharts.length} onClick={clearPinned}>Unpin all</Button>} />
      </Panel>

      <Panel title="Connection">
        <Row icon={Server} title={db.connection === 'online' ? 'Backend connected' : db.connection === 'offline' ? 'Backend offline' : 'Checking backend…'}
          text={`Active database: ${db.activeDb}. The AI model and API key are configured on the server in backend/.env.`}
          action={<Button onClick={db.fetchDatabases}>Re-check</Button>} />
      </Panel>
    </div>
  );
}
