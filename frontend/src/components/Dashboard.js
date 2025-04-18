import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

function Dashboard() {
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/admin', {
                    withCredentials: true, // Enviar la cookie token
                });
                setData(response.data);
                setError('');
            } catch (err) {
                console.error('Error al obtener datos del dashboard:', err);
                setError(err.response?.data?.error || 'Error al cargar los datos');
                setData(null);
            }
        };
        fetchData();
    }, []);

    // Calcular estadísticas basadas en los datos del usuario (por ahora solo mostramos info del token)
    const totalPedidos = data?.user ? 0 : 0; // Placeholder hasta que tengamos pedidos
    const promedioAvance = data?.user ? 'N/A' : 'N/A'; // Placeholder

    return (
        <div>
            <h1>Dashboard</h1>
            <div className="dashboard-stats">
                <div className="stat-card">
                    <h3>Total de Pedidos</h3>
                    <p>{totalPedidos}</p>
                </div>
                <div className="stat-card">
                    <h3>Avance Promedio</h3>
                    <p>{promedioAvance}</p>
                </div>
            </div>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {data && (
                <div>
                    <p>Usuario: {data.user.username}</p>
                    <p>Rol: {data.user.role}</p>
                </div>
            )}
        </div>
    );
}

export default Dashboard;