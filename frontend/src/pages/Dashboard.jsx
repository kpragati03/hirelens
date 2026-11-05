import { useEffect, useState } from 'react';
import api from '../api.js';

const STAGES = ['Applied', 'Shortlisted', 'Assessment', 'Interview', 'Offer', 'Rejected'];

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [apps, setApps] = useState([]);
  const [subs, setSubs] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [j, a, s, i] = await Promise.all([api.getJobs(), api.getApplications(), api.getSubmissions(), api.getInterviews()]);
        setJobs(j.jobs || []); setApps(a.applications || []); setSubs(s.submissions || []); setInterviews(i.interviews || []);
      } catch (e) { setError(`Could not load dashboard data — is the backend running? (${e.message})`); }
    })();
  }, []);

  const funnel = STAGES.map((s) => ({ stage: s, count: apps.filter((a) => a.stage === s).length }));
  const maxFunnel = Math.max(1, ...funnel.map((f) => f.count));
  const skillCounts = {};
  jobs.forEach((j) => (j.skills || []).forEach((s) => { skillCounts[s] = (skillCounts[s] || 0) + 1; }));
  const topSkills = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const avgScore = apps.length ? Math.round(apps.reduce((sum, a) => sum + (a.matchScore || 0), 0) / apps.length) : 0;

  return (
    <div>
      {error && <div className="error">{error}</div>}
      <div className="grid">
        <div className="stat"><b>{jobs.length}</b><span>Open jobs</span></div>
        <div className="stat"><b>{apps.length}</b><span>Applications</span></div>
        <div className="stat"><b>{avgScore}%</b><span>Average AI match score</span></div>
        <div className="stat"><b>{subs.length}</b><span>Assessment submissions</span></div>
        <div className="stat"><b>{interviews.length}</b><span>Interviews scheduled</span></div>
      </div>
      <div className="card">
        <h3>Hiring funnel</h3>
        {funnel.map((f) => (
          <div key={f.stage} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ width: 110, fontSize: 13 }}>{f.stage}</span>
            <div style={{ flex: 1, background: '#e8eef5', borderRadius: 6, height: 18 }}>
              <div style={{ width: `${(f.count / maxFunnel) * 100}%`, background: '#1e5aa8', height: 18, borderRadius: 6 }} />
            </div>
            <b>{f.count}</b>
          </div>
        ))}
        {apps.length === 0 && <p className="muted">No applications yet — post a job and apply from the Jobs tab to see the funnel fill up.</p>}
      </div>
      <div className="card">
        <h3>Skills in demand</h3>
        {topSkills.length === 0 ? <p className="muted">No jobs posted yet.</p> : topSkills.map(([skill, n]) => (
          <span key={skill} className="chip">{skill} · {n}</span>
        ))}
      </div>
    </div>
  );
}
