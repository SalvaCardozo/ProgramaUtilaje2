import React from 'react';
import './Inicio.css';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import logo from '../assets/logo_roma.png';
import { Build, People, Factory } from '@mui/icons-material';

function Inicio() {
    const fadeIn = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
    };

    const slideInLeft = {
        hidden: { opacity: 0, x: -50 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: 'easeOut' } },
    };

    const slideInRight = {
        hidden: { opacity: 0, x: 50 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: 'easeOut' } },
    };

    const counterAnimation = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: { opacity: 1, scale: 1, transition: { duration: 1, ease: 'easeOut' } },
    };

    return (
        <div className="inicio-container">
            {/* Hero Section (sin tarjeta, directamente sobre el fondo) */}
            <motion.div
                className="hero-content"
                initial="hidden"
                animate="visible"
                variants={fadeIn}
            >
                <img src={logo} alt="Logo Roma" className="hero-logo" />
                <motion.h1 variants={slideInLeft}>Bienvenidos a Metalúrgica Roma S.A.</motion.h1>
                <motion.p variants={slideInRight}>
                    Innovación y calidad en soluciones metalmecánicas para tu empresa.
                </motion.p>
                <div className="separator-line"></div>
                <motion.p variants={fadeIn} className="area-text">
                    ÁREA DE UTILAJE
                </motion.p>
            </motion.div>

            {/* Estadísticas */}
            <section className="stats-section">
                <motion.div
                    className="stat-card"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={counterAnimation}
                >
                    <h3>
                        <CountUp end={15} duration={2} suffix="+" />
                    </h3>
                    <p>Años de Experiencia</p>
                </motion.div>
                <motion.div
                    className="stat-card"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={counterAnimation}
                >
                    <h3>
                        <CountUp end={500} duration={2} suffix="+" />
                    </h3>
                    <p>Clientes Atendidos</p>
                </motion.div>
                <motion.div
                    className="stat-card"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={counterAnimation}
                >
                    <h3>
                        <CountUp end={1000} duration={2} suffix="+" />
                    </h3>
                    <p>Proyectos Completados</p>
                </motion.div>
            </section>

            {/* Servicios */}
            <section className="services-section">
                <motion.h2
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeIn}
                >
                    Nuestros Servicios
                </motion.h2>
                <div className="services-grid">
                    <motion.div
                        className="service-card"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
                    >
                        <Build className="service-icon" />
                        <h3>Mecanizado de Piezas</h3>
                        <p>
                            Mecanizamos piezas metálicas de alta calidad con precisión y durabilidad.
                        </p>
                    </motion.div>
                    <motion.div
                        className="service-card"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
                    >
                        <People className="service-icon" />
                        <h3>Asesoramiento Técnico</h3>
                        <p>
                            Ofrecemos soporte técnico especializado para optimizar tus proyectos.
                        </p>
                    </motion.div>
                    <motion.div
                        className="service-card"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
                    >
                        <Factory className="service-icon" />
                        <h3>Producción Industrial</h3>
                        <p>
                            Soluciones a gran escala para la industria, con eficiencia y calidad.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer full-width-footer">
                <p>© 2025 Metalúrgica Roma S.A. Todos los derechos reservados.</p>
                <p>Contacto: info@metalurgicaroma.com | +54 123 456 789</p>
                <p>By: S.Cardozo</p>
            </footer>
        </div>
    );
}

export default Inicio;