import React, { useState, memo } from 'react';
import '../styles/Onboarding.css';

interface OnboardingProps {
    onComplete: () => void;
}

// Premium SVG icons
const Icons = {
    rocket: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" />
            <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" />
            <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
        </svg>
    ),
    brain: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2a4 4 0 014 4c0 1.95-1.4 3.58-3.25 3.93" />
            <path d="M8 6a4 4 0 00-4 4c0 1.3.62 2.45 1.58 3.18" />
            <path d="M16 6a4 4 0 014 4c0 1.3-.62 2.45-1.58 3.18" />
            <path d="M12 22v-6" />
            <path d="M12 16a6 6 0 006-6" />
            <path d="M12 16a6 6 0 01-6-6" />
            <circle cx="12" cy="12" r="2" />
        </svg>
    ),
    command: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M7 7h2v2H7z" />
            <path d="M15 7h2v2h-2z" />
            <path d="M7 15h10" />
        </svg>
    ),
    camera: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
            <circle cx="12" cy="13" r="4" />
        </svg>
    ),
    mic: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
            <path d="M19 10v2a7 7 0 01-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
    ),
    target: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
        </svg>
    ),
    power: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18.36 6.64a9 9 0 11-12.73 0" />
            <line x1="12" y1="2" x2="12" y2="12" />
        </svg>
    ),
    check: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20,6 9,17 4,12" />
        </svg>
    )
};

const steps = [
    {
        title: "Welcome to Gogly",
        subtitle: "Your Invisible Interview Companion",
        icon: Icons.rocket,
        description: "Gogly helps you ace interviews with AI-powered assistance that only you can see. It's completely invisible to screen shares.",
        highlight: null
    },
    {
        title: "Toggle Visibility",
        subtitle: "Ctrl + Enter",
        icon: Icons.power,
        description: "Press Ctrl + Enter anytime to show or hide the Gogly interface. This is your main control shortcut.",
        highlight: "Remember: Ctrl + Enter to toggle on/off"
    },
    {
        title: "Emergency Quit",
        subtitle: "Ctrl + Shift + Enter",
        icon: Icons.power,
        description: "Press Ctrl + Shift + Enter to instantly quit the app. Use this if you need to close everything immediately.",
        highlight: "⚠️ Ctrl + Shift + Enter = Instant Exit"
    },
    {
        title: "AI Modes",
        subtitle: "Customize your experience",
        icon: Icons.brain,
        description: "Create AI assistants for different scenarios: Interview, Study, Coding, and more. Each mode gives tailored responses.",
        highlight: "Settings → AI Assistant → Create New"
    },
    {
        title: "Screen Capture",
        subtitle: "Ctrl + Shift + C",
        icon: Icons.camera,
        description: "Capture any part of your screen. The AI will read the text and help you solve problems or explain concepts.",
        highlight: "Select area → Choose Explain or Solve"
    },
    {
        title: "Live Transcription",
        subtitle: "Ctrl + Shift + T",
        icon: Icons.mic,
        description: "Record and transcribe audio in real-time. Perfect for capturing interview questions as they're asked.",
        highlight: "Click mic button or use shortcut"
    },
    {
        title: "Auto Detection",
        subtitle: "Question Recognition",
        icon: Icons.target,
        description: "Enable auto-detect to automatically recognize interview questions. Click any detected question to get an instant AI answer.",
        highlight: "Click ▶ in the notch bar to enable"
    },
    {
        title: "You're All Set",
        subtitle: "Ready to succeed",
        icon: Icons.check,
        description: "You now know everything you need. Launch Gogly and ace your next interview!",
        highlight: null
    }
];

const Onboarding: React.FC<OnboardingProps> = memo(({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const isLast = currentStep === steps.length - 1;
    const step = steps[currentStep];

    const handleNext = () => {
        if (isLast) {
            localStorage.setItem('onboardingComplete', 'true');
            onComplete();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleSkip = () => {
        localStorage.setItem('onboardingComplete', 'true');
        onComplete();
    };

    return (
        <div className="onboarding-overlay">
            <div className="onboarding-card">
                <button className="onboarding-skip" onClick={handleSkip}>
                    Skip
                </button>

                <div className="onboarding-progress">
                    {steps.map((_, idx) => (
                        <div
                            key={idx}
                            className={`progress-dot ${idx === currentStep ? 'active' : ''} ${idx < currentStep ? 'completed' : ''}`}
                        />
                    ))}
                </div>

                <div className="onboarding-icon">{step.icon}</div>

                <h1 className="onboarding-title">{step.title}</h1>
                <p className="onboarding-subtitle">{step.subtitle}</p>

                <p className="onboarding-description">{step.description}</p>

                {step.highlight && (
                    <div className="onboarding-highlight">
                        {step.highlight}
                    </div>
                )}

                <div className="onboarding-actions">
                    {currentStep > 0 && (
                        <button
                            className="onboarding-btn secondary"
                            onClick={() => setCurrentStep(prev => prev - 1)}
                        >
                            Back
                        </button>
                    )}
                    <button className="onboarding-btn primary" onClick={handleNext}>
                        {isLast ? "Finish" : "Continue"}
                    </button>
                </div>

                <p className="onboarding-step-count">
                    {currentStep + 1} / {steps.length}
                </p>
            </div>
        </div>
    );
});

export default Onboarding;
