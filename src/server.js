const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const { AzureOpenAI } = require('openai');
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

// CORS
const allowedOrigins = [
    'http://localhost:3000',
    process.env.ALLOWED_ORIGIN
].filter(Boolean);
app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);

        const normalized = origin.replace(/\/$/, '');
        if (allowedOrigins.some(o => o.replace(/\/$/, '') === normalized)) {
            return callback(null, true);
        }

        console.log('CORS rejected origin:', JSON.stringify(origin), 'allowed:', allowedOrigins);
        callback(new Error('Not allowed by CORS'));
    }
}));

// Serve frontend
app.use(express.static(path.join(__dirname, '../public')));

// Azure OpenAI client
console.log("AZURE_OPENAI_ENDPOINT =", process.env.AZURE_OPENAI_ENDPOINT);
console.log("AZURE_OPENAI_KEY =", process.env.AZURE_OPENAI_KEY ? "Loaded" : "Missing");
console.log("AZURE_OPENAI_API_VERSION =", process.env.AZURE_OPENAI_API_VERSION);
console.log("AZURE_OPENAI_DEPLOYMENT =", process.env.AZURE_OPENAI_DEPLOYMENT);

const client = new AzureOpenAI({
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiKey: process.env.AZURE_OPENAI_KEY,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION,
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT
});

app.post('/api/chat', async (req, res) => {
    const { message, systemPrompt } = req.body;
    try {
        const response = await client.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt || 'You are a helpful FAQ assistant.' },
                { role: 'user', content: message }
            ],
            max_completion_tokens: 2000
        });
        const reply = response.choices[0]?.message?.content;
        if (!reply) {
            console.error("Empty reply. Full response:", JSON.stringify(response, null, 2));
            return res.status(500).json({ reply: null, error: "Model returned no content." });
        }
        return res.json({ reply });
    } catch (error) {
        console.error("========== AZURE OPENAI ERROR ==========");
        console.error(error);
        return res.status(500).json({ reply: null, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`FAQBot running at http://localhost:${PORT}`);
});
