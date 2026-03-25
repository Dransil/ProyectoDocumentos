import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import FolderList from '../components/FolderList';
import CreateFolder from '../components/CreateFolder';
import SubirArchivo from '../components/SubirArchivo';
import CrearSolicitud from '../components/CrearSolicitud';
import DocumentListUser from '../components/DocumentListUser';
import Notificacion from '../components/Notificaciones';

const UsuarioPage = () => {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const [carpetas, setCarpetas] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchCarpetas = async () => {
    try {
      const response = await fetch('http://localhost:4001/api/carpetas');
      const data = await response.json();
      setCarpetas(data.carpetas);
    } catch (error) {
      console.error('Error al cargar las carpetas:', error);
    }
  };

  const fetchDocumentos = async () => {
    try {
      const response = await fetch(`http://localhost:4001/api/documentos/?id_carpeta=${currentFolder}`);
      const data = await response.json();
      console.log(data.documentos);
    } catch (error) {
      console.error('Error al cargar los documentos:', error);
    }
  };

  const handleReset = () => {
    setCurrentFolder(null);
    window.location.reload();
  };
  const handleLoad = () => {
    setLoading(false);
  };

  useEffect(() => {
    fetchCarpetas();
  }, []);

  return (
    <div className="d-flex" style={{ height: '100vh', overflow: 'hidden' }}>
      <Sidebar role="Usuario" />

      <div className="content flex-grow-1 p-4" style={{ overflowY: 'auto', height: '100vh' }}>
        <h2>
          Bienvenido, Usuario <span className="text-primary">{usuario?.nombre_usuario}</span>
        </h2>

        <Routes>
          {/* Ruta para SEMAPA */}
          <Route path="/" element={
            <div style={{ height: '100vh', width: '100%' }}>
              {loading && (
                <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                  <div className="spinner-border" role="status">
                    <span className="sr-only"></span>
                  </div>
                </div>
              )}
              <iframe
                src="https://www.semapa.gob.bo"
                style={{ height: '100%', width: '100%' }}
                title="SEMAPA"
                frameBorder="0"
                onLoad={handleLoad}
              />
            </div>
          } />

          {/* Ruta para Carpetas */}
          <Route path="/solicitudes" element={<CrearSolicitud />} />
          <Route
            path="/carpetas"
            element={
              <>
                <div className="mt-4">
                  <h4>Gestión de Carpetas</h4>
                  {currentFolder && usuario?.rol !== 'Usuario' && (
                    <SubirArchivo
                      idUsuario={usuario?.id_usuario}
                      idCarpeta={currentFolder}
                      fetchDocumentos={fetchDocumentos}
                    />
                  )}
                  {/* <CreateFolder
                    userId={usuario?.id_usuario}
                    parentId={currentFolder}
                    fetchFolders={fetchCarpetas}
                  /> */}
                </div>

                <hr />

                {/* Lista de carpetas */}
                <FolderList
                  carpetas={carpetas}
                  setParentId={setCurrentFolder}
                />
                {currentFolder && (
                  <DocumentListUser
                    idCarpeta={currentFolder}
                    idDependencia={usuario?.id_dependencia || null} 
                  />
                )}

                {/* Botón para regresar al directorio raíz */}
                {currentFolder && (
                  <button
                    onClick={handleReset}
                    className="btn btn-secondary mt-3"
                  >
                    Regresar al directorio raíz
                  </button>
                )}
              </>
            }
          />
          {/* Cambiar a notificaciones */}
          <Route path="/notificaciones" element={<Notificacion  />} />
        </Routes>
      </div>
    </div>
  );
};

export default UsuarioPage;
