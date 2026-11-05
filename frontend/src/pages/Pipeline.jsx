import { useEffect, useState } from 'react';
import api from '../api.js';

const STAGES = ['Applied', 'Shortlisted', 'Assessment', 'Interview', 'Offer', 'Rejected'];

export default function Pipeline() {
  const [apps, setApps] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    try { const res = await api.getApplications(); setApps(res.applications || []); }
    catch (e) { setError(e.message); }
  };
  useEffect(() => { load(); }, []);

  const move = async (id, stage) => {
    try { await api.updateStage(id, stage); load(); } catch (e) { setError(e.message); }
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      {apps.length === 0 && <p className="muted">No applications yet — apply to a job from the Jobs tab.</p>}
      <div className="kanban">
        {STAGES.map((stage) => (
          <div key={stage} className="kanban-col">
            <h4>{stage} ({apps.filter((a) => a.stage === stage).length})</h4>
            {apps.filter((a) => a.stage === stage).map((a) => (
              <div key={a._id} className="kanban-card">
                <b>{a.candidateName}</b><br />
                {a.jobTitle} — {a.company}<br />
                <span className="score">{a.matchScore}% match</span>
                <p className="muted" style={{ margin: '6px 0 0', fontSize: 12 }}>{a.aiSummary}</p>
                <select value={a.stage} onChange={(e) => move(a._id, e.target.value)}>
                  {STAGES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
