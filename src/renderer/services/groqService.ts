export const testGroqConnection = async (apiKey: string, messages: Array<{ role: string, content: string }>, userProfile?: any) => {
    try {
        // Create system message with interview context and user profile
        let systemContent = `You are an AI interview assistant helping the user during a job interview.

IMPORTANT INSTRUCTIONS:
- Provide ONLY direct answers to interview questions
- Do NOT include conversational fillers like "Here is the answer", "Sure", or "I hope this helps"
- Do NOT ask if there is anything else you can help with
- Keep responses short, crisp, and interview-appropriate
- Format responses using Markdown
- Use code blocks with language identifiers for code examples`;

        if (userProfile) {
            systemContent += `\n\nUSER BACKGROUND:
Name: ${userProfile.name}
Education: ${userProfile.education}
Skills: ${userProfile.skills}
Experience: ${userProfile.experience}`;

            if (userProfile.projects) {
                systemContent += `\nProjects: ${userProfile.projects}`;
            }

            systemContent += `\n\nWhen asked "tell me about yourself" or similar questions, use this background information to provide a concise professional introduction.
For technical questions, answer the question directly and accurately. ONLY refer to the user's background if it is specifically relevant to the question (e.g., "How have you used React?"). Do NOT force the user's background into every answer.`;
        }

        const systemMessage = {
            role: 'system',
            content: systemContent
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

export const transcribeAudio = async (apiKey: string, audioBlob: Blob): Promise<string> => {
    try {
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.webm');
        formData.append('model', 'whisper-large-v3');
        formData.append('response_format', 'json');
        formData.append('temperature', '0');

        const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to transcribe audio');
        }

        const data = await response.json();
        return data.text || '';
    } catch (error: any) {
        console.error('Groq Transcription Error:', error);
        throw new Error(error.message || 'Transcription failed');
    }
};
