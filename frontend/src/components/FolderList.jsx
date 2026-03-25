import React, { useState, useMemo } from "react";
import { FaFolder, FaFolderOpen } from "react-icons/fa";
import styled from "styled-components";

// --- Estilos base ---
const FolderListContainer = styled.div`
  border: 1px solid #ddd;
  padding: 2rem;
  border-radius: 8px;
  background-color: #fefefe;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const FolderListTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 1rem;
  color: #333;
`;

const SearchInput = styled.input`
  padding: 0.5rem 1rem;
  margin: 0 auto 1rem auto;
  display: block;
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
  background: #e9eef5;
  border-radius: 8px;
  padding: 0.5rem 1rem;
`;

const TabButton = styled.button`
  background: ${(props) => (props.active ? "#007bff" : "transparent")};
  color: ${(props) => (props.active ? "#fff" : "#333")};
  border: none;
  border-radius: 6px;
  padding: 0.4rem 1rem;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    color: #007bff;
    background: ${(props) => (props.active ? "#0056b3" : "#cfe3ff")};
  }
`;

const BreadcrumbNav = styled.nav`
  background: #f8fafc;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
`;

const BreadcrumbList = styled.ul`
  display: flex;
  align-items: center;
  list-style: none;
  padding: 0;
  margin: 0;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const BreadcrumbItem = styled.li`
  display: flex;
  align-items: center;
  font-size: 0.95rem;
  color: #64748b;

  &.active {
    color: #0f172a;
    font-weight: 600;
  }

  /* Botón invisible para el nombre de la carpeta */
  .breadcrumb-link {
    background: none;
    border: none;
    color: inherit;
    font-size: inherit;
    font-weight: inherit;
    padding: 0;
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
      color: #007bff;
      text-decoration: underline;
    }
  }

  &::before {
    content: "›";
    margin-right: 0.5rem;
    font-size: 1.2rem;
    color: #cbd5e1;
    display: ${(props) => (props.$isFirst ? "none" : "block")};
  }
`;

const GridContainer = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  padding: 0;
  list-style: none;
  margin: 0;
`;

const GridItem = styled.li`
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
    border-color: #007bff;
  }
`;

const FolderIcon = styled.div`
  color: #007bff;
  margin-bottom: 1rem;
`;

const FolderName = styled.p`
  font-size: 14px;
  color: #333;
  margin-bottom: 0.5rem;
`;

const FolderDate = styled.p`
  font-size: 0.75rem;
  color: #666;
  margin: 0;
`;

// --- Nuevo estilo para el mensaje de vacío ---
const EmptyMessage = styled.div`
  grid-column: 1 / -1; 
  text-align: center;
  padding: 3rem;
  color: #888;
  font-style: italic;
  background: #f9f9f9;
  border-radius: 12px;
  border: 2px dashed #ddd;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
`;
const BackButton = styled.button`
  background: white;
  color: #1e293b;
  border: 1px solid #cbd5e1;
  padding: 0.4rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  margin-right: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);

  &:hover {
    background: #f1f5f9;
    border-color: #94a3b8;
    transform: translateX(-3px);
  }

  &:active {
    transform: scale(0.95);
  }
`;
const RootIcon = styled.span`
  display: flex;
  align-items: center;
  gap: 5px;
  color: #007bff;
  font-weight: 500;
`;

// --- Componente principal ---
const FolderList = ({ carpetas = [], setParentId }) => {
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState("fechaDesc");

  const filteredFolders = carpetas.filter(
    (folder) =>
      folder.id_padre === currentFolderId &&
      folder.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const sortedFolders = [...filteredFolders].sort((a, b) => {
    if (orden === "nombreAsc") return a.nombre.localeCompare(b.nombre);
    if (orden === "nombreDesc") return b.nombre.localeCompare(a.nombre);
    if (orden === "fechaAsc") return new Date(a.fecha_creacion) - new Date(b.fecha_creacion);
    if (orden === "fechaDesc") return new Date(b.fecha_creacion) - new Date(a.fecha_creacion);
    return 0;
  });
  const jumpToFolder = (index) => {
    if (index === -1) {
      // Volver a la raíz
      setBreadcrumb([]);
      setCurrentFolderId(null);
      setParentId(null);
    } else {
      const newBreadcrumb = breadcrumb.slice(0, index + 1);
      const targetFolder = newBreadcrumb[index];

      setBreadcrumb(newBreadcrumb);
      setCurrentFolderId(targetFolder.id_carpeta);
      setParentId(targetFolder.id_carpeta);
    }
  };
  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return "Sin fecha";
    const fecha = new Date(fechaISO.replace(" ", "T"));
    if (isNaN(fecha.getTime())) return "Fecha inválida";
    return fecha.toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleFolderClick = async (folder) => {
    try {
      await fetch(`http://localhost:4001/api/carpetas/uso/${folder.id_carpeta}`, {
        method: "PUT",
      });
    } catch (error) {
      console.error("Error al incrementar uso:", error);
    }
    setBreadcrumb((prev) => [...prev, folder]);
    setCurrentFolderId(folder.id_carpeta);
    setParentId(folder.id_carpeta);
  };

  const handleBackClick = () => {
    if (breadcrumb.length > 0) {
      const newBreadcrumb = [...breadcrumb];
      newBreadcrumb.pop();
      const previousFolderId =
        newBreadcrumb.length > 0 ? newBreadcrumb[newBreadcrumb.length - 1].id_carpeta : null;
      setBreadcrumb(newBreadcrumb);
      setCurrentFolderId(previousFolderId);
      setParentId(previousFolderId);
    }
  };

  return (
    <FolderListContainer>
      <FolderListTitle>Explorador de Carpetas</FolderListTitle>

      <SearchInput
        type="text"
        placeholder="Buscar carpeta por nombre..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <TabsContainer>
        <TabButton active={orden === "fechaDesc"} onClick={() => setOrden("fechaDesc")}>
          Más recientes
        </TabButton>
        <TabButton active={orden === "fechaAsc"} onClick={() => setOrden("fechaAsc")}>
          Más antiguas
        </TabButton>
        <TabButton active={orden === "nombreAsc"} onClick={() => setOrden("nombreAsc")}>
          Nombre A-Z
        </TabButton>
        <TabButton active={orden === "nombreDesc"} onClick={() => setOrden("nombreDesc")}>
          Nombre Z-A
        </TabButton>
      </TabsContainer>

      <BreadcrumbNav>
        {breadcrumb.length > 0 && (
          <BackButton onClick={handleBackClick}>
            <i className="bi bi-arrow-left"></i> Atrás
          </BackButton>
        )}

        <BreadcrumbList>
          {/* Inicio es clickable para volver a la raíz directamente */}
          <BreadcrumbItem $isFirst={true} className={breadcrumb.length === 0 ? "active" : ""}>
            <button className="breadcrumb-link" onClick={() => jumpToFolder(-1)}>
              <RootIcon>
                <i className="bi bi-house-door"></i> Inicio
              </RootIcon>
            </button>
          </BreadcrumbItem>

          {breadcrumb.map((folder, index) => {
            const isLast = index === breadcrumb.length - 1;
            return (
              <BreadcrumbItem key={folder.id_carpeta} className={isLast ? "active" : ""}>
                {isLast ? (
                  folder.nombre // La última no es clickable porque ya estamos ahí
                ) : (
                  <button className="breadcrumb-link" onClick={() => jumpToFolder(index)}>
                    {folder.nombre}
                  </button>
                )}
              </BreadcrumbItem>
            );
          })}
        </BreadcrumbList>
      </BreadcrumbNav>

      <GridContainer>
        {sortedFolders.length > 0 ? (
          sortedFolders.map((folder) => (
            <GridItem key={folder.id_carpeta} onClick={() => handleFolderClick(folder)}>
              <FolderIcon>
                <FaFolder size={40} />
              </FolderIcon>
              <FolderName>{folder.nombre}</FolderName>
              <FolderDate>Creada el {formatearFecha(folder.fecha_creacion)}</FolderDate>
            </GridItem>
          ))
        ) : (
          <EmptyMessage>
            <FaFolderOpen size={48} color="#ccc" />
            {busqueda
              ? `No se encontraron resultados para "${busqueda}"`
              : "No hay carpetas en este directorio."}
          </EmptyMessage>
        )}
      </GridContainer>
    </FolderListContainer>
  );
};

export default FolderList;