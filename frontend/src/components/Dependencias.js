import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Dependencias() {
    // Estados para las dependencias y el formulario
    const [dependencias, setDependencias] = useState([]);
    const [formData, setFormData] = useState({ tipo: '', valor: '' });

    // Obtener dependencias al cargar la página
    useEffect(() => {
        const fetchDependencias = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/dependencias');
                setDependencias(response.data);
            } catch (err) {
                console.error('Error al obtener dependencias:', err);
            }
        };
        fetchDependencias();
    }, []);

    // Manejar cambios en el formulario
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Manejar el envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/api/dependencias', formData);
            setDependencias([...dependencias, response.data]);
            setFormData({ tipo: '', valor: '' });
        } catch (err) {
            console.error('Error al crear dependencia:', err);
            alert(err.response.data.error || 'Error al crear dependencia');
        }
    };

    // Manejar eliminación de una dependencia
    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar esta dependencia?')) {
            try {
                await axios.delete(`http://localhost:5000/api/dependencias/${id}`);
                setDependencias(dependencias.filter(d => d.id !== id));
            } catch (err) {
                console.error('Error al eliminar dependencia:', err);
                alert('Error al eliminar dependencia');
            }
        }
    };

    return (
        <div>
            <h1>Gestionar Dependencias</h1>
            <div className="form-container">
                <h2>Agregar Nueva Dependencia</h2>
                <form onSubmit={handleSubmit}>
                    <label>Tipo:</label>
                    <select name="tipo" value={formData.tipo} onChange={handleChange} required>
                        <option value="">Seleccione un tipo</option>
                        <option value="tipo_pieza">Tipo de Pieza</option>
                        <option value="nombre_plano">Nombre del Plano</option>
                        <option value="linea">Línea</option>
                    </select>

                    <label>Valor:</label>
                    <input type="text" name="valor" value={formData.valor} onChange={handleChange} required />

                    <button type="submit">Agregar</button>
                </form>
            </div>

            <h2>Lista de Dependencias</h2>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tipo</th>
                            <th>Valor</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dependencias.map(dep => (
                            <tr key={dep.id}>
                                <td>{dep.id}</td>
                                <td>{dep.tipo}</td>
                                <td>{dep.valor}</td>
                                <td>
                                    <button className="button button-danger" onClick={() => handleDelete(dep.id)}>Eliminar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Dependencias;