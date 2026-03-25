import React, { useState, useEffect } from "react";

const AgregarUsuario = () => {
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [rol, setRol] = useState("Usuario");
  const [idDependencia, setIdDependencia] = useState("");
  const [dependencias, setDependencias] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [message, setMessage] = useState("");
  const [isFormVisible, setIsFormVisible] = useState(false);

  // Cargar las dependencias y usuarios al montar el componente
  useEffect(() => {
    const fetchDependencias = async () => {
      try {
        const response = await fetch("http://localhost:4001/api/dependencias/");
        const data = await response.json();
        setDependencias(data);
      } catch (error) {
        console.error("Error al cargar las dependencias", error);
      }
    };

    const fetchUsuarios = async () => {
      try {
        const response = await fetch("http://localhost:4001/api/usuarios/");
        const data = await response.json();
        console.log("Usuarios cargados:", data); // Verifica la respuesta
        setUsuarios(data);
      } catch (error) {
        console.error("Error al cargar los usuarios", error);
      }
    };

    fetchDependencias();
    fetchUsuarios();
  }, []);

  // Manejar el envío del formulario (crear o actualizar usuario)
  const handleSave = async () => {
    if (!nombreUsuario || !contraseña || !idDependencia) {
      setMessage("Por favor, complete todos los campos.");
      return;
    }

    const data = {
      nombre_usuario: nombreUsuario,
      contraseña: contraseña,
      rol: rol,
      id_dependencia: idDependencia,
    };

    const url = usuarioSeleccionado
      ? `http://localhost:4001/api/usuarios/modificar/${usuarioSeleccionado.id_usuario}`
      : "http://localhost:4001/api/usuarios/registrar";

    const method = usuarioSeleccionado ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(usuarioSeleccionado ? "Usuario modificado correctamente." : "Usuario registrado correctamente.");
        setUsuarios((prev) =>
          usuarioSeleccionado
            ? prev.map((u) => (u.id_usuario === usuarioSeleccionado.id_usuario ? result.usuario : u))
            : [...prev, result]
        );
        handleCancel();
      } else {
        setMessage("Error al procesar la solicitud: " + result.message);
      }
    } catch (error) {
      setMessage("Error al conectar con el servidor.");
    }
  };

  // Manejar la selección de un usuario para modificar
  const handleSelectUsuario = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setNombreUsuario(usuario.nombre_usuario);
    setContraseña(usuario.contraseña);
    setRol(usuario.rol);
    setIdDependencia(usuario.id_dependencia);
    setIsFormVisible(true);
    setMessage("");
  };

  // Cancelar acción y limpiar campos
  const handleCancel = () => {
    setUsuarioSeleccionado(null);
    setNombreUsuario("");
    setContraseña("");
    setRol("Usuario");
    setIdDependencia("");
    setIsFormVisible(false);
    setMessage("");
  };

  // Mostrar u ocultar formulario para agregar/modificar usuario
  const toggleForm = () => {
    handleCancel();
    setIsFormVisible(!isFormVisible);
  };

  return (
    <div className="container mt-4">
      <button className="btn btn-primary" onClick={toggleForm}>
        {isFormVisible ? "Cerrar Formulario" : "Agregar Usuario"}
      </button>
      {/* Formulario para agregar/modificar usuario */}
      {isFormVisible && (
        <div className="mt-3">
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Nombre de usuario"
              value={nombreUsuario}
              onChange={(e) => setNombreUsuario(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <input
              type="password"
              className="form-control"
              placeholder="Contraseña"
              value={contraseña}
              onChange={(e) => setContraseña(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <select className="form-control" value={rol} onChange={(e) => setRol(e.target.value)}>
              <option value="Usuario">Usuario</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <div className="mb-3">
            <select
              className="form-control"
              value={idDependencia}
              onChange={(e) => setIdDependencia(e.target.value)}
            >
              <option value="">Seleccionar dependencia</option>
              {dependencias.map((dependencia) => (
                <option key={dependencia.id_dependencia} value={dependencia.id_dependencia}>
                  {dependencia.nombre_dependencia}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3 d-flex gap-2">
            <button className="btn btn-success" onClick={handleSave}>
              {usuarioSeleccionado ? "Guardar Cambios" : "Guardar Usuario"}
            </button>
            <button className="btn btn-secondary" onClick={handleCancel}>
              Cancelar
            </button>
          </div>

        </div>
      )}
      {/* Tabla de usuarios existentes */}
      <div className="mt-4">
        <h3>Usuarios Registrados</h3>
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Nombre de Usuario</th>
              <th>Rol</th>
              <th>Dependencia</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length > 0 ? (
              usuarios.map((usuario) => (
                <tr key={usuario.id_usuario}>
                  <td>{usuario.nombre_usuario}</td>
                  <td>{usuario.rol}</td>
                  <td>
                    {
                      dependencias.find((dep) => dep.id_dependencia === usuario.id_dependencia)?.nombre_dependencia
                    }
                  </td>
                  <td>
                    <button
                      className="btn btn-warning btn-sm"
                      onClick={() => handleSelectUsuario(usuario)}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">No hay usuarios registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>



      {/* Mensaje de éxito o error */}
      {message && (
        <div className={`alert ${message.includes("correctamente") ? "alert-success" : "alert-danger"} mt-3`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default AgregarUsuario;
