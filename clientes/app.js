const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
app.use(express.json());

const configMysql = {
  host: process.env.MYSQL_HOST || "mysql-clientes",
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || "tienda",
  password: process.env.MYSQL_PASSWORD || "tienda123",
  database: process.env.MYSQL_DATABASE || "clientes_db",
  waitForConnections: true,
  connectionLimit: 10
};

let pool;

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function conectarMysqlConReintentos(intentos = 30, esperaMs = 2000) {
  for (let intento = 1; intento <= intentos; intento++) {
    try {
      const nuevoPool = mysql.createPool(configMysql);
      await nuevoPool.query("SELECT 1");
      console.log(`MySQL disponible (intento ${intento}/${intentos})`);
      return nuevoPool;
    } catch (error) {
      console.log(
        `Esperando MySQL (intento ${intento}/${intentos}): ${error.code || error.message}`
      );

      if (intento === intentos) {
        throw error;
      }

      await esperar(esperaMs);
    }
  }
}

async function inicializarBaseDeDatos() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clientes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(120) NOT NULL,
      email VARCHAR(180) NOT NULL UNIQUE,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(
    `INSERT IGNORE INTO clientes (id, nombre, email)
     VALUES (?, ?, ?), (?, ?, ?)`,
    [1, "Juan Pérez", "juan@gmail.com", 2, "Ana López", "ana@gmail.com"]
  );
}

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ servicio: "clientes", baseDeDatos: "mysql", estado: "ok" });
  } catch (error) {
    res.status(503).json({
      servicio: "clientes",
      baseDeDatos: "mysql",
      estado: "error"
    });
  }
});

app.get("/clientes", async (req, res) => {
  try {
    const [clientes] = await pool.query(
      "SELECT id, nombre, email, creado_en AS creadoEn FROM clientes ORDER BY id"
    );

    res.json(clientes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al consultar clientes" });
  }
});

app.get("/clientes/:id", async (req, res) => {
  try {
    const [clientes] = await pool.execute(
      "SELECT id, nombre, email, creado_en AS creadoEn FROM clientes WHERE id = ?",
      [req.params.id]
    );

    if (clientes.length === 0) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }

    res.json(clientes[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al consultar el cliente" });
  }
});

app.post("/clientes", async (req, res) => {
  const { nombre, email } = req.body;

  if (!nombre || !email) {
    return res.status(400).json({ mensaje: "nombre y email son obligatorios" });
  }

  try {
    const [resultado] = await pool.execute(
      "INSERT INTO clientes (nombre, email) VALUES (?, ?)",
      [nombre, email]
    );

    const [clientes] = await pool.execute(
      "SELECT id, nombre, email, creado_en AS creadoEn FROM clientes WHERE id = ?",
      [resultado.insertId]
    );

    res.status(201).json(clientes[0]);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ mensaje: "El email ya está registrado" });
    }

    console.error(error);
    res.status(500).json({ mensaje: "Error al crear el cliente" });
  }
});

async function iniciar() {
  try {
    pool = await conectarMysqlConReintentos();
    await inicializarBaseDeDatos();

    app.listen(3002, "0.0.0.0", () => {
      console.log("Microservicio Clientes + MySQL ejecutándose en puerto 3002");
    });
  } catch (error) {
    console.error("No fue posible iniciar Clientes después de varios intentos:", error);
    process.exit(1);
  }
}

iniciar();
