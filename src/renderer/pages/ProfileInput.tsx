import React, { useState } from 'react';

interface ProfileInputProps {
    onNext: (profile: UserProfile) => void;
}

export interface UserProfile {
    name: string;
    education: string;
    skills: string;
    experience: string;
    projects?: string;
}

const ProfileInput: React.FC<ProfileInputProps> = ({ onNext }) => {
    const [profile, setProfile] = useState<UserProfile>({
        name: '',
        education: '',
        skills: '',
        experience: '',
        projects: ''
    });

    const handleNext = () => {
        if (profile.name.trim() && profile.education.trim() && profile.skills.trim() && profile.experience.trim()) {
            onNext(profile);
        }
    };

    const isValid = profile.name.trim() && profile.education.trim() && profile.skills.trim() && profile.experience.trim();

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: '#000000',
            color: '#ffffff',
            padding: '40px 20px',
            overflowY: 'auto'
        }}>
            <h2 style={{ marginBottom: '10px', fontWeight: '300', letterSpacing: '1px' }}>TELL ME ABOUT YOURSELF</h2>
            <p style={{ marginBottom: '30px', color: '#888', fontSize: '14px', textAlign: 'center', maxWidth: '500px' }}>
                This information helps the AI assistant understand your background and provide better interview support.
            </p>

            <div style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#aaa' }}>YOUR NAME *</label>
                    <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        placeholder="John Doe"
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: '#1a1a1a',
                            border: '1px solid #333',
                            borderRadius: '4px',
                            color: '#fff',
                            outline: 'none',
                            fontSize: '14px'
                        }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#aaa' }}>EDUCATION *</label>
                    <textarea
                        value={profile.education}
                        onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                        placeholder="Bachelor's in Computer Science from XYZ University"
                        rows={3}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: '#1a1a1a',
                            border: '1px solid #333',
                            borderRadius: '4px',
                            color: '#fff',
                            outline: 'none',
                            fontSize: '14px',
                            resize: 'vertical',
                            fontFamily: 'inherit'
                        }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#aaa' }}>SKILLS *</label>
                    <textarea
                        value={profile.skills}
                        onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                        placeholder="JavaScript, React, Node.js, Python, etc."
                        rows={3}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: '#1a1a1a',
                            border: '1px solid #333',
                            borderRadius: '4px',
                            color: '#fff',
                            outline: 'none',
                            fontSize: '14px',
                            resize: 'vertical',
                            fontFamily: 'inherit'
                        }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#aaa' }}>EXPERIENCE *</label>
                    <textarea
                        value={profile.experience}
                        onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                        placeholder="2 years as Full Stack Developer at ABC Company"
                        rows={4}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: '#1a1a1a',
                            border: '1px solid #333',
                            borderRadius: '4px',
                            color: '#fff',
                            outline: 'none',
                            fontSize: '14px',
                            resize: 'vertical',
                            fontFamily: 'inherit'
                        }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#aaa' }}>PROJECTS (Optional)</label>
                    <textarea
                        value={profile.projects}
                        onChange={(e) => setProfile({ ...profile, projects: e.target.value })}
                        placeholder="E-commerce platform with React and Node.js..."
                        rows={4}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: '#1a1a1a',
                            border: '1px solid #333',
                            borderRadius: '4px',
                            color: '#fff',
                            outline: 'none',
                            fontSize: '14px',
                            resize: 'vertical',
                            fontFamily: 'inherit'
                        }}
                    />
                </div>
            </div>

            <button
                onClick={handleNext}
                disabled={!isValid}
                style={{
                    padding: '12px 40px',
                    background: isValid ? '#ffffff' : '#333333',
                    color: isValid ? '#000000' : '#888888',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isValid ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: '500',
                    letterSpacing: '1px',
                    transition: 'all 0.2s ease'
                }}
            >
                NEXT
            </button>
        </div>
    );
};

export default ProfileInput;
