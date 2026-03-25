import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaUser, FaFolder, FaSignOutAlt, FaBars, FaAddressBook, FaFile, FaAddressCard, FaHome, FaBell, FaUserAstronaut } from "react-icons/fa";

const Sidebar = ({ role }) => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const [notifCount, setNotifCount] = useState(0);

  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const id_usuario = usuario?.id_usuario;
  const id_dependencia = usuario?.id_dependencia;

  useEffect(() => {
    const fetchNotificaciones = async () => {
      let url = '';
      
      // Definimos la URL según el rol
      if (role === 'Admin' && id_dependencia) {
        url = `http://localhost:4001/api/solicitudes/dependencia/${id_dependencia}`;
      } else if (role === 'Usuario' && id_usuario) {
        url = `http://localhost:4001/api/solicitudes/${id_usuario}`;
      }

      if (url) {
        try {
          const res = await fetch(url);
          const data = await res.json();
          
          if (role === 'Admin') {
            const pendientes = data.filter(s => s.estado === 'Pendiente');
            setNotifCount(pendientes.length);
          } else {
            const noLeidas = data.filter(s => s.leido === false || s.leido === 0);
            setNotifCount(noLeidas.length);
          }
        } catch (err) {
          console.error("Error al actualizar el contador del Sidebar:", err);
        }
      }
    };

    // Ejecución inmediata al cargar el componente
    fetchNotificaciones();
    
    const interval = setInterval(fetchNotificaciones, 10000); 

    return () => clearInterval(interval);

  }, [id_usuario, id_dependencia, role]);

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    navigate("/");
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const menuItems = {
    SuperAdmin: [
      { name: "Inicio", icon: <FaHome />, path: "/superadmin/" },
      { name: "Usuarios", icon: <FaUser />, path: "/superadmin/usuarios" },
      { name: "Dependencias", icon: <FaAddressBook />, path: "/superadmin/dependencias" },
      { name: "Carpetas y documentos", icon: <FaFolder />, path: "/superadmin/carpetas" },
    ],
    Admin: [
      { name: "Inicio", icon: <FaHome />, path: "/admin/" },
      { name: "Clientes", icon: <FaUserAstronaut />, path: "/admin/clientes" },
      { name: "Carpetas y documentos", icon: <FaFolder />, path: "/admin/carpetas" },
      { name: "Documentos", icon: <FaFile />, path: "/admin/documentos" },
      { name: "Solicitudes", icon: <FaAddressCard />, path: "/admin/solicitudes" },
      { name: "Notificaciones", icon: <FaBell />, path: "/admin/notificaciones", badge: notifCount },
    ],
    Usuario: [
      { name: "Inicio", icon: <FaHome />, path: "/usuario/" },
      { name: "Carpetas y documentos", icon: <FaFolder />, path: "/usuario/carpetas" },
      { name: "Solicitudes", icon: <FaAddressCard />, path: "/usuario/solicitudes" },
      { name: "Notificaciones", icon: <FaBell />, path: "/usuario/notificaciones", badge: notifCount },
    ],
  };

  return (
    <div
      className="sidebar d-flex flex-column"
      style={{
        width: isCollapsed ? "80px" : "250px",
        height: "100vh",
        transition: "width 0.3s ease",
        overflow: "hidden",
        background: "linear-gradient(180deg, rgba(21,101,192,0.9), rgba(66,165,245,0.9))",
        backdropFilter: "blur(15px)",
        boxShadow: "2px 0 20px rgba(0,0,0,0.2)",
        color: "white",
        borderRadius: "0 15px 15px 0",
        paddingTop: "10px",
        zIndex: 1000,
      }}
    >
      <div className="d-flex justify-content-between align-items-center px-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.2)", paddingBottom: "10px" }}>
        <h2 style={{ fontSize: "1.5rem", display: isCollapsed ? "none" : "block", margin: 0 }}>Panel {role}</h2>
        <button onClick={toggleSidebar} className="btn" style={{ fontSize: "1.2rem", borderRadius: "50%", padding: "5px", color: "white", background: "rgba(255,255,255,0.1)", border: "none" }}>
          <FaBars />
        </button>
      </div>

      <ul className="list-unstyled mt-4 px-2">
        {menuItems[role]?.map((item, index) => (
          <li key={index} className="mb-3">
            <NavLink
              to={item.path}
              end
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                padding: "10px",
                borderRadius: "8px",
                color: "white",
                backgroundColor: isActive ? "rgba(0,51,153,0.6)" : "transparent",
                transition: "all 0.3s ease",
                textDecoration: "none",
                position: "relative",
              })}
            >
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                {item.icon}
                {item.badge > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-8px",
                      right: "-8px",
                      backgroundColor: "#ff3d00",
                      color: "white",
                      fontSize: "0.7rem",
                      fontWeight: "bold",
                      borderRadius: "50%",
                      width: "18px",
                      height: "18px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid rgba(21,101,192,0.9)",
                      boxShadow: "0 0 5px rgba(255, 61, 0, 0.5)"
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              {!isCollapsed && <span className="ms-2">{item.name}</span>}
            </NavLink>
          </li>
        ))}
      </ul>
      
      <div className="mt-auto px-3 pb-3">
        <button onClick={handleLogout} className="btn w-100 d-flex align-items-center justify-content-center" style={{ padding: "10px", borderRadius: "10px", fontSize: "1rem", border: "none", color: "white", background: "linear-gradient(90deg, #1565c0, #42a5f5)" }}>
          <FaSignOutAlt />
          {!isCollapsed && <span className="ms-2">Cerrar sesión</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;