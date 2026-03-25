import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const SubirArchivo = ({ idUsuario, idCarpeta, fetchDocumentos }) => {
  const [dependencias, setDependencias] = useState([]);
  const [nombreDocumento, setNombreDocumento] = useState('');
  const [ruta_fisica, setRuta_fisica] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [errorArchivo, setErrorArchivo] = useState('');

  useEffect(() => {
    const fetchDependencias = async () => {
      try {
        const response = await fetch('http://localhost:4001/api/dependencias/');
        const data = await response.json();
        setDependencias(data);
      } catch (error) {
        console.error('Error al cargar las dependencias:', error);
      }
    };
    fetchDependencias();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setArchivo(file);
        setErrorArchivo('');
      } else {
        setArchivo(null);
        setErrorArchivo('Solo se permiten archivos PDF');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!archivo) {
      alert('Selecciona un archivo válido antes de subirlo');
      return;
    }

    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('nombre_documento', nombreDocumento);
    formData.append('id_dependencia', e.target.id_dependencia.value);
    formData.append('id_carpeta', idCarpeta);
    formData.append('id_usuario', idUsuario);
    formData.append('ruta_fisica', ruta_fisica);

    try {
      const response = await fetch('http://localhost:4001/api/documentos/agregar', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert('Documento subido exitosamente');
        fetchDocumentos();
        setNombreDocumento('');
        setRuta_fisica('');
        setArchivo(null);
      } else {
        alert('Error al subir el documento');
      }
    } catch (error) {
      console.error('Error al subir el documento:', error);
    }
  };

  return (
    <Container>
      <FormContainer onSubmit={handleSubmit}>
        <h3>Subir un nuevo documento</h3>

        <Input
          type="text"
          placeholder="Nombre del Documento"
          value={nombreDocumento}
          onChange={(e) => setNombreDocumento(e.target.value)}
          required
        />

        <Input
          type="text"
          placeholder="Ruta física"
          value={ruta_fisica}
          onChange={(e) => setRuta_fisica(e.target.value)}
          required
        />

        <InputFileWrapper>
          <label>Seleccionar archivo</label>
          <InputFile type="file" onChange={handleFileChange} required />
          {errorArchivo && <ErrorText>{errorArchivo}</ErrorText>}
        </InputFileWrapper>

        <Select name="id_dependencia" required>
          <option value="">Selecciona una dependencia</option>
          {dependencias.map((dependencia) => (
            <option key={dependencia.id_dependencia} value={dependencia.id_dependencia}>
              {dependencia.nombre_dependencia}
            </option>
          ))}
        </Select>

        <Button primary type="submit">Subir Documento</Button>
      </FormContainer>
    </Container>
  );
};

export default SubirArchivo;

// Estilos del container
const Container = styled.div`
  margin-top: 1rem;
  font-family: 'Arial', sans-serif;
  color: #333;
`;

const FormContainer = styled.form`
  margin-top: 1rem;
  padding: 1.5rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(15px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
`;

const Input = styled.input`
  width: 100%;
  padding: 0.6rem 0.8rem;
  margin-bottom: 1rem;
  border: none;
  border-radius: 12px;
  background: rgba(255,255,255,0.8);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.08);
  font-size: 1rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    background: #fff;
    box-shadow: 0 0 8px rgba(33, 150, 243, 0.5);
  }
`;

const InputFileWrapper = styled.div`
  margin-bottom: 1rem;
`;

const InputFile = styled.input`
  display: block;
  margin-top: 0.3rem;
`;

const ErrorText = styled.p`
  color: #d32f2f;
  font-size: 0.85rem;
  margin-top: 0.3rem;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.6rem 0.8rem;
  margin-bottom: 1rem;
  border: none;
  border-radius: 12px;
  background: rgba(255,255,255,0.8);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.08);
  font-size: 1rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    background: #fff;
    box-shadow: 0 0 8px rgba(33, 150, 243, 0.5);
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
