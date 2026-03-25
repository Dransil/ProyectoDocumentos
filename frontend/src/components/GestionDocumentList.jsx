import React, { useState, useEffect } from "react";
import styled from "styled-components";

const GestionDocumentList = ({ idDependencia }) => {
  const [documentos, setDocumentos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocumento, setSelectedDocumento] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchUsuario, setSearchUsuario] = useState("");
  const [formData, setFormData] = useState({
    nombre_documento: "",
    estado: "publico",
    usuarios_prohibidos: [], // Internamente sigue siendo este nombre por la BD
    ruta_fisica: "",
    archivo: null,
  });

  // Carga de datos inicial
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const documentosRes = await fetch(
          `http://localhost:4001/api/documentos/?id_dependencia=${idDependencia}`
        );
        const documentosData = await documentosRes.json();
        setDocumentos(documentosData.documentos || []);

        const usuariosRes = await fetch(
          `http://localhost:4001/api/dependencias/${idDependencia}/usuarios`
        );
        const usuariosData = await usuariosRes.json();
        setUsuarios(usuariosData || []);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };

    if (idDependencia) fetchData();
  }, [idDependencia]);

  const handleDocumentoClick = (documento) => {
    setSelectedDocumento(documento);
    setFormData({
      nombre_documento: documento.nombre_documento,
      estado: documento.estado,
      usuarios_prohibidos: documento.usuarios_prohibidos || [],
      ruta_fisica: documento.ruta_fisica,
      archivo: null,
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, archivo: e.target.files[0] });
  };

  // Lógica de "Permitidos" (Whitelist)
  const handleAddUsuario = (usuarioId) => {
    if (!formData.usuarios_prohibidos.includes(usuarioId)) {
      setFormData((prev) => ({
        ...prev,
        usuarios_prohibidos: [...prev.usuarios_prohibidos, usuarioId],
      }));
    }
  };

  const handleRemoveUsuario = (usuarioId) => {
    setFormData((prev) => ({
      ...prev,
      usuarios_prohibidos: prev.usuarios_prohibidos.filter((id) => id !== usuarioId),
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    formDataToSend.append("nombre_documento", formData.nombre_documento);
    formDataToSend.append("estado", formData.estado);
    // Se envía como string para que el backend lo procese como integer[]
    formDataToSend.append("usuarios_prohibidos", formData.usuarios_prohibidos.join(","));
    formDataToSend.append("ruta_fisica", formData.ruta_fisica);
    if (formData.archivo) formDataToSend.append("archivo", formData.archivo);

    try {
      const res = await fetch(
        `http://localhost:4001/api/documentos/modificar/${selectedDocumento.id_documento}`,
        {
          method: "PUT",
          body: formDataToSend,
        }
      );
      if (res.ok) {
        alert("Configuración de acceso actualizada");
        setDocumentos((prev) =>
          prev.map((doc) =>
            doc.id_documento === selectedDocumento.id_documento
              ? { ...doc, ...formData }
              : doc
          )
        );
        setSelectedDocumento(null);
      } else {
        const errorData = await res.json();
        console.error("Error al modificar:", errorData.message);
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
    }
  };

  const filteredDocumentos = documentos.filter((doc) =>
    doc.nombre_documento.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsuarios = usuarios.filter(
    (usuario) =>
      !formData.usuarios_prohibidos.includes(usuario.id_usuario) &&
      (usuario.nombre_usuario || "").toLowerCase().includes(searchUsuario.toLowerCase())
  );

  return (
    <Container>
      <h3>Gestión de Accesos y Permisos</h3>
      <SearchInput
        type="text"
        placeholder="Buscar documento en la dependencia..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {loading ? (
        <p>Cargando documentos...</p>
      ) : filteredDocumentos.length === 0 ? (
        <p>No se encontraron documentos en esta sección.</p>
      ) : (
        <ButtonGrid>
          {filteredDocumentos.map((documento) => (
            <Button
              key={documento.id_documento}
              onClick={() => handleDocumentoClick(documento)}
            >
              {documento.nombre_documento}
            </Button>
          ))}
        </ButtonGrid>
      )}

      {selectedDocumento && (
        <FormContainer onSubmit={handleFormSubmit}>
          <HeaderRow>
            <h4>Permisos: {selectedDocumento.nombre_documento}</h4>
            <CloseBtn type="button" onClick={() => setSelectedDocumento(null)}>×</CloseBtn>
          </HeaderRow>

          <label>Título del Documento</label>
          <Input
            type="text"
            name="nombre_documento"
            value={formData.nombre_documento}
            onChange={handleInputChange}
            required
          />

          <label>Nivel de Visibilidad</label>
          <Select name="estado" value={formData.estado} onChange={handleInputChange}>
            <option value="publico">Público (Solo los de la lista blanca)</option>
            <option value="privado">Privado (Solo Administradores)</option>
          </Select>

          <Divider />

          <h5><strong style={{ color: '#1b5e20' }}>✓ Usuarios con Acceso Permitido</strong></h5>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
            Añade a los usuarios que tendrán autorización para visualizar este archivo.
          </p>

          <SearchInput
            type="text"
            placeholder="Escribe el nombre del usuario..."
            value={searchUsuario}
            onChange={(e) => setSearchUsuario(e.target.value)}
          />

          <UserScrollArea>
            {filteredUsuarios.length > 0 ? (
              filteredUsuarios.map((u) => (
                <UserItem key={u.id_usuario}>
                  <span>{u.nombre_usuario}</span>
                  <ActionButton type="button" $mode="add" onClick={() => handleAddUsuario(u.id_usuario)}>
                    Dar Acceso
                  </ActionButton>
                </UserItem>
              ))
            ) : (
              <p style={{ fontSize: '0.85rem', textAlign: 'center', color: '#94a3b8' }}>No hay más usuarios disponibles</p>
            )}
          </UserScrollArea>

          <h5 className="mt-4"><strong>Acceso Concedido a:</strong></h5>
          <UserScrollArea style={{ background: '#f0fdf4', border: '1px solid #dcfce7' }}>
            {formData.usuarios_prohibidos.length > 0 ? (
              formData.usuarios_prohibidos.map((id) => (
                <UserItem key={id}>
                  <span style={{ fontWeight: '600' }}>
                    {usuarios.find((u) => u.id_usuario === id)?.nombre_usuario || `Usuario ${id}`}
                  </span>
                  <ActionButton type="button" $mode="remove" onClick={() => handleRemoveUsuario(id)}>
                    Quitar Acceso
                  </ActionButton>
                </UserItem>
              ))
            ) : (
              <p style={{ fontSize: '0.85rem', textAlign: 'center', color: '#ef4444' }}>
                Atención: Nadie tiene acceso permitido actualmente.
              </p>
            )}
          </UserScrollArea>

          <Divider />

          <label>Localización Física (Archivo)</label>
          <Input
            type="text"
            name="ruta_fisica"
            value={formData.ruta_fisica}
            onChange={handleInputChange}
            placeholder="Ej: Estante A, Fila 3"
          />

          <label>Reemplazar archivo digital (opcional)</label>
          <Input type="file" name="archivo" onChange={handleFileChange} />

          <FormActions>
            <Button type="submit" $primary>
              Guardar Cambios
            </Button>
            <Button type="button" onClick={() => setSelectedDocumento(null)}>
              Cancelar
            </Button>
          </FormActions>
        </FormContainer>
      )}
    </Container>
  );
};

export default GestionDocumentList;

// --- Estilos ---

const Container = styled.div`
  margin-top: 1rem;
`;

const Divider = styled.hr`
  margin: 1.5rem 0;
  border: 0;
  border-top: 1px solid #e2e8f0;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #94a3b8;
  &:hover { color: #ef4444; }
`;

const UserScrollArea = styled.div`
  max-height: 180px;
  overflow-y: auto;
  padding: 0.8rem;
  background: #f8fafc;
  border-radius: 10px;
  margin-bottom: 1rem;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.7rem;
  margin-bottom: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  &:focus { outline: none; border-color: #3b82f6; }
`;

const ButtonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 15px;
`;

const Button = styled.button`
  padding: 0.7rem;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  background: ${(props) => (props.$primary ? '#2563eb' : '#fff')};
  color: ${(props) => (props.$primary ? 'white' : '#1e293b')};
  border: ${(props) => (props.$primary ? 'none' : '1px solid #e2e8f0')};

  &:hover {
    background: ${(props) => (props.$primary ? '#1d4ed8' : '#f1f5f9')};
  }
`;

const ActionButton = styled.button`
  padding: 0.3rem 0.8rem;
  border-radius: 6px;
  border: none;
  font-size: 0.8rem;
  cursor: pointer;
  background: ${(props) => (props.$mode === 'add' ? '#dcfce7' : '#fee2e2')};
  color: ${(props) => (props.$mode === 'add' ? '#166534' : '#991b1b')};
  &:hover { opacity: 0.8; }
`;

const FormContainer = styled.form`
  margin-top: 2rem;
  padding: 2.5rem;
  border-radius: 20px;
  background: white;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  border: 1px solid #f1f5f9;

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: #475569;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.7rem;
  margin-bottom: 1.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.7rem;
  margin-bottom: 1.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
`;

const UserItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: white;
  border-radius: 8px;
  margin-bottom: 0.4rem;
  border: 1px solid #f1f5f9;
`;