import { useState } from 'react';
import Dashboard from './pages/Dashboard.jsx';
import Jobs from './pages/Jobs.jsx';
import MatchLab from './pages/MatchLab.jsx';
import Pipeline from './pages/Pipeline.jsx';
import Assessments from './pages/Assessments.jsx';
import Interviews from './pages/Interviews.jsx';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', Component: Dashboard },
  { id: 'jobs', label: 'Jobs', Component: Jobs },
  { id: 'match', label: 'Match Lab', Component: MatchLab },
  { id: 'pipeline', label: 'Pipeline', Component: Pipeline },
  { id: 'assessments', label: 'Assessments', Component: Assessments },
  { id: 'interviews', label: 'Interviews', Component: Interviews },
];
const ROLES = ['Candidate', 'Recruiter', 'Admin'];

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [role, setRole] = useState('Candidate');
  const Active = TABS.find((t) => t.id === tab).Component;
  return (
    <div>
      <header className="header">
        <div>
          <h1>Hire<span>Lens</span></h1>
          <p>AI-powered technical hiring — jobs, matching, coding assessments &amp; interviews</p>
        </div>
        <div className="role-switch">
          <span>Role:</span>
          {ROLES.map((r) => (
            <button key={r} className={role === r ? 'active' : ''} onClick={() => setRole(r)}>{r}</button>
          ))}
        </div>
      </header>
      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </nav>
      <main className="main">
        <p className="muted">Viewing as <b>{role}</b>. The role switcher frames each workflow — recruiters post jobs, candidates apply and take assessments, admins see analytics.</p>
        <Active role={role} />
      </main>
    </div>
  );
}
