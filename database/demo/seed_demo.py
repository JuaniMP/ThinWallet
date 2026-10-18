#!/usr/bin/env python3
"""
Carga datos de demostración en ThinWallet usando la API REST (no SQL directo),
así se ejercitan los mismos flujos que usa el frontend.

Requisitos:
  * Backend corriendo con el perfil dev:  SPRING_PROFILES_ACTIVE=sql,dev
  * Mailpit corriendo (http://localhost:8025) para leer los códigos de verificación.

Uso:
  python3 database/demo/seed_demo.py
Variables opcionales: API_URL (http://localhost:8080/api), MAILPIT_URL (http://localhost:8025)

Usuarios creados (contraseña: Demo1234*): ana@demo.com, bruno@demo.com
"""
import json
import os
import re
import sys
import urllib.error
import urllib.request

API = os.environ.get("API_URL", "http://localhost:8080/api")
MAILPIT = os.environ.get("MAILPIT_URL", "http://localhost:8025")
PASSWORD = "Demo1234*"


def call(method, path, body=None, token=None, base=API):
    req = urllib.request.Request(base + path, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    data = json.dumps(body).encode() if body is not None else None
    try:
        with urllib.request.urlopen(req, data) as res:
            raw = res.read().decode()
            return res.status, (json.loads(raw) if raw[:1] in "[{" else raw)
    except urllib.error.HTTPError as err:
        return err.code, err.read().decode()


def codigo_verificacion(correo):
    _, data = call("GET", f"/api/v1/search?query=to:{correo}", base=MAILPIT)
    snippet = data["messages"][0]["Snippet"]
    return re.search(r"es: (\d{6})", snippet).group(1)


def usuario(nombres, apellidos, nick):
    correo = f"{nick}@demo.com"
    status, _ = call("POST", "/usuarios/register", {
        "nombres": nombres, "apellidos": apellidos, "nombreUsuario": nick,
        "correo": correo, "contrasena": PASSWORD})
    if status == 201:
        call("POST", "/usuarios/verify", {"correo": correo, "codigo": codigo_verificacion(correo)})
    status, login = call("POST", "/usuarios/login", {"correo": correo, "contrasena": PASSWORD})
    if status != 200:
        sys.exit(f"No se pudo iniciar sesión como {correo}: {login}")
    print(f"✓ usuario {correo}")
    return login["usuario"]["idUsuario"], login["token"]


def categoria(token, nombre, tipo, descripcion):
    _, existentes = call("GET", "/categorias", token=token)
    for c in existentes:
        if c["nombre"] == nombre:
            return c["idCategoria"]
    _, creada = call("POST", "/categorias", {
        "nombre": nombre, "tipoCategoria": tipo, "descripcion": descripcion,
        "exclusivaPerfilSolo": False, "frecuenciaUso": 0}, token)
    return creada["idCategoria"]


def transaccion(token, id_usuario, nombre, monto, id_categoria, tipo_mov="TARJETA", **extra):
    status, trx = call("POST", "/transacciones", {
        "nombre": nombre, "montoOriginal": monto, "monedaOriginal": "COP", "tasaCambio": 1,
        "tipoMovimiento": tipo_mov, "idUsuario": id_usuario, "idCategoria": id_categoria,
        **extra}, token)
    if status >= 300:
        sys.exit(f"Error creando transacción '{nombre}': {trx}")
    return trx


def main():
    ana, t_ana = usuario("Ana", "Gómez", "ana")
    bruno, t_bruno = usuario("Bruno", "Díaz", "bruno")

    cat = {nombre: categoria(t_ana, nombre, tipo, desc) for nombre, tipo, desc in [
        ("Salario", "DEPOSITO", "Ingreso mensual"),
        ("Freelance", "DEPOSITO", "Proyectos independientes"),
        ("Mercado", "RETIRO", "Supermercado y despensa"),
        ("Transporte", "RETIRO", "Bus, taxi y gasolina"),
        ("Restaurantes", "RETIRO", "Comidas fuera de casa"),
        ("Café y snacks", "RETIRO", "Gastos pequeños del día a día"),
        ("Servicios", "RETIRO", "Luz, agua, internet"),
        ("Entretenimiento", "RETIRO", "Cine, streaming, salidas"),
    ]}
    print(f"✓ {len(cat)} categorías")

    movimientos = [
        ("Salario octubre", 4_200_000, "Salario", "TRANSFERENCIA"),
        ("Diseño de logo", 650_000, "Freelance", "TRANSFERENCIA"),
        ("Mercado del mes", 480_000, "Mercado", "TARJETA"),
        ("Arriendo + servicios", 310_000, "Servicios", "TRANSFERENCIA"),
        ("Recarga transporte", 120_000, "Transporte", "EFECTIVO"),
        ("Cena con amigos", 95_000, "Restaurantes", "TARJETA"),
        ("Netflix", 38_900, "Entretenimiento", "TARJETA"),
        ("Café de la mañana", 7_500, "Café y snacks", "EFECTIVO"),
        ("Empanada", 4_000, "Café y snacks", "EFECTIVO"),
        ("Café de la tarde", 8_000, "Café y snacks", "EFECTIVO"),
        ("Galletas", 5_500, "Café y snacks", "EFECTIVO"),
        ("Café con pan", 9_000, "Café y snacks", "EFECTIVO"),
    ]
    for nombre, monto, categoria_nombre, tipo_mov in movimientos:
        transaccion(t_ana, ana, nombre, monto, cat[categoria_nombre], tipo_mov)
    transaccion(t_bruno, bruno, "Salario octubre", 3_600_000, cat["Salario"], "TRANSFERENCIA")
    transaccion(t_bruno, bruno, "Gasolina", 140_000, cat["Transporte"], "TARJETA")
    print(f"✓ {len(movimientos) + 2} transacciones")

    _, circulo = call("POST", "/circulos-gasto", {
        "nombre": "Viaje a Cartagena", "monedaBase": "COP", "tipoCirculo": "Amigos",
        "presupuestoGrupal": 2_500_000, "permiteMesadas": False,
        "permiteSimplificacionDeudas": True, "idUsuarioCreador": ana,
        "nombresInvitados": ["Carlos"]}, t_ana)
    id_circulo = circulo["idCirculoGasto"]
    call("POST", f"/circulos-gasto/{id_circulo}/invitar-registrado", {"idUsuario": bruno}, t_ana)
    print(f"✓ círculo '{circulo['nombre']}' con Bruno y el invitado Carlos")

    for nombre, monto in [("Hotel 3 noches", 1_200_000), ("Tiquetes de bus", 360_000)]:
        trx = transaccion(t_ana, ana, nombre, monto, cat["Entretenimiento"],
                          idCirculoGasto=id_circulo, modalidadDivision="IGUALITARIA",
                          contexto="Viaje a Cartagena")
        call("POST", f"/transacciones/{trx['idTransaccion']}/dividir-deudas", {
            "idAcreedor": ana, "idCirculo": id_circulo, "monto": monto,
            "modalidad": "IGUALITARIA"}, t_ana)
    print("✓ gastos del viaje divididos en deudas")

    for nombre, valor, actual in [("Fondo de emergencia", 6_000_000, 2_100_000),
                                  ("Portátil nuevo", 3_500_000, 900_000)]:
        meta = {"nombre": nombre, "valor": valor, "periodicidad": "META",
                "fechaInicio": "2026-10-01T00:00:00", "idUsuarioCreador": ana,
                "idCategoria": cat["Salario"]}
        _, creada = call("POST", "/gastos", meta, t_ana)
        # Las metas nacen en 0; el abono se registra igual que en Goals.tsx
        call("PUT", f"/gastos/{creada['idGasto']}", {**meta, "montoActual": actual}, t_ana)
    call("POST", "/gastos", {
        "nombre": "Plan de celular", "valor": 55_000, "periodicidad": "MENSUAL",
        "fechaInicio": "2026-10-05T00:00:00", "fechaFin": "2027-10-05T00:00:00",
        "idUsuarioCreador": ana, "idCategoria": cat["Servicios"]}, t_ana)
    print("✓ metas de ahorro y gasto programado")
    print("\nListo. Inicia sesión con ana@demo.com / Demo1234*")


if __name__ == "__main__":
    main()
