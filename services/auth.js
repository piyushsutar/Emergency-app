(function () {
    const USERS_KEY = "emergency_sos_users";
    const SESSION_KEY = "emergency_sos_session";

    function getUsers() {
        try {
            return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
        } catch (error) {
            return {};
        }
    }

    function saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    window.sosAuth = {

        async register(name, email, phone, password, confirmPassword) {
            name = name.trim();
            email = email.trim().toLowerCase();
            phone = phone.trim();

            if (!name || !email || !phone || !password) {
                throw new Error("Please fill all fields.");
            }

            if (password.length < 6) {
                throw new Error("Password must contain at least 6 characters.");
            }

            if (password !== confirmPassword) {
                throw new Error("Passwords do not match.");
            }

            const users = getUsers();

            if (users[email]) {
                throw new Error("Account already exists. Please login.");
            }

            users[email] = {
                name: name,
                email: email,
                phone: phone,
                password: password
            };

            saveUsers(users);

            const session = { name, email, phone };

            localStorage.setItem(
                SESSION_KEY,
                JSON.stringify(session)
            );

            return session;
        },

        async login(email, password) {
            email = email.trim().toLowerCase();

            const users = getUsers();
            const user = users[email];

            if (!user || user.password !== password) {
                throw new Error("Invalid email or password.");
            }

            const session = {
                name: user.name,
                email: user.email,
                phone: user.phone
            };

            localStorage.setItem(
                SESSION_KEY,
                JSON.stringify(session)
            );

            return session;
        },

        async getSession() {
            try {
                return JSON.parse(
                    localStorage.getItem(SESSION_KEY) || "null"
                );
            } catch (error) {
                return null;
            }
        },

        async setSession(session) {
            localStorage.setItem(
                SESSION_KEY,
                JSON.stringify(session)
            );
        },

        async logout() {
            localStorage.removeItem(SESSION_KEY);
        },

        async resetPassword(email, newPassword, confirmPassword) {
            email = email.trim().toLowerCase();

            if (newPassword !== confirmPassword) {
                throw new Error("Passwords do not match.");
            }

            if (newPassword.length < 6) {
                throw new Error("Password must contain at least 6 characters.");
            }

            const users = getUsers();

            if (!users[email]) {
                throw new Error("Account not found.");
            }

            users[email].password = newPassword;

            saveUsers(users);
        }
    };
})();
