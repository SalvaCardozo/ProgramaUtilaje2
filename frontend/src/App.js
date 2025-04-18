import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Inicio from './components/Inicio';
import Pedidos from './components/Pedidos';
import Calendario from './components/Calendario';
import Dashboard from './components/Dashboard';
import Dependencias from './components/Dependencias';
import Notas from './components/Notas';
import Configuracion from './components/Configuracion';
import Perfil from './components/Perfil';
import Ajustes from './components/Ajustes';
import './App.css';

// Configurar axios para HTTP y credenciales
axios.defaults.baseURL = 'http://localhost:5000';
axios.defaults.withCredentials = true;

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // Para evitar renderizado hasta que checkAuth termine

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await axios.get('/api/admin');
                console.log('Resultado de checkAuth:', response.data);
                setUser(response.data.user);
            } catch (err) {
                console.error('Error en checkAuth:', err.response?.data);
                setUser(null); // Aseguramos que user sea null si no hay autenticación
            } finally {
                setLoading(false); // Terminamos el loading
            }
        };
        checkAuth();
    }, []);

    const handleLogin = async (username, password) => {
        try {
            console.log('Enviando solicitud al backend:', { username, password });
            const response = await axios.post('/api/login', {
                username,
                password,
            });
            console.log('Respuesta del backend:', response.data);

            const authResponse = await axios.get('/api/admin');
            setUser(authResponse.data.user);
            return response.data.message;
        } catch (err) {
            console.error('Error en handleLogin:', err.response?.data);
            throw new Error(err.response?.data?.error || 'Error al iniciar sesión');
        }
    };

    const handleLogout = async () => {
        try {
            await axios.post('/api/logout');
            setUser(null);
        } catch (err) {
            console.error('Error al cerrar sesión:', err);
        }
    };

    // Evitar renderizar hasta que checkAuth termine
    if (loading) {
        return <div>Cargando...</div>;
    }

    return (
        <Router>
            <div className="app">
                {user ? (
                    <>
                        <Sidebar handleLogout={handleLogout} />
                        <div className="main-content">
                            <Routes>
                                <Route path="/inicio" element={<Inicio />} />
                                <Route path="/pedidos" element={<Pedidos />} />
                                <Route path="/calendario" element={<Calendario />} />
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/dependencias" element={<Dependencias />} />
                                <Route path="/notas" element={<Notas />} />
                                <Route path="/configuracion" element={<Configuracion />} />
                                <Route path="/perfil" element={<Perfil />} />
                                <Route path="/ajustes" element={<Ajustes />} />
                                <Route path="*" element={<Navigate to="/inicio" />} />
                            </Routes>
                        </div>
                    </>
                ) : (
                    <Routes>
                        <Route path="/login" element={<Login handleLogin={handleLogin} />} />
                        <Route path="*" element={<Navigate to="/login" />} />
                    </Routes>
                )}
            </div>
        </Router>
    );
}

export default App;