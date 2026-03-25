import React, { useState, useEffect } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import FolderList from '../components/FolderList';
import CreateFolder from '../components/CreateFolder';
import SubirArchivo from '../components/SubirArchivo';
import DocumentListAdmin from '../components/DocumentListAdmin';
import GestionDocumentList from '../components/GestionDocumentList';
import RevisarSolicitudes from '../components/RevisarSolicitud';
import Notificacion from '../components/Notificaciones';
import GestionClientes from '../components/GestionClientes';
import BusquedaAvanzada from '../components/BusquedaAvanzada';

const AdminPage = () => {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario'));

  // Estados de datos
  const [carpetas, setCarpetas] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [loading, setLoading] = useState(true);

  // ESTADO PARA TABS INTERNAS (Solo en la sección de Carpetas)
  const [activeTab, setActiveTab] = useState('principal'); // 'principal' o 'nueva'

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
      <Sidebar role="Admin" />

      <div className="content flex-grow-1 p-4" style={{ overflowY: 'auto', height: '100vh' }}>
        <h2>
          Bienvenido, Admin <span className="text-primary">{usuario?.nombre_usuario}</span>
        </h2>

        <Routes>
          {/* RUTA: SEMAPA (RAÍZ) */}
          <Route path="/" element={
            <div style={{ height: '100vh', width: '100%' }}>
              {loading && (
                <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                  <div className="spinner-border" role="status"></div>
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

          {/* OTRAS RUTAS */}
          <Route path="/clientes" element={<GestionClientes />} />
          <Route path="/documentos" element={<GestionDocumentList idDependencia={usuario?.id_dependencia} />} />
          <Route path="/solicitudes" element={<RevisarSolicitudes />} />
          <Route path="/notificaciones" element={<Notificacion />} />

          {/* RUTA: CARPETAS (CON PESTAÑAS INTERNAS) */}
          <Route
            path="/carpetas"
            element={
              <>
                {/* --- NAVEGACIÓN DE PESTAÑAS --- */}
                <ul className="nav nav-tabs mt-4">
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'principal' ? 'active font-weight-bold' : ''}`}
                      onClick={() => setActiveTab('principal')}
                    >
                      Carpetas y documentos
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'nueva' ? 'active font-weight-bold' : ''}`}
                      onClick={() => setActiveTab('nueva')}
                    >
                      Busqueda avanzada
                    </button>
                  </li>
                </ul>

                <div className="tab-content border-left border-right border-bottom p-3 bg-white">

                  {/* CONTENIDO PESTAÑA PRINCIPAL */}
                  {activeTab === 'principal' && (
                    <div id="contenido-principal">
                      <div className="mt-4">
                        <h4>Gestión de Carpetas</h4>
                        {currentFolder && usuario?.rol !== 'Usuario' && (
                          <SubirArchivo
                            idUsuario={usuario?.id_usuario}
                            idCarpeta={currentFolder}
                            fetchDocumentos={fetchDocumentos}
                          />
                        )}
                        <CreateFolder
                          userId={usuario?.id_usuario}
                          parentId={currentFolder}
                          fetchFolders={fetchCarpetas}
                        />
                      </div>

                      <hr />

                      <FolderList
                        carpetas={carpetas}
                        setParentId={setCurrentFolder}
                      />

                      {currentFolder && (
                        <DocumentListAdmin
                          idCarpeta={currentFolder}
                          idDependencia={usuario?.id_dependencia || null}
                        />
                      )}

                      {currentFolder && (
                        <button onClick={handleReset} className="btn btn-secondary mt-3">
                          Regresar al directorio raíz
                        </button>
                      )}
                    </div>
                  )}

                  {/* CONTENIDO NUEVA PESTAÑA (VACÍA PARA TI) */}
                  {activeTab === 'nueva' && (
                    <div id="contenido-nuevo" className="py-4">
                      <BusquedaAvanzada idDependencia={usuario?.id_dependencia} />
                    </div>
                  )}

                </div>
              </>
            }
          />
        </Routes>
      </div>
    </div>
  );
};

export default AdminPage;