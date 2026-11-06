import * as THREE from "three";
import { crearTuberias } from "./tuberias.js";
import { crearCajaSelladoWarman } from "./bombas/cajaSelladoWarman.js";
import { crearBombaWarman } from "./bombas/bombaWarman.js";

/* =========================================================
   PLANTA INDUSTRIAL 3D
   DISTRIBUCIÓN DE EQUIPOS — VERSIÓN 2

   X = horizontal
   Y = elevación
   Z = profundidad

   1 unidad = 1 metro (escala conceptual)
   ========================================================= */

// =========================================================
// 1. COORDENADAS DE EQUIPOS
// =========================================================

export const DISTRIBUCION = {

  espesadores: [
    { id: "E-01", x: 0,   y: 15, z: -20 },
    { id: "E-02", x: 48,  y: 15, z: -20 },
    { id: "E-03", x: 96,  y: 15, z: -20 },
    { id: "E-04", x: 144, y: 15, z: -20 }
  ],

  tanques: [
    { id: "TK-01", x: 122,  y: 0, z: 68 },
    { id: "TK-02", x: 142,  y: 0, z: 68 },
    { id: "TK-03", x: 162,  y: 0, z: 68 },
    { id: "TK-04", x: 182, y: 0, z: 68 }
  ],

  bombasUF: [
    { id: "UF-4A", x: 0,  y: 0, z: -25, estado: "operativa" },
    { id: "UF-4B", x: 0,   y: 0, z: -15, estado: "standby" },

    { id: "UF-3A", x: 48,  y: 0, z: -25, estado: "operativa" },
    { id: "UF-3B", x: 48,  y: 0, z: -15, estado: "standby" },

    { id: "UF-2A", x: 96,  y: 0, z: -25, estado: "operativa" },
    { id: "UF-2B", x: 96, y: 0, z: -15, estado: "standby" },

    { id: "UF-1A", x: 144, y: 0, z: -25, estado: "operativa" },
    { id: "UF-1B", x: 144, y: 0, z: -15, estado: "standby" }
  ],

  bombasAgua: [
    { id: "PA-01", x: 158,   y: 0, z: 105 },
    { id: "PA-02", x: 164,  y: 0, z: 105 },
    { id: "PA-03", x: 170,  y: 0, z: 105 },
    { id: "PA-04", x: 176, y: 0, z: 105 },
    { id: "PA-05", x: 182, y: 0, z: 105 }
  ]

};

// =========================================================
// 2. COLORES
// =========================================================

const COLORES = {
  espesador: 0x005889,
  estructura: 0x087CB2,
  tanque: 0x76B7D8,
  bomba: 0x64788A,
  standby: 0x9CA8B2,
  suelo: 0xDCE2E7
};

function material(color) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.2,
    roughness: 0.6
  });
}

const M = {};

Object.entries(COLORES).forEach(([nombre, color]) => {
  M[nombre] = material(color);
});

// =========================================================
// 3. FUNCIONES GEOMÉTRICAS
// =========================================================

function agregarCilindro(
  grupo,
  nombre,
  radioSuperior,
  radioInferior,
  altura,
  x,
  y,
  z,
  mat
) {
  const objeto = new THREE.Mesh(
    new THREE.CylinderGeometry(
      radioSuperior,
      radioInferior,
      altura,
      48
    ),
    mat
  );

  objeto.name = nombre;
  objeto.position.set(x, y, z);

  grupo.add(objeto);

  return objeto;
}

function agregarCaja(
  grupo,
  nombre,
  ancho,
  altura,
  profundidad,
  x,
  y,
  z,
  mat
) {
  const objeto = new THREE.Mesh(
    new THREE.BoxGeometry(ancho, altura, profundidad),
    mat
  );

  objeto.name = nombre;
  objeto.position.set(x, y, z);

  grupo.add(objeto);

  return objeto;
}

// =========================================================
// 4. ETIQUETAS
// =========================================================

function agregarEtiqueta(grupo, texto, altura) {

  const canvas = document.createElement("canvas");

  canvas.width = 512;
  canvas.height = 128;

  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#082F63";
  ctx.fillRect(0, 0, 512, 128);

  ctx.font = "bold 44px Arial";
  ctx.fillStyle = "#FFFFFF";

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(texto, 256, 64);

  const textura = new THREE.CanvasTexture(canvas);

  const etiqueta = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: textura,
      transparent: true,
      depthTest: false
    })
  );

  etiqueta.name = `ETIQUETA_${texto}`;

  etiqueta.position.set(0, altura, 0);
  etiqueta.scale.set(5, 1.25, 1);

  grupo.add(etiqueta);
}

// =========================================================
// 5. CREAR ESPESADOR
// =========================================================

function crearEspesador(datos) {

  const grupo = new THREE.Group();

  grupo.name = datos.id;

  grupo.userData = {
    id: datos.id,
    tipo: "espesador",
    diametro: 30
  };

  // Fondo cónico
  agregarCilindro(
    grupo,
    "FONDO_CONICO",
    15,
    2,
    5,
    0,
    2,
    0,
    M.espesador
  );

  // Cuerpo circular
  agregarCilindro(
    grupo,
    "CUERPO",
    15,
    15,
    5,
    0,
    7,
    0,
    M.espesador
  );

  // Puente
  agregarCaja(
    grupo,
    "PUENTE",
    30,
    0.8,
    2,
    0,
    10,
    0,
    M.estructura
  );

  // Columna central
  agregarCilindro(
    grupo,
    "COLUMNA",
    1.2,
    1.2,
    8,
    0,
    11,
    0,
    M.estructura
  );

  agregarEtiqueta(grupo, datos.id, 17);

  grupo.position.set(
    datos.x,
    datos.y,
    datos.z
  );

  return grupo;
}

// =========================================================
// 6. CREAR TANQUE
// =========================================================

function crearTanque(datos) {

  const grupo = new THREE.Group();

  grupo.name = datos.id;

  grupo.userData = {
    id: datos.id,
    tipo: "tanque",
    diametro: 18
  };

  // Cuerpo
  agregarCilindro(
    grupo,
    "CUERPO",
    9,
    9,
    13,
    0,
    7.5,
    0,
    M.tanque
  );

  // Tapa
  agregarCilindro(
    grupo,
    "TAPA",
    9.2,
    9.2,
    0.5,
    0,
    14.25,
    0,
    M.estructura
  );

  agregarEtiqueta(grupo, datos.id, 19);

  grupo.position.set(
    datos.x,
    datos.y,
    datos.z
  );

  return grupo;
}

// =========================================================
// 7. CREAR BOMBA
// =========================================================

/* =========================================================
   BOMBAS INDUSTRIALES 3D

   Bomba UF:
   Diseño conceptual tipo Warman AH

   Bomba de agua:
   Diseño conceptual tipo Goulds 3196

   Se conservan las coordenadas XYZ actuales.
   Bombas UF orientadas en X.
   Bombas de agua orientadas en Z.
   ========================================================= */

function crearBomba(datos, tipo) {

  const grupo = new THREE.Group();
  grupo.name = datos.id;

  grupo.userData = {
    id: datos.id,
    tipo,
    estado: datos.estado || "por definir",
    sistemaSellado: "Pendiente de modelar"
  };

  const conjunto = new THREE.Group();
  conjunto.name = "CONJUNTO_BOMBA";
  grupo.add(conjunto);

  const warman = tipo === "bombaUF";

  // =======================================================
  // MATERIALES
  // =======================================================

  const crearMaterial = (color, metalness = 0.35) =>
    new THREE.MeshStandardMaterial({
      color,
      metalness,
      roughness: 0.48
    });

  const MAT = {
    carcasa: crearMaterial(warman ? 0x005889 : 0x087CB2),
    tapa: crearMaterial(warman ? 0x087CB2 : 0x3F7CB0),
    rodamiento: crearMaterial(0x51677A),
    sello: crearMaterial(0xC4CCD2, 0.7),
    eje: crearMaterial(0xAEB8C2, 0.75),
    motor: crearMaterial(0x526575),
    nervios: crearMaterial(0x394C5D),
    base: crearMaterial(0x34495E),
    pernos: crearMaterial(0xBFC6CD, 0.7),
    acoplamiento: crearMaterial(0xD4A63A),
    juntas: crearMaterial(0x22313F)
  };

  // =======================================================
  // FUNCIONES AUXILIARES
  // =======================================================

  function caja(nombre, w, h, d, x, y, z, mat) {

    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      mat
    );

    mesh.name = nombre;
    mesh.position.set(x, y, z);

    conjunto.add(mesh);
    return mesh;
  }

  function cilindroX(
    nombre, radio, largo, x, y, z, mat
  ) {

    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(
        radio, radio, largo, 40
      ),
      mat
    );

    mesh.name = nombre;
    mesh.rotation.z = Math.PI / 2;
    mesh.position.set(x, y, z);

    conjunto.add(mesh);
    return mesh;
  }

  function cilindroY(
    nombre, radio, largo, x, y, z, mat
  ) {

    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(
        radio, radio, largo, 32
      ),
      mat
    );

    mesh.name = nombre;
    mesh.position.set(x, y, z);

    conjunto.add(mesh);
    return mesh;
  }

  function anilloX(
    nombre, radio, espesor, x, y, z, mat
  ) {

    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(
        radio, espesor, 12, 48
      ),
      mat
    );

    mesh.name = nombre;
    mesh.rotation.y = Math.PI / 2;
    mesh.position.set(x, y, z);

    conjunto.add(mesh);
    return mesh;
  }

  // =======================================================
  // 1. BASE METÁLICA
  // =======================================================

  caja(
    "BASE_METALICA",
    9.5, 0.35, 5.2,
    0, 0.3, 0,
    MAT.base
  );

  // Dos perfiles estructurales
  [-1.9, 1.9].forEach((z, i) => {

    caja(
      `PERFIL_BASE_${i + 1}`,
      9.5, 0.6, 0.45,
      0, 0.35, z,
      MAT.base
    );

  });

  // =======================================================
  // 2. CARCASA DE BOMBA
  // =======================================================

  const radioCarcasa = warman ? 2.25 : 1.65;
  const anchoCarcasa = warman ? 1.75 : 1.2;
  const alturaCentro = warman ? 3.0 : 2.5;
  const xCarcasa = -2.65;

  cilindroX(
    "CARCASA_VOLUTA",
    radioCarcasa,
    anchoCarcasa,
    xCarcasa,
    alturaCentro,
    0,
    MAT.carcasa
  );

  // Tapa frontal
  cilindroX(
    "TAPA_FRONTAL",
    radioCarcasa * 0.88,
    0.22,
    xCarcasa - anchoCarcasa / 2 - 0.1,
    alturaCentro,
    0,
    MAT.tapa
  );

  // Anillo perimetral de carcasa
  anilloX(
    "JUNTA_CARCASA",
    radioCarcasa * 0.93,
    0.1,
    xCarcasa,
    alturaCentro,
    0,
    MAT.juntas
  );

  // =======================================================
// 3 Y 4. SUCCIÓN Y DESCARGA
// =======================================================

if (warman) {

  // -----------------------------------------------------
  // WARMAN - SUCCIÓN VERTICAL SUPERIOR
  // -----------------------------------------------------

  const xSuccionUF = xCarcasa + 0.3;

  cilindroY(
    "CUELLO_SUCCION_VERTICAL",
    0.85,
    1.55,
    xSuccionUF,
    alturaCentro + radioCarcasa + 0.30,
    0,
    MAT.carcasa
  );

  cilindroY(
    "BRIDA_SUCCION_SUPERIOR",
    1.18,
    0.22,
    xSuccionUF,
    6.20,
    0,
    MAT.tapa
  );

  // -----------------------------------------------------
  // WARMAN - DESCARGA HORIZONTAL
  // Dirección negativa del eje X
  // -----------------------------------------------------

  cilindroX(
    "CUELLO_DESCARGA_HORIZONTAL",
    0.78,
    0.85,
    -3.70,
    alturaCentro,
    0,
    MAT.carcasa
  );

  cilindroX(
    "BRIDA_DESCARGA_HORIZONTAL",
    1.10,
    0.22,
    -4.17,
    alturaCentro,
    0,
    MAT.tapa
  );

} else {

  // -----------------------------------------------------
  // GOULDS - MANTENER CONFIGURACIÓN ORIGINAL
  // -----------------------------------------------------

  const xSuccion =
    xCarcasa - anchoCarcasa / 2 - 0.55;

  cilindroX(
    "CUELLO_SUCCION",
    0.75,
    0.85,
    xSuccion + 0.25,
    alturaCentro,
    0,
    MAT.carcasa
  );

  cilindroX(
    "BRIDA_SUCCION",
    1.08,
    0.22,
    xSuccion - 0.25,
    alturaCentro,
    0,
    MAT.tapa
  );

  anilloX(
    "BOCA_SUCCION",
    0.68,
    0.10,
    xSuccion - 0.37,
    alturaCentro,
    0,
    MAT.juntas
  );

  cilindroY(
    "CUELLO_DESCARGA",
    0.63,
    1.65,
    xCarcasa + 0.3,
    alturaCentro + radioCarcasa + 0.35,
    0,
    MAT.carcasa
  );

  cilindroY(
    "BRIDA_DESCARGA",
    0.87,
    0.24,
    xCarcasa + 0.3,
    alturaCentro + radioCarcasa + 1.15,
    0,
    MAT.tapa
  );
}

  // =======================================================
  // 5. PERNOS DE CARCASA
  // =======================================================

  const cantidadPernos = warman ? 12 : 8;

  for (let i = 0; i < cantidadPernos; i++) {

    const angulo = (i / cantidadPernos) * Math.PI * 2;

    const radioPernos = radioCarcasa * 0.84;

    const y =
      alturaCentro + Math.cos(angulo) * radioPernos;

    const z =
      Math.sin(angulo) * radioPernos;

    cilindroX(
      `PERNO_CARCASA_${i + 1}`,
      warman ? 0.14 : 0.1,
      0.25,
      xCarcasa - anchoCarcasa / 2 - 0.23,
      y,
      z,
      MAT.pernos
    );
  }

// =======================================================
// 6. CAJA DE SELLADO
// =======================================================

if (warman) {

  const cajaSellado = crearCajaSelladoWarman();

  cajaSellado.position.set(
    -0.95,
    alturaCentro,
    0
  );

  conjunto.add(cajaSellado);

} else {

  // Caja simplificada de las bombas Goulds

  cilindroX(
    "CAJA_DE_SELLADO",
    0.80,
    0.90,
    -0.95,
    alturaCentro,
    0,
    MAT.tapa
  );

  cilindroX(
    "BRIDA_SELLO_MECANICO",
    0.74,
    0.20,
    -0.45,
    alturaCentro,
    0,
    MAT.sello
  );

}

  // =======================================================
  // 7. EJE PRINCIPAL
  // =======================================================

  cilindroX(
    "EJE_PRINCIPAL",
    0.24,
    3.3,
    0.8,
    alturaCentro,
    0,
    MAT.eje
  );

  // =======================================================
  // 8. SOPORTE DE RODAMIENTOS
  // =======================================================

  cilindroX(
    "BASTIDOR_RODAMIENTOS",
    warman ? 0.85 : 0.67,
    1.6,
    0.65,
    alturaCentro,
    0,
    MAT.rodamiento
  );

  cilindroX(
    "TAPA_RODAMIENTO",
    0.78,
    0.18,
    1.55,
    alturaCentro,
    0,
    MAT.tapa
  );

  caja(
    "SOPORTE_RODAMIENTOS",
    1.8,
    alturaCentro - 0.7,
    1.55,
    0.65,
    (alturaCentro + 0.7) / 2,
    0,
    MAT.rodamiento
  );

  // =======================================================
  // 9. ACOPLAMIENTO
  // =======================================================

  cilindroX(
    "ACOPLAMIENTO",
    0.43,
    0.8,
    2.05,
    alturaCentro,
    0,
    MAT.acoplamiento
  );

  cilindroX(
    "GUARDA_ACOPLAMIENTO",
    0.58,
    1.1,
    2.05,
    alturaCentro,
    0,
    MAT.juntas
  );

  // =======================================================
  // 10. MOTOR ELÉCTRICO
  // =======================================================

  const xMotor = 3.45;
  const radioMotor = warman ? 1.12 : 0.9;

  cilindroX(
    "MOTOR_ELECTRICO",
    radioMotor,
    2.0,
    xMotor,
    alturaCentro,
    0,
    MAT.motor
  );

  // Aletas de refrigeración del motor
  for (let i = 0; i < 10; i++) {

    const x = xMotor - 0.85 + i * 0.19;

    anilloX(
      `ALETA_MOTOR_${i + 1}`,
      radioMotor,
      0.055,
      x,
      alturaCentro,
      0,
      MAT.nervios
    );
  }

  // Tapa trasera
  cilindroX(
    "TAPA_MOTOR",
    radioMotor * 0.9,
    0.24,
    xMotor + 1.08,
    alturaCentro,
    0,
    MAT.motor
  );

  // Caja de conexiones eléctricas
  caja(
    "CAJA_BORNES",
    0.85,
    0.48,
    0.85,
    xMotor,
    alturaCentro + radioMotor + 0.2,
    0,
    MAT.motor
  );

// =======================================================
// TERMOSIFÓN INDIVIDUAL PARA BOMBAS WARMAN
// =======================================================

if (warman) {

  const materialDeposito = new THREE.MeshStandardMaterial({
    color: 0xB8BEC3,
    metalness: 0.65,
    roughness: 0.38
  });

  const materialTuberia = new THREE.MeshStandardMaterial({
    color: 0x9BA9B3,
    metalness: 0.5,
    roughness: 0.4
  });

  const materialManometro = new THREE.MeshStandardMaterial({
    color: 0xE6EDF2,
    metalness: 0.2,
    roughness: 0.4
  });

  // Posición local del termosifón
  const TS = {
    x: -0.5,
    y: 5.3,
    z: -3.4,

    radio: 0.50,
    altura: 3.6
  };

  // -----------------------------------------------------
  // DEPÓSITO VERTICAL
  // -----------------------------------------------------

  cilindroY(
    "TERMOSIFON_DEPOSITO",
    TS.radio,
    TS.altura,
    TS.x,
    TS.y,
    TS.z,
    materialDeposito
  );

  // Tapa superior
  cilindroY(
    "TERMOSIFON_TAPA_SUPERIOR",
    0.55,
    0.16,
    TS.x,
    TS.y + TS.altura / 2,
    TS.z,
    MAT.sello
  );

  // Tapa inferior
  cilindroY(
    "TERMOSIFON_TAPA_INFERIOR",
    0.55,
    0.16,
    TS.x,
    TS.y - TS.altura / 2,
    TS.z,
    MAT.sello
  );

  // -----------------------------------------------------
  // SOPORTE DEL DEPÓSITO
  // -----------------------------------------------------

  caja(
    "TERMOSIFON_SOPORTE",
    0.20,
    2.2,
    0.20,
    TS.x,
    2.4,
    TS.z,
    MAT.base
  );

  // -----------------------------------------------------
  // MANÓMETRO SUPERIOR
  // -----------------------------------------------------

  cilindroY(
    "TERMOSIFON_CONEXION_MANOMETRO",
    0.12,
    0.55,
    TS.x,
    TS.y + 2.05,
    TS.z,
    materialTuberia
  );

  const manometro = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.35,
      0.35,
      0.16,
      32
    ),
    materialManometro
  );

  manometro.name = "TERMOSIFON_MANOMETRO";
  manometro.rotation.x = Math.PI / 2;

  manometro.position.set(
    TS.x,
    TS.y + 2.45,
    TS.z
  );

  conjunto.add(manometro);

  // -----------------------------------------------------
  // FUNCIÓN PARA TUBOS DE CONEXIÓN
  // -----------------------------------------------------

  function tuboTermosifon(nombre, puntos, radio = 0.09) {

    const grupoTubo = new THREE.Group();
    grupoTubo.name = nombre;

    const coordenadas = puntos.map(
      p => new THREE.Vector3(...p)
    );

    for (let i = 0; i < coordenadas.length - 1; i++) {

      const a = coordenadas[i];
      const b = coordenadas[i + 1];

      const direccion = new THREE.Vector3()
        .subVectors(b, a);

      const largo = direccion.length();

      if (largo < 0.001) continue;

      const tubo = new THREE.Mesh(
        new THREE.CylinderGeometry(
          radio,
          radio,
          largo,
          12
        ),
        materialTuberia
      );

      tubo.position.copy(a).add(b).multiplyScalar(0.5);

      tubo.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direccion.normalize()
      );

      grupoTubo.add(tubo);
    }

    // Uniones de los cambios de dirección
    coordenadas.slice(1, -1).forEach(p => {

      const codo = new THREE.Mesh(
        new THREE.SphereGeometry(radio, 12, 8),
        materialTuberia
      );

      codo.position.copy(p);
      grupoTubo.add(codo);
    });

    conjunto.add(grupoTubo);
  }

  // -----------------------------------------------------
  // CONEXIÓN SUPERIOR AL SELLO
  // -----------------------------------------------------

  tuboTermosifon(
    "TERMOSIFON_LINEA_SUPERIOR",
    [
      [TS.x, TS.y + 1.25, TS.z],
      [TS.x, TS.y + 1.25, -2.1],
      [-0.95, 4.3, -2.1],
      [-0.95, 4.3, -0.65]
    ]
  );

  // -----------------------------------------------------
  // CONEXIÓN INFERIOR AL SELLO
  // -----------------------------------------------------

  tuboTermosifon(
    "TERMOSIFON_LINEA_INFERIOR",
    [
      [TS.x, TS.y - 1.25, TS.z],
      [TS.x, TS.y - 1.25, -2.1],
      [-0.95, 3.2, -2.1],
      [-0.95, 3.2, -0.65]
    ]
  );

}

  // =======================================================
  // 11. DIFERENCIAS ENTRE WARMAN Y GOULDS
  // =======================================================

  if (warman) {

    // Refuerzos externos de carcasa para pulpa
    for (let i = 0; i < 6; i++) {

      const angulo = i * Math.PI / 3;

      const y =
        alturaCentro + Math.cos(angulo) * 1.75;

      const z =
        Math.sin(angulo) * 1.75;

      cilindroX(
        `REFUERZO_CARCASA_${i + 1}`,
        0.20,
        anchoCarcasa + 0.25,
        xCarcasa,
        y,
        z,
        MAT.tapa
      );
    }

  } else {

    // Refuerzo de pie de carcasa Goulds
    caja(
      "PIE_CARCASA",
      1.25,
      0.8,
      1.6,
      xCarcasa,
      0.8,
      0,
      MAT.carcasa
    );

    // Indicador visual de aceite del bastidor
    const visorAceite = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 16, 12),
      MAT.acoplamiento
    );

    visorAceite.name = "VISOR_ACEITE";
    visorAceite.position.set(0.65, 2.1, 0.68);
    conjunto.add(visorAceite);

  }

  // =======================================================
  // 12. ESCALA DE REPRESENTACIÓN
  // =======================================================

  // Las bombas de agua están separadas 6 m.
  // Se reduce su geometría para evitar superposición.
  // La escala es visual, todavía no dimensional.

  if (!warman) {
    conjunto.scale.setScalar(0.55);
  }

  // =======================================================
  // 13. ETIQUETA
  // =======================================================

  agregarEtiqueta(
    grupo,
    datos.id,
    warman ? 9 : 6.5
  );

// =======================================================
// 14. ORIENTACIÓN
// =======================================================

// Bombas UF: mantienen su orientación original.
// Bombas de agua (Goulds): giran 180° respecto
// a su orientación actual, sobre el eje Y.

grupo.rotation.y = warman
  ? 0
  : -Math.PI / 2;

  // =======================================================
  // 15. POSICIÓN ORIGINAL
  // =======================================================

  grupo.position.set(
    datos.x,
    datos.y,
    datos.z
  );

  return grupo;
}

// =========================================================
// 8. CONSTRUIR PLANTA
// =========================================================

export function crearPlantaIndustrial() {

  const planta = new THREE.Group();

  planta.name = "PLANTA_INDUSTRIAL";

  const equipos = [];

  // Espesadores
  DISTRIBUCION.espesadores.forEach(datos => {
    const equipo = crearEspesador(datos);
    planta.add(equipo);
    equipos.push(equipo);
  });

  // Tanques
  DISTRIBUCION.tanques.forEach(datos => {
    const equipo = crearTanque(datos);
    planta.add(equipo);
    equipos.push(equipo);
  });

 // =======================================================
// BOMBAS UF — MODELO SEGÚN FOTOGRAFÍA
// =======================================================

DISTRIBUCION.bombasUF.forEach(datos => {

  const equipo = crearBombaWarman(datos);

  planta.add(equipo);
  equipos.push(equipo);

});

  // Bombas de agua
  DISTRIBUCION.bombasAgua.forEach(datos => {
    const equipo = crearBomba(datos, "bombaAgua");
    planta.add(equipo);
    equipos.push(equipo);
  });

  // =======================================================
  // PISO
  // =======================================================

  const piso = new THREE.Mesh(
    new THREE.PlaneGeometry(260, 220),
    M.suelo
  );

  piso.name = "PISO_PLANTA";
  piso.rotation.x = -Math.PI / 2;

  piso.position.set(72, -0.5, 35);

  planta.add(piso);

  // =======================================================
  // INFORMACIÓN GENERAL
  // =======================================================

  planta.userData = {
    version: "2.0",
    equipos,
    espesadores: 4,
    tanques: 4,
    bombasUF: 8,
    bombasAgua: 5,
    tuberiasVisibles: false
  };

/* =========================================================
   AGREGAR SISTEMA DE TUBERÍAS
   ========================================================= */

const sistemaTuberias = crearTuberias(DISTRIBUCION);

planta.add(sistemaTuberias);

planta.userData.tuberiasVisibles = true;

  return planta;
}