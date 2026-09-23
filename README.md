# Tienda con microservicios y Docker

Ejemplo académico de una tienda dividida en tres microservicios, cada uno con una tecnología de persistencia distinta.

| Microservicio | API | Base de datos |
|---|---|---|
| Productos | http://localhost:3001 | SQLite |
| Clientes | http://localhost:3002 | MySQL 8.4 |
| Pedidos | http://localhost:3003 | MongoDB 8 |

## Arquitectura

- **clientes** guarda clientes en MySQL.
- **productos** guarda productos en SQLite dentro de un volumen Docker.
- **pedidos** consulta Clientes y Productos por HTTP, calcula el total y guarda el pedido en MongoDB.
- Docker Compose crea la red interna y los volúmenes persistentes.

## Levantar el proyecto

```bash
docker compose up --build -d
docker compose ps
```

Logs:

```bash
docker compose logs -f
```

Detener:

```bash
docker compose down
```

Detener y borrar también todas las bases de datos:

```bash
docker compose down -v
```

## Endpoints

### Productos

```text
GET  http://localhost:3001/productos
GET  http://localhost:3001/productos/1
POST http://localhost:3001/productos
GET  http://localhost:3001/health
```

Ejemplo POST:

```json
{
  "nombre": "Teclado",
  "precio": 950
}
```

### Clientes

```text
GET  http://localhost:3002/clientes
GET  http://localhost:3002/clientes/1
POST http://localhost:3002/clientes
GET  http://localhost:3002/health
```

Ejemplo POST:

```json
{
  "nombre": "Carlos Martínez",
  "email": "carlos@example.com"
}
```

### Pedidos

```text
GET  http://localhost:3003/pedidos
POST http://localhost:3003/pedidos
GET  http://localhost:3003/health
```

Ejemplo POST:

```json
{
  "clienteId": 1,
  "productoId": 1,
  "cantidad": 2
}
```

## Puertos de las bases

Para poder inspeccionarlas desde la PC:

- MySQL: `localhost:3307`
- MongoDB: `localhost:27018`
- SQLite: archivo persistente dentro del volumen `productos_sqlite_data`

## Volúmenes

```bash
docker volume ls
```

Se crean:

- `mysql_clientes_data`
- `productos_sqlite_data`
- `mongo_pedidos_data`

Los datos sobreviven a `docker compose down`. Para eliminarlos usa `docker compose down -v`.
