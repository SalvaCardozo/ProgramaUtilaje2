import React, { useState, useEffect, useRef } from 'react';
import './Pedidos.css';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

function Pedidos() {
    const [pedidos, setPedidos] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        id: '',
        codigo: [],
        fechaPedido: '',
        fechaLimite: '',
        nombreConjunto: [],
        numeroPlano: [],
        nombreComponente: [],
        numeroPlanoComponente: [],
        linea: [],
        tipoPieza: [],
        tipoPedido: [],
        cantidad: '',
        estado: [],
        avance: ''
    });
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState({
        agregar: false,
        editar: false,
        detalles: false,
        eliminarFinalizados: false,
        notificaciones: false,
        reprogramar: false,
        eliminar: false
    });
    const [currentPedido, setCurrentPedido] = useState(null);
    const [notificaciones, setNotificaciones] = useState({ proximos: [], vencidos: [], actividades: [] });
    const [openActionMenuId, setOpenActionMenuId] = useState(null);
    const settingsRef = useRef(null);
    const actionMenuRefs = useRef({});
    const fileInputRef = useRef(null);

    const opciones = {
        nombresConjuntos: ['Conjunto A', 'Conjunto B', 'Conjunto C'],
        numerosPlanos: ['Plano 001', 'Plano 002', 'Plano 003'],
        nombresComponentes: ['Componente X', 'Componente Y', 'Componente Z'],
        numerosPlanosComponentes: ['PlanoComp 101', 'PlanoComp 102', 'PlanoComp 103'],
        lineas: ['Línea 1', 'Línea 2', 'Línea 3'],
        tiposPiezas: ['Pieza 1', 'Pieza 2', 'Pieza 3'],
        responsables: ['F. Fernández', 'M. Gómez', 'L. Pérez']
    };

    const initialPedidoState = {
        id: null,
        codigo: '',
        fechaPedido: '',
        fechaLimite: '',
        nombreConjunto: '',
        numeroPlano: '',
        nombreComponente: '',
        numeroPlanoComponente: '',
        linea: '',
        tipoPieza: '',
        tipoPedido: 'Programado',
        cantidad: 1,
        estado: 'Sin Comenzar',
        avance: 0,
        procesos: [
            { nombre: 'Corte', responsable: '', fechaInicio: '', fechaFin: '', estado: 'Sin Comenzar', horasNormales: 0, horasExtras: 0 },
            { nombre: 'Torneado', responsable: '', fechaInicio: '', fechaFin: '', estado: 'Sin Comenzar', horasNormales: 0, horasExtras: 0 },
            { nombre: 'Ensamblaje', responsable: '', fechaInicio: '', fechaFin: '', estado: 'Sin Comenzar', horasNormales: 0, horasExtras: 0 }
        ],
        observaciones: ''
    };

    useEffect(() => {
        const fetchPedidos = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/orders');
                const data = await response.json();
                setPedidos(data);
                setTotalPages(Math.ceil(data.length / 10));
                sincronizarConExcel(data);
                checkNotificaciones(data);
            } catch (error) {
                console.error('Error al cargar los pedidos:', error);
            }
        };
        fetchPedidos();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target)) {
                setIsSettingsMenuOpen(false);
            }
            Object.values(actionMenuRefs.current).forEach(ref => {
                if (ref && !ref.contains(event.target)) {
                    setOpenActionMenuId(null);
                }
            });
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const checkNotificaciones = (pedidosList) => {
        const today = new Date();
        const proximos = [];
        const vencidos = [];
        pedidosList.forEach(pedido => {
            const fechaLimite = new Date(pedido.fechaLimite);
            const diffDays = (fechaLimite - today) / (1000 * 60 * 60 * 24);
            if (fechaLimite < today) {
                vencidos.push(pedido);
            } else if (diffDays <= 5 && diffDays >= 0) {
                proximos.push(pedido);
            }
        });
        // eslint-disable-next-line no-undef
        setNotificaciones(prev => ({ ...prev, proximos, vencidos }));
    };

    const calcularAvance = (procesos) => {
        if (!procesos || procesos.length === 0) return 0;
        const totalProcesos = procesos.length;
        let avance = 0;
        procesos.forEach(proceso => {
            if (proceso.estado === 'Terminado') {
                avance += 100 / totalProcesos;
            } else if (proceso.estado === 'En Proceso') {
                avance += (100 / totalProcesos) * 0.5;
            }
        });
        return parseFloat(avance.toFixed(2));
    };

    const determinarEstadoPedido = (procesos) => {
        if (!procesos || procesos.length === 0) return 'Sin Comenzar';
        const todosTerminados = procesos.every(proceso => proceso.estado === 'Terminado');
        const algunoEnProceso = procesos.some(proceso => proceso.estado === 'En Proceso');
        const algunoSinComenzar = procesos.some(proceso => proceso.estado === 'Sin Comenzar');
        if (todosTerminados) return 'Terminado';
        if (algunoEnProceso) return 'En Proceso';
        if (algunoSinComenzar) return 'Sin Comenzar';
        return 'Cancelado';
    };

    const sincronizarConExcel = (pedidosList) => {
        const data = pedidosList.map(pedido => ({
            ID: pedido.id,
            Código: pedido.codigo,
            'Fecha Pedido': pedido.fechaPedido,
            'Fecha Límite': pedido.fechaLimite,
            'Nombre Conjunto': pedido.nombreConjunto,
            'Número Plano': pedido.numeroPlano,
            'Nombre Componente': pedido.nombreComponente,
            'Número Plano Componente': pedido.numeroPlanoComponente,
            Línea: pedido.linea,
            'Tipo Pieza': pedido.tipoPieza,
            'Tipo Pedido': pedido.tipoPedido,
            Cantidad: pedido.cantidad,
            Estado: pedido.estado,
            Avance: pedido.avance,
            Procesos: JSON.stringify(pedido.procesos),
            Observaciones: pedido.observaciones
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Pedidos');
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        console.log('Sincronizado con Excel:', blob);
    };

    const exportarDatos = (formato) => {
        const data = pedidos.map(pedido => ({
            ID: pedido.id,
            Código: pedido.codigo,
            'Fecha Pedido': pedido.fechaPedido,
            'Fecha Límite': pedido.fechaLimite,
            'Nombre Conjunto': pedido.nombreConjunto,
            'Número Plano': pedido.numeroPlano,
            'Nombre Componente': pedido.nombreComponente,
            'Número Plano Componente': pedido.numeroPlanoComponente,
            Línea: pedido.linea,
            'Tipo Pieza': pedido.tipoPieza,
            'Tipo Pedido': pedido.tipoPedido,
            Cantidad: pedido.cantidad,
            Estado: pedido.estado,
            Avance: pedido.avance
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Pedidos');
        const fileType = formato === 'xlsx' ? 'application/octet-stream' : 'text/csv';
        const extension = formato === 'xlsx' ? 'xlsx' : 'csv';
        const excelBuffer = XLSX.write(wb, { bookType: extension, type: 'array' });
        const blob = new Blob([excelBuffer], { type: fileType });
        saveAs(blob, `Pedidos_${new Date().toISOString()}.${extension}`);
    };

    const importarDatos = (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet);
            const nuevosPedidos = jsonData.map((row, index) => ({
                id: pedidos.length + index + 1,
                codigo: row.Código || `PED${String(pedidos.length + index + 1).padStart(3, '0')}`,
                fechaPedido: row['Fecha Pedido'],
                fechaLimite: row['Fecha Límite'],
                nombreConjunto: row['Nombre Conjunto'],
                numeroPlano: row['Número Plano'],
                nombreComponente: row['Nombre Componente'],
                numeroPlanoComponente: row['Número Plano Componente'],
                linea: row.Línea,
                tipoPieza: row['Tipo Pieza'],
                tipoPedido: row['Tipo Pedido'],
                cantidad: row.Cantidad,
                estado: row.Estado,
                avance: row.Avance,
                procesos: row.Procesos ? JSON.parse(row.Procesos) : [],
                observaciones: row.Observaciones || ''
            }));
            const updatedPedidos = [...pedidos, ...nuevosPedidos];
            setPedidos(updatedPedidos);
            setTotalPages(Math.ceil(updatedPedidos.length / 10));
            sincronizarConExcel(updatedPedidos);
            agregarNotificacion(`Usuario ha importado ${nuevosPedidos.length} pedidos.`);
        };
        reader.readAsArrayBuffer(file);
    };

    const agregarNotificacion = (mensaje) => {
        setNotificaciones(prev => ({
            ...prev,
            actividades: [...prev.actividades, { id: Date.now(), mensaje, fecha: new Date().toISOString() }]
        }));
    };

    const handleFilterChange = (e, field) => {
        const { value, checked } = e.target;
        if (Array.isArray(filters[field])) {
            setFilters(prev => ({
                ...prev,
                [field]: checked
                    ? [...prev[field], value]
                    : prev[field].filter(item => item !== value)
            }));
        } else {
            setFilters(prev => ({ ...prev, [field]: value })); // Línea corregida
        }
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        const filteredPedidos = pedidos.filter(pedido => {
            return (
                (!filters.id || pedido.id.toString().includes(filters.id)) &&
                (filters.codigo.length === 0 || filters.codigo.includes(pedido.codigo)) &&
                (!filters.fechaPedido || pedido.fechaPedido === filters.fechaPedido) &&
                (!filters.fechaLimite || pedido.fechaLimite === filters.fechaLimite) &&
                (filters.nombreConjunto.length === 0 || filters.nombreConjunto.includes(pedido.nombreConjunto)) &&
                (filters.numeroPlano.length === 0 || filters.numeroPlano.includes(pedido.numeroPlano)) &&
                (filters.nombreComponente.length === 0 || filters.nombreComponente.includes(pedido.nombreComponente)) &&
                (filters.numeroPlanoComponente.length === 0 || filters.numeroPlanoComponente.includes(pedido.numeroPlanoComponente)) &&
                (filters.linea.length === 0 || filters.linea.includes(pedido.linea)) &&
                (filters.tipoPieza.length === 0 || filters.tipoPieza.includes(pedido.tipoPieza)) &&
                (filters.tipoPedido.length === 0 || filters.tipoPedido.includes(pedido.tipoPedido)) &&
                (!filters.cantidad || pedido.cantidad.toString().includes(filters.cantidad)) &&
                (filters.estado.length === 0 || filters.estado.includes(pedido.estado)) &&
                (!filters.avance || pedido.avance.toString().includes(filters.avance))
            );
        });
        setPedidos(filteredPedidos);
        setTotalPages(Math.ceil(filteredPedidos.length / 10));
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setFilters({
            id: '',
            codigo: [],
            fechaPedido: '',
            fechaLimite: '',
            nombreConjunto: [],
            numeroPlano: [],
            nombreComponente: [],
            numeroPlanoComponente: [],
            linea: [],
            tipoPieza: [],
            tipoPedido: [],
            cantidad: '',
            estado: [],
            avance: ''
        });
        setPedidos(pedidos);
        setTotalPages(Math.ceil(pedidos.length / 10));
    };

    const toggleFilterPanel = () => {
        setIsFilterPanelOpen(!isFilterPanelOpen);
    };

    const toggleSettingsMenu = () => {
        setIsSettingsMenuOpen(!isSettingsMenuOpen);
    };

    const toggleActionMenu = (pedidoId) => {
        setOpenActionMenuId(openActionMenuId === pedidoId ? null : pedidoId);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const stats = {
        terminados: {
            total: pedidos.filter(p => p.estado === 'Terminado').length,
            programados: pedidos.filter(p => p.estado === 'Terminado' && p.tipoPedido === 'Programado').length,
            urgentes: pedidos.filter(p => p.estado === 'Terminado' && p.tipoPedido === 'Urgente').length
        },
        enProceso: {
            total: pedidos.filter(p => p.estado === 'En Proceso').length,
            programados: pedidos.filter(p => p.estado === 'En Proceso' && p.tipoPedido === 'Programado').length,
            urgentes: pedidos.filter(p => p.estado === 'En Proceso' && p.tipoPedido === 'Urgente').length
        },
        sinComenzar: {
            total: pedidos.filter(p => p.estado === 'Sin Comenzar').length,
            programados: pedidos.filter(p => p.estado === 'Sin Comenzar' && p.tipoPedido === 'Programado').length,
            urgentes: pedidos.filter(p => p.estado === 'Sin Comenzar' && p.tipoPedido === 'Urgente').length
        }
    };

    const paginatedPedidos = pedidos.slice((currentPage - 1) * 10, currentPage * 10);

    const [formData, setFormData] = useState(initialPedidoState);

    const handleFormChange = (e, section, index) => {
        const { name, value } = e.target;
        if (section === 'info') {
            setFormData(prev => ({ ...prev, [name]: value }));
        } else if (section === 'procesos') {
            const updatedProcesos = [...formData.procesos];
            updatedProcesos[index][name] = value;
            const avance = calcularAvance(updatedProcesos);
            const estado = determinarEstadoPedido(updatedProcesos);
            setFormData(prev => ({
                ...prev,
                procesos: updatedProcesos,
                avance,
                estado
            }));
        } else if (section === 'observaciones') {
            setFormData(prev => ({ ...prev, observaciones: value }));
        }
    };

    const agregarProceso = () => {
        setFormData(prev => ({
            ...prev,
            procesos: [
                ...prev.procesos,
                { nombre: '', responsable: '', fechaInicio: '', fechaFin: '', estado: 'Sin Comenzar', horasNormales: 0, horasExtras: 0 }
            ]
        }));
    };

    const eliminarProceso = (index) => {
        const updatedProcesos = formData.procesos.filter((_, i) => i !== index);
        const avance = calcularAvance(updatedProcesos);
        const estado = determinarEstadoPedido(updatedProcesos);
        setFormData(prev => ({
            ...prev,
            procesos: updatedProcesos,
            avance,
            estado
        }));
    };

    const handleSubmitPedido = (e) => {
        e.preventDefault();
        const nuevoPedido = {
            ...formData,
            id: isModalOpen.editar ? formData.id : pedidos.length + 1,
            codigo: isModalOpen.editar ? formData.codigo : `PED${String(pedidos.length + 1).padStart(3, '0')}`
        };
        let updatedPedidos;
        if (isModalOpen.editar) {
            updatedPedidos = pedidos.map(p => (p.id === nuevoPedido.id ? nuevoPedido : p));
            agregarNotificacion(`Usuario ha editado el pedido #${nuevoPedido.codigo}`);
        } else {
            updatedPedidos = [...pedidos, nuevoPedido];
            agregarNotificacion(`Usuario ha agregado el pedido #${nuevoPedido.codigo}`);
        }
        setPedidos(updatedPedidos);
        setTotalPages(Math.ceil(updatedPedidos.length / 10));
        sincronizarConExcel(updatedPedidos);
        checkNotificaciones(updatedPedidos);
        setIsModalOpen(prev => ({ ...prev, agregar: false, editar: false }));
        setFormData(initialPedidoState);
    };

    const handleEliminarPedido = () => {
        const updatedPedidos = pedidos.filter(p => p.id !== currentPedido.id);
        setPedidos(updatedPedidos);
        setTotalPages(Math.ceil(updatedPedidos.length / 10));
        agregarNotificacion(`Usuario ha eliminado el pedido #${currentPedido.codigo}`);
        setIsModalOpen(prev => ({ ...prev, eliminar: false }));
        checkNotificaciones(updatedPedidos);
    };

    const handleEliminarFinalizados = (e) => {
        e.preventDefault();
        const { mes, ano } = e.target.elements;
        const fechaLimite = new Date(ano.value, mes.value - 1, 1);
        const updatedPedidos = pedidos.filter(p => {
            const fechaPedido = new Date(p.fechaLimite);
            return p.estado !== 'Terminado' || fechaPedido > fechaLimite;
        });
        setPedidos(updatedPedidos);
        setTotalPages(Math.ceil(updatedPedidos.length / 10));
        agregarNotificacion(`Usuario ha eliminado pedidos terminados hasta ${mes.value}/${ano.value}`);
        setIsModalOpen(prev => ({ ...prev, eliminarFinalizados: false }));
        checkNotificaciones(updatedPedidos);
    };

    const handleReprogramarFecha = (e) => {
        e.preventDefault();
        const { nuevaFechaLimite, razon } = e.target.elements;
        const updatedPedidos = pedidos.map(p => {
            if (p.id === currentPedido.id) {
                return {
                    ...p,
                    fechaLimite: nuevaFechaLimite.value,
                    observaciones: `${p.observaciones}\nReprogramación: ${razon.value} (${new Date().toISOString()})`
                };
            }
            return p;
        });
        setPedidos(updatedPedidos);
        agregarNotificacion(`Usuario ha reprogramado la fecha límite del pedido #${currentPedido.codigo}`);
        setIsModalOpen(prev => ({ ...prev, reprogramar: false }));
        checkNotificaciones(updatedPedidos);
        sincronizarConExcel(updatedPedidos);
    };

    return (
        <div className="pedidos-page">
            <div className="header-container">
                <h1>Pedidos</h1>
                <div className="header-actions">
                    <button className="icon-btn" onClick={() => setIsModalOpen(prev => ({ ...prev, notificaciones: true }))}>
                        <NotificationsIcon />
                        <span className="notification-badge">{notificaciones.proximos.length + notificaciones.vencidos.length + notificaciones.actividades.length}</span>
                    </button>
                    <div className="settings-menu-container" ref={settingsRef}>
                        <button className="icon-btn" onClick={toggleSettingsMenu}>
                            <SettingsIcon />
                        </button>
                        {isSettingsMenuOpen && (
                            <div className="settings-menu">
                                <button className="menu-item" onClick={() => exportarDatos('xlsx')}>Exportar a Excel</button>
                                <button className="menu-item" onClick={() => exportarDatos('csv')}>Exportar a CSV</button>
                                <button className="menu-item" onClick={() => fileInputRef.current.click()}>Importar desde Excel</button>
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    onChange={importarDatos}
                                />
                                <button className="menu-item" onClick={() => setIsModalOpen(prev => ({ ...prev, eliminarFinalizados: true }))}>Eliminar Finalizados</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="stats-cards">
                <div className="card">
                    <h2>Terminados</h2>
                    <p className="count green">{stats.terminados.total}</p>
                    <div className="sub-stats">
                        <p>Programados: {stats.terminados.programados}</p>
                        <p>Urgentes: {stats.terminados.urgentes}</p>
                    </div>
                </div>
                <div className="card">
                    <h2>En Proceso</h2>
                    <p className="count blue">{stats.enProceso.total}</p>
                    <div className="sub-stats">
                        <p>Programados: {stats.enProceso.programados}</p>
                        <p>Urgentes: {stats.enProceso.urgentes}</p>
                    </div>
                </div>
                <div className="card">
                    <h2>Sin Comenzar</h2>
                    <p className="count yellow">{stats.sinComenzar.total}</p>
                    <div className="sub-stats">
                        <p>Programados: {stats.sinComenzar.programados}</p>
                        <p>Urgentes: {stats.sinComenzar.urgentes}</p>
                    </div>
                </div>
            </div>

            <div className="actions-bar">
                <div className="total-pedidos">
                    <span>Total de Pedidos: {pedidos.length}</span>
                </div>
                <div className="actions-right">
                    <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <div className="action-buttons">
                        <button className="action-btn primary" onClick={() => setIsModalOpen(prev => ({ ...prev, agregar: true }))}>
                            <AddIcon /> Agregar Nuevo Pedido
                        </button>
                        <button className="action-btn secondary" onClick={toggleFilterPanel}>
                            <FilterListIcon /> Filtros
                        </button>
                    </div>
                </div>
            </div>

            {(isModalOpen.agregar || isModalOpen.editar) && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>{isModalOpen.agregar ? 'Agregar Pedido' : 'Editar Pedido'}</h2>
                        <form onSubmit={handleSubmitPedido}>
                            <div className="form-section">
                                <h3>Información</h3>
                                <div className="form-input">
                                    <label>Fecha Pedido</label>
                                    <input
                                        type="date"
                                        name="fechaPedido"
                                        value={formData.fechaPedido}
                                        onChange={(e) => handleFormChange(e, 'info')}
                                        required
                                    />
                                </div>
                                <div className="form-input">
                                    <label>Fecha Límite</label>
                                    <input
                                        type="date"
                                        name="fechaLimite"
                                        value={formData.fechaLimite}
                                        onChange={(e) => handleFormChange(e, 'info')}
                                        required
                                    />
                                </div>
                                <div className="form-input">
                                    <label>Nombre Conjunto</label>
                                    <select
                                        name="nombreConjunto"
                                        value={formData.nombreConjunto}
                                        onChange={(e) => handleFormChange(e, 'info')}
                                        required
                                    >
                                        <option value="">Seleccionar</option>
                                        {opciones.nombresConjuntos.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-input">
                                    <label>Número Plano</label>
                                    <select
                                        name="numeroPlano"
                                        value={formData.numeroPlano}
                                        onChange={(e) => handleFormChange(e, 'info')}
                                        required
                                    >
                                        <option value="">Seleccionar</option>
                                        {opciones.numerosPlanos.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-input">
                                    <label>Nombre Componente</label>
                                    <select
                                        name="nombreComponente"
                                        value={formData.nombreComponente}
                                        onChange={(e) => handleFormChange(e, 'info')}
                                        required
                                    >
                                        <option value="">Seleccionar</option>
                                        {opciones.nombresComponentes.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-input">
                                    <label>Número Plano Componente</label>
                                    <select
                                        name="numeroPlanoComponente"
                                        value={formData.numeroPlanoComponente}
                                        onChange={(e) => handleFormChange(e, 'info')}
                                        required
                                    >
                                        <option value="">Seleccionar</option>
                                        {opciones.numerosPlanosComponentes.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-input">
                                    <label>Línea</label>
                                    <select
                                        name="linea"
                                        value={formData.linea}
                                        onChange={(e) => handleFormChange(e, 'info')}
                                        required
                                    >
                                        <option value="">Seleccionar</option>
                                        {opciones.lineas.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-input">
                                    <label>Tipo Pieza</label>
                                    <select
                                        name="tipoPieza"
                                        value={formData.tipoPieza}
                                        onChange={(e) => handleFormChange(e, 'info')}
                                        required
                                    >
                                        <option value="">Seleccionar</option>
                                        {opciones.tiposPiezas.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-input">
                                    <label>Tipo Pedido</label>
                                    <div className="tag-options">
                                        {['Programado', 'Urgente'].map(tipo => (
                                            <label key={tipo}>
                                                <input
                                                    type="radio"
                                                    name="tipoPedido"
                                                    value={tipo}
                                                    checked={formData.tipoPedido === tipo}
                                                    onChange={(e) => handleFormChange(e, 'info')}
                                                />
                                                <span className={`badge ${tipo.toLowerCase()}`}>{tipo}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="form-input">
                                    <label>Cantidad</label>
                                    <input
                                        type="number"
                                        name="cantidad"
                                        value={formData.cantidad}
                                        onChange={(e) => handleFormChange(e, 'info')}
                                        min="1"
                                        required
                                    />
                                </div>
                                <div className="form-input">
                                    <label>Estado</label>
                                    <div className="tag-options">
                                        {['Terminado', 'En Proceso', 'Sin Comenzar', 'Cancelado'].map(estado => (
                                            <label key={estado}>
                                                <input
                                                    type="radio"
                                                    name="estado"
                                                    value={estado}
                                                    checked={formData.estado === estado}
                                                    onChange={(e) => handleFormChange(e, 'info')}
                                                />
                                                <span className={`badge ${estado.toLowerCase().replace(' ', '-')}`}>{estado}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="form-input">
                                    <label>Avance (%)</label>
                                    <input
                                        type="number"
                                        name="avance"
                                        value={formData.avance}
                                        readOnly
                                    />
                                </div>
                            </div>
                            <div className="form-section">
                                <h3>Procesos</h3>
                                <table className="procesos-table">
                                    <thead>
                                        <tr>
                                            <th>Nombre</th>
                                            <th>Responsable</th>
                                            <th>Fecha Inicio</th>
                                            <th>Fecha Fin</th>
                                            <th>Estado</th>
                                            <th>Horas Normales</th>
                                            <th>Horas Extras</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.procesos.map((proceso, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <input
                                                        type="text"
                                                        name="nombre"
                                                        value={proceso.nombre}
                                                        onChange={(e) => handleFormChange(e, 'procesos', index)}
                                                        required
                                                    />
                                                </td>
                                                <td>
                                                    <select
                                                        name="responsable"
                                                        value={proceso.responsable}
                                                        onChange={(e) => handleFormChange(e, 'procesos', index)}
                                                        required
                                                    >
                                                        <option value="">Seleccionar</option>
                                                        {opciones.responsables.map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td>
                                                    <input
                                                        type="date"
                                                        name="fechaInicio"
                                                        value={proceso.fechaInicio}
                                                        onChange={(e) => handleFormChange(e, 'procesos', index)}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="date"
                                                        name="fechaFin"
                                                        value={proceso.fechaFin}
                                                        onChange={(e) => handleFormChange(e, 'procesos', index)}
                                                    />
                                                </td>
                                                <td>
                                                    <select
                                                        name="estado"
                                                        value={proceso.estado}
                                                        onChange={(e) => handleFormChange(e, 'procesos', index)}
                                                    >
                                                        {['Terminado', 'En Proceso', 'Sin Comenzar'].map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        name="horasNormales"
                                                        value={proceso.horasNormales}
                                                        onChange={(e) => handleFormChange(e, 'procesos', index)}
                                                        min="0"
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        name="horasExtras"
                                                        value={proceso.horasExtras}
                                                        onChange={(e) => handleFormChange(e, 'procesos', index)}
                                                        min="0"
                                                    />
                                                </td>
                                                <td>
                                                    <button type="button" className="action-btn small danger" onClick={() => eliminarProceso(index)}>
                                                        Eliminar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <button type="button" className="action-btn primary small" onClick={agregarProceso}>
                                    Agregar Proceso
                                </button>
                            </div>
                            <div className="form-section">
                                <h3>Observaciones</h3>
                                <textarea
                                    name="observaciones"
                                    value={formData.observaciones}
                                    onChange={(e) => handleFormChange(e, 'observaciones')}
                                    rows="4"
                                />
                            </div>
                            <div className="form-buttons">
                                <button type="submit" className="action-btn primary">Guardar</button>
                                <button
                                    type="button"
                                    className="action-btn secondary"
                                    onClick={() => {
                                        setIsModalOpen(prev => ({ ...prev, agregar: false, editar: false }));
                                        setFormData(initialPedidoState);
                                    }}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isModalOpen.detalles && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Detalles del Pedido #{currentPedido.codigo}</h2>
                        <div className="form-section">
                            <h3>Procesos</h3>
                            <table className="procesos-table">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Responsable</th>
                                        <th>Fecha Inicio</th>
                                        <th>Fecha Fin</th>
                                        <th>Estado</th>
                                        <th>Horas Normales</th>
                                        <th>Horas Extras</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentPedido.procesos.map((proceso, index) => (
                                        <tr key={index}>
                                            <td>{proceso.nombre}</td>
                                            <td>{proceso.responsable}</td>
                                            <td>{proceso.fechaInicio}</td>
                                            <td>{proceso.fechaFin}</td>
                                            <td>{proceso.estado}</td>
                                            <td>{proceso.horasNormales}</td>
                                            <td>{proceso.horasExtras}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="form-section">
                            <h3>Observaciones</h3>
                            <p>{currentPedido.observaciones || 'Sin observaciones'}</p>
                        </div>
                        <div className="form-buttons">
                            <button
                                className="action-btn secondary"
                                onClick={() => setIsModalOpen(prev => ({ ...prev, detalles: false }))}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen.eliminar && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Confirmar Eliminación</h2>
                        <p>¿Estás seguro de que deseas eliminar el pedido #{currentPedido.codigo}? Esta acción es permanente.</p>
                        <div className="form-buttons">
                            <button className="action-btn danger" onClick={handleEliminarPedido}>Eliminar</button>
                            <button
                                className="action-btn secondary"
                                onClick={() => setIsModalOpen(prev => ({ ...prev, eliminar: false }))}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen.notificaciones && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Notificaciones</h2>
                        <div className="form-section">
                            <h3>Pedidos Próximos a Vencer</h3>
                            {notificaciones.proximos.length === 0 ? (
                                <p>No hay pedidos próximos a vencer.</p>
                            ) : (
                                <ul>
                                    {notificaciones.proximos.map(pedido => (
                                        <li key={pedido.id}>
                                            Pedido #{pedido.codigo} - Vence: {pedido.fechaLimite}
                                            <button
                                                className="action-btn small primary"
                                                onClick={() => {
                                                    setCurrentPedido(pedido);
                                                    setIsModalOpen(prev => ({ ...prev, reprogramar: true, notificaciones: false }));
                                                }}
                                            >
                                                Reprogramar
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="form-section">
                            <h3>Pedidos Vencidos</h3>
                            {notificaciones.vencidos.length === 0 ? (
                                <p>No hay pedidos vencidos.</p>
                            ) : (
                                <ul>
                                    {notificaciones.vencidos.map(pedido => (
                                        <li key={pedido.id}>
                                            Pedido #{pedido.codigo} - Venció: {pedido.fechaLimite}
                                            <button
                                                className="action-btn small primary"
                                                onClick={() => {
                                                    setCurrentPedido(pedido);
                                                    setIsModalOpen(prev => ({ ...prev, reprogramar: true, notificaciones: false }));
                                                }}
                                            >
                                                Reprogramar
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="form-section">
                            <h3>Actividades Recientes</h3>
                            {notificaciones.actividades.length === 0 ? (
                                <p>No hay actividades recientes.</p>
                            ) : (
                                <ul>
                                    {notificaciones.actividades.map(actividad => (
                                        <li key={actividad.id}>{actividad.mensaje} - {new Date(actividad.fecha).toLocaleString()}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="form-buttons">
                            <button
                                className="action-btn secondary"
                                onClick={() => setIsModalOpen(prev => ({ ...prev, notificaciones: false }))}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen.reprogramar && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Reprogramar Fecha Límite</h2>
                        <form onSubmit={handleReprogramarFecha}>
                            <div className="form-input">
                                <label>Nueva Fecha Límite</label>
                                <input type="date" name="nuevaFechaLimite" required />
                            </div>
                            <div className="form-input">
                                <label>Razón</label>
                                <textarea name="razon" rows="3" required />
                            </div>
                            <div className="form-buttons">
                                <button type="submit" className="action-btn primary">Guardar</button>
                                <button
                                    type="button"
                                    className="action-btn secondary"
                                    onClick={() => setIsModalOpen(prev => ({ ...prev, reprogramar: false }))}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isModalOpen.eliminarFinalizados && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Eliminar Pedidos Finalizados</h2>
                        <form onSubmit={handleEliminarFinalizados}>
                            <div className="form-input">
                                <label>Mes</label>
                                <input type="number" name="mes" min="1" max="12" required />
                            </div>
                            <div className="form-input">
                                <label>Año</label>
                                <input type="number" name="ano" min="2020" max="2030" required />
                            </div>
                            <div className="form-buttons">
                                <button type="submit" className="action-btn danger">Eliminar</button>
                                <button
                                    type="button"
                                    className="action-btn secondary"
                                    onClick={() => setIsModalOpen(prev => ({ ...prev, eliminarFinalizados: false }))}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isFilterPanelOpen && (
                <div className="filter-panel">
                    <form onSubmit={handleFilterSubmit} className="filter-form">
                        <div className="filter-input">
                            <label>ID</label>
                            <input type="number" name="id" value={filters.id} onChange={(e) => handleFilterChange(e, 'id')} />
                        </div>
                        <div className="filter-input">
                            <label>Código</label>
                            <div className="checkbox-group">
                                {[...new Set(pedidos.map(p => p.codigo))].map(codigo => (
                                    <label key={codigo}>
                                        <input
                                            type="checkbox"
                                            value={codigo}
                                            checked={filters.codigo.includes(codigo)}
                                            onChange={(e) => handleFilterChange(e, 'codigo')}
                                        />
                                        {codigo}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="filter-input">
                            <label>Fecha Pedido</label>
                            <input type="date" name="fechaPedido" value={filters.fechaPedido} onChange={(e) => handleFilterChange(e, 'fechaPedido')} />
                        </div>
                        <div className="filter-input">
                            <label>Fecha Límite</label>
                            <input type="date" name="fechaLimite" value={filters.fechaLimite} onChange={(e) => handleFilterChange(e, 'fechaLimite')} />
                        </div>
                        <div className="filter-input">
                            <label>Nombre Conjunto</label>
                            <div className="checkbox-group">
                                {opciones.nombresConjuntos.map(opt => (
                                    <label key={opt}>
                                        <input
                                            type="checkbox"
                                            value={opt}
                                            checked={filters.nombreConjunto.includes(opt)}
                                            onChange={(e) => handleFilterChange(e, 'nombreConjunto')}
                                        />
                                        {opt}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="filter-input">
                            <label>Número Plano</label>
                            <div className="checkbox-group">
                                {opciones.numerosPlanos.map(opt => (
                                    <label key={opt}>
                                        <input
                                            type="checkbox"
                                            value={opt}
                                            checked={filters.numeroPlano.includes(opt)}
                                            onChange={(e) => handleFilterChange(e, 'numeroPlano')}
                                        />
                                        {opt}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="filter-input">
                            <label>Nombre Componente</label>
                            <div className="checkbox-group">
                                {opciones.nombresComponentes.map(opt => (
                                    <label key={opt}>
                                        <input
                                            type="checkbox"
                                            value={opt}
                                            checked={filters.nombreComponente.includes(opt)}
                                            onChange={(e) => handleFilterChange(e, 'nombreComponente')}
                                        />
                                        {opt}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="filter-input">
                            <label>Número Plano Componente</label>
                            <div className="checkbox-group">
                                {opciones.numerosPlanosComponentes.map(opt => (
                                    <label key={opt}>
                                        <input
                                            type="checkbox"
                                            value={opt}
                                            checked={filters.numeroPlanoComponente.includes(opt)}
                                            onChange={(e) => handleFilterChange(e, 'numeroPlanoComponente')}
                                        />
                                        {opt}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="filter-input">
                            <label>Línea</label>
                            <div className="checkbox-group">
                                {opciones.lineas.map(opt => (
                                    <label key={opt}>
                                        <input
                                            type="checkbox"
                                            value={opt}
                                            checked={filters.linea.includes(opt)}
                                            onChange={(e) => handleFilterChange(e, 'linea')}
                                        />
                                        {opt}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="filter-input">
                            <label>Tipo Pieza</label>
                            <div className="checkbox-group">
                                {opciones.tiposPiezas.map(opt => (
                                    <label key={opt}>
                                        <input
                                            type="checkbox"
                                            value={opt}
                                            checked={filters.tipoPieza.includes(opt)}
                                            onChange={(e) => handleFilterChange(e, 'tipoPieza')}
                                        />
                                        {opt}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="filter-input">
                            <label>Tipo Pedido</label>
                            <div className="checkbox-group">
                                {['Programado', 'Urgente'].map(opt => (
                                    <label key={opt}>
                                        <input
                                            type="checkbox"
                                            value={opt}
                                            checked={filters.tipoPedido.includes(opt)}
                                            onChange={(e) => handleFilterChange(e, 'tipoPedido')}
                                        />
                                        {opt}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="filter-input">
                            <label>Cantidad</label>
                            <input type="number" name="cantidad" value={filters.cantidad} onChange={(e) => handleFilterChange(e, 'cantidad')} />
                        </div>
                        <div className="filter-input">
                            <label>Estado</label>
                            <div className="checkbox-group">
                                {['Terminado', 'En Proceso', 'Sin Comenzar', 'Cancelado'].map(opt => (
                                    <label key={opt}>
                                        <input
                                            type="checkbox"
                                            value={opt}
                                            checked={filters.estado.includes(opt)}
                                            onChange={(e) => handleFilterChange(e, 'estado')}
                                        />
                                        {opt}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="filter-input">
                            <label>Avance (%)</label>
                            <input type="number" name="avance" value={filters.avance} onChange={(e) => handleFilterChange(e, 'avance')} />
                        </div>
                        <div className="filter-buttons">
                            <button type="submit" className="action-btn primary">Aplicar Filtros</button>
                            <button type="button" className="action-btn secondary" onClick={handleClearFilters}>Eliminar Filtros</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Código</th>
                            <th>Fecha Pedido</th>
                            <th>Fecha Límite</th>
                            <th>Nombre Conjunto</th>
                            <th>Número Plano</th>
                            <th>Nombre Componente</th>
                            <th>Número Plano Componente</th>
                            <th>Línea</th>
                            <th>Tipo Pieza</th>
                            <th>Tipo Pedido</th>
                            <th>Cantidad</th>
                            <th>Estado</th>
                            <th>Avance</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedPedidos.map(pedido => (
                            <tr key={pedido.id}>
                                <td>{pedido.id}</td>
                                <td>{pedido.codigo}</td>
                                <td>{pedido.fechaPedido}</td>
                                <td>{pedido.fechaLimite}</td>
                                <td>{pedido.nombreConjunto}</td>
                                <td>{pedido.numeroPlano}</td>
                                <td>{pedido.nombreComponente}</td>
                                <td>{pedido.numeroPlanoComponente}</td>
                                <td>{pedido.linea}</td>
                                <td>{pedido.tipoPieza}</td>
                                <td>
                                    <span className={`badge ${pedido.tipoPedido.toLowerCase()}`}>
                                        {pedido.tipoPedido}
                                    </span>
                                </td>
                                <td>{pedido.cantidad}</td>
                                <td>
                                    <span className={`badge ${pedido.estado.toLowerCase().replace(' ', '-')}`}>
                                        {pedido.estado}
                                    </span>
                                </td>
                                <td>{pedido.avance}%</td>
                                <td>
                                    <div className="action-menu-container">
                                        <button
                                            className="icon-btn small"
                                            onClick={() => toggleActionMenu(pedido.id)}
                                            ref={el => (actionMenuRefs.current[pedido.id] = el)}
                                        >
                                            <SettingsIcon />
                                        </button>
                                        {openActionMenuId === pedido.id && (
                                            <div className="action-menu">
                                                <button
                                                    className="action-menu-item"
                                                    onClick={() => {
                                                        setCurrentPedido(pedido);
                                                        setIsModalOpen(prev => ({ ...prev, detalles: true }));
                                                    }}
                                                >
                                                    Detalles
                                                </button>
                                                <button
                                                    className="action-menu-item"
                                                    onClick={() => {
                                                        setFormData(pedido);
                                                        setIsModalOpen(prev => ({ ...prev, editar: true }));
                                                    }}
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    className="action-menu-item danger"
                                                    onClick={() => {
                                                        setCurrentPedido(pedido);
                                                        setIsModalOpen(prev => ({ ...prev, eliminar: true }));
                                                    }}
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="pagination">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={currentPage === page ? 'active' : ''}
                    >
                        {page}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default Pedidos;