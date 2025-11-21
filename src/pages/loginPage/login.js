import React, { useState } from 'react';
import LoginPresenter from './loginPresenter';

class LoginPage {
    constructor() {
        this.presenter = new LoginPresenter(this);
    }

    // View methods that the presenter can call
    showError(message) {
        // This will be called by presenter to update UI
        console.error(message);
    }

    showSuccess(userData) {
        // Handle successful login
        console.log('Login successful:', userData);
    }

    showLoading(isLoading) {
        // Show/hide loading state
    }
}

// React component wrapper
function LoginView() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const loginPage = new LoginPage();
    
    // Override view methods to update React state
    loginPage.showError = (message) => setError(message);
    loginPage.showLoading = (isLoading) => setLoading(isLoading);
    loginPage.showSuccess = (userData) => {
        // Handle navigation or state update
        console.log('User logged in:', userData);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        loginPage.presenter.login(email, password);
    };

    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                />
                {error && <p style={{color: 'red'}}>{error}</p>}
                <button type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </div>
    );
}

export default LoginView;
