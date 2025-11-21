class LoginPresenter {
    constructor(view) {
        this.view = view;
    }

    async login(email, password) {
        if (!email || !password) {
            this.view.showError('Please fill in all fields');
            return;
        }

        this.view.showLoading(true);

        try {
            const response = await fetch('http://localhost/capstoneproject/database/api/users/login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.view.showSuccess(data.user);
            } else {
                this.view.showError(data.message || 'Login failed');
            }
        } catch (error) {
            this.view.showError('Network error. Please try again.');
        } finally {
            this.view.showLoading(false);
        }
    }
}

export default LoginPresenter;
