
import { MOCK_INVOICES, MOCK_RATES, MOCK_BATCHES } from '../constants';

const OLLAMA_API_URL = 'http://localhost:11434/api/generate';
const MODEL_NAME = 'llama3'; // Default to llama3, user can change if they have mistral etc.

export interface OllamaResponse {
    response: string;
    context?: number[];
    done: boolean;
}

export const generateOllamaResponse = async (prompt: string): Promise<string | null> => {
    try {
        // 1. Build Context String with REAL Data
        // We trim this to avoid token limits on smaller local models
        const pendingCount = MOCK_INVOICES.filter(i => i.status === 'PENDING').length;
        const totalValue = MOCK_INVOICES.reduce((sum, i) => sum + i.amount, 0).toFixed(2);

        const systemContext = `
You are Vector, an advanced AI Logistics Control Tower Assistant.
Current System State:
- Pending Invoices: ${pendingCount}
- Total Spend Value: ₹${totalValue}
- Active Contracts: ${MOCK_RATES.length}
- Payment Batches: ${MOCK_BATCHES.length}

User Query: ${prompt}

Answer as Vector. Be concise, professional, and use the data provided.
    `;

        // 2. Call Local Ollama Instance
        const response = await fetch(OLLAMA_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                prompt: systemContext,
                stream: false, // We want the full response at once for simplicity in this demo
                options: {
                    temperature: 0.7
                }
            }),
        });

        if (!response.ok) {
            console.warn('Ollama service not reachable or returned error.');
            return null;
        }

        const data: OllamaResponse = await response.json();
        return data.response;

    } catch (error) {
        console.warn('Ollama connection failed (likely not running). Falling back to mock.', error);
        return null;
    }
};
