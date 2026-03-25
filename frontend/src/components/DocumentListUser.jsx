import React, { useState, useEffect, useRef } from "react";
import { FaFile } from "react-icons/fa";
import styled from "styled-components";

// --- Estilos de la Previsualización Flotante ---
const PreviewFloating = styled.div`
  position: fixed;
  top: ${(props) => props.y - 15}px;
  left: ${(props) => props.x + 15}px;
  width: 320px;
  height: 250px;
  background: white;
  border: 2px solid #007bff;
  border-radius: 12px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
  z-index: 10000;
  overflow: hidden;
  pointer-events: none; /* Para que el mouse no se trabe al entrar al cuadro */
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  iframe {
    width: 100%;
    height: 100%;
    border: none;
  }
`;

const PreviewHeader = styled.div`
  background: #007bff;
  color: white;
  padding: 8px 12px;
  font-size: 0.85rem;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// --- Estilos generales (Tus estilos originales) ---
const DocumentListContainer = styled.div`
  padding: 2rem;
  background: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  text-align: center;
`;

const DocumentListTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #333;
`;

const SearchInput = styled.input`
  padding: 0.5rem 1rem;
  margin-bottom: 1rem;
  width: 100%;
  max-width: 400px;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 1rem;
`;

const TabsContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  background: #969696ff;
  border-radius: 8px;
  padding: 0.5rem 1rem;
`;

const TabButton = styled.button`
  background: ${(props) => (props.active ? "#007bff" : "transparent")};
  color: ${(props) => (props.active ? "#fff" : "#ffffffff")};
  border: none;
  border-radius: 6px;
  padding: 0.4rem 1rem;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    color: #fff;
    background: #007bff33;
  }
`;

const LoadingText = styled.p`
  font-size: 1rem; color: #888;
`;

const NoDocumentsText = styled.p`
  font-size: 1rem; color: #888;
`;

const DocumentGrid = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  padding: 0;
  list-style: none;
  margin: 0;
`;

const DocumentCard = styled.li`
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
  position: relative;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
    border-color: #007bff;
  }
`;

const DocumentIcon = styled.div`
  color: #007bff;
  margin-bottom: 1rem;
`;

const DocumentName = styled.p`
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
  word-break: break-word;
`;

const DocumentAction = styled.p`
  font-size: 0.9rem;
  color: #007bff;
  text-decoration: underline;
  margin-bottom: 0.3rem;
`;

const DocumentDate = styled.p`
  font-size: 0.65rem;
  color: #555;
  margin: 0;
`;

const DocumentLink = styled.div` // Cambiado de <a> a <div> para evitar conflictos de navegación
  text-decoration: none;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

// --- COMPONENTE PRINCIPAL ---
const DocumentListUser = ({ idCarpeta, idDependencia }) => {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const id_usuario = usuario?.id_usuario;

  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState("fechaDesc");

  // Estados para la Previsualización
  const [preview, setPreview] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const timerRef = useRef(null); // Para el delay del hover

  useEffect(() => {
    const fetchDocumentos = async () => {
      try {
        const idDependenciaQuery = idDependencia ? `&id_dependencia=${idDependencia}` : "";
        const url = `http://localhost:4001/api/documentos/docs/?id_carpeta=${idCarpeta}${idDependenciaQuery}&id_usuario=${id_usuario}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.documentos) {
          setDocumentos(data.documentos);
        }
      } catch (error) {
        console.error("Error al cargar los documentos:", error);
      } finally {
        setLoading(false);
      }
    };

    if (idCarpeta) fetchDocumentos();
  }, [idCarpeta, idDependencia, id_usuario]);

  // Manejadores de Mouse para la previsualización
  const handleMouseEnter = (doc) => {
    // Si el usuario deja el mouse quieto 400ms, mostramos la preview
    timerRef.current = setTimeout(() => {
      setPreview(doc);
    }, 400);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPreview(null);
  };

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleDocumentClick = async (documento) => {
    try {
      await fetch(`http://localhost:4001/api/documentos/uso/${documento.id_documento}`, {
        method: "PUT",
      });
      window.open(`http://localhost:4001/api/documentos/ver/${documento.id_documento}`, "_blank");
    } catch (error) {
      console.error("Error al registrar visualización:", error);
    }
  };

  const documentosFiltrados = documentos.filter((doc) =>
    doc.nombre_documento.toLowerCase().includes(busqueda.toLowerCase())
  );

  const documentosOrdenados = [...documentosFiltrados].sort((a, b) => {
    if (orden === "nombreAsc") return a.nombre_documento.localeCompare(b.nombre_documento);
    if (orden === "nombreDesc") return b.nombre_documento.localeCompare(a.nombre_documento);
    if (orden === "fechaAsc") return new Date(a.createdat) - new Date(b.createdat);
    if (orden === "fechaDesc") return new Date(b.createdat) - new Date(a.createdat);
    return 0;
  });

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return "Sin fecha";
    const fecha = new Date(fechaISO);
    return fecha.toLocaleString("es-ES", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <DocumentListContainer>
      <DocumentListTitle>Documentos</DocumentListTitle>

      <SearchInput
        type="text"
        placeholder="Buscar documento por nombre..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <TabsContainer>
        {["fechaDesc", "fechaAsc", "nombreAsc", "nombreDesc"].map((o) => (
          <TabButton key={o} active={orden === o} onClick={() => setOrden(o)}>
            {o === "fechaDesc" && "Más recientes"}
            {o === "fechaAsc" && "Más antiguos"}
            {o === "nombreAsc" && "Nombre A-Z"}
            {o === "nombreDesc" && "Nombre Z-A"}
          </TabButton>
        ))}
      </TabsContainer>

      {loading ? (
        <LoadingText>Cargando documentos...</LoadingText>
      ) : documentosOrdenados.length === 0 ? (
        <NoDocumentsText>No hay documentos disponibles.</NoDocumentsText>
      ) : (
        <DocumentGrid>
          {documentosOrdenados.map((documento, index) => (
            <DocumentCard 
              key={index} 
              onClick={() => handleDocumentClick(documento)}
              onMouseEnter={() => handleMouseEnter(documento)}
              onMouseLeave={handleMouseLeave}
              onMouseMove={handleMouseMove}
            >
              <DocumentLink>
                <DocumentIcon>
                  <FaFile size={48} />
                </DocumentIcon>
                <DocumentName>{documento.nombre_documento}</DocumentName>
                <DocumentAction>Ver archivo</DocumentAction>
                <DocumentDate>
                  Subido el {formatearFecha(documento.createdat)}
                </DocumentDate>
              </DocumentLink>
            </DocumentCard>
          ))}
        </DocumentGrid>
      )}

      {/* RENDER DE LA PREVISUALIZACIÓN FLOTANTE */}
      {preview && (
        <PreviewFloating x={mousePos.x} y={mousePos.y}>
          <PreviewHeader>Vista previa: {preview.nombre_documento}</PreviewHeader>
          <iframe 
            src={`http://localhost:4001/api/documentos/ver/${preview.id_documento}#toolbar=0&navpanes=0`} 
            title="preview"
          />
        </PreviewFloating>
      )}
    </DocumentListContainer>
  );
};

export default DocumentListUser;