import { useState } from "react";
import "../assets/Login.css";
const Login = ({ onLogin }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const handleLogin = () => {
        fetch("http://localhost:8081/api/v1.0/users/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        })
            .then(res => res.json())
            .then(data => {
                if (!data.token) {
                    setError("El nombre de usuario o contraseña introducidas no son válidas")
                    throw new Error("Login inválido");
                }
                localStorage.setItem("token", data.token);
                onLogin();
            })
            .catch(() => {
                localStorage.removeItem("token");
            });

    };
    return (
        <div className="login-container">
            <h2>Iniciar Sesión</h2>
            <input
                type="email"
                placeholder="email@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                type="password"
                placeholder="contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            {error && <div className="error">{error}</div>}
            <button onClick={handleLogin}>Aceptar</button>
        </div>
    );
};
export default Login;

