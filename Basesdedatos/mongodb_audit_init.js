/**
 * ThinWallet – Inicialización de Base de Datos NoSQL (MongoDB)
 * Servidor: 100.124.143.126:27017
 * Base de datos: gestion_gastos_audit
 *
 * PATRONES APLICADOS:
 *   Bucket       – actividad_circulo_diaria: agrupa hasta 500 eventos/círculo/día
 *   Approximation– indicadores_circulo: recalcula métricas cada 10 eventos
 *
 * EJECUCIÓN:
 *   mongosh "mongodb://100.124.143.126:27017/gestion_gastos_audit" --file mongodb_audit_init.js
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. BASE DE DATOS Y COLECCIONES
// ─────────────────────────────────────────────────────────────────────────────

db = db.getSiblingDB("gestion_gastos_audit");

// Colección 1: Historial de eventos por círculo (Bucket Pattern)
// Cada documento agrupa hasta 500 eventos de un círculo en un día.
// Si el bucket se llena → se crea uno nuevo con bucket_seq++.
if (!db.getCollectionNames().includes("actividad_circulo_diaria")) {
    db.createCollection("actividad_circulo_diaria");
    print("✓ Colección actividad_circulo_diaria creada");
} else {
    print("✓ Colección actividad_circulo_diaria ya existe");
}

// Colección 2: Indicadores calculados por círculo (Approximation Pattern)
// Un documento por círculo. Se actualiza cada 10 eventos (umbral configurable).
if (!db.getCollectionNames().includes("indicadores_circulo")) {
    db.createCollection("indicadores_circulo");
    print("✓ Colección indicadores_circulo creada");
} else {
    print("✓ Colección indicadores_circulo ya existe");
}


// ─────────────────────────────────────────────────────────────────────────────
// 2. ÍNDICES
// ─────────────────────────────────────────────────────────────────────────────

// actividad_circulo_diaria
db.actividad_circulo_diaria.createIndex(
    { id_circulo: 1, fecha_bucket: -1 },
    { name: "idx_circulo_fecha" }
);
db.actividad_circulo_diaria.createIndex(
    { "eventos.tipo_evento": 1, "eventos.timestamp": -1 },
    { name: "idx_tipo_evento_timestamp" }
);
db.actividad_circulo_diaria.createIndex(
    { "eventos.id_usuario": 1 },
    { name: "idx_usuario_eventos" }
);
// Índice compuesto para el Bucket Pattern (buscar bucket con espacio disponible)
db.actividad_circulo_diaria.createIndex(
    { id_circulo: 1, fecha_bucket: 1, total_eventos: 1 },
    { name: "idx_bucket_busqueda" }
);

// indicadores_circulo
db.indicadores_circulo.createIndex(
    { id_circulo: 1 },
    { unique: true, name: "idx_circulo_unico" }
);
db.indicadores_circulo.createIndex(
    { ultima_actualizacion: -1 },
    { name: "idx_ultima_actualizacion" }
);

print("✓ Índices creados");

// ─────────────────────────────────────────────────────────────────────────────
// 3. DATOS DE EJEMPLO – CÍRCULO 1 (Gastos del Hogar)
// ─────────────────────────────────────────────────────────────────────────────

const CIRCULO_1 = NumberLong(1);
const CIRCULO_2 = NumberLong(2);

// Crear indicadores iniciales si no existen
if (!db.indicadores_circulo.findOne({ id_circulo: CIRCULO_1 })) {
    db.indicadores_circulo.insertOne({
        id_circulo: CIRCULO_1,
        contadores: {
            total_transacciones: 25,
            total_deudas_generadas: 15,
            total_deudas_pagadas: 12,
            total_deudas_rechazadas: 3,
            total_gastos_programados: 1,
            total_mesadas_enviadas: 1,
            total_miembros_invitados: 0,
            total_miembros_expulsados: 0,
            eventos_sin_persistir: 0
        },
        indicadores: {
            tasa_friccion: {
                valor: 0.20,
                etiqueta: "MEDIO",
                descripcion: "% de deudas rechazadas vs generadas"
            },
            nivel_actividad: {
                valor: "MUY_ACTIVO",
                transacciones_mes: 25,
                descripcion: "Estado del círculo basado en transacciones recientes"
            },
            salud_circulo: {
                puntuacion: 74,
                etiqueta: "BUENO",
                descripcion: "Índice combinado de actividad y pagos"
            }
        },
        categorias_mas_usadas: [
            { nombre: "Supermercado", cantidad: 9, porcentaje: 36 },
            { nombre: "Servicios",    cantidad: 8, porcentaje: 32 },
            { nombre: "Transporte",   cantidad: 8, porcentaje: 32 }
        ],
        miembro_mas_activo: NumberLong(101),
        umbral_persistencia: 10,
        ultima_actualizacion: new Date(),
        creado_en: new Date()
    });
    print("✓ Indicadores iniciales para Círculo 1 creados");
}

if (!db.indicadores_circulo.findOne({ id_circulo: CIRCULO_2 })) {
    db.indicadores_circulo.insertOne({
        id_circulo: CIRCULO_2,
        contadores: {
            total_transacciones: 8,
            total_deudas_generadas: 5,
            total_deudas_pagadas: 4,
            total_deudas_rechazadas: 0,
            total_gastos_programados: 0,
            total_mesadas_enviadas: 0,
            total_miembros_invitados: 1,
            total_miembros_expulsados: 0,
            eventos_sin_persistir: 0
        },
        indicadores: {
            tasa_friccion: {
                valor: 0.0,
                etiqueta: "BAJO",
                descripcion: "% de deudas rechazadas vs generadas"
            },
            nivel_actividad: {
                valor: "POCO_ACTIVO",
                transacciones_mes: 8,
                descripcion: "Estado del círculo basado en transacciones recientes"
            },
            salud_circulo: {
                puntuacion: 78,
                etiqueta: "BUENO",
                descripcion: "Índice combinado de actividad y pagos"
            }
        },
        categorias_mas_usadas: [
            { nombre: "Alojamiento", cantidad: 4, porcentaje: 50 },
            { nombre: "Comida",      cantidad: 4, porcentaje: 50 }
        ],
        miembro_mas_activo: NumberLong(201),
        umbral_persistencia: 10,
        ultima_actualizacion: new Date(),
        creado_en: new Date()
    });
    print("✓ Indicadores iniciales para Círculo 2 creados");
}

// Bucket de actividad de ejemplo para hoy
const hoy = new Date();
hoy.setHours(0, 0, 0, 0);

if (!db.actividad_circulo_diaria.findOne({ id_circulo: CIRCULO_1, fecha_bucket: hoy })) {
    db.actividad_circulo_diaria.insertOne({
        id_circulo: CIRCULO_1,
        fecha_bucket: hoy,
        bucket_seq: 0,
        total_eventos: 5,
        creado_en: new Date(),
        eventos: [
            {
                tipo_evento: "TRANSACCION_REALIZADA",
                id_usuario: NumberLong(101),
                timestamp: new Date(),
                contexto: { monto: 85000, moneda: "COP", modalidad: "EQUITATIVA" }
            },
            {
                tipo_evento: "DEUDA_GENERADA",
                id_usuario: NumberLong(101),
                timestamp: new Date(),
                contexto: { monto: 42500, acreedor: NumberLong(101), deudor: NumberLong(102) }
            },
            {
                tipo_evento: "DEUDA_PAGADA",
                id_usuario: NumberLong(102),
                timestamp: new Date(),
                contexto: { monto: 42500, metodo_pago: "Transferencia" }
            },
            {
                tipo_evento: "GASTO_PROGRAMADO_CREADO",
                id_usuario: NumberLong(101),
                timestamp: new Date(),
                contexto: { nombre: "Netflix", valor: 45000, periodicidad: "MENSUAL" }
            },
            {
                tipo_evento: "MESADA_ENVIADA",
                id_usuario: NumberLong(101),
                timestamp: new Date(),
                contexto: { monto: 100000, destinatario: NumberLong(103) }
            }
        ]
    });
    print("✓ Bucket de actividad de ejemplo creado para Círculo 1");
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. CONSULTAS DE VERIFICACIÓN
// ─────────────────────────────────────────────────────────────────────────────

print("\n=== VERIFICACIÓN DE DATOS ===\n");

print("Indicadores Círculo 1:");
printjson(db.indicadores_circulo.findOne(
    { id_circulo: CIRCULO_1 },
    { "indicadores": 1, "contadores": 1 }
));

print("\nActividad de hoy – Círculo 1:");
const actHoy = db.actividad_circulo_diaria.findOne({ id_circulo: CIRCULO_1, fecha_bucket: hoy });
if (actHoy) {
    print("Total eventos hoy: " + actHoy.total_eventos);
} else {
    print("Sin actividad hoy");
}

print("\nTipos de eventos más frecuentes (todos los tiempos):");
printjson(db.actividad_circulo_diaria.aggregate([
    { $match: { id_circulo: CIRCULO_1 } },
    { $unwind: "$eventos" },
    { $group: { _id: "$eventos.tipo_evento", cantidad: { $sum: 1 } } },
    { $sort: { cantidad: -1 } }
]).toArray());

print("\n=== INICIALIZACIÓN COMPLETADA ===");
print("Base de datos: gestion_gastos_audit");
print("Colecciones:");
print("  • actividad_circulo_diaria  (Bucket Pattern)");
print("  • indicadores_circulo       (Approximation Pattern)");
print("\nConectar con: mongosh 'mongodb://100.124.143.126:27017/gestion_gastos_audit'");
