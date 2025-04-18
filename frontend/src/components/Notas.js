import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Notas.css';

function Notas() {
    // Estados para las notas y el formulario
    const [notas, setNotas] = useState([]);
    const [formData, setFormData] = useState({ contenido: '', color: '#ffffff' });
    const [editingId, setEditingId] = useState(null);

    // Obtener notas al cargar la página
    useEffect(() => {
        const fetchNotas = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/notas');
                setNotas(response.data);
            } catch (err) {
                console.error('Error al obtener notas:', err);
            }
        };
        fetchNotas();
    }, []);

    // Manejar cambios en el formulario
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Manejar el envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                // Actualizar nota
                const response = await axios.put(`http://localhost:5000/api/notas/${editingId}`, formData);
                setNotas(notas.map(n => (n.id === editingId ? response.data : n)));
                setEditingId(null);
            } else {
                // Crear nueva nota
                const response = await axios.post('http://localhost:5000/api/notas', formData);
                setNotas([response.data, ...notas]);
            }
            // Limpiar formulario
            setFormData({ contenido: '', color: '#ffffff' });
        } catch (err) {
            console.error('Error al guardar nota:', err);
            alert('Error al guardar nota');
        }
    };

    // Manejar edición de una nota
    const handleEdit = (nota) => {
        setFormData({ contenido: nota.contenido, color: nota.color });
        setEditingId(nota.id);
    };

    // Manejar eliminación de una nota
    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar esta nota?')) {
            try {
                await axios.delete(`http://localhost:5000/api/notas/${id}`);
                setNotas(notas.filter(n => n.id !== id));
            } catch (err) {
                console.error('Error al eliminar nota:', err);
                alert('Error al eliminar nota');
            }
        }
    };

    return (
        <div>
            <h1>{editingId ? 'Editar Nota' : 'Crear Nota'}</h1>
            <div className="form-container">
                <form onSubmit={handleSubmit}>
                    <label>Contenido:</label>
                    <textarea name="contenido" value={formData.contenido} onChange={handleChange} required></textarea>

                    <label>Color:</label>
                    <input type="color" name="color" value={formData.color} onChange={handleChange} />

                    <button type="submit">{editingId ? 'Actualizar' : 'Guardar'}</button>
                </form>
            </div>

            <h2>Mis Notas</h2>
            <div className="notas-container">
                {notas.map(nota => (
                    <div key={nota.id} className="nota" style={{ backgroundColor: nota.color }}>
                        <p>{nota.contenido}</p>
                        <div className="nota-actions">
                            <button className="button" onClick={() => handleEdit(nota)}>Editar</button>
                            <button className="button button-danger" onClick={() => handleDelete(nota.id)}>Eliminar</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Notas;