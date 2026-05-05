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
  scenarioText?: string;
  decisionText?: string;
  hesitationMs?: number;
  decisionTimeMs?: number;
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

export async function completeSession(sessionId: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/complete-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    return res.ok;
  } catch (error) {
    console.error('API Error (completeSession):', error);
    return false;
  }
}

export async function getSessionResults(sessionId: string): Promise<any> {
  try {
    const res = await fetch(`${BASE_URL}/api/get-results?sessionId=${sessionId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('API Error (getSessionResults):', error);
    return null;
  }
}
