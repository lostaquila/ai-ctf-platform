import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    // Start small to avoid burning all your AI credits immediately
    stages: [
        { duration: '10s', target: 10 },  // Ramp to 10 users
        { duration: '30s', target: 20 },  // Hold 20 users
        { duration: '10s', target: 0 },   // Stop
    ],
};

// REPLACE THESE!
const BASE_URL = 'https://your-project.vercel.app';
const AUTH_TOKEN = 'eyJhY2Nlc3NfdG9rZW4iOiJleUpoYkdjaU9pSklVekkxTmlJc0ltdHBaQ0k2SWxGc00zSk1TemhXVkhaWlpHRTJkRUVpTENKMGVYQWlPaUpLVjFRaWZRLmV5SnBjM01pT2lKb2RIUndjem92TDNodGMzTmplVzVoZDNKc2FuUnRabXB6Y0c1ckxuTjFjR0ZpWVhObExtTnZMMkYxZEdndmRqRWlMQ0p6ZFdJaU9pSmxZakV6WlRRek1TMWlaamhrTFRRMllUY3RZak5oTnkxallqWTBOamhrWldFMk5UY2lMQ0poZFdRaU9pSmhkWFJvWlc1MGFXTmhkR1ZrSWl3aVpYaHdJam94TnpZME16WXdOalUzTENKcFlYUWlPakUzTmpRek5UY3dOVGNzSW1WdFlXbHNJam9pYTNWdVlXeHdjbUZrZVhWdFlXNDNRR2R0WVdsc0xtTnZiU0lzSW5Cb2IyNWxJam9pSWl3aVlYQndYMjFsZEdGa1lYUmhJanA3SW5CeWIzWnBaR1Z5SWpvaVpXMWhhV3dpTENKd2NtOTJhV1JsY25NaU9sc2laVzFoYVd3aVhYMHNJblZ6WlhKZmJXVjBZV1JoZEdFaU9uc2laVzFoYVd3aU9pSnJkVzVoYkhCeVlXUjVkVzFoYmpkQVoyMWhhV3d1WTI5dElpd2laVzFoYVd4ZmRtVnlhV1pwWldRaU9uUnlkV1VzSW5Cb2IyNWxYM1psY21sbWFXVmtJanBtWVd4elpTd2ljM1ZpSWpvaVpXSXhNMlUwTXpFdFltWTRaQzAwTm1FM0xXSXpZVGN0WTJJMk5EWTRaR1ZoTmpVM0lpd2lkWE5sY201aGJXVWlPaUpzYjNOMFlYRjFhV3hoSW4wc0luSnZiR1VpT2lKaGRYUm9aVzUwYVdOaGRHVmtJaXdpWVdGc0lqb2lZV0ZzTVNJc0ltRnRjaUk2VzNzaWJXVjBhRzlrSWpvaWNHRnpjM2R2Y21RaUxDSjBhVzFsYzNSaGJYQWlPakUzTmpReU1EQTVNVGg5WFN3aWMyVnpjMmx2Ymw5cFpDSTZJbVJsTjJRNE9UUmpMV0ZpTXpBdE5HWmpNUzA0TlRRNExXWTRNell5TXpCak1XSmpNQ0lzSW1selgyRnViMjU1Ylc5MWN5STZabUZzYzJWOS5NNjZhOW80aWtRUWcxSjNycFVLbnNpTTBaQWl3SHpvVlc4RmNYdGJqc0xBIiwidG9rZW5fdHlwZSI6ImJlYXJlciIsImV4cGlyZXNfaW4iOjM2MDAsImV4cGlyZXNfYXQiOjE3NjQzNjA2NTcsInJlZnJlc2hfdG9rZW4iOiJ2Zml4ZWlvN3YyMnQiLCJ1c2VyIjp7ImlkIjoiZWIxM2U0MzEtYmY4ZC00NmE3LWIzYTctY2I2NDY4ZGVhNjU3IiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiZW1haWwiOiJrdW5hbHByYWR5dW1hbjdAZ21haWwuY29tIiwiZW1haWxfY29uZmlybWVkX2F0IjoiMjAyNS0xMS0yMVQwNzowNDoxNy42NTRaIiwicGhvbmUiOiIiLCJjb25maXJtYXRpb25fc2VudF9hdCI6IjIwMjUtMTEtMjFUMDc6MDM6NTkuODMxOTU5WiIsImNvbmZpcm1lZF9hdCI6IjIwMjUtMTEtMjFUMDc6MDQ6MTcuNjU0WiIsImxhc3Rfc2lnbl9pbl9hdCI6IjIwMjUtMTEtMjZUMjM6NDg6MzguOTY5ODM3WiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoia3VuYWxwcmFkeXVtYW43QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1YiI6ImViMTNlNDMxLWJmOGQtNDZhNy1iM2E3LWNiNjQ2OGRlYTY1NyIsInVzZXJuYW1lIjoibG9zdGFxdWlsYSJ9LCJpZGVudGl0aWVzIjpbeyJpZGVudGl0eV9pZCI6IjIzZWUzYTZmLTk2MzMtNDBhMi1hNTQ0LTdhNDM4OGFmYTFjZiIsImlkIjoiZWIxM2U0MzEtYmY4ZC00NmE3LWIzYTctY2I2NDY4ZGVhNjU3IiwidXNlcl9pZCI6ImViMTNlNDMxLWJmOGQtNDZhNy1iM2E3LWNiNjQ2OGRlYTY1NyIsImlkZW50aXR5X2RhdGEiOnsiZW1haWwiOiJrdW5hbHByYWR5dW1hbjdAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiZWIxM2U0MzEtYmY4ZC00NmE3LWIzYTctY2I2NDY4ZGVhNjU3IiwidXNlcm5hbWUiOiJsb3N0YXF1aWxhIn0sInByb3ZpZGVyIjoiZW1haWwiLCJsYXN0X3NpZ25faW5fYXQiOiIyMDI1LTExLTIxVDA3OjAzOjU5LjgyNzgzNloiLCJjcmVhdGVkX2F0IjoiMjAyNS0xMS0yMVQwNzowMzo1OS44Mjc4ODRaIiwidXBkYXRlZF9hdCI6IjIwMjUtMTEtMjFUMDc6MDM6NTkuODI3ODg0WiIsImVtYWlsIjoia3VuYWxwcmFkeXVtYW43QGdtYWlsLmNvbSJ9XSwiY3JlYXRlZF9hdCI6IjIwMjUtMTEtMjFUMDc6MDM6NTkuODIyNzczWiIsInVwZGF0ZWRfYXQiOiIyMDI1LTExLTI4VDE5OjEwOjU3LjA3NDQ2N1oiLCJpc19hbm9ueW1vdXMiOmZhbHNlfX0';
const SIMULATION_ID = '4b40304d-784a-4ab6-9a70-972c1c0fe8ec';

export default function () {
    const url = `${BASE_URL}/api/chat`;

    const payload = JSON.stringify({
        messages: [
            { role: 'user', content: 'This is a load test message. Please reply "OK".' }
        ],
        simulationId: SIMULATION_ID
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AUTH_TOKEN}`, // Pass the token!
        },
        // Increase timeout because AI takes time
        timeout: '60s'
    };

    const res = http.post(url, payload, params);

    // We expect a 200 OK
    check(res, {
        'status is 200': (r) => r.status === 200,
        'AI replied': (r) => r.body && r.body.includes('content'),
    });

    // Wait 5 seconds between messages (Simulates reading time)
    sleep(5);
}
