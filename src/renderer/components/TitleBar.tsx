import React from 'react';

const TitleBar: React.FC = () => {
    const handleMinimize = () => {
        (window as any).ipcRenderer.invoke('MINIMIZE_WINDOW');
    };

    const handleClose = () => {
        (window as any).ipcRenderer.invoke('CLOSE_WINDOW');
    };

    return (
        <div style={{
            height: '30px',
            background: '#0f0f0f',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            WebkitAppRegion: 'drag', // Allow dragging
            borderBottom: '1px solid #333',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10000
        } as any}>
            <div style={{ display: 'flex', WebkitAppRegion: 'no-drag' } as any}>
                <button
                    onClick={handleMinimize}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#fff',
                        width: '40px',
                        height: '30px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <svg width="10" height="1" viewBox="0 0 10 1" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 0.5H10" stroke="white" />
                    </svg>
                </button>
                <button
                    onClick={handleClose}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#fff',
                        width: '40px',
                        height: '30px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#e81123'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L9 9M9 1L1 9" stroke="white" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default TitleBar;
