import React, { useState, useEffect } from "react";

const Dependencias = () => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [nombreDependencia, setNombreDependencia] = useState("");
  const [dependenciaId, setDependenciaId] = useState(null);
  const [message, setMessage] = useState("");
  const [dependencias, setDependencias] = useState([]);

  useEffect(() => {
    fetchDependencias();
  }, []);

  const fetchDependencias = async () => {
    try {
      const response = await fetch("http://localhost:4001/api/dependencias");
      const data = await response.json();
      setDependencias(data);
    } catch (error) {
      console.error("Error al obtener las dependencias:", error);
      setMessage("Error al cargar las dependencias.");
    }
  };

  const toggleForm = () => {
    setIsFormVisible(!isFormVisible);
    setIsEditMode(false);
    setMessage("");
    setNombreDependencia("");
    setDependenciaId(null);
  };

  const handleSave = async () => {
    if (!nombreDependencia) {
      setMessage("Por favor, ingrese un nombre para la dependencia.");
      return;
    }

    const data = { nombre_dependencia: nombreDependencia };
    try {
      const url = isEditMode
        ? `http://localhost:4001/api/dependencias/modificar/${dependenciaId}`
        : "http://localhost:4001/api/dependencias/agregar";

      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        window.location.reload(); // Recarga la página completa
      } else {
        const result = await response.json();
        setMessage("Error: " + result.message);
      }
    } catch (error) {
      setMessage("Error al conectar con el servidor.");
    }
  };

  const handleEdit = (id, nombre) => {
    setIsFormVisible(true);
    setIsEditMode(true);
    setDependenciaId(id);
    setNombreDependencia(nombre);
    setMessage("");
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setNombreDependencia("");
    setDependenciaId(null);
    setIsEditMode(false);
    setMessage("");
  };

  return (
    <div className="container mt-4">
      <button className="btn btn-primary" onClick={toggleForm}>
        {isEditMode ? "Editar Dependencia" : "Agregar Dependencia"}
      </button>

      {isFormVisible && (
        <div className="mt-3">
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Nombre de la dependencia"
              value={nombreDependencia}
              onChange={(e) => setNombreDependencia(e.target.value)}
            />
          </div>
          <div className="mb-3 d-flex gap-2">
            <button className="btn btn-success" onClick={handleSave}>
              {isEditMode ? "Modificar Dependencia" : "Guardar Dependencia"}
            </button>
            <button className="btn btn-secondary ml-2" onClick={handleCancel}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {message && (
        <div
          className={`alert ${
            message.includes("correctamente") ? "alert-success" : "alert-danger"
          } mt-3`}
        >
          {message}
        </div>
      )}

      <div className="mt-4">
        <h4>Lista de Dependencias</h4>
        <ul className="list-group">
          {dependencias.map((dependencia) => (
            <li
              key={dependencia.id_dependencia}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              {dependencia.nombre_dependencia}
              <button
                className="btn btn-sm btn-warning"
                onClick={() =>
                  handleEdit(dependencia.id_dependencia, dependencia.nombre_dependencia)
                }
              >
                Editar
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Dependencias;
