const express = require("express");

const app = express();

app.use(express.json());

// URL de los otros microservicios
const URL_CLIENTES = "http://clientes:3002";
const URL_PRODUCTOS = "http://productos:3001";

// -------------------------------------
// CONSULTAR TODOS LOS PEDIDOS
// -------------------------------------

app.get("/pedidos", (req, res) => {

    res.json([
        {
            id: 1,
            clienteId: 1,
            productoId: 1,
            cantidad: 2
        }
    ]);

});

// -------------------------------------
// CREAR UN PEDIDO
// -------------------------------------

app.post("/pedidos", async (req, res) => {

    try {

        const { clienteId, productoId, cantidad } = req.body;

        // Validamos que lleguen los datos
        if (!clienteId || !productoId || !cantidad) {
            return res.status(400).json({
                mensaje: "Faltan datos del pedido"
            });
        }

        // -------------------------------------
        // 1. CONSULTAR AL MICROSERVICIO CLIENTES
        // -------------------------------------

        const respuestaCliente = await fetch(
            `${URL_CLIENTES}/clientes/${clienteId}`
        );

        if (!respuestaCliente.ok) {
            return res.status(404).json({
                mensaje: "El cliente no existe"
            });
        }

        const cliente = await respuestaCliente.json();


        // -------------------------------------
        // 2. CONSULTAR AL MICROSERVICIO PRODUCTOS
        // -------------------------------------

        const respuestaProducto = await fetch(
            `${URL_PRODUCTOS}/productos/${productoId}`
        );

        if (!respuestaProducto.ok) {
            return res.status(404).json({
                mensaje: "El producto no existe"
            });
        }

        const producto = await respuestaProducto.json();


        // -------------------------------------
        // 3. CALCULAR EL TOTAL
        // -------------------------------------

        const total = producto.precio * cantidad;


        // -------------------------------------
        // 4. CREAR RESPUESTA
        // -------------------------------------

        const pedido = {
            id: Math.floor(Math.random() * 10000),
            cliente: cliente.nombre,
            producto: producto.nombre,
            cantidad: cantidad,
            precioUnitario: producto.precio,
            total: total
        };

        res.status(201).json({
            mensaje: "Pedido creado correctamente",
            pedido: pedido
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: "Error al comunicarse con otros microservicios"
        });

    }

});

// -------------------------------------
// INICIAR SERVIDOR
// -------------------------------------

app.listen(3003, () => {

    console.log(
        "Microservicio Pedidos ejecutándose en puerto 3003"
    );

});