// Placeholder for Auth service

export const login = async (email: string, password: string): Promise<{ email: string }> => {
    console.log("Login with", email, password);
    return new Promise((resolve) => setTimeout(() => resolve({ email }), 1000));
};

export const signup = async (email: string, password: string): Promise<{ email: string }> => {
    console.log("Signup with", email, password);
    return new Promise((resolve) => setTimeout(() => resolve({ email }), 1000));
};

export const logout = async (): Promise<void> => {
    console.log("Logout");
    return new Promise((resolve) => setTimeout(resolve, 500));
};
