/**
 * api.ts
 * Minimal wrapper for Vercel serverless backend integration.
 */

const BASE_URL = 'https://playtrace-mocha.vercel.app';

export async function startSession(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/start-session`);
    if (!res.ok) throw new Error('Failed to start session');
    const { sessionId } = await res.json();
    if (sessionId) {
      localStorage.setItem('playtrace_session_id', sessionId);
    }
    return sessionId;
  } catch (error) {
    console.error('API Error (startSession):', error);
    return null;
  }
}

export async function logDecision(payload: {
  sessionId: string;
  stepId: string;
  decision: string;
  tags?: string[];
}) {
  try {
    // Fire-and-forget pattern
    fetch(`${BASE_URL}/api/log-decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(err => console.error('API Background Error (logDecision):', err));
  } catch (error) {
    console.error('API Error (logDecision):', error);
  }
}

export async function submitFeedback(payload: {
  sessionId: string;
  rating: number;
  feedback: string;
}) {
  try {
    const res = await fetch(`${BASE_URL}/api/submit-feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (error) {
    console.error('API Error (submitFeedback):', error);
    return false;
  }
}
