/**
 * AUDITORÍA DE ACTIVIDAD DEL NEGOCIO - MONGODB
 * Proyecto: ThinWallet
 * * JUSTIFICACIÓN TÉCNICA:
 * Se aplica un diseño NoSQL para manejar la naturaleza polimórfica de los eventos 
 * (Transacciones, Deudas, Cambios de Roles) cuya estructura varía.
 * * PATRONES APLICADOS:
 * 1. Bucket Pattern: Agrupación de eventos por círculo y día para optimizar lectura.
 * 2. Approximation Pattern: Indicadores calculados para consultas rápidas.
 */

// ============================================
// 1. CONFIGURACIÓN INICIAL
// ============================================

db = db.getSiblingDB("gestion_gastos_audit");

db.actividad_circulo_diaria.drop();
db.indicadores_circulo.drop();

db.createCollection("actividad_circulo_diaria");
db.createCollection("indicadores_circulo");

// Índices para optimizar el Bucket Pattern
db.actividad_circulo_diaria.createIndex({ id_circulo: 1, fecha_bucket: -1 });
db.indicadores_circulo.createIndex({ id_circulo: 1 }, { unique: true });

const CIRCULO_1 = 101;
const USUARIO_JUAN = 500;
const hoy = new Date();

// ============================================
// 2. OPERACIÓN CREATE (UPSERT ATÓMICO)
// ============================================

const nuevoEvento = {
  id_evento: UUID(),
  tipo_evento: "TRANSACCION_REALIZADA",
  id_usuario: USUARIO_JUAN,
  timestamp: new Date(),
  detalles: {
    monto: 55000,
    categoria: "Alimentación",
    metodo: "Transferencia"
  }
};

print("-> Insertando evento mediante Bucket Pattern...");

// La lógica lt: 500 junto con upsert: true crea automáticamente un nuevo bucket 
// si el actual está lleno o no existe. No requiere validaciones manuales extra.
db.actividad_circulo_diaria.updateOne(
  { 
    id_circulo: CIRCULO_1, 
    fecha_bucket: { $gte: new Date(hoy.setHours(0,0,0,0)) },
    "resumen_dia.conteo": { $lt: 500 } 
  },
  {
    $push: { eventos: nuevoEvento },
    $inc: { "resumen_dia.conteo": 1, "resumen_dia.total": nuevoEvento.detalles.monto },
    $setOnInsert: { id_circulo: CIRCULO_1, fecha_bucket: new Date(), version_esquema: "1.0" }
  },
  { upsert: true }
);

// Approximation Pattern: Actualizar indicadores globales
db.indicadores_circulo.updateOne(
  { id_circulo: CIRCULO_1 },
  { 
    $inc: { "metricas.total": nuevoEvento.detalles.monto, "metricas.num": 1 },
    $set: { ultima_actualizacion: new Date() },
    $setOnInsert: { id_circulo: CIRCULO_1 }
  },
  { upsert: true }
);

// ============================================
// 3. OPERACIONES UPDATE Y DELETE (CRUD COMPLETO)
// ============================================

print("\n-> Ejecutando UPDATE: Actualizando umbral de retención...");
db.indicadores_circulo.updateOne(
  { id_circulo: CIRCULO_1 },
  { 
    $set: { umbral_persistencia_dias: 90 },
    $currentDate: { ultima_actualizacion: true }
  }
);

print("\n-> Ejecutando DELETE: Limpieza de logs históricos (Data Retention)...");
const hace90Dias = new Date();
hace90Dias.setDate(hace90Dias.getDate() - 90);

const deleteResult = db.actividad_circulo_diaria.deleteMany({
  fecha_bucket: { $lt: hace90Dias }
});
print(`✓ Buckets eliminados por antigüedad: ${deleteResult.deletedCount}`);

// ============================================
// 4. AGREGACIONES AVANZADAS ($LOOKUP + $PROJECT)
// ============================================

print("\n-> Consulta: Reporte unificado (Cruce de colecciones + Proyección):");
const reporte = db.actividad_circulo_diaria.aggregate([
  { $match: { id_circulo: CIRCULO_1 } },
  {
    $lookup: {
      from: "indicadores_circulo",
      localField: "id_circulo",
      foreignField: "id_circulo",
      as: "info_consolidada"
    }
  },
  {
    $project: {
      _id: 0,
      fecha: { $dateToString: { format: "%Y-%m-%d", date: "$fecha_bucket" } },
      eventos_del_dia: "$resumen_dia.conteo",
      total_acumulado_circulo: { $arrayElemAt: ["$info_consolidada.metricas.total", 0] },
      version: "$version_esquema"
    }
  }
]).toArray();

printjson(reporte);

// ============================================
// 5. CONSULTAS DE AUDITORÍA ADICIONALES
// ============================================

print("\n-> Miembro más activo (Últimos 30 días):");
printjson(db.actividad_circulo_diaria.aggregate([
  { $match: { id_circulo: CIRCULO_1 } },
  { $unwind: "$eventos" },
  { $group: { _id: "$eventos.id_usuario", total_acciones: { $sum: 1 } } },
  { $sort: { total_acciones: -1 } },
  { $limit: 1 }
]).toArray());