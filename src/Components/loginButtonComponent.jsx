import authService from "../services/authService";

const LoginButton = () => {
  const handleLogin = async () => {
    try {
      const user = await authService.signInWithGoogle();
      console.log("User logged in:", user);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return <button onClick={handleLogin}>Log in with Google</button>;
};

export default LoginButton;