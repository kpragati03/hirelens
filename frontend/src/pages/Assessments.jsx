import { useEffect, useState } from 'react';
import api from '../api.js';
import { CHALLENGES, runTests } from '../data/challenges.js';

export default function Assessments() {
  const [challenge, setChallenge] = useState(CHALLENGES[0]);
  const [code, setCode] = useState(CHALLENGES[0].starterCode);
  const [secondsLeft, setSecondsLeft] = useState(CHALLENGES[0].timeMinutes * 60);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [review, setReview] = useState(null);
  const [subs, setSubs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => { api.getSubmissions().then((r) => setSubs(r.submissions || [])).catch(() => {}); }, []);

  useEffect(() => {
    setSecondsLeft(challenge.timeMinutes * 60);
    const t = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [challenge]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  const pick = (c) => { setChallenge(c); setCode(c.starterCode); setResults(null); setReview(null); };

  const run = async () => {
    setRunning(true); setError('');
    try { setResults(await runTests(code, challenge)); }
    catch (e) { setError(e.message); }
    setRunning(false);
  };

  const submit = async () => {
    if (!results) { setError('Run the tests first, then submit.'); return; }
    const passed = results.filter((r) => r.passed).length;
    try {
      const profile = await api.getProfile();
      const res = await api.submitAssessment({
        challengeId: challenge.id, challengeTitle: challenge.title, code,
        passed, total: results.length,
        candidateName: profile.profile?.name || '', candidateEmail: profile.profile?.email || '',
      });
      setReview(res.submission);
      const all = await api.getSubmissions(); setSubs(all.submissions || []);
    } catch (e) { setError(e.message); }
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      <div className="card">
        <h3>Coding challenges</h3>
        <div>{CHALLENGES.map((c) => (
          <button key={c.id} className={`btn ${challenge.id === c.id ? '' : 'secondary'}`} style={{ margin: '0 6px 6px 0' }} onClick={() => pick(c)}>
            {c.title} · {c.difficulty}
          </button>
        ))}</div>
      </div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ margin: 0 }}>{challenge.title} <span className="muted">({challenge.difficulty})</span></h3>
          <span className={`timer ${secondsLeft < 60 ? 'low' : ''}`}>{mm}:{ss}</span>
        </div>
        <p>{challenge.description}</p>
        <p className="muted">Write <code>{challenge.functionName}</code> in the editor. Tests run in the browser sandbox (or via Piston if VITE_PISTON_API_URL is set). Hidden tests are not shown until you run.</p>
        <textarea className="code" value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={run} disabled={running}>{running ? 'Running…' : 'Run tests'}</button>
          <button className="btn secondary" onClick={submit} disabled={!results}>Submit for AI review</button>
        </div>
        {results && (
          <pre className="results">{results.map((r, i) => `${r.passed ? '✓' : '✗'} Test ${i + 1}${r.hidden ? ' (hidden)' : ''}: ${r.passed ? 'passed' : `failed — expected ${JSON.stringify(r.expected)}, got ${JSON.stringify(r.got)}${r.error ? ` (${r.error})` : ''}`}`).join('\n')}</pre>
        )}
        {review && (
          <div style={{ marginTop: 12 }}>
            <h4>AI code review</h4>
            <p>Correctness <b>{review.correctness}%</b> · Efficiency <b>{review.efficiency}%</b> · Readability <b>{review.readability}%</b></p>
            <ul>{(review.feedback || []).map((f, i) => <li key={i}>{f}</li>)}</ul>
          </div>
        )}
      </div>
      <div className="card">
        <h3>Past submissions</h3>
        {subs.length === 0 ? <p className="muted">No submissions yet.</p> : subs.slice(0, 10).map((s) => (
          <p key={s._id}><b>{s.challengeTitle}</b> — {s.passed}/{s.total} tests · correctness {s.correctness}% · efficiency {s.efficiency}% · readability {s.readability}%</p>
        ))}
      </div>
    </div>
  );
}
