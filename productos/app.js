const express = require("express");
const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const app = express();
app.use(express.json());

const databasePath = process.env.DATABASE_PATH || path.join(__dirname, "data", "productos.db");
fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const db = new DatabaseSync(databasePath);

db.exec(`
  CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    precio REAL NOT NULL CHECK (precio >= 0),
    creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

const cantidad = db.prepare("SELECT COUNT(*) AS total FROM productos").get().total;

if (cantidad === 0) {
  const insertar = db.prepare("INSERT INTO productos (nombre, precio) VALUES (?, ?)");
  insertar.run("Laptop", 15000);
  insertar.run("Mouse", 500);
}

app.get("/health", (req, res) => {
  try {
    db.prepare("SELECT 1").get();
    res.json({ servicio: "productos", baseDeDatos: "sqlite", estado: "ok" });
  } catch (error) {
    res.status(503).json({ servicio: "productos", estado: "error" });
  }
});

app.get("/productos", (req, res) => {
  const productos = db
    .prepare("SELECT id, nombre, precio, creado_en AS creadoEn FROM productos ORDER BY id")
    .all();

  res.json(productos);
});

app.get("/productos/:id", (req, res) => {
  const producto = db
    .prepare("SELECT id, nombre, precio, creado_en AS creadoEn FROM productos WHERE id = ?")
    .get(req.params.id);

  if (!producto) {
    return res.status(404).json({ mensaje: "Producto no encontrado" });
  }

  res.json(producto);
});

app.post("/productos", (req, res) => {
  const { nombre, precio } = req.body;
  const precioNumero = Number(precio);

  if (!nombre || !Number.isFinite(precioNumero) || precioNumero < 0) {
    return res.status(400).json({ mensaje: "nombre y precio válido son obligatorios" });
  }

  const resultado = db
    .prepare("INSERT INTO productos (nombre, precio) VALUES (?, ?)")
    .run(nombre, precioNumero);

  const producto = db
    .prepare("SELECT id, nombre, precio, creado_en AS creadoEn FROM productos WHERE id = ?")
    .get(resultado.lastInsertRowid);

  res.status(201).json(producto);
});

app.listen(3001, () => {
  console.log(`Microservicio Productos + SQLite ejecutándose en puerto 3001 (${databasePath})`);
});
