/**
 * AI matching + code review for HireLens.
 * Tries Google Gemini when GEMINI_API_KEY is set, otherwise falls back
 * to a deterministic, transparent skill-overlap scorer / heuristic reviewer
 * so the app works fully without a key.
 */

const GEMINI_MODEL = 'gemini-1.5-flash';

function normalise(s) {
  return String(s || '').trim().toLowerCase().replace(/[^a-z0-9+#. ]/g, '');
}

function parseSkills(input) {
  if (Array.isArray(input)) return input.map((s) => String(s).trim()).filter(Boolean);
  return String(input || '').split(',').map((s) => s.trim()).filter(Boolean);
}

function deterministicMatch(jobSkills, candidateSkills, resumeText) {
  const required = parseSkills(jobSkills);
  const have = new Set(parseSkills(candidateSkills).map(normalise));
  const resume = normalise(resumeText || '');
  const matchedSkills = [];
  const missingSkills = [];
  required.forEach((skill) => {
    if (have.has(normalise(skill)) || resume.includes(normalise(skill))) matchedSkills.push(skill);
    else missingSkills.push(skill);
  });
  const overlap = required.length ? matchedSkills.length / required.length : 0;
  // Small, explainable adjustment: a rich resume (projects / internships
  // mentioned) lifts the score slightly; missing skills cap it.
  let score = Math.round(overlap * 100);
  if (missingSkills.length === 0 && score === 100) score = 95; // never claim perfection
  if (missingSkills.length > 0) score = Math.min(score, 92);
  const strengths = [];
  if (matchedSkills.length) strengths.push(`Matches ${matchedSkills.length} of ${required.length} required skills: ${matchedSkills.join(', ')}.`);
  if (/intern/i.test(resumeText || '')) strengths.push('Has internship experience in a real engineering / delivery setting.');
  if (/project/i.test(resumeText || '')) strengths.push('Has shipped hands-on projects demonstrating the listed skills.');
  if (/hackerrank|gfg|geeksforgeeks|dsa/i.test(resumeText || '')) strengths.push('Shows sustained problem-solving practice (DSA / coding platforms).');
  if (!strengths.length) strengths.push('Candidate profile is on file; review the resume for project evidence.');
  const verdict =
    score >= 85 ? 'Strong match — shortlist recommended.'
    : score >= 70 ? 'Good match — worth an assessment.'
    : score >= 50 ? 'Moderate match — consider for a junior / intern role.'
    : 'Weak match — key required skills are missing.';
  return { score, matchedSkills, missingSkills, strengths, verdict };
}

async function tryGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
        }),
      }
    );
    if (!res.ok) {
      console.warn('Gemini request failed:', res.status, await res.text().catch(() => ''));
      return null;
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (err) {
    console.warn('Gemini error, falling back to deterministic scorer:', err.message);
    return null;
  }
}

async function matchResume(job, profile) {
  const jobSkills = job.skills || [];
  const candidateSkills = profile?.skills || '';
  const resumeText = profile?.resumeText || '';
  const fallback = deterministicMatch(jobSkills, candidateSkills, resumeText);
  const ai = await tryGemini(
    `You are a hiring assistant. Score how well this candidate matches the job. ` +
    `Return ONLY valid JSON with keys: score (0-100 integer), matchedSkills (array of strings, subset of the required skills), ` +
    `missingSkills (array of strings), strengths (array of short strings), verdict (one short sentence). ` +
    `Job: ${job.title} at ${job.company}. Required skills: ${jobSkills.join(', ')}. ` +
    `Candidate skills: ${candidateSkills}. Resume: ${resumeText.slice(0, 3000)}`
  );
  if (ai && typeof ai.score === 'number') {
    return {
      score: Math.max(0, Math.min(100, Math.round(ai.score))),
      matchedSkills: Array.isArray(ai.matchedSkills) ? ai.matchedSkills : fallback.matchedSkills,
      missingSkills: Array.isArray(ai.missingSkills) ? ai.missingSkills : fallback.missingSkills,
      strengths: Array.isArray(ai.strengths) && ai.strengths.length ? ai.strengths : fallback.strengths,
      verdict: ai.verdict || fallback.verdict,
      source: 'gemini',
    };
  }
  return { ...fallback, source: 'deterministic' };
}

function heuristicReview(code, passed, total) {
  const correctness = total ? Math.round((passed / total) * 100) : 0;
  const lines = String(code || '').split('\n').filter((l) => l.trim()).length;
  const hasMap = /\b(Map|Set|Object\.|hasOwnProperty)\b/.test(code || '');
  const hasNestedLoop = /for\s*\([^)]*\)\s*{[^}]*for\s*\(/.test(code || '');
  const hasComments = /\/\/|\/\*/.test(code || '');
  let efficiency = 90;
  if (hasNestedLoop && !hasMap) efficiency = 65;
  else if (hasMap) efficiency = 95;
  if (lines > 60) efficiency -= 10;
  efficiency = Math.max(40, Math.min(100, efficiency));
  let readability = 85;
  if (hasComments) readability += 5;
  if (/\b(a|b|x|tmp|arr2)\b/.test(code || '')) readability -= 10;
  if (lines < 5 && total > 0 && passed < total) readability -= 5;
  readability = Math.max(40, Math.min(100, readability));
  const feedback = [];
  feedback.push(passed === total
    ? 'All visible and hidden test cases pass — the solution is functionally correct.'
    : `${passed} of ${total} test cases pass. Check the failing cases: edge cases such as empty input, duplicates or negative numbers are the usual cause.`);
  feedback.push(hasNestedLoop && !hasMap
    ? 'Efficiency: nested loops suggest O(n²). Consider a hash map / Set for O(n) lookups where the problem allows it.'
    : 'Efficiency: the approach looks reasonably efficient for the input sizes in the tests.');
  feedback.push(hasComments
    ? 'Readability: good — comments explain the intent.'
    : 'Readability: add a short comment explaining the approach, and prefer descriptive variable names over single letters.');
  return { correctness, efficiency, readability, feedback, source: 'heuristic' };
}

async function reviewCode({ code, challengeTitle, passed, total }) {
  const fallback = heuristicReview(code, passed, total);
  const ai = await tryGemini(
    `You are a code reviewer. Review this JavaScript solution to "${challengeTitle}". ` +
    `It passed ${passed} of ${total} test cases. Return ONLY valid JSON with keys: ` +
    `correctness (0-100), efficiency (0-100), readability (0-100), feedback (array of 2-4 short specific strings). ` +
    `Code:\n${String(code || '').slice(0, 4000)}`
  );
  if (ai && typeof ai.correctness === 'number') {
    return {
      correctness: Math.round(ai.correctness),
      efficiency: Math.round(ai.efficiency ?? fallback.efficiency),
      readability: Math.round(ai.readability ?? fallback.readability),
      feedback: Array.isArray(ai.feedback) && ai.feedback.length ? ai.feedback : fallback.feedback,
      source: 'gemini',
    };
  }
  return fallback;
}

module.exports = { parseSkills, deterministicMatch, matchResume, reviewCode, heuristicReview };
