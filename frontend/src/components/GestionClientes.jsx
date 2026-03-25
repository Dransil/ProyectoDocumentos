import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { FaEdit, FaTrash, FaUserPlus, FaSearch, FaIdCard } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";

const GestionClientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("add"); 
  const [selectedCliente, setSelectedCliente] = useState(null);

  const [formData, setFormData] = useState({
    nombre_completo: "",
    ci_nit: "",
    telefono: ""
  });

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4001/api/clientes");
      const data = await res.json();
      setClientes(data || []);
    } catch (error) {
      toast.error("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const openModal = (type, cliente = null) => {
    setModalType(type);
    setSelectedCliente(cliente);
    if (type === "edit" && cliente) {
      setFormData({
        nombre_completo: cliente.nombre_completo,
        ci_nit: cliente.ci_nit || "",
        telefono: cliente.telefono || ""
      });
    } else {
      setFormData({ nombre_completo: "", ci_nit: "", telefono: "" });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedCliente(null);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- Operación Guardar (POST/PUT) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEdit = modalType === "edit";
    
    // Lógica automática: CLI- + el valor del CI/NIT ingresado
    const dataFinal = {
      ...formData,
      numero_cliente: `CLI-${formData.ci_nit}`
    };

    const url = isEdit 
      ? `http://localhost:4001/api/clientes/modificar/${selectedCliente.id_cliente}`
      : "http://localhost:4001/api/clientes/agregar";
    
    const idToast = toast.loading(isEdit ? "Actualizando datos..." : "Registrando cliente...");

    try {
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataFinal),
      });

      const data = await res.json();

      if (res.ok) {
        toast.update(idToast, { 
          render: `Cliente ${formData.nombre_completo} guardado con ID: ${dataFinal.numero_cliente}`, 
          type: "success", 
          isLoading: false, 
          autoClose: 4000 
        });
        fetchClientes();
        closeModal();
      } else {
        throw new Error(data.message || "Error en la operación");
      }
    } catch (error) {
      toast.update(idToast, { render: error.message, type: "error", isLoading: false, autoClose: 3000 });
    }
  };

  const handleDelete = async () => {
    const idToast = toast.loading("Eliminando registro...");
    try {
      const res = await fetch(`http://localhost:4001/api/clientes/eliminar/${selectedCliente.id_cliente}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.update(idToast, { render: "Cliente eliminado", type: "success", isLoading: false, autoClose: 3000 });
        fetchClientes();
        closeModal();
      } else {
        const data = await res.json();
        throw new Error(data.message);
      }
    } catch (error) {
      toast.update(idToast, { render: error.message, type: "error", isLoading: false, autoClose: 3000 });
    }
  };

  const filteredClientes = clientes.filter((c) =>
    c.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.ci_nit?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container>
      <ToastContainer theme="colored" position="bottom-right" />

      <HeaderSection>
        <div>
          <h3>Gestión de Clientes</h3>
          <p className="text-muted">El sistema genera automáticamente el ID basado en el CI/NIT.</p>
        </div>
        <Button onClick={() => openModal("add")} $primary>
          <FaUserPlus /> Nuevo Registro
        </Button>
      </HeaderSection>

      <SearchWrapper>
        <FaSearch />
        <SearchInput
          type="text"
          placeholder="Buscar por nombre o CI..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </SearchWrapper>

      <TableWrapper>
        <Table>
          <thead>
            <tr>
              <th>ID Sistema</th>
              <th>Nombre Completo</th>
              <th>CI / NIT</th>
              <th>Teléfono</th>
              <th style={{ textAlign: "center" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: "center" }}>Cargando registros...</td></tr>
            ) : filteredClientes.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: "center" }}>No hay clientes registrados</td></tr>
            ) : (
              filteredClientes.map((c) => (
                <tr key={c.id_cliente}>
                  <td><Badge>{c.numero_cliente}</Badge></td>
                  <td><strong>{c.nombre_completo}</strong></td>
                  <td>{c.ci_nit}</td>
                  <td>{c.telefono || "---"}</td>
                  <td>
                    <ActionButtons>
                      <IconButton onClick={() => openModal("edit", c)} $edit><FaEdit /></IconButton>
                      <IconButton onClick={() => openModal("delete", c)} $delete><FaTrash /></IconButton>
                    </ActionButtons>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </TableWrapper>

      {modalOpen && (
        <ModalOverlay onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h4>{modalType === "add" ? "Nuevo Cliente" : modalType === "edit" ? "Editar Cliente" : "Eliminar"}</h4>
              <button onClick={closeModal}>&times;</button>
            </ModalHeader>

            <ModalBody>
              {modalType === "delete" ? (
                <p>¿Borrar a <strong>{selectedCliente?.nombre_completo}</strong>?</p>
              ) : (
                <Form onSubmit={handleSubmit} id="clienteForm">
                  <FormGroup>
                    <label>Nombre Completo</label>
                    <Input name="nombre_completo" value={formData.nombre_completo} onChange={handleInputChange} required />
                  </FormGroup>
                  <FormGroup>
                    <label>CI / NIT (Será el ID del sistema)</label>
                    <Input name="ci_nit" value={formData.ci_nit} onChange={handleInputChange} placeholder="Sin puntos ni guiones" required />
                  </FormGroup>
                  <FormGroup>
                    <label>Teléfono</label>
                    <Input name="telefono" value={formData.telefono} onChange={handleInputChange} />
                  </FormGroup>
                  
                  {/* Vista previa del ID generado */}
                  <IDPreview>
                    <FaIdCard /> ID a generar: <strong>CLI-{formData.ci_nit || "..."}</strong>
                  </IDPreview>
                </Form>
              )}
            </ModalBody>

            <ModalFooter>
              <Button onClick={closeModal}>Cerrar</Button>
              {modalType === "delete" ? (
                <Button onClick={handleDelete} $danger>Confirmar</Button>
              ) : (
                <Button type="submit" form="clienteForm" $primary>Guardar</Button>
              )}
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default GestionClientes;

// --- Estilos ---
const Container = styled.div` margin-top: 1rem; `;
const HeaderSection = styled.div` display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; `;
const SearchWrapper = styled.div` position: relative; display: flex; align-items: center; margin-bottom: 1.5rem; svg { position: absolute; left: 15px; color: #94a3b8; } `;
const SearchInput = styled.input` width: 100%; padding: 0.8rem 1rem 0.8rem 2.8rem; border-radius: 12px; border: 1px solid #e2e8f0; `;
const TableWrapper = styled.div` background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; `;
const Table = styled.table` width: 100%; border-collapse: collapse; thead { background: #f8fafc; } th, td { padding: 1rem; font-size: 0.9rem; } tr:not(:last-child) { border-bottom: 1px solid #f1f5f9; } `;
const Badge = styled.span` background: #eff6ff; color: #1e40af; padding: 4px 10px; border-radius: 8px; font-weight: 700; font-size: 0.75rem; border: 1px solid #bfdbfe; `;
const ActionButtons = styled.div` display: flex; gap: 8px; justify-content: center; `;
const IconButton = styled.button` border: none; padding: 8px; border-radius: 8px; cursor: pointer; background: ${p => p.$edit ? "#e0f2fe" : "#fee2e2"}; color: ${p => p.$edit ? "#0369a1" : "#b91c1c"}; `;
const Button = styled.button` padding: 0.7rem 1.4rem; border-radius: 10px; border: none; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; background: ${p => p.$primary ? "#2563eb" : p.$danger ? "#dc2626" : "#e2e8f0"}; color: ${p => p.$primary || p.$danger ? "white" : "#1e293b"}; `;
const ModalOverlay = styled.div` position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 2000; `;
const ModalContent = styled.div` background: white; width: 450px; border-radius: 20px; overflow: hidden; `;
const ModalHeader = styled.div` padding: 1.2rem; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; h4 { margin: 0; } button { background: none; border: none; font-size: 1.5rem; cursor: pointer; } `;
const ModalBody = styled.div` padding: 1.5rem; `;
const ModalFooter = styled.div` padding: 1rem; background: #f8fafc; display: flex; justify-content: flex-end; gap: 10px; `;
const Form = styled.form` display: flex; flex-direction: column; gap: 15px; `;
const FormGroup = styled.div` display: flex; flex-direction: column; label { font-size: 0.8rem; font-weight: 600; color: #64748b; margin-bottom: 4px; } `;
const Input = styled.input` padding: 0.7rem; border-radius: 8px; border: 1px solid #cbd5e1; `;
const IDPreview = styled.div` margin-top: 10px; padding: 10px; background: #f0fdf4; border-radius: 8px; color: #166534; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; border: 1px solid #bbf7d0; `;