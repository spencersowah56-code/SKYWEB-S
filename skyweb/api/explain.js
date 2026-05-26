export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { query, isPro } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return res.status(400).json({ error: 'Missing query' });
    }

    const systemPrompt = isPro
        ? 'Explain in 4-5 detailed paragraphs. No markdown. Add interesting facts and real-world examples. Make it feel like a deep research answer.'
        : 'Explain clearly in 2-3 short paragraphs. No markdown. Use simple language for a 14-year-old. Keep it engaging.';

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Key is hidden safely in Vercel environment variables
                'Authorization': 'Bearer ' + process.env.GROQ_API_KEY
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user',   content: query.trim() }
                ],
                max_tokens:  isPro ? 1000 : 600,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('Groq error:', err);
            return res.status(502).json({ error: 'Groq API error' });
        }

        const data   = await response.json();
        const answer = data.choices?.[0]?.message?.content ?? 'No answer returned.';
        return res.status(200).json({ answer });

    } catch (err) {
        console.error('Server error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
