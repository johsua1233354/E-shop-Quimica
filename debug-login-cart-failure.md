[OPEN]

# Debug Session: login-cart-failure

## Síntoma
- Después de registrarse o iniciar sesión, al intentar agregar un producto al carrito ocurre un error y no se agrega.

## Esperado
- Con sesión iniciada, se debe poder agregar al carrito sin errores, y el carrito debe cargar correctamente.

## Hipótesis (falsables)
- **A**: `currentUser` no queda correctamente seteado/persistido (falta `id` o cambia de tipo), por eso el POST a `/cart` falla.
- **B**: `API_URL`/ruta del backend es incorrecta (subcarpeta/origin) y algunas llamadas (login vs cart) apuntan a endpoints distintos.
- **C**: El backend responde con un schema distinto (Node: `userId/productId/productName` vs PHP: `user_id/product_id/product_name`) y el front rompe al mapear el carrito, dejando estados inválidos.
- **D**: El backend está rechazando el POST a `/cart` por validación/DB (status 400/500) y el front solo muestra un error genérico.
- **E**: Problema de CORS/servidor/HTTP (mixed content o fetch bloqueado) que ocurre solo tras login (o por headers/cache).

## Reproducción (checklist)
1) Abrir la web.
2) Iniciar sesión o registrarse.
3) Ir a “Ventas”.
4) Pulsar “Agregar al Carrito”.
5) Abrir carrito (🛒).

## Evidencia a recolectar
- Logs de eventos del front (login/register, addToCart, apiFetch, loadCart).
- Status HTTP y cuerpo JSON de errores.
- Forma exacta de los objetos devueltos por `/cart/:userId` (keys).

## Estado
- [ ] Debug Server corriendo
- [ ] Instrumentación aplicada
- [ ] Reproducido (pre)
- [ ] Análisis con evidencia
- [ ] Fix
- [ ] Verificación (post)
