import React from 'react';

const Dashboard = () => {
    return (
        <div className="dashboard-grid">
            <div className="card wide-card">
                <h3>Welcome to gogly</h3>
                <p style={{ color: 'var(--text-muted)', marginTop: '10px' }}>
                    Your personal assistant to ace technical interviews.
                </p>
            </div>

            <div className="card stat-card">
                <h3>Questions Practiced</h3>
                <div className="value">12</div>
                <div className="trend positive">Keep it up!</div>
            </div>
            <div className="card stat-card">
                <h3>Mock Interviews</h3>
                <div className="value">3</div>
                <div className="trend positive">Improving</div>
            </div>
            <div className="card stat-card">
                <h3>Success Rate</h3>
                <div className="value">85%</div>
                <div className="trend positive">High</div>
            </div>
        </div>
    );
};

export default Dashboard;
