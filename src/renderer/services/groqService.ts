export const testGroqConnection = async (apiKey: string, messages: Array<{ role: string, content: string }>) => {
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: messages,
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
