import React, { useState, useEffect, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaCheckCircle, FaTimesCircle, FaClock, FaEye, FaCheck } from "react-icons/fa";

const Notificacion = () => {
    const [notificaciones, setNotificaciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    const { id_usuario, id_dependencia, rol } = usuario;

    const cargarDatos = useCallback(async () => {
        let url = '';
        if (rol === 'Admin') {
            url = `http://localhost:4001/api/solicitudes/dependencia/${id_dependencia}`;
        } else if (rol === 'Usuario') {
            url = `http://localhost:4001/api/solicitudes/${id_usuario}`;
        }

        try {
            const res = await fetch(url);
            const data = await res.json();
            // Ordenar por fecha (más reciente primero)
            const sortedData = data.sort((a, b) => new Date(b.fecha_solicitud) - new Date(a.fecha_solicitud));
            setNotificaciones(sortedData);
            setCargando(false);
        } catch (err) {
            console.error("Error al cargar notificaciones:", err);
            setCargando(false);
        }
    }, [id_usuario, id_dependencia, rol]);

    useEffect(() => {
        cargarDatos();
        // Opcional: Recargar automáticamente cada 15 segundos para ver cambios del Admin
        const interval = setInterval(cargarDatos, 15000);
        return () => clearInterval(interval);
    }, [cargarDatos]);

    // Función para actualizar en la Base de Datos
    const marcarLeidoDB = async (id) => {
        try {
            const response = await fetch(`http://localhost:4001/api/solicitudes/marcar-leida/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ valor: true }) 
            });

            if (response.ok) {
                setNotificaciones(prev => prev.map(n => 
                    n.id_solicitud === id ? { ...n, leido: true } : n
                ));
            }
        } catch (error) {
            console.error("Error al marcar como leído:", error);
        }
    };

    const getEstadoConfig = (estado) => {
        const iconSize = 20;
        switch (estado) {
            case 'Aprobado': 
                return { color: '#198754', bg: '#d1e7dd', icon: <FaCheckCircle size={iconSize}/>, mensaje: 'Documento aprobado' };
            case 'Rechazado': 
                return { color: '#dc3545', bg: '#f8d7da', icon: <FaTimesCircle size={iconSize}/>, mensaje: 'Documento denegado' };
            default: 
                return { color: '#664d03', bg: '#fff3cd', icon: <FaClock size={iconSize}/>, mensaje: 'Este documento sigue pendiente' };
        }
    };

    if (cargando) return <div className="text-center mt-5">Cargando avisos...</div>;

    return (
        <div className="container mt-4">
            <h3 className="mb-4" style={{ color: '#1565c0', fontWeight: 'bold' }}>
                {rol === 'Admin' ? 'Gestión de solicitudes recientes' : 'Notificaciones de mis solicitudes'}
            </h3>
            
            {notificaciones.length === 0 ? (
                <div className="alert alert-light border shadow-sm">No hay actividad reciente.</div>
            ) : (
                <div className="list-group">
                    {notificaciones.map((n) => {
                        const config = getEstadoConfig(n.estado);
                        const isRead = n.leido === true || n.leido === 1;

                        return (
                            <div 
                                key={n.id_solicitud} 
                                className={`list-group-item mb-3 border-start border-4 shadow-sm transition-all ${isRead ? 'opacity-75' : ''}`}
                                style={{ 
                                    borderLeftColor: config.color, 
                                    borderRadius: '10px',
                                    backgroundColor: isRead ? '#f8f9fa' : '#ffffff',
                                    transition: '0.3s'
                                }}
                            >
                                <div className="d-flex w-100 justify-content-between align-items-center">
                                    <h6 className="mb-1 d-flex align-items-center" style={{ fontWeight: isRead ? 'normal' : 'bold' }}>
                                        <span className="me-2" style={{ color: config.color }}>{config.icon}</span>
                                        {rol === 'Admin' ? `De: ${n.nombre_usuario || 'Usuario'}` : config.mensaje}
                                        {!isRead && rol === 'Usuario' && (
                                            <span className="badge bg-danger ms-2" style={{fontSize: '0.6rem', animation: 'pulse 2s infinite'}}>NUEVO</span>
                                        )}
                                    </h6>
                                    <small className="text-muted bg-light px-2 py-1 rounded">
                                        {new Date(n.fecha_solicitud).toLocaleDateString()}
                                    </small>
                                </div>

                                <p className="mb-2 mt-2 text-secondary" style={{ fontSize: '0.95rem' }}>
                                    <strong className="text-dark">Comentario:</strong> "{n.comentario || 'Sin observaciones'}"
                                </p>

                                <div className="d-flex justify-content-between align-items-center mt-3">
                                    <span 
                                        className="badge px-3 py-2" 
                                        style={{ backgroundColor: config.bg, color: config.color, borderRadius: '20px', fontSize: '0.8rem' }}
                                    >
                                        {n.estado}
                                    </span>
                                    
                                    {rol === 'Usuario' && (
                                        !isRead ? (
                                            <button 
                                                onClick={() => marcarLeidoDB(n.id_solicitud)}
                                                className="btn btn-sm btn-primary shadow-sm"
                                                style={{ borderRadius: '20px', padding: '5px 15px' }}
                                            >
                                                <FaEye className="me-1"/> Marcar como leído
                                            </button>
                                        ) : (
                                            <span className="text-muted small d-flex align-items-center">
                                                <FaCheck className="me-1 text-success"/> Visto
                                            </span>
                                        )
                                    )}
                                    
                                    {rol === 'Admin' && (
                                        <small className="text-muted">ID: #{n.id_solicitud}</small>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default Notificacion;