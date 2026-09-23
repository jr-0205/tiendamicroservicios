const express = require("express");

const app = express();

app.use(express.json());

const productos = [
    {
        id: 1,
        nombre: "Laptop",
        precio: 15000
    },
    {
        id: 2,
        nombre: "Mouse",
        precio: 500
    }
];

app.get("/productos", (req, res) => {
    res.json(productos);
});

app.get("/productos/:id", (req, res) => {
    const producto = productos.find(
        p => p.id == req.params.id
    );

    if (!producto) {
        return res.status(404).json({
            mensaje: "Producto no encontrado"
        });
    }

    res.json(producto);
});

app.listen(3001, () => {
    console.log("Microservicio Productos ejecutándose en puerto 3001");
});
