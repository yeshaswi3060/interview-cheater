import { secureApiCall, checkRateLimit } from './apiSecurity';

export const testGroqConnection = async (_apiKey: string, messages: Array<{ role: string, content: string }>, userProfile?: any) => {
    return secureApiCall('groq', async (apiKey) => {
        // Check for active AI assistant from Settings
        const savedAssistants = localStorage.getItem('aiAssistants');
        const activeAssistantId = localStorage.getItem('activeAssistantId');
        const resumeText = localStorage.getItem('resumeText') || '';

        let systemContent = '';
        let activeMode = 'default';

        // Check if there's a custom active assistant
        if (savedAssistants && activeAssistantId) {
            const assistants = JSON.parse(savedAssistants);
            const activeAssistant = assistants.find((a: any) => a.id === activeAssistantId);
            if (activeAssistant) {
                activeMode = activeAssistant.mode;
                systemContent = activeAssistant.systemPrompt;

                // Add mode-specific response style instructions
                const modeStyles: { [key: string]: string } = {
                    'interview': `\n\nRESPONSE STYLE - INTERVIEW MODE:
- Keep answers SHORT and CRISP (2-4 sentences for simple questions)
- Be professional, confident, and direct
- No filler words like "Sure" or "Here's the answer"
- Use bullet points for longer answers
- Sound like a confident job candidate`,

                    'study': `\n\nRESPONSE STYLE - STUDY MODE:
- Provide DETAILED explanations with examples
- Break down complex concepts step-by-step
- Use analogies to make things easier
- Include relevant examples
- Be thorough and educational`,

                    'meeting': `\n\nRESPONSE STYLE - MEETING MODE:
- Be professional and business-focused
- Provide clear, actionable insights
- Summarize key points concisely
- Suggest next steps when appropriate`,

                    'coding': `\n\nRESPONSE STYLE - CODING MODE:
- Provide working code examples with proper formatting
- Explain the logic and approach
- Mention edge cases and best practices
- Use fenced code blocks with language tags`,

                    'creative': `\n\nRESPONSE STYLE - CREATIVE MODE:
- Be witty, fun, and imaginative
- Think outside the box
- Use engaging language
- Be entertaining while helpful`,
                };

                if (modeStyles[activeMode]) {
                    systemContent += modeStyles[activeMode];
                }

                // Add resume context if available
                if (resumeText) {
                    systemContent += `\n\nUser's Background:\n${resumeText}`;
                }
            }
        }

        // Fall back to default if no custom assistant
        if (!systemContent) {
            systemContent = `You are an AI assistant.

FORMATTING:
- Use proper Markdown formatting
- For code, use fenced code blocks with language
- Use **bold** for emphasis and bullet points for lists
- For math expressions, use LaTeX notation wrapped in $ for inline and $$ for block equations

MATH & CALCULATIONS:
- For any math problem, ALWAYS show step-by-step working
- Double-check all arithmetic calculations before answering
- Verify your final answer by working backwards
- For equations, simplify step by step and state the final answer clearly

RESPONSE STYLE:
- Be helpful, clear, and concise
- Provide direct answers`;

            if (resumeText) {
                systemContent += `\n\nUser's Background:\n${resumeText}`;
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
        }

        const apiMessages = [{ role: 'system', content: systemContent }, ...messages];

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
    });
};

// Get current active assistant info
export const getActiveAssistant = (): { name: string; mode: string } | null => {
    const savedAssistants = localStorage.getItem('aiAssistants');
    const activeAssistantId = localStorage.getItem('activeAssistantId');

    if (savedAssistants && activeAssistantId) {
        const assistants = JSON.parse(savedAssistants);
        const active = assistants.find((a: any) => a.id === activeAssistantId);
        if (active) {
            return { name: active.name, mode: active.mode };
        }
    }
    return null;
};

// Get all assistants
export const getAllAssistants = (): Array<{ id: string; name: string; mode: string }> => {
    const saved = localStorage.getItem('aiAssistants');
    return saved ? JSON.parse(saved) : [];
};

// Set active assistant
export const setActiveAssistant = (id: string | null) => {
    if (id) {
        localStorage.setItem('activeAssistantId', id);
    } else {
        localStorage.removeItem('activeAssistantId');
    }
};

export const transcribeAudio = async (_apiKey: string, audioBlob: Blob): Promise<string> => {
    return secureApiCall('groq2', async (apiKey) => {
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
    });
};

// Fast question detection and extraction using smaller model for speed
export const detectQuestion = async (_apiKey: string, text: string): Promise<{ isQuestion: boolean; question: string }> => {
    // Skip very short texts (less than 3 words)
    const cleanText = text.trim();
    if (!cleanText || cleanText.split(/\s+/).length < 3) {
        return { isQuestion: false, question: '' };
    }

    // Check rate limit before proceeding
    const { allowed } = checkRateLimit();
    if (!allowed) {
        return { isQuestion: false, question: '' };
    }

    try {
        return await secureApiCall('groq', async (apiKey) => {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: 'system',
                            content: `You are a question detector for job interviews. Your task:
1. If the text contains a question (ends with ? or is asking something), extract and return ONLY that question.
2. If there is NO question, reply exactly: NO

Examples:
- "So tell me about your experience with React" → "Tell me about your experience with React?"
- "What are your strengths" → "What are your strengths?"
- "I see you worked at Google" → NO
- "Can you explain your last project" → "Can you explain your last project?"`
                        },
                        { role: 'user', content: cleanText }
                    ],
                    model: 'llama-3.1-8b-instant',
                    max_tokens: 100,
                    temperature: 0
                })
            });

            if (!response.ok) {
                return { isQuestion: false, question: '' };
            }

            const data = await response.json();
            const answer = data.choices[0]?.message?.content?.trim() || '';

            // If answer is "NO" or very short, not a question
            if (answer.toUpperCase() === 'NO' || answer.length < 5) {
                return { isQuestion: false, question: '' };
            }

            // Otherwise, the answer IS the extracted question
            return { isQuestion: true, question: answer };
        });
    } catch (error) {
        return { isQuestion: false, question: '' };
    }
};

// Export rate limit check for UI components
export { checkRateLimit, getRateLimitStatus } from './apiSecurity';
