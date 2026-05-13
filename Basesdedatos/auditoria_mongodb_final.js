/*
 * AUDITORÍA DE ACTIVIDAD DEL NEGOCIO - MONGODB
 * Sistema de Gestión de Gastos Compartidos
 *
 * JUSTIFICACIÓN NOSQL:
 * El contexto de cada evento varía completamente según el tipo de acción.
 * Un TRANSACCION_REALIZADA trae monto, categoría y modalidad.
 * Un MIEMBRO_EXPULSADO trae motivo y rol anterior.
 * Un GASTO_PROGRAMADO_CREADO trae periodicidad y fecha de fin.
 * Esa variabilidad estructural no cabe limpiamente en columnas relacionales.
 *
 * PATRONES APLICADOS:
 * 1. Bucket - Agrupa eventos por círculo y día (reduce millones de docs a miles)
 * 2. Approximation - Actualiza indicadores cada N eventos, no en cada uno
 *
 * CONSUMIDOR: Líder del círculo (no hay admin global en el sistema)
 */

// ============================================
// 1. CREAR BASE DE DATOS Y COLECCIONES
// ============================================

use gestion_gastos_audit;

// Colección 1: Historial de eventos por círculo (Bucket Pattern)
db.createCollection("actividad_circulo_diaria");

// Colección 2: Indicadores calculados por círculo (Approximation Pattern)
db.createCollection("indicadores_circulo");

print("✓ Base de datos y colecciones creadas");

// ============================================
// 2. CREAR ÍNDICES OPTIMIZADOS
// ============================================

// Índices para actividad_circulo_diaria
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

// Índices para indicadores_circulo
db.indicadores_circulo.createIndex(
  { id_circulo: 1 },
  { unique: true, name: "idx_circulo_unico" }
);

db.indicadores_circulo.createIndex(
  { ultima_actualizacion: -1 },
  { name: "idx_ultima_actualizacion" }
);

print("✓ Índices creados");

// ============================================
// 3. FUNCIONES AUXILIARES
// ============================================

/**
 * Registra un evento en el bucket del día
 * Aplica patrón Bucket: agrupa hasta 500 eventos por círculo/día
 */
function registrarEvento(idCirculo, tipoEvento, idUsuario, contexto) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const evento = {
    tipo_evento: tipoEvento,
    id_usuario: idUsuario,
    timestamp: new Date(),
    contexto: contexto
  };
  
  // Buscar bucket del día o crear uno nuevo
  const resultado = db.actividad_circulo_diaria.updateOne(
    {
      id_circulo: idCirculo,
      fecha_bucket: hoy,
      total_eventos: { $lt: 500 } // Límite de eventos por bucket
    },
    {
      $push: { eventos: evento },
      $inc: { total_eventos: 1 },
      $setOnInsert: {
        bucket_seq: 0,
        creado_en: new Date()
      }
    },
    { upsert: true }
  );
  
  // Si el bucket está lleno, crear uno nuevo con secuencia++
  if (resultado.matchedCount === 0 && resultado.upsertedCount === 0) {
    const ultimoBucket = db.actividad_circulo_diaria.findOne(
      { id_circulo: idCirculo, fecha_bucket: hoy },
      { sort: { bucket_seq: -1 } }
    );
    
    const nuevaSeq = ultimoBucket ? ultimoBucket.bucket_seq + 1 : 0;
    
    db.actividad_circulo_diaria.insertOne({
      id_circulo: idCirculo,
      fecha_bucket: hoy,
      bucket_seq: nuevaSeq,
      eventos: [evento],
      total_eventos: 1,
      creado_en: new Date()
    });
  }
  
  return true;
}

/**
 * Actualiza indicadores del círculo
 * Aplica patrón Approximation: persiste cada N eventos, no en cada uno
 */
function actualizarIndicadores(idCirculo, tipoEvento, datos) {
  const indicador = db.indicadores_circulo.findOne({ id_circulo: idCirculo });
  
  if (!indicador) {
    // Crear indicadores iniciales para el círculo
    db.indicadores_circulo.insertOne({
      id_circulo: idCirculo,
      contadores: {
        total_transacciones: 0,
        total_deudas_generadas: 0,
        total_deudas_pagadas: 0,
        total_deudas_rechazadas: 0,
        total_gastos_programados: 0,
        total_mesadas_enviadas: 0,
        total_miembros_invitados: 0,
        total_miembros_expulsados: 0,
        eventos_sin_persistir: 0
      },
      indicadores: {
        tasa_friccion: { valor: 0, etiqueta: "BAJO", descripcion: "% de deudas rechazadas vs generadas" },
        nivel_actividad: { valor: "NUEVO", descripcion: "Estado del círculo basado en transacciones recientes" },
        tendencia_gasto: { valor: "0%", descripcion: "Variación de gasto vs mes anterior" },
        salud_circulo: { puntuacion: 100, etiqueta: "EXCELENTE", descripcion: "Índice combinado de actividad y pagos" }
      },
      categorias_mas_usadas: [],
      miembro_mas_activo: null,
      umbral_persistencia: 10, // Persistir cada 10 eventos
      ultima_actualizacion: new Date(),
      creado_en: new Date()
    });
    return;
  }
  
  // Incrementar contador específico según tipo de evento
  const actualizacion = { $inc: { "contadores.eventos_sin_persistir": 1 } };
  
  switch(tipoEvento) {
    case "TRANSACCION_REALIZADA":
      actualizacion.$inc["contadores.total_transacciones"] = 1;
      // Actualizar categoría más usada
      if (datos.categoria) {
        const categoriaIdx = indicador.categorias_mas_usadas.findIndex(
          c => c.nombre === datos.categoria
        );
        if (categoriaIdx >= 0) {
          actualizacion.$inc = actualizacion.$inc || {};
          actualizacion.$inc[`categorias_mas_usadas.${categoriaIdx}.cantidad`] = 1;
        } else {
          actualizacion.$push = {
            categorias_mas_usadas: {
              nombre: datos.categoria,
              cantidad: 1,
              porcentaje: 0
            }
          };
        }
      }
      break;
    case "DEUDA_GENERADA":
      actualizacion.$inc["contadores.total_deudas_generadas"] = 1;
      break;
    case "DEUDA_PAGADA":
      actualizacion.$inc["contadores.total_deudas_pagadas"] = 1;
      break;
    case "DEUDA_RECHAZADA":
      actualizacion.$inc["contadores.total_deudas_rechazadas"] = 1;
      break;
    case "GASTO_PROGRAMADO_CREADO":
      actualizacion.$inc["contadores.total_gastos_programados"] = 1;
      break;
    case "MESADA_ENVIADA":
      actualizacion.$inc["contadores.total_mesadas_enviadas"] = 1;
      break;
    case "MIEMBRO_INVITADO":
      actualizacion.$inc["contadores.total_miembros_invitados"] = 1;
      break;
    case "MIEMBRO_EXPULSADO":
      actualizacion.$inc["contadores.total_miembros_expulsados"] = 1;
      break;
  }
  
  db.indicadores_circulo.updateOne(
    { id_circulo: idCirculo },
    actualizacion
  );
  
  // Verificar si se alcanzó el umbral de persistencia
  const actualizado = db.indicadores_circulo.findOne({ id_circulo: idCirculo });
  
  if (actualizado.contadores.eventos_sin_persistir >= actualizado.umbral_persistencia) {
    recalcularIndicadores(idCirculo);
  }
}

/**
 * Recalcula todos los indicadores del círculo
 * Se ejecuta solo cuando se alcanza el umbral de eventos
 */
function recalcularIndicadores(idCirculo) {
  const indicador = db.indicadores_circulo.findOne({ id_circulo: idCirculo });
  
  if (!indicador) return;
  
  const c = indicador.contadores;
  
  // Calcular tasa de fricción
  const tasaFriccion = c.total_deudas_generadas > 0 
    ? (c.total_deudas_rechazadas / c.total_deudas_generadas) 
    : 0;
  
  let etiquetaFriccion = "BAJO";
  if (tasaFriccion > 0.3) etiquetaFriccion = "ALTO";
  else if (tasaFriccion > 0.15) etiquetaFriccion = "MEDIO";
  
  // Calcular nivel de actividad (basado en transacciones últimos 30 días)
  const hace30Dias = new Date();
  hace30Dias.setDate(hace30Dias.getDate() - 30);
  
  const transaccionesRecientes = db.actividad_circulo_diaria.aggregate([
    {
      $match: {
        id_circulo: idCirculo,
        fecha_bucket: { $gte: hace30Dias }
      }
    },
    {
      $unwind: "$eventos"
    },
    {
      $match: {
        "eventos.tipo_evento": "TRANSACCION_REALIZADA"
      }
    },
    {
      $count: "total"
    }
  ]).toArray();
  
  const totalRecientes = transaccionesRecientes.length > 0 
    ? transaccionesRecientes[0].total 
    : 0;
  
  let nivelActividad = "DORMIDO";
  if (totalRecientes > 20) nivelActividad = "MUY_ACTIVO";
  else if (totalRecientes > 10) nivelActividad = "ACTIVO";
  else if (totalRecientes > 0) nivelActividad = "POCO_ACTIVO";
  
  // Calcular salud del círculo (0-100)
  let puntuacionSalud = 100;
  
  // Penalizar por deudas rechazadas
  puntuacionSalud -= (tasaFriccion * 30);
  
  // Penalizar por inactividad
  if (nivelActividad === "DORMIDO") puntuacionSalud -= 40;
  else if (nivelActividad === "POCO_ACTIVO") puntuacionSalud -= 20;
  
  // Penalizar si hay más deudas pendientes que pagadas
  if (c.total_deudas_generadas > c.total_deudas_pagadas) {
    const deudaPendiente = c.total_deudas_generadas - c.total_deudas_pagadas;
    puntuacionSalud -= Math.min(deudaPendiente * 2, 20);
  }
  
  puntuacionSalud = Math.max(0, Math.min(100, puntuacionSalud));
  
  let etiquetaSalud = "EXCELENTE";
  if (puntuacionSalud < 40) etiquetaSalud = "CRITICO";
  else if (puntuacionSalud < 60) etiquetaSalud = "REGULAR";
  else if (puntuacionSalud < 80) etiquetaSalud = "BUENO";
  
  // Calcular porcentajes de categorías
  const totalTransacciones = c.total_transacciones || 1;
  const categoriasActualizadas = indicador.categorias_mas_usadas.map(cat => ({
    nombre: cat.nombre,
    cantidad: cat.cantidad,
    porcentaje: Math.round((cat.cantidad / totalTransacciones) * 100)
  })).sort((a, b) => b.cantidad - a.cantidad).slice(0, 5); // Top 5
  
  // Actualizar indicadores
  db.indicadores_circulo.updateOne(
    { id_circulo: idCirculo },
    {
      $set: {
        "indicadores.tasa_friccion": {
          valor: Math.round(tasaFriccion * 100) / 100,
          etiqueta: etiquetaFriccion,
          descripcion: "% de deudas rechazadas vs generadas"
        },
        "indicadores.nivel_actividad": {
          valor: nivelActividad,
          transacciones_mes: totalRecientes,
          descripcion: "Estado del círculo basado en transacciones recientes"
        },
        "indicadores.salud_circulo": {
          puntuacion: Math.round(puntuacionSalud),
          etiqueta: etiquetaSalud,
          descripcion: "Índice combinado de actividad y pagos"
        },
        categorias_mas_usadas: categoriasActualizadas,
        "contadores.eventos_sin_persistir": 0,
        ultima_actualizacion: new Date()
      }
    }
  );
  
  print(`✓ Indicadores recalculados para círculo ${idCirculo}`);
}

print("✓ Funciones auxiliares definidas");

// ============================================
// 4. DATOS DE EJEMPLO
// ============================================

print("\n=== SIMULACIÓN DE EVENTOS ===\n");

const CIRCULO_1 = 1; // Gastos del Hogar
const CIRCULO_2 = 2; // Viaje a Cartagena

// Simular eventos del Círculo 1: Gastos del Hogar
print("Registrando eventos para 'Gastos del Hogar'...");

for (let i = 0; i < 25; i++) {
  registrarEvento(CIRCULO_1, "TRANSACCION_REALIZADA", 101, {
    monto: 50000 + (i * 1000),
    categoria: i % 3 === 0 ? "Supermercado" : i % 3 === 1 ? "Servicios" : "Transporte",
    modalidad: "EQUITATIVA"
  });
  actualizarIndicadores(CIRCULO_1, "TRANSACCION_REALIZADA", {
    categoria: i % 3 === 0 ? "Supermercado" : i % 3 === 1 ? "Servicios" : "Transporte"
  });
}

for (let i = 0; i < 15; i++) {
  registrarEvento(CIRCULO_1, "DEUDA_GENERADA", 102, {
    monto: 25000,
    acreedor: 101,
    deudor: 102
  });
  actualizarIndicadores(CIRCULO_1, "DEUDA_GENERADA", {});
}

for (let i = 0; i < 12; i++) {
  registrarEvento(CIRCULO_1, "DEUDA_PAGADA", 102, {
    monto: 25000,
    metodo_pago: "Transferencia"
  });
  actualizarIndicadores(CIRCULO_1, "DEUDA_PAGADA", {});
}

for (let i = 0; i < 3; i++) {
  registrarEvento(CIRCULO_1, "DEUDA_RECHAZADA", 102, {
    monto: 25000,
    motivo: "No corresponde"
  });
  actualizarIndicadores(CIRCULO_1, "DEUDA_RECHAZADA", {});
}

registrarEvento(CIRCULO_1, "MESADA_ENVIADA", 101, {
  monto: 100000,
  destinatario: 103,
  periodo: "MENSUAL"
});
actualizarIndicadores(CIRCULO_1, "MESADA_ENVIADA", {});

registrarEvento(CIRCULO_1, "GASTO_PROGRAMADO_CREADO", 101, {
  descripcion: "Netflix",
  monto: 45000,
  periodicidad: "MENSUAL",
  fecha_fin: null
});
actualizarIndicadores(CIRCULO_1, "GASTO_PROGRAMADO_CREADO", {});

print("✓ 57 eventos registrados para Círculo 1");

// Simular eventos del Círculo 2: Viaje a Cartagena
print("\nRegistrando eventos para 'Viaje a Cartagena'...");

for (let i = 0; i < 8; i++) {
  registrarEvento(CIRCULO_2, "TRANSACCION_REALIZADA", 201, {
    monto: 200000 + (i * 5000),
    categoria: i % 2 === 0 ? "Alojamiento" : "Comida",
    modalidad: "PROPORCIONAL"
  });
  actualizarIndicadores(CIRCULO_2, "TRANSACCION_REALIZADA", {
    categoria: i % 2 === 0 ? "Alojamiento" : "Comida"
  });
}

for (let i = 0; i < 5; i++) {
  registrarEvento(CIRCULO_2, "DEUDA_GENERADA", 202, {
    monto: 80000,
    acreedor: 201,
    deudor: 202
  });
  actualizarIndicadores(CIRCULO_2, "DEUDA_GENERADA", {});
}

for (let i = 0; i < 4; i++) {
  registrarEvento(CIRCULO_2, "DEUDA_PAGADA", 202, {
    monto: 80000,
    metodo_pago: "Efectivo"
  });
  actualizarIndicadores(CIRCULO_2, "DEUDA_PAGADA", {});
}

registrarEvento(CIRCULO_2, "MIEMBRO_INVITADO", 201, {
  nuevo_miembro: 203,
  rol: "MIEMBRO"
});
actualizarIndicadores(CIRCULO_2, "MIEMBRO_INVITADO", {});

print("✓ 18 eventos registrados para Círculo 2");

print("\n=== DATOS DE EJEMPLO CREADOS ===\n");

// ============================================
// 5. CONSULTAS PARA EL LÍDER DEL CÍRCULO
// ============================================

print("\n=== CONSULTAS DISPONIBLES PARA EL LÍDER ===\n");

// Consulta 1: Resumen de indicadores del círculo
print("1. Indicadores del Círculo 'Gastos del Hogar':");
const indicadoresCirculo1 = db.indicadores_circulo.findOne({ id_circulo: CIRCULO_1 });
if (indicadoresCirculo1) {
  printjson({
    salud_circulo: indicadoresCirculo1.indicadores.salud_circulo,
    nivel_actividad: indicadoresCirculo1.indicadores.nivel_actividad,
    tasa_friccion: indicadoresCirculo1.indicadores.tasa_friccion,
    categorias_top: indicadoresCirculo1.categorias_mas_usadas.slice(0, 3),
    totales: {
      transacciones: indicadoresCirculo1.contadores.total_transacciones,
      deudas_pagadas: indicadoresCirculo1.contadores.total_deudas_pagadas,
      deudas_rechazadas: indicadoresCirculo1.contadores.total_deudas_rechazadas
    }
  });
}

// Consulta 2: Actividad de hoy del círculo
print("\n2. Eventos de hoy en 'Gastos del Hogar':");
const hoy = new Date();
hoy.setHours(0, 0, 0, 0);
const actividadHoy = db.actividad_circulo_diaria.findOne(
  { id_circulo: CIRCULO_1, fecha_bucket: hoy },
  { eventos: { $slice: -5 } } // Últimos 5 eventos
);
if (actividadHoy) {
  print(`Total eventos hoy: ${actividadHoy.total_eventos}`);
  printjson(actividadHoy.eventos);
}

// Consulta 3: Tipos de eventos más frecuentes en los últimos 7 días
print("\n3. Tipos de eventos más frecuentes (últimos 7 días):");
const hace7Dias = new Date();
hace7Dias.setDate(hace7Dias.getDate() - 7);

const eventosFrecuentes = db.actividad_circulo_diaria.aggregate([
  {
    $match: {
      id_circulo: CIRCULO_1,
      fecha_bucket: { $gte: hace7Dias }
    }
  },
  { $unwind: "$eventos" },
  {
    $group: {
      _id: "$eventos.tipo_evento",
      cantidad: { $sum: 1 }
    }
  },
  { $sort: { cantidad: -1 } },
  { $limit: 5 }
]).toArray();

printjson(eventosFrecuentes);

// Consulta 4: Miembro más activo
print("\n4. Miembro más activo en los últimos 30 días:");
const hace30Dias = new Date();
hace30Dias.setDate(hace30Dias.getDate() - 30);

const miembroActivo = db.actividad_circulo_diaria.aggregate([
  {
    $match: {
      id_circulo: CIRCULO_1,
      fecha_bucket: { $gte: hace30Dias }
    }
  },
  { $unwind: "$eventos" },
  {
    $group: {
      _id: "$eventos.id_usuario",
      acciones: { $sum: 1 }
    }
  },
  { $sort: { acciones: -1 } },
  { $limit: 1 }
]).toArray();

printjson(miembroActivo);

// Consulta 5: Evolución de transacciones por día (últimos 7 días)
print("\n5. Evolución de transacciones (últimos 7 días):");
const evolucionTransacciones = db.actividad_circulo_diaria.aggregate([
  {
    $match: {
      id_circulo: CIRCULO_1,
      fecha_bucket: { $gte: hace7Dias }
    }
  },
  { $unwind: "$eventos" },
  {
    $match: {
      "eventos.tipo_evento": "TRANSACCION_REALIZADA"
    }
  },
  {
    $group: {
      _id: {
        $dateToString: { format: "%Y-%m-%d", date: "$fecha_bucket" }
      },
      cantidad: { $sum: 1 },
      monto_total: { $sum: "$eventos.contexto.monto" }
    }
  },
  { $sort: { _id: 1 } }
]).toArray();

printjson(evolucionTransacciones);

print("\n=== SCRIPT COMPLETADO EXITOSAMENTE ===");
print("\nColecciones creadas:");
print("  • actividad_circulo_diaria (Bucket Pattern)");
print("  • indicadores_circulo (Approximation Pattern)");
print("\nPara ejecutar: mongosh gestion_gastos_audit < auditoria_mongodb_final.js");
