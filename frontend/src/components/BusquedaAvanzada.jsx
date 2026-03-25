import React, { useState } from "react";
import styled from "styled-components";
import { FaSearch, FaFilePdf, FaCalendarAlt, FaUserTag, FaEraser } from "react-icons/fa";
import { toast } from "react-toastify";

const BusquedaAvanzada = ({ idDependencia }) => {
  const initialState = {
    nombre: "",
    fecha_inicio: "",
    fecha_fin: "",
    numero_cliente: "",
  };

  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState(initialState);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...filtros,
        id_dependencia: idDependencia || ""
      });
      const res = await fetch(`http://localhost:4001/api/documentos/busqueda/avanzada?${params}`);
      const data = await res.json();
      setResultados(data);
      if (data.length === 0) toast.info("No se encontraron documentos con esos criterios");
    } catch (error) {
      toast.error("Error al realizar la búsqueda");
    } finally {
      setLoading(false);
    }
  };

  // Función para limpiar filtros y resultados
  const handleClear = () => {
    setFiltros(initialState);
    setResultados([]);
    toast.info("Filtros limpiados");
  };

  const handleVerArchivo = (id) => {
    window.open(`http://localhost:4001/api/documentos/ver/${id}`, "_blank");
  };

  return (
    <SearchContainer>
      <FilterCard onSubmit={handleSearch}>
        <div className="row g-3">
          <div className="col-md-3">
            <Label><FaSearch /> Nombre</Label>
            <Input 
              type="text" 
              placeholder="Nombre del archivo..." 
              value={filtros.nombre}
              onChange={(e) => setFiltros({...filtros, nombre: e.target.value})}
            />
          </div>

          <div className="col-md-2">
            <Label><FaCalendarAlt /> Desde</Label>
            <Input 
              type="date" 
              value={filtros.fecha_inicio}
              onChange={(e) => setFiltros({...filtros, fecha_inicio: e.target.value})}
            />
          </div>

          <div className="col-md-2">
            <Label><FaCalendarAlt /> Hasta</Label>
            <Input 
              type="date" 
              value={filtros.fecha_fin}
              onChange={(e) => setFiltros({...filtros, fecha_fin: e.target.value})}
            />
          </div>

          <div className="col-md-3">
            <Label><FaUserTag /> ID Cliente (CLI-CI)</Label>
            <Input 
              type="text" 
              placeholder="Ej: CLI-12345" 
              value={filtros.numero_cliente}
              onChange={(e) => setFiltros({...filtros, numero_cliente: e.target.value})}
            />
          </div>

          <div className="col-md-2 d-flex align-items-end gap-2">
            <SearchButton type="submit" $loading={loading}>
              Filtrar
            </SearchButton>
            <ClearButton type="button" onClick={handleClear} title="Limpiar filtros">
              <FaEraser />
            </ClearButton>
          </div>
        </div>
      </FilterCard>

      <ResultsSection>
        {resultados.length > 0 ? (
          <div className="table-responsive">
            <Table>
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Cliente Asociado</th>
                  <th>Fecha de Registro</th>
                  <th style={{ textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((doc) => (
                  <tr key={doc.id_documento}>
                    <td>
                      <div className="d-flex align-items-center">
                        <FaFilePdf style={{ color: '#ef4444', marginRight: '12px', fontSize: '1.2rem' }} />
                        <strong>{doc.nombre_documento}</strong>
                      </div>
                    </td>
                    <td>
                      {doc.nombre_cliente ? (
                        <ClientBadge>{doc.numero_cliente} - {doc.nombre_cliente}</ClientBadge>
                      ) : (
                        <span className="text-muted" style={{ fontSize: '0.8rem' }}>Sin vinculación</span>
                      )}
                    </td>
                    <td>{new Date(doc.createdat).toLocaleDateString('es-ES')}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn btn-sm btn-primary" onClick={() => handleVerArchivo(doc.id_documento)}>
                        Abrir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ) : (
          !loading && <EmptyState>Ingresa los criterios y presiona "Filtrar" para ver los documentos.</EmptyState>
        )}
      </ResultsSection>
    </SearchContainer>
  );
};

export default BusquedaAvanzada;

// --- Estilos ---
const SearchContainer = styled.div` margin-top: 1rem; `;

const FilterCard = styled.form`
  background: white; padding: 1.5rem; border-radius: 16px;
  border: 1px solid #e2e8f0; margin-bottom: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const Label = styled.label`
  display: block; font-size: 0.75rem; font-weight: 700;
  color: #64748b; margin-bottom: 6px; text-transform: uppercase;
  svg { margin-right: 6px; color: #3b82f6; }
`;

const Input = styled.input`
  width: 100%; padding: 0.6rem 0.8rem; border-radius: 10px;
  border: 1px solid #cbd5e1; font-size: 0.9rem;
  &:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
`;

const SearchButton = styled.button`
  flex: 1; padding: 0.65rem; border-radius: 10px; border: none;
  background: #2563eb; color: white; font-weight: 600;
  transition: all 0.2s; opacity: ${p => p.$loading ? 0.7 : 1};
  &:hover { background: #1d4ed8; transform: translateY(-1px); }
`;

const ClearButton = styled.button`
  padding: 0.65rem 1rem; border-radius: 10px; border: 1px solid #e2e8f0;
  background: #f8fafc; color: #64748b; font-size: 1.1rem;
  transition: all 0.2s;
  &:hover { background: #f1f5f9; color: #ef4444; border-color: #fee2e2; }
`;

const ResultsSection = styled.div`
  background: white; border-radius: 16px; border: 1px solid #e2e8f0;
  overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
`;

const Table = styled.table`
  width: 100%; border-collapse: collapse;
  th { background: #f8fafc; padding: 1rem; text-align: left; font-size: 0.8rem; color: #64748b; text-transform: uppercase; }
  td { padding: 1rem; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; color: #1e293b; }
  tr:last-child td { border-bottom: none; }
  tr:hover { background: #f8fafc; }
`;

const ClientBadge = styled.span`
  background: #eff6ff; color: #1e40af; padding: 4px 10px;
  border-radius: 20px; font-size: 0.75rem; font-weight: 700;
  border: 1px solid #bfdbfe;
`;

const EmptyState = styled.div`
  padding: 4rem; text-align: center; color: #94a3b8; font-style: italic;
`;