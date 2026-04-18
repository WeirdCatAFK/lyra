/**
 * Idempotent exercise catalog seeder.
 *
 * Runs once after schema/migrations on startup. If the Exercises table is
 * empty (or any of the catalog titles are missing), inserts the missing rows.
 *
 * Notation shape:
 *   { tempo_bpm, notes: [{ pitch, startBeat, duration, hand, finger }] }
 *
 * Pitches are MIDI numbers. Middle C = 60, C3 = 48, C5 = 72.
 */

const { all, run } = require('./helpers');

// ── metric_schema presets ──────────────────────────────────────────────────────

const baseRH = {
    note_accuracy:        { weight: 1.0 },
    wrong_note_rate:      { weight: 0.8 },
    missed_note_rate:     { weight: 0.7 },
    rhythm_consistency:   { weight: 0.7 },
    tempo_deviation:      { weight: 0.6 },
};

const baseLH = { ...baseRH };

const baseBoth = {
    ...baseRH,
    hand_independence:    { weight: 0.9 },
    note_length_accuracy: { weight: 0.5 },
};

// ── helpers ────────────────────────────────────────────────────────────────────

const note = (pitch, startBeat, duration, hand, finger) =>
    ({ pitch, startBeat, duration, hand, finger });

// Build a sequence of equal-duration notes: pitches[i] starts at i*step
function seq(pitches, fingers, hand = 'right', step = 1, duration = 1) {
    return pitches.map((p, i) => note(p, i * step, duration, hand, fingers[i] ?? 1));
}

// Build a chord: all pitches at the same startBeat
function chord(pitches, fingers, startBeat, duration, hand) {
    return pitches.map((p, i) => note(p, startBeat, duration, hand, fingers[i] ?? 1));
}

// ── catalog ────────────────────────────────────────────────────────────────────

const CATALOG = [
    {
        title: 'Notas repetidas — Pulgar MD',
        difficulty: 1,
        target_skills: ['right_hand', 'finger_independence'],
        notation: {
            tempo_bpm: 60,
            notes: seq([60, 60, 60, 60], [1, 1, 1, 1], 'right'),
        },
        metric_schema: baseRH,
    },
    {
        title: 'Notas repetidas — Dedo medio MD',
        difficulty: 1,
        target_skills: ['right_hand', 'finger_independence'],
        notation: {
            tempo_bpm: 60,
            notes: seq([64, 64, 64, 64], [3, 3, 3, 3], 'right'),
        },
        metric_schema: baseRH,
    },
    {
        title: 'Notas repetidas — Meñique MD',
        difficulty: 1,
        target_skills: ['right_hand', 'finger_independence'],
        notation: {
            tempo_bpm: 60,
            notes: seq([67, 67, 67, 67], [5, 5, 5, 5], 'right'),
        },
        metric_schema: baseRH,
    },
    {
        title: 'Posición de cinco dedos — Mano derecha',
        difficulty: 1,
        target_skills: ['right_hand', 'finger_independence'],
        notation: {
            tempo_bpm: 60,
            notes: seq([60, 62, 64, 65, 67], [1, 2, 3, 4, 5], 'right'),
        },
        metric_schema: baseRH,
    },
    {
        title: 'Posición de cinco dedos — Mano izquierda',
        difficulty: 1,
        target_skills: ['left_hand', 'finger_independence'],
        notation: {
            tempo_bpm: 60,
            notes: seq([48, 50, 52, 53, 55], [5, 4, 3, 2, 1], 'left'),
        },
        metric_schema: baseLH,
    },
    {
        title: 'Dos notas alternadas — MD',
        difficulty: 1,
        target_skills: ['right_hand', 'intervals'],
        notation: {
            tempo_bpm: 70,
            notes: seq(
                [60, 64, 60, 64, 60, 64, 60, 64],
                [1,  3,  1,  3,  1,  3,  1,  3],
                'right'
            ),
        },
        metric_schema: baseRH,
    },
    {
        title: 'Tres notas — MD',
        difficulty: 1,
        target_skills: ['right_hand', 'finger_independence'],
        notation: {
            tempo_bpm: 70,
            notes: seq([60, 62, 64, 62, 60], [1, 2, 3, 2, 1], 'right'),
        },
        metric_schema: baseRH,
    },
    {
        title: 'Quinta Do-Sol — MD',
        difficulty: 1,
        target_skills: ['right_hand', 'chords', 'intervals'],
        notation: {
            tempo_bpm: 60,
            notes: [
                ...chord([60, 67], [1, 5], 0, 1, 'right'),
                ...chord([60, 67], [1, 5], 1, 1, 'right'),
                ...chord([60, 67], [1, 5], 2, 1, 'right'),
                ...chord([60, 67], [1, 5], 3, 1, 'right'),
            ],
        },
        metric_schema: { ...baseRH, note_length_accuracy: { weight: 0.7 } },
    },
    {
        title: 'Hot Cross Buns — MD',
        difficulty: 1,
        target_skills: ['right_hand', 'melody'],
        notation: {
            tempo_bpm: 80,
            notes: seq(
                [64, 62, 60, 64, 62, 60, 60, 60, 60, 60, 62, 62, 62, 62, 64, 62, 60],
                [3,  2,  1,  3,  2,  1,  1,  1,  1,  1,  2,  2,  2,  2,  3,  2,  1],
                'right'
            ),
        },
        metric_schema: { ...baseRH, note_length_accuracy: { weight: 0.6 } },
    },
    {
        title: 'Cambio de posición Do→Sol — MD',
        difficulty: 1,
        target_skills: ['right_hand', 'hand_position'],
        notation: {
            tempo_bpm: 60,
            notes: seq(
                [60, 62, 64, 65, 67, 67, 69, 71, 72, 74],
                [1,  2,  3,  4,  5,  1,  2,  3,  4,  5],
                'right'
            ),
        },
        metric_schema: baseRH,
    },
    {
        title: 'Escala Do Mayor — Mano derecha',
        difficulty: 1,
        target_skills: ['right_hand', 'scales'],
        notation: {
            tempo_bpm: 60,
            notes: seq([60, 62, 64, 65, 67, 69, 71, 72],
                       [1, 2, 3, 1, 2, 3, 4, 5], 'right'),
        },
        metric_schema: baseRH,
    },
    {
        title: 'Escala Do Mayor — Mano izquierda',
        difficulty: 2,
        target_skills: ['left_hand', 'scales'],
        notation: {
            tempo_bpm: 60,
            notes: seq([48, 50, 52, 53, 55, 57, 59, 60],
                       [5, 4, 3, 2, 1, 3, 2, 1], 'left'),
        },
        metric_schema: baseLH,
    },
    {
        title: 'Mary Had a Little Lamb',
        difficulty: 2,
        target_skills: ['right_hand', 'melody'],
        notation: {
            tempo_bpm: 80,
            notes: seq(
                [64, 62, 60, 62, 64, 64, 64, 62, 62, 62, 64, 67, 67],
                [3,  2,  1,  2,  3,  3,  3,  2,  2,  2,  3,  5,  5],
                'right'
            ),
        },
        metric_schema: { ...baseRH, note_length_accuracy: { weight: 0.6 } },
    },
    {
        title: 'Twinkle Twinkle Little Star',
        difficulty: 2,
        target_skills: ['right_hand', 'melody', 'intervals'],
        notation: {
            tempo_bpm: 80,
            notes: seq(
                [60, 60, 67, 67, 69, 69, 67, 65, 65, 64, 64, 62, 62, 60],
                [1,  1,  5,  5,  4,  4,  3,  4,  4,  3,  3,  2,  2,  1],
                'right'
            ),
        },
        metric_schema: { ...baseRH, note_length_accuracy: { weight: 0.6 } },
    },
    {
        title: 'Arpegio Do Mayor — Mano derecha',
        difficulty: 3,
        target_skills: ['right_hand', 'arpeggios'],
        notation: {
            tempo_bpm: 70,
            notes: seq([60, 64, 67, 72, 67, 64, 60],
                       [1,  2,  3,  5,  3,  2,  1], 'right'),
        },
        metric_schema: baseRH,
    },
    {
        title: 'Escala contraria — Ambas manos',
        difficulty: 3,
        target_skills: ['both_hands', 'hand_independence', 'scales'],
        notation: {
            tempo_bpm: 60,
            notes: [
                ...seq([60, 62, 64, 65, 67], [1, 2, 3, 4, 5], 'right'),
                ...seq([60, 59, 57, 55, 53], [1, 2, 3, 4, 5], 'left'),
            ],
        },
        metric_schema: baseBoth,
    },
    {
        title: 'Acordes I-IV-V-I — Mano izquierda',
        difficulty: 3,
        target_skills: ['left_hand', 'chords'],
        notation: {
            tempo_bpm: 60,
            notes: [
                ...chord([48, 52, 55], [5, 3, 1], 0, 2, 'left'),  // I  C
                ...chord([53, 57, 60], [5, 3, 1], 2, 2, 'left'),  // IV F
                ...chord([55, 59, 62], [5, 3, 1], 4, 2, 'left'),  // V  G
                ...chord([48, 52, 55], [5, 3, 1], 6, 2, 'left'),  // I  C
            ],
        },
        metric_schema: { ...baseLH, note_length_accuracy: { weight: 0.7 } },
    },
    {
        title: 'Oda a la Alegría (Beethoven)',
        difficulty: 3,
        target_skills: ['right_hand', 'melody'],
        notation: {
            tempo_bpm: 80,
            notes: seq(
                [64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64, 64, 62, 62],
                [3,  3,  4,  5,  5,  4,  3,  2,  1,  1,  2,  3,  3,  2,  2],
                'right'
            ),
        },
        metric_schema: { ...baseRH, note_length_accuracy: { weight: 0.6 } },
    },
    {
        title: 'Escala Sol Mayor — Mano derecha',
        difficulty: 4,
        target_skills: ['right_hand', 'scales', 'key_signatures'],
        notation: {
            tempo_bpm: 70,
            notes: seq([67, 69, 71, 72, 74, 76, 78, 79],
                       [1,  2,  3,  1,  2,  3,  4,  5], 'right'),
        },
        metric_schema: baseRH,
    },
    {
        title: 'Acordes con melodía — Ambas manos',
        difficulty: 4,
        target_skills: ['both_hands', 'coordination', 'chords'],
        notation: {
            tempo_bpm: 70,
            notes: [
                ...seq([60, 62, 64, 65, 67], [1, 2, 3, 4, 5], 'right'),
                ...chord([48, 52, 55], [5, 3, 1], 0, 5, 'left'),
            ],
        },
        metric_schema: baseBoth,
    },
    {
        title: 'Escala Do Mayor — 2 octavas (MD)',
        difficulty: 4,
        target_skills: ['right_hand', 'scales', 'finger_crossing'],
        notation: {
            tempo_bpm: 80,
            notes: seq(
                [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 83, 84],
                [1,  2,  3,  1,  2,  3,  4,  1,  2,  3,  1,  2,  3,  4,  5],
                'right'
            ),
        },
        metric_schema: baseRH,
    },
    {
        title: 'Canon en Re — Fragmento',
        difficulty: 5,
        target_skills: ['both_hands', 'polyphony', 'voice_leading'],
        notation: {
            tempo_bpm: 70,
            notes: [
                // RH: simplified Pachelbel motif (D-A-B-F#-G-D-G-A range)
                ...seq([74, 73, 71, 69, 71, 73, 74, 76],
                       [3,  2,  1,  2,  3,  4,  5,  5], 'right'),
                // LH: descending bass (D-A-B-F#-G-D-G-A as quarter notes)
                ...seq([50, 57, 47, 54, 55, 50, 55, 57],
                       [5,  3,  5,  4,  3,  5,  3,  1], 'left'),
            ],
        },
        metric_schema: baseBoth,
    },
    {
        title: 'Bach — Preludio en Do Menor (Frag.)',
        difficulty: 5,
        target_skills: ['both_hands', 'voice_leading', 'arpeggios'],
        notation: {
            tempo_bpm: 70,
            notes: [
                // RH: arpeggios C-Eb-G-C across two beats each, repeated
                ...seq([60, 63, 67, 72, 67, 63, 60, 63],
                       [1,  2,  3,  5,  3,  2,  1,  2], 'right'),
                // LH: bass C2 sustained
                note(36, 0, 4, 'left', 5),
                note(36, 4, 4, 'left', 5),
            ],
        },
        metric_schema: baseBoth,
    },
];

// ── seeder ─────────────────────────────────────────────────────────────────────

async function seedExercises() {
    try {
        const existing = await all('SELECT title FROM Exercises', []);
        const haveTitles = new Set(existing.map(r => r.title));
        const missing = CATALOG.filter(e => !haveTitles.has(e.title));

        if (missing.length === 0) {
            console.log(`Exercise catalog already seeded (${existing.length} rows)`);
            return;
        }

        for (const ex of missing) {
            await run(
                `INSERT INTO Exercises (title, difficulty, target_skills, notation, metric_schema, generated_by)
                 VALUES (?, ?, ?, ?, ?, 'seed')`,
                [
                    ex.title,
                    ex.difficulty,
                    JSON.stringify(ex.target_skills),
                    JSON.stringify(ex.notation),
                    JSON.stringify(ex.metric_schema),
                ]
            );
        }
        console.log(`Seeded ${missing.length} new exercises (catalog total: ${existing.length + missing.length})`);
    } catch (err) {
        console.error('Exercise seed failed:', err.message);
    }
}

module.exports = { seedExercises };
