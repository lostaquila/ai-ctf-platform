import http from 'k6/http';
import { check, sleep } from 'k6';

// --- CONFIGURATION ---
// Target: 100 users over 1 minute
export const options = {
    stages: [
        { duration: '30s', target: 50 },  // Warm up to 50 users
        { duration: '1m', target: 100 },  // Stay at 100 users (Peak)
        { duration: '30s', target: 0 },   // Cool down
    ],
};

// Replace this with your VERCEL PRODUCTION URL (Not localhost)
const BASE_URL = 'https://ai-ctf-eosin.vercel.app/';

export default function () {
    // 1. VISIT HOMEPAGE (Tests Vercel CDN & Basic React rendering)
    const resHome = http.get(BASE_URL);
    check(resHome, { 'Homepage 200': (r) => r.status === 200 });

    // 2. CHECK LEADERBOARD (Tests Supabase Read Capacity)
    const resBoard = http.get(`${BASE_URL}/leaderboard`);
    check(resBoard, { 'Leaderboard 200': (r) => r.status === 200 });

    // 3. SIMULATE A FLAG SUBMISSION (Tests Supabase Write + Transaction Pooler)
    // We send a fake flag to a non-existent endpoint or just the home page to generate traffic.
    // Ideally, creating a specific API route that does a simple DB select is safer than spamming your AI.

    // Sleep between 1-5 seconds (simulates human thinking time)
    sleep(Math.random() * 5 + 1);
}
