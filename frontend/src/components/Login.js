import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo_roma.png'; // Ajusta la ruta si es necesario
import './Login.css';

function Login({ handleLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Usuario enviado:', username);
        console.log('Contraseña enviada:', password);
        try {
            const message = await handleLogin(username, password);
            console.log('Login exitoso:', message);
            setError('');
            navigate('/inicio'); // Redirige a /inicio como en tu App.js
        } catch (err) {
            console.error('Error completo:', err);
            setError(err.message || 'Error al iniciar sesión');
        }
    };

    return (
        <div className="login-page">
            <div className="background-shapes">
                <div className="shape shape1"></div>
                <div className="shape shape2"></div>
            </div>

            <div className="login-container">
                <div className="logo">
                    <img src={logo} alt="Logo" className="logo-img" />
                </div>

                <h2 className="login-title">Login</h2>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group">
                        <label htmlFor="username">Usuario</label>
                        <div className="input-wrapper">
                            <span className="input-icon">📧</span>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="usuario"
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Contraseña</label>
                        <div className="input-wrapper">
                            <span className="input-icon">🔒</span>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="contraseña"
                                required
                            />
                        </div>
                    </div>

                    {error && <p className="error-message">{error}</p>}

                    <button type="submit" className="login-button">
                        Login
                    </button>
                </form>

                <div className="login-links">
                    <p className="signup-link">
                        or <a href="/signup">Sign Up</a>
                    </p>
                    <p className="forgot-password">
                        <a href="/forgot-password">¿Olvidaste tu contraseña?</a>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;