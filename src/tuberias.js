import * as THREE from "three";

/* =========================================================
   SISTEMA DE TUBERÍAS INDUSTRIALES — V1

   OF: Espesadores → Tanques
   UF: Espesadores → Bombas A/B
   Agua: Tanques → Colector → 5 bombas
   Refrigeración: PA-05 → 8 sellos mecánicos

   X, Y, Z en metros

   Colores:
   Azul  = Overflow / agua
   Marrón = Underflow
   Verde = Refrigeración de sellos
   Amarillo = Válvulas abiertas
   Rojo = Válvulas cerradas
   ========================================================= */

export function crearTuberias(DISTRIBUCION) {

  const sistema = new THREE.Group();
  sistema.name = "SISTEMA_TUBERIAS";

  const COLORES = {
    of: 0x1686C4,
    uf: 0xA56D34,
    agua: 0x087CB2,
    refrigeracion: 0x25B978,
    abierta: 0xE7B747,
    cerrada: 0xD84B4B
  };

  const materiales = {};

  for (const [nombre, color] of Object.entries(COLORES)) {
    materiales[nombre] = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.35,
      roughness: 0.45
    });
  }

  // =======================================================
  // CREAR TUBERÍA ENTRE PUNTOS XYZ
  // =======================================================

  function tuberia(nombre, puntos, radio, servicio) {

    const grupo = new THREE.Group();

    grupo.name = nombre;

    grupo.userData = {
      tipo: "tuberia",
      servicio,
      radio,
      puntos: puntos.map(p => [...p])
    };

    const mat = materiales[servicio];

    const coordenadas = puntos.map(
      p => new THREE.Vector3(...p)
    );

    for (let i = 0; i < coordenadas.length - 1; i++) {

      const inicio = coordenadas[i];
      const fin = coordenadas[i + 1];

      const direccion = new THREE.Vector3()
        .subVectors(fin, inicio);

      const largo = direccion.length();

      if (largo < 0.001) continue;

      const cilindro = new THREE.Mesh(
        new THREE.CylinderGeometry(
          radio,
          radio,
          largo,
          16
        ),
        mat
      );

      cilindro.position
        .copy(inicio)
        .add(fin)
        .multiplyScalar(0.5);

      cilindro.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direccion.normalize()
      );

      cilindro.castShadow = true;

      grupo.add(cilindro);
    }

    // Uniones redondeadas en cambios de dirección
    for (const punto of coordenadas.slice(1, -1)) {

      const union = new THREE.Mesh(
        new THREE.SphereGeometry(radio, 12, 8),
        mat
      );

      union.position.copy(punto);
      grupo.add(union);
    }

    sistema.add(grupo);

    return grupo;
  }

/* =========================================================
   VÁLVULAS INDUSTRIALES 3D

   - Tamaño según diámetro de tubería
   - Orientación según dirección de tubería
   - Bridas y cuerpo industrial
   - Bonete, vástago y volante
   - Amarillo: abierta
   - Rojo: cerrada
   ========================================================= */

function valvula(nombre, x, y, z, abierta = true) {

  const grupo = new THREE.Group();

  grupo.name = nombre;
  grupo.position.set(x, y, z);

  // =======================================================
  // 1. IDENTIFICAR TUBERÍA CERCANA
  // =======================================================

  const posicionValvula = new THREE.Vector3(x, y, z);

  let radioTuberia = 0.3;
  let direccionTuberia = new THREE.Vector3(1, 0, 0);
  let distanciaMinima = Infinity;

  sistema.children.forEach(objeto => {

    if (objeto.userData.tipo !== "tuberia") return;

    const puntos = objeto.userData.puntos;

    if (!puntos || puntos.length < 2) return;

    for (let i = 0; i < puntos.length - 1; i++) {

      const inicio = new THREE.Vector3(...puntos[i]);
      const fin = new THREE.Vector3(...puntos[i + 1]);

      const segmento = new THREE.Line3(inicio, fin);
      const cercano = new THREE.Vector3();

      segmento.closestPointToPoint(
        posicionValvula,
        true,
        cercano
      );

      const distancia = posicionValvula.distanceTo(cercano);

      if (distancia < distanciaMinima) {

        distanciaMinima = distancia;

        radioTuberia = objeto.userData.radio;

        direccionTuberia = new THREE.Vector3()
          .subVectors(fin, inicio)
          .normalize();
      }
    }
  });

  // =======================================================
  // 2. DIMENSIONES PROPORCIONALES
  // =======================================================

  const R = radioTuberia;

  const cuerpoRadio = R * 1.65;
  const longitud = R * 3.5;

  const radioBrida = R * 1.45;
  const espesorBrida = Math.max(R * 0.35, 0.04);

  const alturaBonete = R * 1.8;
  const alturaVastago = R * 2.5;

  const radioVolante = R * 2.2;

  // =======================================================
  // 3. MATERIALES
  // =======================================================

  const materialCuerpo = new THREE.MeshStandardMaterial({
    color: abierta ? 0xD4A63A : 0xC94A43,
    metalness: 0.45,
    roughness: 0.42
  });

  const materialAcero = new THREE.MeshStandardMaterial({
    color: 0xAEB8C2,
    metalness: 0.75,
    roughness: 0.3
  });

  const materialOscuro = new THREE.MeshStandardMaterial({
    color: 0x445566,
    metalness: 0.5,
    roughness: 0.5
  });

  // =======================================================
  // 4. CUERPO Y BRIDAS
  // =======================================================

  const cuerpoOrientado = new THREE.Group();
  grupo.add(cuerpoOrientado);

  // Eje local Y alineado con la tubería
  cuerpoOrientado.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direccionTuberia
  );

  const cuerpo = new THREE.Mesh(
    new THREE.CylinderGeometry(
      cuerpoRadio,
      cuerpoRadio,
      longitud,
      24
    ),
    materialCuerpo
  );

  cuerpo.name = "CUERPO_VALVULA";
  cuerpoOrientado.add(cuerpo);

  // Bridas en ambos extremos
  [-1, 1].forEach((lado, i) => {

    const brida = new THREE.Mesh(
      new THREE.CylinderGeometry(
        radioBrida,
        radioBrida,
        espesorBrida,
        24
      ),
      materialAcero
    );

    brida.name = `BRIDA_${i + 1}`;
    brida.position.y = lado * longitud / 2;

    cuerpoOrientado.add(brida);

  });

  // =======================================================
  // 5. BONETE SUPERIOR
  // =======================================================

  const bonete = new THREE.Mesh(
    new THREE.BoxGeometry(
      cuerpoRadio * 1.4,
      alturaBonete,
      cuerpoRadio * 1.4
    ),
    materialCuerpo
  );

  bonete.name = "BONETE";

  bonete.position.y =
    cuerpoRadio + alturaBonete / 2;

  grupo.add(bonete);

  // =======================================================
  // 6. VÁSTAGO
  // =======================================================

  const vastago = new THREE.Mesh(
    new THREE.CylinderGeometry(
      R * 0.22,
      R * 0.22,
      alturaVastago,
      12
    ),
    materialAcero
  );

  vastago.name = "VASTAGO";

  vastago.position.y =
    cuerpoRadio + alturaBonete + alturaVastago / 2;

  grupo.add(vastago);

  // =======================================================
  // 7. VOLANTE
  // =======================================================

  const volante = new THREE.Mesh(
    new THREE.TorusGeometry(
      radioVolante,
      Math.max(R * 0.18, 0.025),
      10,
      32
    ),
    materialOscuro
  );

  volante.name = "VOLANTE";

  volante.rotation.x = Math.PI / 2;

  volante.position.y =
    cuerpoRadio + alturaBonete + alturaVastago;

  grupo.add(volante);

  // Radios interiores del volante
  for (let i = 0; i < 4; i++) {

    const angulo = i * Math.PI / 2;

    const largoRadio = radioVolante * 2;

    const barra = new THREE.Mesh(
      new THREE.CylinderGeometry(
        R * 0.10,
        R * 0.10,
        largoRadio,
        8
      ),
      materialOscuro
    );

    barra.rotation.z = Math.PI / 2;

    barra.rotation.y = angulo;

    barra.position.copy(volante.position);

    grupo.add(barra);
  }

  // =======================================================
  // 8. DATOS
  // =======================================================

  grupo.userData = {
    tipo: "valvula",
    abierta,
    estado: abierta ? "abierta" : "cerrada",
    radioTuberia: R,
    diametroTuberia: R * 2,
    modelo: "Valvula industrial simplificada"
  };

  sistema.add(grupo);

  return grupo;
}
  // =======================================================
  // BUSCAR EQUIPO
  // =======================================================

  function buscar(lista, id) {
    const equipo = lista.find(e => e.id === id);

    if (!equipo) {
      throw new Error(`No existe el equipo: ${id}`);
    }

    return equipo;
  }

  // =======================================================
  // 1. LÍNEAS OVERFLOW
  // ESPESADORES → TANQUES
  // =======================================================

  DISTRIBUCION.espesadores.forEach((esp, i) => {

    const tk = DISTRIBUCION.tanques[i];

    // Salida OF aproximada a nivel superior
    const salida = [
      esp.x + 14,
      esp.y + 8.5,
      esp.z
    ];

    const zIntermedio = 24;

    tuberia(
      `OF_${esp.id}_${tk.id}`,
      [
        salida,

        [esp.x + 20, salida[1], esp.z],

        [esp.x + 20, salida[1], zIntermedio],

        [tk.x, salida[1], zIntermedio],

        [tk.x, tk.y + 14.5, zIntermedio],

        [tk.x, tk.y + 14.5, tk.z]
      ],
      0.45,
      "of"
    );

  });

// =======================================================
// 2. SISTEMA UNDERFLOW — ESPESADORES
//
// SUCCIÓN: AXIAL HORIZONTAL
// DESCARGA: TANGENCIAL SUPERIOR
//
// Dos bombas por espesador:
// A = operativa
// B = standby
// =======================================================

DISTRIBUCION.espesadores.forEach((esp, i) => {

  // Buscar las bombas según su orden en DISTRIBUCION
// Espesador 1 → UF-4A / UF-4B
// Espesador 2 → UF-3A / UF-3B
// Espesador 3 → UF-2A / UF-2B
// Espesador 4 → UF-1A / UF-1B

const bombaA = DISTRIBUCION.bombasUF[i * 2];
const bombaB = DISTRIBUCION.bombasUF[i * 2 + 1];

if (!bombaA || !bombaB) {
  throw new Error(
    `Faltan bombas UF para ${esp.id}`
  );
}

  const bombas = [bombaA, bombaB];

  // =====================================================
  // CONEXIONES DEL MODELO 3D
  // =====================================================

  const CONEXION = {
  succion: {
    x: -4.45,
    y: 2.70,
    z: 0
  },

  descarga: {
    x: -3.35,
    y: 5.99,
    z: 0
  }
};

  // =====================================================
  // COLECTORES
  // =====================================================

  const xSuccion = esp.x - 11;
  const ySuccion = 7.5;

 const xDescarga = esp.x - 14;
const yDescarga = 9.5;

  const zA = bombaA.z;
  const zB = bombaB.z;

  const zMin = Math.min(zA, zB);
  const zMax = Math.max(zA, zB);

  // =====================================================
  // 2.1 BAJADA UF DESDE ESPESADOR
  // =====================================================

  tuberia(
    `UF_${esp.id}_BAJADA`,
    [
      // Salida inferior del espesador
      [
        esp.x,
        esp.y - 0.5,
        esp.z
      ],

      // Bajada vertical
      [
        esp.x,
        ySuccion,
        esp.z
      ],

      // Codo hacia colector de succión
      [
        xSuccion,
        ySuccion,
        esp.z
      ]
    ],
    0.50,
    "uf"
  );

  // =====================================================
  // 2.2 COLECTOR COMÚN DE SUCCIÓN
  // =====================================================

  tuberia(
    `UF_${esp.id}_COLECTOR_SUCCION`,
    [
      [xSuccion, ySuccion, zMin],
      [xSuccion, ySuccion, zMax]
    ],
    0.45,
    "uf"
  );

  // Conexión de la bajada al colector
  tuberia(
    `UF_${esp.id}_UNION_SUCCION`,
    [
      [xSuccion, ySuccion, esp.z],
      [xSuccion, ySuccion, zMin]
    ],
    0.45,
    "uf"
  );

  // =====================================================
  // 2.3 CONEXIONES INDIVIDUALES
  // =====================================================

  bombas.forEach(bomba => {

    const operativa =
      bomba.estado !== "standby";

    // ---------------------------------------------------
    // POSICIÓN DE BRIDA DE SUCCIÓN AXIAL
    // ---------------------------------------------------

    const sx =
      bomba.x + CONEXION.succion.x;

    const sy =
      bomba.y + CONEXION.succion.y;

    const sz =
      bomba.z + CONEXION.succion.z;

    // ---------------------------------------------------
    // SUCCIÓN:
    // COLECTOR → BAJADA → ENTRADA HORIZONTAL
    // ---------------------------------------------------

    tuberia(
      `SUCCION_${bomba.id}`,
      [
        [xSuccion, ySuccion, bomba.z],

        [xSuccion, sy, bomba.z],

        [sx, sy, sz]
      ],
      0.35,
      "uf"
    );

    // Válvula de succión horizontal
   valvula(
  `V_SUCCION_${bomba.id}`,
  (xSuccion + sx) / 2,
  sy,
  sz,
  operativa
);

    // ---------------------------------------------------
    // POSICIÓN DE DESCARGA TANGENCIAL SUPERIOR
    // ---------------------------------------------------

    const dx =
      bomba.x + CONEXION.descarga.x;

    const dy =
      bomba.y + CONEXION.descarga.y;

    const dz =
      bomba.z + CONEXION.descarga.z;

    // ---------------------------------------------------
    // DESCARGA:
    // VOLUTA → ASCENSO VERTICAL → COLECTOR
    // ---------------------------------------------------

    tuberia(
      `DESCARGA_${bomba.id}`,
      [
        // Brida superior de la voluta
        [dx, dy, dz],

        // Descarga vertical
        [dx, yDescarga, dz],

        // Codo hacia colector común
        [xDescarga, yDescarga, dz]
      ],
      0.35,
      "uf"
    );

    // =====================================================
// VÁLVULA DE DESCARGA EN TRAMO HORIZONTAL
// =====================================================

// Se ubica a mitad de distancia entre el codo
// superior de la bomba y el colector común.

const xValvulaDescarga = (dx + xDescarga) / 2;

valvula(
  `V_DESCARGA_${bomba.id}`,
  xValvulaDescarga,
  yDescarga,
  dz,
  operativa
);

  });

  // =====================================================
  // 2.4 COLECTOR COMÚN DE DESCARGA
  // =====================================================

  tuberia(
    `UF_${esp.id}_COLECTOR_DESCARGA`,
    [
      [xDescarga, yDescarga, zMin],
      [xDescarga, yDescarga, zMax]
    ],
    0.45,
    "uf"
  );

  // =====================================================
  // 2.5 SALIDA FINAL DE UNDERFLOW
  // =====================================================

  tuberia(
    `UF_${esp.id}_SALIDA_FINAL`,
    [
      [xDescarga, yDescarga, esp.z],

      [xDescarga - 12, yDescarga, esp.z]
    ],
    0.45,
    "uf"
  );

});

  // =======================================================
  // 3. TANQUES → COLECTOR PRINCIPAL DE AGUA
  // =======================================================

  const Z_COLECTOR = 87;
  const Y_COLECTOR = 3;

  DISTRIBUCION.tanques.forEach(tk => {

    const salidaZ = tk.z + 9;

    tuberia(
      `SALIDA_${tk.id}`,
      [
        [tk.x, tk.y + 3, salidaZ],
        [tk.x, Y_COLECTOR, Z_COLECTOR]
      ],
      0.5,
      "agua"
    );

    valvula(
      `V_SALIDA_${tk.id}`,
      tk.x,
      Y_COLECTOR,
      salidaZ + 7,
      true
    );

  });

  // Colector compartido por los cuatro tanques
  const xs = [
    ...DISTRIBUCION.tanques.map(t => t.x),
    ...DISTRIBUCION.bombasAgua.map(b => b.x)
  ];

  const X_MIN = Math.min(...xs);
  const X_MAX = Math.max(...xs);

  tuberia(
    "COLECTOR_PRINCIPAL_AGUA",
    [
      [X_MIN, Y_COLECTOR, Z_COLECTOR],
      [X_MAX, Y_COLECTOR, Z_COLECTOR]
    ],
    0.75,
    "agua"
  );

// =======================================================
// 4. SUCCIÓN Y DESCARGA DE LAS CINCO BOMBAS GOULDS
// =======================================================

// Medidas referenciales según la geometría actual
// de crearBomba().
//
// Bombas Goulds:
// escala = 0.55
// rotación Y = -Math.PI / 2
//
// Succión axial y descarga vertical.

const GOULDS = {
  escala: 0.55,

  // Posición local de la boca de succión
  xSuccion: -4.16,
  ySuccion: 2.5,

  // Posición local de la brida de descarga
  xDescarga: -2.35,
  yDescarga: 5.42,

  // Altura del recorrido de descarga
  alturaDescarga: 6.5,

  // Prolongación posterior de descarga
  zFinalDescarga: 14
};

// Calcular conexiones en coordenadas globales.
// Esta versión corresponde a la rotación -90°
// aprobada para las bombas de agua.

function conexionesGoulds(bomba) {

  const s = GOULDS.escala;

  return {
    succion: [
      bomba.x,
      bomba.y + GOULDS.ySuccion * s,
      bomba.z + GOULDS.xSuccion * s
    ],

    descarga: [
      bomba.x,
      bomba.y + GOULDS.yDescarga * s,
      bomba.z + GOULDS.xDescarga * s
    ]
  };
}

// =======================================================
// 4.1 LÍNEAS INDIVIDUALES DE SUCCIÓN
// =======================================================

DISTRIBUCION.bombasAgua.forEach(bomba => {

  const conexion = conexionesGoulds(bomba);

  const [sx, sy, sz] = conexion.succion;

  // Punto previo a la succión
  const zValvula = bomba.z - 8;
  const zCambioNivel = bomba.z - 12;

  tuberia(
    `SUCCION_${bomba.id}`,
    [
      // Colector principal
      [bomba.x, Y_COLECTOR, Z_COLECTOR],

      // Avance horizontal desde colector
      [bomba.x, Y_COLECTOR, zCambioNivel],

      // Cambio de elevación
      [bomba.x, sy, zCambioNivel],

      // Llegada directa a brida de succión
      [sx, sy, sz]
    ],
    0.34,
    "agua"
  );

  // Válvula individual de succión
  valvula(
    `V_SUCCION_${bomba.id}`,
    bomba.x,
    sy,
    zValvula,
    bomba.id === "PA-05"
  );

});

// =======================================================
// 4.2 DESCARGAS DE PA-01 A PA-04
// =======================================================

DISTRIBUCION.bombasAgua
  .filter(bomba => bomba.id !== "PA-05")
  .forEach(bomba => {

    const conexion = conexionesGoulds(bomba);

    const [dx, dy, dz] = conexion.descarga;

    const ySuperior =
      bomba.y + GOULDS.alturaDescarga;

    const zFinal =
      bomba.z + GOULDS.zFinalDescarga;

    tuberia(
      `DESCARGA_${bomba.id}`,
      [
        // Brida superior real de bomba
        [dx, dy, dz],

        // Ascenso vertical
        [dx, ySuperior, dz],

        // Codo y recorrido horizontal
        [dx, ySuperior, zFinal]
      ],
      0.28,
      "agua"
    );

    // Válvula en tramo vertical
    valvula(
      `V_DESCARGA_${bomba.id}`,
      dx,
      dy + 1.5,
      dz,
      false
    );

  });

// =======================================================
// 5. PA-05 — REFRIGERACIÓN DE SELLOS MECÁNICOS
// =======================================================

const pa05 = buscar(
  DISTRIBUCION.bombasAgua,
  "PA-05"
);

const conexionPA05 = conexionesGoulds(pa05);

const [dx05, dy05, dz05] =
  conexionPA05.descarga;

const xRefrigeracion = Math.max(
  ...DISTRIBUCION.espesadores.map(e => e.x),
  ...DISTRIBUCION.bombasAgua.map(b => b.x)
) + 30;

const zRefrigeracion = Math.min(
  ...DISTRIBUCION.bombasUF.map(b => b.z)
) - 17;

const yRefrigeracion = 6;

// Línea desde la brida de descarga de PA-05
tuberia(
  "PA05_LINEA_REFRIGERACION",
  [
    // Brida superior
    [dx05, dy05, dz05],

    // Ascenso
    [dx05, pa05.y + 6.5, dz05],

    // Salida horizontal
    [
      dx05,
      pa05.y + 6.5,
      pa05.z + 14
    ],

    // Recorrido lateral
    [
      xRefrigeracion,
      pa05.y + 6.5,
      pa05.z + 14
    ],

    // Conexión al colector de refrigeración
    [
      xRefrigeracion,
      yRefrigeracion,
      zRefrigeracion
    ]
  ],
  0.25,
  "refrigeracion"
);

// Válvula de descarga PA-05
valvula(
  "V_DESCARGA_PA05",
  dx05,
  dy05 + 1.5,
  dz05,
  true
);

// =======================================================
// 5.1 COLECTOR DE REFRIGERACIÓN DE SELLOS
// =======================================================

const xsUF = DISTRIBUCION.bombasUF.map(
  b => b.x
);

tuberia(
  "COLECTOR_REFRIGERACION_SELLOS",
  [
    [
      Math.min(...xsUF),
      yRefrigeracion,
      zRefrigeracion
    ],
    [
      xRefrigeracion,
      yRefrigeracion,
      zRefrigeracion
    ]
  ],
  0.3,
  "refrigeracion"
);
// =======================================================
// 6. AGUA DE REFRIGERACIÓN A LOS 8 TERMOSIFONES
//
// Alimentación desde arriba, según fotografía real.
// =======================================================

DISTRIBUCION.bombasUF.forEach(bomba => {

  // Posición del termosifón en bombaWarman.js
  const TS = {
    x: bomba.x - 0.5,
    ySuperior: bomba.y + 6.82,
    z: bomba.z - 3.5
  };

  // Nivel de la tubería de alimentación
  const yAlimentacion = bomba.y + 9.5;

  tuberia(
    `AGUA_TERMOSIFON_${bomba.id}`,
    [
      // Conexión al colector verde
      [
        bomba.x,
        yRefrigeracion,
        zRefrigeracion
      ],

      // Subida al nivel de alimentación
      [
        bomba.x,
        yAlimentacion,
        zRefrigeracion
      ],

      // Recorrido horizontal hasta el termosifón
      [
        TS.x,
        yAlimentacion,
        zRefrigeracion
      ],

      [
        TS.x,
        yAlimentacion,
        TS.z
      ],

      // Bajada vertical hacia el termosifón
      [
        TS.x,
        TS.ySuperior,
        TS.z
      ]
    ],
    0.12,
    "refrigeracion"
  );

  // =====================================================
// VÁLVULA DE AGUA EN TRAMO HORIZONTAL
// =====================================================

// Ubicada en la tubería horizontal,
// antes de la bajada vertical al termosifón.

const zValvulaAgua = TS.z - 1.5;

valvula(
  `V_AGUA_TERMOSIFON_${bomba.id}`,
  TS.x,
  yAlimentacion,
  zValvulaAgua,
  bomba.estado !== "standby"
);

});

  // =======================================================
  // 7. DATOS DEL SISTEMA
  // =======================================================

  sistema.userData = {
    tipo: "red_tuberias",
    version: "1.0",
    servicios: [
      "overflow",
      "underflow",
      "agua",
      "refrigeracion"
    ],
    bombaRefrigeracion: "PA-05",
    conexiones: "conceptuales",
    retornoRefrigeracion: "pendiente de definir",
    estadosValvulas: "representacion inicial"
  };

  return sistema;
}