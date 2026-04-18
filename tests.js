#!/usr/bin/env node
/**
 * Integration smoke tests — LyraBackend <-> LyraAI
 *
 * Requirements:
 *   LyraBackend running on http://localhost:3000  (cd LyraBackend && node index.js)
 *   LyraAI      running on http://localhost:8001  (cd LyraAI && uvicorn app.main:app --port 8001)
 *
 * Run: node tests.js
 */

const BACKEND = 'http://localhost:3000';
const AI      = 'http://localhost:8001';

// ── helpers ───────────────────────────────────────────────────────────────────

let passed = 0, failed = 0;

async function get(url, token) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(url, { headers });
    return { status: res.status, body: await res.json().catch(() => ({})) };
}

async function post(url, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    return { status: res.status, body: await res.json().catch(() => ({})) };
}

function assert(name, condition, detail = '') {
    if (condition) {
        console.log(`  ✅  ${name}`);
        passed++;
    } else {
        console.log(`  ❌  ${name}${detail ? ' — ' + detail : ''}`);
        failed++;
    }
}

function section(title) {
    const pad = Math.max(0, 50 - title.length);
    console.log(`\n── ${title} ${'─'.repeat(pad)}`);
}

// ── tests ─────────────────────────────────────────────────────────────────────

async function run() {
    // ── 1. Health checks ─────────────────────────────────────────────────────
    section('Health checks');

    const backendHealth = await get(`${BACKEND}/health`).catch(() => null);
    assert('LyraBackend /health responds',
        backendHealth?.status === 200,
        backendHealth ? JSON.stringify(backendHealth.body) : 'connection refused');
    assert('LyraBackend status is ok',
        backendHealth?.body?.status === 'ok');

    const aiHealth = await get(`${AI}/health`).catch(() => null);
    assert('LyraAI /health responds',
        aiHealth?.status === 200,
        aiHealth ? JSON.stringify(aiHealth.body) : 'connection refused');
    assert('LyraAI status is ok',
        aiHealth?.body?.status === 'ok');

    if (!backendHealth || !aiHealth) {
        console.log('\n⚠️  One or both services are not running. Aborting remaining tests.\n');
        summary();
        return;
    }

    // ── 2. LyraAI standalone ─────────────────────────────────────────────────
    section('LyraAI — /recommend (standalone)');

    const recRes = await post(`${AI}/recommend`, {
        user_id: 'test-user-0',
        learning_objectives: ['Aprender desde cero'],
        n_sessions: 0,
        recent_metrics: [],
        exercises: [
            { exercise_id: '1', title: 'C Major Scale', difficulty: 1, target_skills: '["rhythm","right_hand"]' },
            { exercise_id: '2', title: 'Legato Touch',  difficulty: 2, target_skills: '["legato","right_hand"]' },
        ],
    });
    assert('/recommend returns 200', recRes.status === 200, `got ${recRes.status}`);
    assert('/recommend returns exercise_id', !!recRes.body.exercise_id, JSON.stringify(recRes.body));
    assert('/recommend returns selected_by', !!recRes.body.selected_by);
    assert('/recommend returns cnn_epsilon', typeof recRes.body.cnn_epsilon === 'number');
    console.log(`     selected_by=${recRes.body.selected_by}  epsilon=${recRes.body.cnn_epsilon}`);

    const trainRes = await post(`${AI}/train/test-user-0`, { samples: [] });
    assert('/train returns 200', trainRes.status === 200, `got ${trainRes.status}`);
    assert('/train returns triggered=true', trainRes.body.triggered === true);

    // ── 3. Auth ───────────────────────────────────────────────────────────────
    section('LyraBackend — Auth');

    const ts = Date.now();
    const regRes = await post(`${BACKEND}/api/auth/register`, {
        username: `testuser_${ts}`,
        email: `test_${ts}@lyra.dev`,
        password: 'Test1234!',
        learning_objectives: ['Mejorar técnica', 'Leer partituras'],
    });
    assert('POST /auth/register returns 200', regRes.status === 200, `got ${regRes.status}: ${JSON.stringify(regRes.body)}`);
    assert('register returns token', !!regRes.body.token);
    assert('register returns user_id', !!regRes.body.user_id);

    const token  = regRes.body.token;
    const userId = regRes.body.user_id;
    console.log(`     user_id=${userId}`);

    const loginRes = await post(`${BACKEND}/api/auth/login`, {
        email: `test_${ts}@lyra.dev`,
        password: 'Test1234!',
    });
    assert('POST /auth/login returns 200', loginRes.status === 200, `got ${loginRes.status}`);
    assert('login returns token', !!loginRes.body.token);

    // ── 4. Exercises catalog ──────────────────────────────────────────────────
    section('LyraBackend — Exercises');

    const exRes = await get(`${BACKEND}/api/exercises`, token);
    assert('GET /exercises returns 200', exRes.status === 200, `got ${exRes.status}`);
    assert('exercises is an array', Array.isArray(exRes.body));
    console.log(`     ${exRes.body.length} exercise(s) in catalog`);

    // ── 5. Next exercise (Backend -> AI) ─────────────────────────────────────
    section('LyraBackend — GET /users/:id/next-exercise  (calls LyraAI)');

    const nextRes = await get(`${BACKEND}/api/users/${userId}/next-exercise`, token);
    assert('GET /next-exercise returns 200', nextRes.status === 200, `got ${nextRes.status}: ${JSON.stringify(nextRes.body)}`);
    assert('next-exercise has session_id', !!nextRes.body.session_id);
    assert('next-exercise has exercise',   !!nextRes.body.exercise);
    assert('exercise has notation',        !!nextRes.body.exercise?.notation);
    assert('selected_by is present',       !!nextRes.body.selected_by);
    console.log(`     exercise="${nextRes.body.exercise?.title}"  selected_by=${nextRes.body.selected_by}  hint=${nextRes.body.strategy_hint || 'none'}`);

    const sessionId = nextRes.body.session_id;

    // ── 6. Complete session (Backend -> AI /train) ────────────────────────────
    section('LyraBackend — POST /sessions/:id/complete  (triggers LyraAI /train)');

    const completeRes = await post(`${BACKEND}/api/sessions/${sessionId}/complete`, {
        metric_vector: {
            note_accuracy:       0.82,
            wrong_note_rate:     0.10,
            missed_note_rate:    0.08,
            tempo_deviation:     0.12,
            rhythm_consistency:  0.75,
            note_length_accuracy:0.80,
            velocity_mean:       0.55,
            velocity_variance:   0.30,
            legato_adherence:    0.70,
            hand_independence:   0.65,
        },
        duration_s: 47.3,
    }, token);
    assert('POST /complete returns 200', completeRes.status === 200, `got ${completeRes.status}: ${JSON.stringify(completeRes.body)}`);
    assert('complete returns metric_id',       !!completeRes.body.metric_id);
    assert('complete returns improvement_delta', typeof completeRes.body.improvement_delta === 'number');
    console.log(`     improvement_delta=${completeRes.body.improvement_delta?.toFixed(4)}`);

    // ── 7. Second next-exercise (CNN should now have data) ────────────────────
    section('LyraBackend — second /next-exercise after training data exists');

    // Small delay so LyraAI background training has a chance to start
    await new Promise(r => setTimeout(r, 500));

    const next2Res = await get(`${BACKEND}/api/users/${userId}/next-exercise`, token);
    assert('second /next-exercise returns 200', next2Res.status === 200, `got ${next2Res.status}`);
    assert('new session_id issued', next2Res.body.session_id !== sessionId);
    console.log(`     exercise="${next2Res.body.exercise?.title}"  selected_by=${next2Res.body.selected_by}`);

    // ── 8. Progress ───────────────────────────────────────────────────────────
    section('LyraBackend — GET /users/:id/progress');

    const progRes = await get(`${BACKEND}/api/users/${userId}/progress`, token);
    assert('GET /progress returns 200', progRes.status === 200, `got ${progRes.status}`);
    assert('progress has metrics array', Array.isArray(progRes.body.metrics));
    assert('progress has history array', Array.isArray(progRes.body.history));
    assert('n_sessions = 1',            progRes.body.n_sessions === 1);
    console.log(`     n_sessions=${progRes.body.n_sessions}  history events=${progRes.body.history.length}`);

    // ── 9. Duplicate complete (idempotency guard) ─────────────────────────────
    section('LyraBackend — duplicate complete is rejected');

    const dupeRes = await post(`${BACKEND}/api/sessions/${sessionId}/complete`, {
        metric_vector: {}, duration_s: 5,
    }, token);
    assert('duplicate complete returns 409', dupeRes.status === 409, `got ${dupeRes.status}`);

    summary();
}

function summary() {
    const total = passed + failed;
    console.log(`\n${'═'.repeat(55)}`);
    console.log(`  ${passed}/${total} passed   ${failed > 0 ? `(${failed} failed)` : '🎉 all good'}`);
    console.log(`${'═'.repeat(55)}\n`);
    process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
    console.error('\nUnexpected error:', err.message);
    process.exit(1);
});
