import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout"; // Asegúrate de tener el archivo AuthLayout que creamos
import "./Login.css";

const Login = () => {
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [mensaje, setMensaje] = useState({ text: "", type: "" });
  const navigate = useNavigate();

  // Mantenemos tus 1000 partículas originales por funcionalidad
  const particles = useMemo(() => {
    return Array.from({ length: 1000 }).map((_, i) => (
      <div
        key={i}
        className="particle"
        style={{
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 10}s`,
          animationDuration: `${8 + Math.random() * 6}s`,
        }}
      />
    ));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const loginData = {
      nombre_usuario: nombreUsuario,
      contraseña: contraseña,
    };

    try {
      const response = await fetch("http://localhost:4001/api/usuarios/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (response.ok) {
        setMensaje({ text: "Inicio de sesión exitoso.", type: "success" });
        localStorage.setItem("usuario", JSON.stringify(data.usuario));

        switch (data.usuario.rol) {
          case "Admin":
            navigate("/admin");
            break;
          case "Super Admin":
            navigate("/superadmin");
            break;
          case "Usuario":
            navigate("/usuario");
            break;
          default:
            navigate("/home");
            break;
        }
      } else {
        setMensaje({ text: data.message || "Error en las credenciales.", type: "error" });
      }
    } catch {
      setMensaje({ text: "Error al conectar con el servidor.", type: "error" });
    }
  };

  return (
    <AuthLayout>
      <div className="login-card">
        <h3 className="text-center mb-4"> INICIAR SESIÓN</h3>

        {mensaje.text && (
          <div className={`alert ${mensaje.type === "success" ? "alert-success" : "alert-danger"}`}>
            {mensaje.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="nombre_usuario" className="form-label">Nombre de usuario</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-person-fill"></i></span>
              <input
                type="text"
                id="nombre_usuario"
                className="form-control"
                value={nombreUsuario}
                onChange={(e) => setNombreUsuario(e.target.value)}
                required
                placeholder="Ingrese su nombre de usuario"
              />
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="contraseña" className="form-label">Contraseña</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-lock-fill"></i></span>
              <input
                type="password"
                id="contraseña"
                className="form-control"
                value={contraseña}
                onChange={(e) => setContraseña(e.target.value)}
                required
                placeholder="********"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-100 mt-3">
            Iniciar sesión
          </button>
        </form>

        <div className="text-center mt-3">
          <small>¿No tienes cuenta? <a href="/register" className="text-decoration-none">Regístrate aquí</a></small>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;