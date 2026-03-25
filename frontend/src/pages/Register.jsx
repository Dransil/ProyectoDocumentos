import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout"; // Importamos el nuevo Layout unificado

const Register = () => {
  const navigate = useNavigate();
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [idDependencia, setIdDependencia] = useState("");
  const [dependencias, setDependencias] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstUser, setIsFirstUser] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // 1. Cargar dependencias
        const depResponse = await fetch("http://localhost:4001/api/dependencias/");
        const depData = await depResponse.json();
        setDependencias(depData);

        // 2. Verificar si hay usuarios registrados para la lógica de Superadmin
        const userResponse = await fetch("http://localhost:4001/api/usuarios/");
        const userData = await userResponse.json();
        
        if (userData.length === 0) {
          setIsFirstUser(true);
        }
      } catch (error) {
        console.error("Error al cargar datos iniciales", error);
      }
    };
    fetchInitialData();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();

    // Validación: idDependencia es obligatorio solo si NO es el primer usuario
    if (!nombreUsuario || !contraseña || (!isFirstUser && !idDependencia)) {
      setMensaje("Por favor, complete los campos obligatorios.");
      return;
    }

    const data = {
      nombre_usuario: nombreUsuario,
      contraseña: contraseña,
      id_dependencia: idDependencia || null, 
    };

    setIsLoading(true);
    setMensaje("");

    try {
      const response = await fetch("http://localhost:4001/api/usuarios/registrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        const saludo = result.rol === "Superadmin" 
          ? "¡Bienvenido, Superadmin! Configuración inicial completa." 
          : "Registro exitoso.";
        setMensaje(`${saludo} Redirigiendo...`);
        setTimeout(() => navigate("/"), 2000);
      } else {
        setMensaje("Error: " + result.message);
      }
    } catch {
      setMensaje("Error al conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="register-card">
        <h2 className="mb-4 text-center"> REGISTRARSE </h2>
        
        {mensaje && (
          <div className={`alert ${mensaje.includes("Error") ? "alert-danger" : "alert-info"}`}>
            {mensaje}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="mb-3">
            <label className="form-label">Nombre de usuario</label>
            <input
              type="text"
              className="form-control"
              value={nombreUsuario}
              onChange={(e) => setNombreUsuario(e.target.value)}
              placeholder=""
              required
              disabled={isLoading}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className="form-control"
              value={contraseña}
              onChange={(e) => setContraseña(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">
              Dependencia {isFirstUser && <span className="text-muted small">(Opcional para Superadmin)</span>}
            </label>
            <select
              className="form-select"
              value={idDependencia}
              onChange={(e) => setIdDependencia(e.target.value)}
              required={!isFirstUser}
              disabled={isLoading}
            >
              <option value="">
                {isFirstUser ? "-- Acceso Superadmin (Sin dependencia) --" : "Seleccionar dependencia"}
              </option>
              {dependencias.map((d) => (
                <option key={d.id_dependencia} value={d.id_dependencia}>
                  {d.nombre_dependencia}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary w-100" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Registrando...
              </>
            ) : "Registrar"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="small">
            ¿Ya tienes cuenta? <a href="/" className="text-decoration-none">Iniciar sesión</a>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Register;