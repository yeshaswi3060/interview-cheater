import React from 'react';

const Loading: React.FC = () => {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            width: '100vw',
            background: '#000000',
            color: '#ffffff',
            fontFamily: 'sans-serif',
            letterSpacing: '2px',
            fontSize: '14px',
            textTransform: 'uppercase'
        }}>
            Loading...
        </div>
    );
};

export default Loading;
