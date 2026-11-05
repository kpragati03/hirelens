import { useEffect, useState } from 'react';
import api from '../api.js';

export default function Interviews() {
  const [apps, setApps] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [form, setForm] = useState({ applicationId: '', date: '', time: '', mode: 'Video', notes: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const [a, i] = await Promise.all([api.getApplications(), api.getInterviews()]);
    setApps(a.applications || []); setInterviews(i.interviews || []);
    if (a.applications?.length && !form.applicationId) setForm((f) => ({ ...f, applicationId: a.applications[0]._id }));
  };
  useEffect(() => { load().catch((e) => setError(e.message)); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const schedule = async (e) => {
    e.preventDefault(); setError(''); setMsg('');
    const app = apps.find((a) => a._id === form.applicationId);
    if (!app) { setError('Pick an application first.'); return; }
    try {
      await api.scheduleInterview({ applicationId: app._id, candidateName: app.candidateName, jobTitle: app.jobTitle, company: app.company, date: form.date, time: form.time, mode: form.mode, notes: form.notes });
      setMsg(`Interview scheduled for ${app.candidateName} — their application moved to the Interview stage.`);
      load();
    } catch (err) { setError(err.message); }
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      {msg && <div className="success">{msg}</div>}
      <div className="card">
        <h3>Schedule an interview</h3>
        <form onSubmit={schedule}>
          <label>Candidate / application
            <select value={form.applicationId} onChange={(e) => setForm({ ...form, applicationId: e.target.value })}>
              {apps.map((a) => <option key={a._id} value={a._id}>{a.candidateName} — {a.jobTitle} ({a.company}) · {a.stage}</option>)}
            </select>
          </label>
          <label>Date<input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
          <label>Time<input required type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></label>
          <label>Mode
            <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
              <option>Video</option><option>Phone</option><option>In person</option>
            </select>
          </label>
          <label>Notes<textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          <button className="btn" type="submit">Schedule interview</button>
        </form>
      </div>
      <div className="card">
        <h3>Scheduled interviews</h3>
        {interviews.length === 0 ? <p className="muted">No interviews scheduled yet.</p> : interviews.map((iv) => (
          <p key={iv._id}><b>{iv.candidateName}</b> — {iv.jobTitle} ({iv.company}) · {iv.date} at {iv.time} · {iv.mode}
            <button className="btn danger" style={{ marginLeft: 10 }} onClick={async () => { await api.deleteInterview(iv._id); load(); }}>Cancel</button>
          </p>
        ))}
      </div>
    </div>
  );
}
