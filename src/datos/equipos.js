/* =========================================================
   BASE DE DATOS BÁSICA DE EQUIPOS
   PLANTA INDUSTRIAL 3D

   Los datos técnicos pendientes se completarán
   cuando dispongamos de la información real.
   ========================================================= */

export const DATOS_EQUIPOS = {

  // =======================================================
  // ESPESADORES
  // =======================================================

  "E-01": {
  nombre: "Espesador 01",
  tipo: "Espesador",
  servicio: "Espesamiento de pulpa",
  diametro: "30 m (provisional)",
  bombas: ["UF-4A", "UF-4B"],
  descargaOF: "TK-01"
},

"E-02": {
  nombre: "Espesador 02",
  tipo: "Espesador",
  servicio: "Espesamiento de pulpa",
  diametro: "30 m (provisional)",
  bombas: ["UF-3A", "UF-3B"],
  descargaOF: "TK-02"
},

"E-03": {
  nombre: "Espesador 03",
  tipo: "Espesador",
  servicio: "Espesamiento de pulpa",
  diametro: "30 m (provisional)",
  bombas: ["UF-2A", "UF-2B"],
  descargaOF: "TK-03"
},

"E-04": {
  nombre: "Espesador 04",
  tipo: "Espesador",
  servicio: "Espesamiento de pulpa",
  diametro: "30 m (provisional)",
  bombas: ["UF-1A", "UF-1B"],
  descargaOF: "TK-04"
},

  // =======================================================
  // TANQUES
  // =======================================================

  ...Object.fromEntries(
    [1, 2, 3, 4].map(n => {

      const id = `TK-0${n}`;

      return [id, {
        nombre: `Tanque de agua 0${n}`,
        tipo: "Tanque",
        servicio: "Recepción de overflow",
        diametro: "18 m (provisional)",
        capacidad: "Por definir",
        alimentacion: `ESP-0${n}`,
        descarga: "Colector de agua"
      }];
    })
  ),

  // =======================================================
  // BOMBAS UNDERFLOW
  // =======================================================

  ...Object.fromEntries(
    [1, 2, 3, 4].flatMap(n => {

      const numero = 5 - n;

const idA = `UF-${numero}A`;
const idB = `UF-${numero}B`;

      return [
        [idA, {
          nombre: `Bomba UF ${n}01-A`,
          tipo: "Bomba centrífuga",
          servicio: "Underflow de espesador",
          equipoAsociado: `ESP-0${n}`,
          estado: "Operativa",
          respaldo: idB,
          fabricante: "Por definir",
          modelo: "Por definir",
          caudal: "Por definir",
          presion: "Por definir",
          selloMecanico: "Por definir",
          refrigeracion: "PA-05"
        }],

        [idB, {
          nombre: `Bomba UF ${n}01-B`,
          tipo: "Bomba centrífuga",
          servicio: "Underflow de espesador",
          equipoAsociado: `ESP-0${n}`,
          estado: "Standby",
          respaldo: idA,
          fabricante: "Por definir",
          modelo: "Por definir",
          caudal: "Por definir",
          presion: "Por definir",
          selloMecanico: "Por definir",
          refrigeracion: "PA-05"
        }]
      ];
    })
  ),

  // =======================================================
  // BOMBAS DE AGUA
  // =======================================================

  ...Object.fromEntries(
    [1, 2, 3, 4, 5].map(n => {

      const id = `PA-0${n}`;

      return [id, {
        nombre: `Bomba de agua 0${n}`,
        tipo: "Bomba de agua",
        servicio: n === 5
          ? "Refrigeración de sellos mecánicos"
          : "Distribución de agua",
        fabricante: "Por definir",
        modelo: "Por definir",
        caudal: "Por definir",
        presion: "Por definir",
        selloMecanico: "Por definir",
        alimentacion: "Colector de tanques"
      }];
    })
  )

};