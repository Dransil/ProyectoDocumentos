import React, { useState } from "react";
import styled from "styled-components";

const CreateFolder = ({ userId, parentId, fetchFolders }) => {
  const [folderName, setFolderName] = useState("");
  const [estadoMensaje, setEstadoMensaje] = useState("");

  const handleCreateFolder = async () => {
    if (!folderName) {
      setEstadoMensaje("El nombre de la carpeta no puede estar vacío.");
      return;
    }

    const folderData = {
      nombre: folderName,
      id_usuario: userId,
      id_padre: parentId,
    };

    try {
      const response = await fetch("http://localhost:4001/api/carpetas/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(folderData),
      });

      if (response.ok) {
        setEstadoMensaje(`Carpeta "${folderName}" creada exitosamente!`);
        setFolderName("");
        fetchFolders();
      } else {
        const errorData = await response.json();
        setEstadoMensaje(errorData.message || "No se pudo crear la carpeta.");
      }
    } catch (error) {
      console.error("Error al crear la carpeta:", error);
      setEstadoMensaje("Error al crear la carpeta. Inténtalo de nuevo.");
    }
  };

  return (
    <Container>
      <Card>
        <h4>Crear Carpeta</h4>
        <InputGroup>
          <Input
            type="text"
            placeholder="Nombre de la carpeta"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
          />
          <Button primary onClick={handleCreateFolder}>
            Crear carpeta
          </Button>
        </InputGroup>

        {estadoMensaje && (
          <Alert success={!estadoMensaje.toLowerCase().includes("error")}>
            {estadoMensaje}
          </Alert>
        )}
      </Card>
    </Container>
  );
};

export default CreateFolder;

// Styled Components
const Container = styled.div`
  margin-top: 1rem;
  display: flex;
  justify-content: center;
`;

const Card = styled.div`
  width: 100%;
  max-width: 100%;
  padding: 1.5rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(15px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  text-align: center;
`;

const InputGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
`;

const Input = styled.input`
  flex: 1;
  padding: 0.6rem 0.8rem;
  border: none;
  border-radius: 12px;
  background: rgba(255,255,255,0.8);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.08);
  font-size: 1rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    background: #fff;
    box-shadow: 0 0 8px rgba(33,150,243,0.5);
  }
`;

const Button = styled.button`
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 500;
  font-size: 1rem;
  color: ${(props) => (props.primary ? 'white' : '#333')};
  background: ${(props) => (props.primary ? 'linear-gradient(90deg, #1565c0, #42a5f5)' : 'rgba(255,255,255,0.8)')};
  box-shadow: ${(props) => (props.primary ? '0 4px 12px rgba(0,0,0,0.2)' : '0 2px 6px rgba(0,0,0,0.1)')};
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    background: ${(props) => (props.primary ? 'linear-gradient(90deg, #0d47a1, #1e88e5)' : 'rgba(255,255,255,0.95)')};
  }
`;

const Alert = styled.div`
  padding: 0.6rem 0.8rem;
  margin-top: 1rem;
  border-radius: 12px;
  font-size: 0.95rem;
  color: ${(props) => (props.success ? '#155724' : '#721c24')};
  background-color: ${(props) => (props.success ? '#d4edda' : '#f8d7da')};
  border: 1px solid ${(props) => (props.success ? '#c3e6cb' : '#f5c6cb')};
  text-align: center;
`;
