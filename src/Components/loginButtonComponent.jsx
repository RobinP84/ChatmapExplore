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

  return <button onClick={handleLogin}>
    <svg width={32} height={32} aria-hidden="true">
      <use href="#icon-user" />
    </svg>
  </button>;
};

export default LoginButton;