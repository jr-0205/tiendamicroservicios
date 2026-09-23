const express = require("express");

const app = express();

app.use(express.json());

const clientes = [
    {
        id: 1,
        nombre: "Juan Pérez",
        email: "juan@gmail.com"
    },
    {
        id: 2,
        nombre: "Ana López",
        email: "ana@gmail.com"
    }
];

app.get("/clientes", (req, res) => {
    res.json(clientes);
});

app.get("/clientes/:id", (req, res) => {
    const cliente = clientes.find(
        c => c.id == req.params.id
    );

    if (!cliente) {
        return res.status(404).json({
            mensaje: "Cliente no encontrado"
        });
    }

    res.json(cliente);
});

app.listen(3002, () => {
    console.log("Microservicio Clientes ejecutándose en puerto 3002");
});
