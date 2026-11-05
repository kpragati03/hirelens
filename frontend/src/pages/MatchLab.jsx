import { useEffect, useState } from 'react';
import api from '../api.js';

export default function MatchLab() {
  const [profile, setProfile] = useState({ name: '', headline: '', email: '', location: '', skills: '', experienceYears: 0, summary: '', resumeText: '' });
  const [jobs, setJobs] = useState([]);
  const [jobId, setJobId] = useState('');
  const [result, setResult] = useState(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [p, j] = await Promise.all([api.getProfile(), api.getJobs()]);
        if (p.profile) setProfile({ ...p.profile, experienceYears: p.profile.experienceYears ?? 0 });
        setJobs(j.jobs || []);
        if (j.jobs?.length) setJobId(j.jobs[0]._id);
      } catch (e) { setError(e.message); }
    })();
  }, []);

  const save = async (e) => {
    e.preventDefault(); setError(''); setMsg('');
    try { await api.saveProfile({ ...profile, experienceYears: Number(profile.experienceYears) || 0 }); setMsg('Profile saved.'); }
    catch (err) { setError(err.message); }
  };

  const runMatch = async () => {
    setError(''); setResult(null);
    try {
      const res = await api.matchJob({ jobId, skills: profile.skills, resumeText: profile.resumeText });
      setResult(res);
    } catch (err) { setError(err.message); }
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      {msg && <div className="success">{msg}</div>}
      <div className="card">
        <h3>Candidate profile</h3>
        <form onSubmit={save}>
          <label>Name<input required value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></label>
          <label>Headline<input value={profile.headline} onChange={(e) => setProfile({ ...profile, headline: e.target.value })} /></label>
          <label>Email<input required type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></label>
          <label>Location<input value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} /></label>
          <label>Skills (comma-separated)<input value={profile.skills} onChange={(e) => setProfile({ ...profile, skills: e.target.value })} /></label>
          <label>Experience (years)<input type="number" min="0" value={profile.experienceYears} onChange={(e) => setProfile({ ...profile, experienceYears: e.target.value })} /></label>
          <label>Summary<textarea rows={3} value={profile.summary} onChange={(e) => setProfile({ ...profile, summary: e.target.value })} /></label>
          <label>Resume text (paste your full resume)<textarea rows={6} value={profile.resumeText} onChange={(e) => setProfile({ ...profile, resumeText: e.target.value })} /></label>
          <button className="btn" type="submit">Save profile</button>
        </form>
      </div>
      <div className="card">
        <h3>AI resume ↔ job match</h3>
        <label>Job
          <select value={jobId} onChange={(e) => setJobId(e.target.value)}>
            {jobs.map((j) => <option key={j._id} value={j._id}>{j.title} — {j.company}</option>)}
          </select>
        </label>
        <button className="btn" onClick={runMatch} disabled={!jobId}>Run AI match</button>
        {result && (
          <div style={{ marginTop: 14 }}>
            <p>Match score: <span className="score">{result.score}%</span> <span className="muted">({result.source === 'gemini' ? 'Gemini AI' : 'deterministic scorer — no Gemini key set'})</span></p>
            <p><b>Verdict:</b> {result.verdict}</p>
            <p><b>Matched skills:</b> {(result.matchedSkills || []).join(', ') || '—'}</p>
            <p><b>Missing skills:</b> {(result.missingSkills || []).join(', ') || 'None'}</p>
            <p><b>Strengths:</b></p>
            <ul>{(result.strengths || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
        )}
      </div>
    </div>
  );
}
