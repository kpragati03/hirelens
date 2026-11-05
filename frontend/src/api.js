// Central API client. Base URL comes from VITE_API_URL, falling back to
// the local Express backend. In `vite dev` the proxy also forwards /api.
const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  health: () => request('/health'),
  getJobs: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/jobs${q ? `?${q}` : ''}`);
  },
  createJob: (job) => request('/jobs', { method: 'POST', body: JSON.stringify(job) }),
  deleteJob: (id) => request(`/jobs/${id}`, { method: 'DELETE' }),

  getProfile: () => request('/profile'),
  saveProfile: (profile) => request('/profile', { method: 'POST', body: JSON.stringify(profile) }),

  matchJob: (payload) => request('/match', { method: 'POST', body: JSON.stringify(payload) }),

  getApplications: () => request('/applications'),
  applyToJob: (payload) => request('/applications', { method: 'POST', body: JSON.stringify(payload) }),
  updateStage: (id, stage) => request(`/applications/${id}/stage`, { method: 'PATCH', body: JSON.stringify({ stage }) }),
  deleteApplication: (id) => request(`/applications/${id}`, { method: 'DELETE' }),

  getSubmissions: () => request('/assessments'),
  submitAssessment: (payload) => request('/assessments/submit', { method: 'POST', body: JSON.stringify(payload) }),

  getInterviews: () => request('/interviews'),
  scheduleInterview: (payload) => request('/interviews', { method: 'POST', body: JSON.stringify(payload) }),
  deleteInterview: (id) => request(`/interviews/${id}`, { method: 'DELETE' }),
};

export default api;
