export const testGroqConnection = async (apiKey: string, messages: Array<{ role: string, content: string }>) => {
    try {
        // Add system message for better formatting if not present
        const systemMessage = {
            role: 'system',
            content: `You are a direct and concise AI assistant.
            Provide ONLY the answer to the user's question.
            Do NOT include conversational fillers like "Here is the code", "Sure", or "I hope this helps".
            Do NOT ask if there is anything else you can help with.
            Keep responses short, crisp, and content-heavy.
            Format your responses using Markdown.
            Use code blocks with language identifiers for code.`
        };

        const apiMessages = [systemMessage, ...messages];

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: apiMessages,
                model: 'llama-3.3-70b-versatile'
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to connect to Groq API');
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || 'No response from AI';
    } catch (error: any) {
        console.error('Groq API Error:', error);
        throw new Error(error.message || 'Network error');
    }
};
