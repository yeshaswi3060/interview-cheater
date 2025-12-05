export const testGroqConnection = async (apiKey: string, messages: Array<{ role: string, content: string }>, userProfile?: any) => {
    try {
        // Check for active AI assistant from Settings
        const savedAssistants = localStorage.getItem('aiAssistants');
        const activeAssistantId = localStorage.getItem('activeAssistantId');
        const resumeText = localStorage.getItem('resumeText') || '';

        let systemContent = '';

        // Check if there's a custom active assistant
        if (savedAssistants && activeAssistantId) {
            const assistants = JSON.parse(savedAssistants);
            const activeAssistant = assistants.find((a: any) => a.id === activeAssistantId);
            if (activeAssistant) {
                systemContent = activeAssistant.systemPrompt;

                // Add resume context if available
                if (resumeText) {
                    systemContent += `\n\nUser's Resume/Background:\n${resumeText}`;
                }
            }
        }

        // Fall back to default if no custom assistant
        if (!systemContent) {
            systemContent = `You are an AI interview assistant helping the user during a job interview.

IMPORTANT FORMATTING INSTRUCTIONS:
- Format ALL responses using proper Markdown
- For code, ALWAYS use fenced code blocks with language: \`\`\`python, \`\`\`javascript, \`\`\`java, etc.
- For inline code or variable names, use single backticks: \`variableName\`
- For mathematical equations, use LaTeX: $x^2$ for inline or $$\\sum_{i=1}^n$$ for block
- Use **bold** for emphasis, use bullet points and numbered lists
- Use headings (## or ###) to organize longer answers
- Do NOT use plain text for code - ALWAYS format properly

RESPONSE STYLE:
- Provide ONLY direct answers to interview questions
- Do NOT include fillers like "Here is the answer" or "Sure"
- Keep responses concise and interview-appropriate`;

            // Add resume if available
            if (resumeText) {
                systemContent += `\n\nUser's Resume/Background:\n${resumeText}`;
            }
        }

        if (userProfile) {
            systemContent += `\n\nUSER PROFILE:
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
