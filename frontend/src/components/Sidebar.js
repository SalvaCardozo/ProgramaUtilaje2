import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import logo from '../assets/logo_roma.png'; // Importamos el logo de Roma
import './Sidebar.css'; // Importamos el archivo CSS
import HomeIcon from '@mui/icons-material/Home';
import ListAltIcon from '@mui/icons-material/ListAlt';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LinkIcon from '@mui/icons-material/Link';
import NoteIcon from '@mui/icons-material/Note';
import SettingsIcon from '@mui/icons-material/Settings'; // Ícono para Configuración
import AccountCircleIcon from '@mui/icons-material/AccountCircle'; // Ícono circular de perfil

function Sidebar({ handleLogout }) {
    const [isExpanded, setIsExpanded] = useState(false); // Estado para manejar si el sidebar está expandido
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false); // Estado para el menú desplegable
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 }); // Posición del menú
    const [showLogoText, setShowLogoText] = useState(false); // Estado para controlar la aparición del texto
    const [logoSizeState, setLogoSizeState] = useState('large'); // Estado para controlar el tamaño del logo
    const profileItemRef = useRef(null); // Referencia al elemento de perfil

    const toggleSidebar = () => {
        setIsExpanded(!isExpanded); // Alternar entre expandido y colapsado
    };

    const toggleProfileMenu = () => {
        setIsProfileMenuOpen(!isProfileMenuOpen); // Alternar el menú desplegable
    };

    // Controlar la aparición del texto "Metalúrgica Roma" y el tamaño del logo después de la animación
    useEffect(() => {
        if (isExpanded) {
            // Mostrar el texto y cambiar el tamaño del logo después de que la animación de expansión haya terminado
            const timer = setTimeout(() => {
                setShowLogoText(true);
                setLogoSizeState('small'); // Cambiar a tamaño pequeño cuando está expandido
            }, 350); // 350ms (la transición del sidebar es de 300ms)
            return () => clearTimeout(timer);
        } else {
            // Ocultar el texto y cambiar el tamaño del logo inmediatamente al colapsar
            setShowLogoText(false);
            setLogoSizeState('large'); // Cambiar a tamaño grande cuando está colapsado
        }
    }, [isExpanded]);

    // Calcular la posición del menú desplegable
    useEffect(() => {
        if (isProfileMenuOpen && profileItemRef.current) {
            const rect = profileItemRef.current.getBoundingClientRect();
            setMenuPosition({
                top: rect.top - 70, // Más arriba (ajustar según el alto del menú)
                left: isExpanded ? 220 : 65 // A la derecha del sidebar
            });
        }
    }, [isProfileMenuOpen, isExpanded]);

    return (
        <div className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
            {/* Logo de Roma */}
            <div className="sidebar-logo">
                <img src={logo} alt="Logo Roma" className={`logo-img ${logoSizeState}`} />
                {isExpanded && showLogoText && <span className="logo-text">METALÚRGICA ROMA S.A.</span>}
            </div>

            {/* Botón de hamburguesa */}
            <div className="hamburger" onClick={toggleSidebar}>
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
            </div>

            {/* Opciones del menú */}
            <nav className="sidebar-nav">
                <NavLink
                    to="/inicio"
                    className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                >
                    <HomeIcon className="sidebar-icon" />
                    <span className="sidebar-text">Inicio</span>
                </NavLink>
                <NavLink
                    to="/pedidos"
                    className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                >
                    <ListAltIcon className="sidebar-icon" />
                    <span className="sidebar-text">Pedidos</span>
                </NavLink>
                <NavLink
                    to="/calendario"
                    className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                >
                    <CalendarTodayIcon className="sidebar-icon" />
                    <span className="sidebar-text">Calendario</span>
                </NavLink>
                <NavLink
                    to="/dashboard"
                    className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                >
                    <DashboardIcon className="sidebar-icon" />
                    <span className="sidebar-text">Dashboard</span>
                </NavLink>
                <NavLink
                    to="/dependencias"
                    className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                >
                    <LinkIcon className="sidebar-icon" />
                    <span className="sidebar-text">Dependencias</span>
                </NavLink>
                <NavLink
                    to="/notas"
                    className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                >
                    <NoteIcon className="sidebar-icon" />
                    <span className="sidebar-text">Notas</span>
                </NavLink>
                <div className="sidebar-spacer"></div> {/* Espaciador para empujar los últimos elementos hacia abajo */}
                <NavLink
                    to="/configuracion"
                    className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                >
                    <SettingsIcon className="sidebar-icon" />
                    <span className="sidebar-text">Configuración</span>
                </NavLink>
                {/* Ícono de perfil con menú desplegable */}
                <div className="sidebar-item profile-item" onClick={toggleProfileMenu} ref={profileItemRef}>
                    <AccountCircleIcon className="sidebar-icon" />
                    <span className="sidebar-text">Perfil</span>
                    {isProfileMenuOpen && (
                        <div className="profile-menu" style={{ top: menuPosition.top, left: menuPosition.left }}>
                            <NavLink
                                to="/perfil"
                                className={({ isActive }) => `profile-menu-item ${isActive ? 'active' : ''}`}
                            >
                                Perfil
                            </NavLink>
                            <NavLink
                                to="/ajustes"
                                className={({ isActive }) => `profile-menu-item ${isActive ? 'active' : ''}`}
                            >
                                Ajustes
                            </NavLink>
                            <div className="profile-menu-item" onClick={handleLogout}>
                                Logout
                            </div>
                        </div>
                    )}
                </div>
            </nav>
        </div>
    );
}

export default Sidebar;