import { secureApiCall, checkRateLimit } from './apiSecurity';

// ===== SHARED TRANSCRIPT BUFFER =====
// Groq 2 stores live transcripts here, accessible by both AIs
let liveTranscriptBuffer: string[] = [];
const MAX_TRANSCRIPT_ENTRIES = 20;

export const addToLiveTranscript = (text: string) => {
    if (text && text.trim()) {
        liveTranscriptBuffer.push(text.trim());
        // Keep only recent entries to prevent memory issues
        if (liveTranscriptBuffer.length > MAX_TRANSCRIPT_ENTRIES) {
            liveTranscriptBuffer = liveTranscriptBuffer.slice(-MAX_TRANSCRIPT_ENTRIES);
        }
    }
};

export const getLiveTranscript = (): string => {
    return liveTranscriptBuffer.join(' ');
};

export const clearLiveTranscript = () => {
    liveTranscriptBuffer = [];
};

export const hasLiveTranscript = (): boolean => {
    return liveTranscriptBuffer.length > 0;
};

// Check if query needs live context (should use Groq 2)
export const requiresLiveContext = (query: string): boolean => {
    const contextPatterns = [
        /what.*(she|he|they|interviewer).*(say|said|talk|talking|ask|asked|mean|meant)/i,
        /what.*(is|was|are|were).*(that|this|it|the question)/i,
        /what.*(happen|happened|happening)/i,
        /can you (repeat|summarize|summarise|recap)/i,
        /summarize|summarise|recap|context/i,
        /tell me.*(said|asked|mentioned)/i,
        /last.*(question|thing|said)/i,
        /previous.*(question|statement)/i,
        /repeat.*(that|question)/i,
    ];
    return contextPatterns.some(p => p.test(query));
};

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
You are helping someone answer interview questions IN REAL-TIME. You must sound like the interviewee themselves.

CRITICAL RULES:
- Respond in FIRST PERSON as if YOU are the candidate ("I have experience in...", "In my previous role, I...")
- Be confident, articulate, and professional
- NO phrases like "Here's a good answer" or "You could say" - respond AS the candidate directly
- Never start with "Sure", "Certainly", "Of course" or similar filler

ANSWER STRUCTURE:
- For simple questions: 3-5 sentences, direct and impactful
- For behavioral questions: Use STAR method (Situation → Task → Action → Result) in 4-6 sentences
- For technical questions: Give a clear, accurate answer with a brief example if helpful
- For "tell me about yourself": 4-5 sentences covering background, key skills, and career goals

TONE:
- Confident but not arrogant
- Specific with real examples (use generic but realistic details)
- Enthusiastic about the opportunity
- Professional vocabulary

FORMATTING:
- Keep responses concise - interviewers appreciate brevity
- No bullet points unless listing 3+ technical skills
- Natural speaking style that flows well when read aloud`,

                    'study': `\n\nRESPONSE STYLE - STUDY MODE:
You are a knowledgeable tutor helping a student TRULY UNDERSTAND concepts.

CRITICAL FOR MATH & SCIENCE:
- ALWAYS show step-by-step working for calculations
- VERIFY your arithmetic - double check each calculation
- For math problems: State the approach, show each step clearly, box/highlight the final answer
- For physics/chemistry: Include units in every step, verify dimensional consistency
- If a calculation is complex, break it into smaller parts
- Use $ for inline math and $$ for block equations when helpful

EXPLANATION APPROACH:
- Start with the CORE concept in simple terms
- Build up complexity gradually
- Use analogies and real-world examples
- Anticipate common misconceptions and address them
- Connect to related concepts the student might know

ANSWER STRUCTURE:
1. **Quick Answer**: The direct answer first
2. **Explanation**: Why this is the answer, step by step
3. **Example**: A concrete example or application
4. **Key Takeaway**: What to remember

ACCURACY REQUIREMENTS:
- For numerical answers: ALWAYS verify by working backwards or using an alternative method
- For science: Cite principles/laws being applied
- For definitions: Be precise and complete
- Admit uncertainty if a topic is ambiguous

FORMATTING:
- Use headers for different sections
- Use bullet points for lists
- Use **bold** for key terms
- Use code blocks for formulas or technical notation`,

                    'meeting': `\n\nRESPONSE STYLE - MEETING MODE:
- Be professional and business-focused
- Provide clear, actionable insights
- Summarize key points concisely
- Suggest next steps when appropriate
- Use professional business language`,

                    'coding': `\n\nRESPONSE STYLE - CODING MODE:
- Provide working, tested code examples with proper formatting
- Explain the logic and approach before the code
- Mention edge cases, error handling, and best practices
- Use fenced code blocks with correct language tags
- Include comments in code for clarity
- If multiple approaches exist, briefly mention alternatives`,

                    'creative': `\n\nRESPONSE STYLE - CREATIVE MODE:
- Be witty, fun, and imaginative
- Think outside the box
- Use engaging, vivid language
- Be entertaining while still being helpful
- Add personality to your responses`,
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
            systemContent = `You are an intelligent AI assistant.

FORMATTING:
- Use proper Markdown formatting for clarity
- For code, use fenced code blocks with the correct language tag
- Use **bold** for emphasis and bullet points for lists
- For math expressions, use LaTeX notation wrapped in $ for inline and $$ for block equations

MATH & SCIENCE ACCURACY (CRITICAL):
- For ANY math problem, ALWAYS show step-by-step working
- Double-check and VERIFY all arithmetic calculations before answering
- Work backwards to confirm your final answer is correct
- For equations, simplify step by step and clearly state the final answer
- For physics/chemistry: Always include units and verify dimensional consistency
- If you're uncertain about a calculation, state it and show your reasoning

SCIENCE & TECHNICAL TOPICS:
- Be precise and accurate with scientific facts
- Cite the principles or laws being applied
- Use proper terminology
- If something is debated or uncertain in science, acknowledge it

RESPONSE STYLE:
- Be helpful, clear, and accurate above all
- Provide direct answers first, then explanations
- Anticipate follow-up questions and address them proactively`;

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

// ===== SMART AI ROUTING =====
// Routes queries to the appropriate AI based on context needs

// Groq 2 context response - for questions about live transcript
const askGroq2AboutContext = async (query: string): Promise<string> => {
    const transcript = getLiveTranscript();

    if (!transcript) {
        return "I haven't heard anything yet. Press the play button to start listening to the interview.";
    }

    return secureApiCall('groq2', async (apiKey) => {
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
                        content: `You are a real-time interview assistant. You have been listening to the interview and have access to the live transcript. 
                        
Your job is to help the user understand what's being discussed in the interview.

LIVE TRANSCRIPT (what you've heard so far):
"${transcript}"

Respond naturally and helpfully. Be concise but informative.`
                    },
                    { role: 'user', content: query }
                ],
                model: 'llama-3.1-8b-instant',
                max_tokens: 500,
                temperature: 0.3
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to get context response');
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || 'No response';
    });
};

// Smart response routing - chooses the right AI based on the query
export const getSmartResponse = async (
    query: string,
    conversationHistory: Array<{ role: string; content: string }>,
    userProfile?: any
): Promise<{ response: string; ai: 'groq1' | 'groq2' }> => {
    const needsContext = requiresLiveContext(query);
    const hasTranscript = hasLiveTranscript();

    // If query is about context/live audio AND we have transcript -> Groq 2
    if (needsContext && hasTranscript) {
        console.log('Routing to Groq 2 (context query)');
        const response = await askGroq2AboutContext(query);
        return { response, ai: 'groq2' };
    }

    // Otherwise -> Groq 1 (with transcript context if available)
    console.log('Routing to Groq 1 (interview answer)');

    // Enhance the query with transcript context for Groq 1
    let enhancedHistory = [...conversationHistory];
    if (hasTranscript) {
        const transcript = getLiveTranscript();
        // Add context as a system-like message
        enhancedHistory = [
            {
                role: 'user',
                content: `[CONTEXT: The interviewer has been saying: "${transcript}"]`
            },
            ...conversationHistory
        ];
    }

    const response = await testGroqConnection('', enhancedHistory, userProfile);
    return { response, ai: 'groq1' };
};
