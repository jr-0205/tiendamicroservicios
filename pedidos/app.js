const express = require("express");
const { MongoClient } = require("mongodb");

const app = express();
app.use(express.json());

const URL_CLIENTES = process.env.CLIENTES_URL || "http://clientes:3002";
const URL_PRODUCTOS = process.env.PRODUCTOS_URL || "http://productos:3001";
const MONGO_URL = process.env.MONGO_URL || "mongodb://mongo-pedidos:27017";
const MONGO_DB = process.env.MONGO_DB || "pedidos_db";

const mongo = new MongoClient(MONGO_URL);
let pedidos;

function serializarPedido(documento) {
  return {
    id: documento._id.toString(),
    clienteId: documento.clienteId,
    productoId: documento.productoId,
    cliente: documento.cliente,
    producto: documento.producto,
    cantidad: documento.cantidad,
    precioUnitario: documento.precioUnitario,
    total: documento.total,
    creadoEn: documento.creadoEn
  };
}

app.get("/health", async (req, res) => {
  try {
    await mongo.db("admin").command({ ping: 1 });
    res.json({ servicio: "pedidos", baseDeDatos: "mongodb", estado: "ok" });
  } catch (error) {
    res.status(503).json({ servicio: "pedidos", estado: "error" });
  }
});

app.get("/pedidos", async (req, res) => {
  try {
    const documentos = await pedidos.find({}).sort({ creadoEn: -1 }).toArray();
    res.json(documentos.map(serializarPedido));
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al consultar pedidos" });
  }
});

app.post("/pedidos", async (req, res) => {
  try {
    const clienteId = Number(req.body.clienteId);
    const productoId = Number(req.body.productoId);
    const cantidad = Number(req.body.cantidad);

    if (
      !Number.isInteger(clienteId) ||
      !Number.isInteger(productoId) ||
      !Number.isInteger(cantidad) ||
      cantidad <= 0
    ) {
      return res.status(400).json({
        mensaje: "clienteId, productoId y cantidad deben ser enteros válidos"
      });
    }

    const respuestaCliente = await fetch(`${URL_CLIENTES}/clientes/${clienteId}`);

    if (!respuestaCliente.ok) {
      return res.status(404).json({ mensaje: "El cliente no existe" });
    }

    const cliente = await respuestaCliente.json();

    const respuestaProducto = await fetch(`${URL_PRODUCTOS}/productos/${productoId}`);

    if (!respuestaProducto.ok) {
      return res.status(404).json({ mensaje: "El producto no existe" });
    }

    const producto = await respuestaProducto.json();
    const total = Number(producto.precio) * cantidad;

    const documento = {
      clienteId,
      productoId,
      cliente: cliente.nombre,
      producto: producto.nombre,
      cantidad,
      precioUnitario: Number(producto.precio),
      total,
      creadoEn: new Date()
    };

    const resultado = await pedidos.insertOne(documento);

    res.status(201).json({
      mensaje: "Pedido creado y guardado correctamente",
      pedido: serializarPedido({ ...documento, _id: resultado.insertedId })
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al crear el pedido o comunicarse con otros microservicios"
    });
  }
});

async function iniciar() {
  try {
    await mongo.connect();
    pedidos = mongo.db(MONGO_DB).collection("pedidos");
    await pedidos.createIndex({ creadoEn: -1 });

    app.listen(3003, () => {
      console.log("Microservicio Pedidos + MongoDB ejecutándose en puerto 3003");
    });
  } catch (error) {
    console.error("No fue posible iniciar Pedidos:", error);
    process.exit(1);
  }
}

iniciar();
