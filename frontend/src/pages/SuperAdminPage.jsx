import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import FolderList from '../components/FolderList';
import CreateFolder from '../components/CreateFolder';
import Dependencias from '../components/Dependencias';
import AgregarUsuario from '../components/AgregarUsuario';
import SubirArchivo from '../components/SubirArchivo';
import DocumentList from '../components/DocumentList';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

const SuperAdminPage = () => {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const [carpetas, setCarpetas] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [documentosMasVistos, setDocumentosMasVistos] = useState([]);
  const [carpetasMasVistas, setCarpetasMasVistas] = useState([]);
  const [documentosRecientes, setDocumentosRecientes] = useState([]);
  const [carpetasRecientes, setCarpetasRecientes] = useState([]);
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
    const fetchEstadisticas = async () => {
      try {
        const [docVistoRes, docRecienteRes, carpetaVistoRes, carpetaRecienteRes] = await Promise.all([
          fetch('http://localhost:4001/api/documentos/mayores'),
          fetch('http://localhost:4001/api/documentos/recientes'),
          fetch('http://localhost:4001/api/carpetas/mayores'),
          fetch('http://localhost:4001/api/carpetas/recientes')
        ]);

        const docVistoData = await docVistoRes.json();
        const docRecienteData = await docRecienteRes.json();
        const carpetaVistoData = await carpetaVistoRes.json();
        const carpetaRecienteData = await carpetaRecienteRes.json();

        setDocumentosMasVistos(docVistoData.documentos);
        setDocumentosRecientes(docRecienteData.documentos);
        setCarpetasMasVistas(carpetaVistoData.carpetas);
        setCarpetasRecientes(carpetaRecienteData.carpetas);
      } catch (error) {
        console.error('Error al obtener estadísticas:', error);
      }
    };

    fetchEstadisticas();
    fetchCarpetas();
  }, []);

  return (
    <div className="d-flex" style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar se integra aquí */}
      <Sidebar role="SuperAdmin" />

      {/* Contenido principal con scroll */}
      <div className="content flex-grow-1 p-4" style={{ overflowY: 'auto', height: '100vh' }}>
        <h2>
          Bienvenido, Super Admin <span className="text-primary">{usuario?.nombre_usuario}</span>
        </h2>

        {/* Aquí manejamos las rutas */}
        <Routes>
          {/* Ruta para SEMAPA */}
          <Route path="/" element={
            <div style={{ height: '100vh', width: '100%' }}>
              <div className="container mt-4">
                <div className="row">
                  {/* Documentos más vistos */}
                  <div className="col-md-6 mb-4">
                    <h5 className="text-primary">📄 Documentos más vistos</h5>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={documentosMasVistos}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="nombre_documento" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="uso" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Carpetas más vistas */}
                  <div className="col-md-6 mb-4">
                    <h5 className="text-warning">📁 Carpetas más vistas</h5>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={carpetasMasVistas}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="nombre" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="uso" fill="#ffc658" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Documentos recientes por fecha */}
                  <div className="col-md-6 mb-4">
                    <h5 className="text-success">🕒 Documentos más recientes</h5>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={documentosRecientes.map(d => ({
                        ...d,
                        fecha: new Date(d.createdat).toLocaleDateString()
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="fecha" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="uso" stroke="#82ca9d" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Carpetas recientes por fecha */}
                  <div className="col-md-6 mb-4">
                    <h5 className="text-danger">🕒 Carpetas más recientes</h5>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={carpetasRecientes.map(c => ({
                        ...c,
                        fecha: new Date(c.fecha_creacion).toLocaleDateString()
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="fecha" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="uso" stroke="#ff7300" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Si está cargando, muestra un spinner */}
              {/* {loading && (
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
                onLoad={handleLoad} // Llamamos a handleLoad cuando se carga el iframe
              /> */}
            </div>
          } />
          {/* Ruta para Dependencias */}
          <Route path="/usuarios" element={<AgregarUsuario />} />
          <Route path="/dependencias" element={<Dependencias />} />

          {/* Ruta para Carpetas */}
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
                  <CreateFolder
                    userId={usuario?.id_usuario}
                    parentId={currentFolder}
                    fetchFolders={fetchCarpetas}
                  />
                </div>

                <hr />

                {/* Lista de carpetas */}
                <FolderList
                  carpetas={carpetas}
                  setParentId={setCurrentFolder}
                />
                {currentFolder && (
                  <DocumentList idCarpeta={currentFolder} />
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
        </Routes>
      </div>
    </div>
  );
};

export default SuperAdminPage;
