import { useEffect, useState } from 'react';
import api from '../api.js';

const EMPTY = { title: '', company: '', location: '', jobType: 'Full-time', level: 'Junior', salary: '', skills: '', description: '' };

export default function Jobs({ role }) {
  const [jobs, setJobs] = useState([]);
  const [profile, setProfile] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [j, p] = await Promise.all([api.getJobs({ search }), api.getProfile()]);
      setJobs(j.jobs || []); setProfile(p.profile);
    } catch (e) { setError(e.message); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [search]);

  const postJob = async (e) => {
    e.preventDefault(); setError(''); setMsg('');
    try {
      await api.createJob({ ...form, skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean) });
      setForm(EMPTY); setMsg('Job posted.'); load();
    } catch (err) { setError(err.message); }
  };

  const apply = async (job) => {
    setError(''); setMsg('');
    if (!profile) { setError('Save your candidate profile in Match Lab first.'); return; }
    try {
      const res = await api.applyToJob({ jobId: job._id, candidateName: profile.name, candidateEmail: profile.email, skills: profile.skills, resumeText: profile.resumeText });
      setMsg(`Applied to ${job.title} — AI match ${res.application.matchScore}%. See the Pipeline tab.`);
    } catch (err) { setError(err.message); }
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      {msg && <div className="success">{msg}</div>}
      <div className="card">
        <h3>Find a job</h3>
        <input placeholder="Search title, company or location…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {jobs.length === 0 && <p className="muted">No jobs yet. Post one below, or run the backend seed script.</p>}
      {jobs.map((job) => (
        <div key={job._id} className="card">
          <div className="job">
            <div>
              <h3 style={{ margin: '0 0 4px' }}>{job.title}</h3>
              <p className="muted" style={{ margin: 0 }}>{job.company} · {job.location} · {job.jobType} · {job.level} · {job.salary}</p>
              <p>{job.description}</p>
              {(job.skills || []).map((s) => <span key={s} className="chip">{s}</span>)}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" onClick={() => apply(job)}>Apply</button>
              {role !== 'Candidate' && <button className="btn danger" onClick={async () => { await api.deleteJob(job._id); load(); }}>Delete</button>}
            </div>
          </div>
        </div>
      ))}
      <div className="card">
        <h3>Post a job {role === 'Candidate' && <span className="muted">(recruiters usually do this — you can still try it in the demo)</span>}</h3>
        <form onSubmit={postJob}>
          <label>Title<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label>Company<input required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></label>
          <label>Location<input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label>
          <label>Job type
            <select value={form.jobType} onChange={(e) => setForm({ ...form, jobType: e.target.value })}>
              <option>Full-time</option><option>Part-time</option><option>Internship</option><option>Contract</option>
            </select>
          </label>
          <label>Level
            <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
              <option>Intern</option><option>Entry Level</option><option>Junior</option><option>Mid</option><option>Senior</option>
            </select>
          </label>
          <label>Salary<input value={form.salary} placeholder="e.g. ₹6–8 LPA" onChange={(e) => setForm({ ...form, salary: e.target.value })} /></label>
          <label>Skills (comma-separated)<input value={form.skills} placeholder="React, Node.js, MongoDB" onChange={(e) => setForm({ ...form, skills: e.target.value })} /></label>
          <label>Description<textarea rows={3} required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <button className="btn" type="submit">Post job</button>
        </form>
      </div>
    </div>
  );
}
