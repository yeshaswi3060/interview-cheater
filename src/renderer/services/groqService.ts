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

// Strict question detection for interviews - uses Groq #2 API
export const detectQuestion = async (_apiKey: string, text: string): Promise<{ isQuestion: boolean; question: string }> => {
    const cleanText = text.trim();

    // Skip very short texts (less than 5 words) - interview questions are usually longer
    if (!cleanText || cleanText.split(/\s+/).length < 5) {
        return { isQuestion: false, question: '' };
    }

    // Skip common filler phrases and acknowledgments that are NOT questions
    const skipPatterns = [
        /^(okay|ok|alright|sure|yes|no|yeah|hmm|uhh?|uh-huh|right|got it|i see|thank you|thanks|welcome|hello|hi|bye|goodbye)/i,
        /^(let me|i will|i'm going to|we will|we're going to)/i,
        /^(that's|that is|this is|it's|it is) (great|good|fine|nice|interesting|correct)/i,
        /(thank you|thanks) (for|so much)/i,
        /^(so|and|but|well|now|okay so)/i, // Sentences starting with filler words
    ];

    for (const pattern of skipPatterns) {
        if (pattern.test(cleanText)) {
            return { isQuestion: false, question: '' };
        }
    }

    // Check rate limit before proceeding
    const { allowed } = checkRateLimit();
    if (!allowed) {
        return { isQuestion: false, question: '' };
    }

    try {
        // Use groq2 for question detection as per user request
        return await secureApiCall('groq2', async (apiKey) => {
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
                            content: `You are a STRICT interview question detector. Your job is to identify ONLY genuine interview questions that require a substantive answer.

RETURN "YES: [question]" ONLY if the text is:
- A direct question asking about skills, experience, or abilities
- A behavioral interview question (tell me about a time...)
- A technical question requiring explanation
- A situational/hypothetical question

RETURN "NO" if the text is:
- A statement or comment (even if it sounds like it wants a response)
- Filler conversation, greetings, or acknowledgments
- Instructions or next steps
- Rhetorical questions
- Very short or incomplete sentences
- Questions about scheduling, logistics, or breaks

Examples that ARE questions:
- "Can you tell me about yourself" → YES: Can you tell me about yourself?
- "What are your strengths and weaknesses" → YES: What are your strengths and weaknesses?
- "Tell me about a time you faced a challenge" → YES: Tell me about a time you faced a challenge?
- "How would you handle a difficult coworker" → YES: How would you handle a difficult coworker?

Examples that are NOT questions (return NO):
- "Thank you for joining us today" → NO
- "Let me explain the next steps" → NO
- "That's a great point" → NO
- "So moving on to the next topic" → NO
- "I see you worked at Google" → NO
- "Can you hear me okay" → NO
- "Let's take a short break" → NO`
                        },
                        { role: 'user', content: cleanText }
                    ],
                    model: 'llama-3.1-8b-instant',
                    max_tokens: 150,
                    temperature: 0
                })
            });

            if (!response.ok) {
                return { isQuestion: false, question: '' };
            }

            const data = await response.json();
            const answer = data.choices[0]?.message?.content?.trim() || '';

            // Parse the response
            if (answer.toUpperCase().startsWith('YES:')) {
                const question = answer.substring(4).trim();
                // Ensure the extracted question is substantive (at least 4 words)
                if (question.split(/\s+/).length >= 4) {
                    return { isQuestion: true, question: question };
                }
            }

            return { isQuestion: false, question: '' };
        });
    } catch (error) {
        console.error('Question detection error:', error);
        return { isQuestion: false, question: '' };
    }
};

// Export rate limit check for UI components
export { checkRateLimit, getRateLimitStatus } from './apiSecurity';
