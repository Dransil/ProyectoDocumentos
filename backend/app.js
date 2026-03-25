const express = require('express');
const app = express();
const cors = require('cors');
const db = require('./db/db');
const path = require('path');

require('dotenv').config();

// Importar rutas
const dependenciasRoutes = require('./routes/dependencias');
const usuariosRoutes = require('./routes/usuarios');
const carpetasRoutes = require('./routes/carpetas'); 
const documentosRoutes = require('./routes/documentos');
const solicitudRoutes = require('./routes/solicitudes');
const clienteRoutes = require('./routes/clientes');

app.use(cors());
app.use(express.json());

app.get('/api/prueba', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ message: 'Conexión exitosa a PostgreSQL', server_time: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ message: 'Error conectándose a PostgreSQL', error: error.message });
  }
});

app.use('/api/dependencias', dependenciasRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/carpetas', carpetasRoutes);
app.use('/api/documentos', documentosRoutes);
app.use('/api/solicitudes', solicitudRoutes);
app.use('/api/clientes', clienteRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Servidor en el puerto ${PORT}`);
});
