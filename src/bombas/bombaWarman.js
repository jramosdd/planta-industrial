import * as THREE from "three";

/* =========================================================
   BOMBA DE PULPA — REFERENCIA FOTOGRÁFICA

   Motor elevado
   Transmisión por correas
   Succión axial horizontal (-X)
   Descarga vertical (+Y)
   Caja de sellado independiente
   Termosifón individual

   Coordenadas locales:
   X = eje longitudinal
   Y = altura
   Z = profundidad

   Modelo conceptual, no dimensional.
   ========================================================= */

export const CONEXIONES_WARMAN = {
  succion: [-4.45, 2.7, 0],
  descarga: [-2.15, 5.75, 0]
};

export function crearBombaWarman(datos) {

  const bomba = new THREE.Group();
  bomba.name = datos.id;

  bomba.userData = {
    id: datos.id,
    tipo: "bombaUF",
    estado: datos.estado,
    modeloReferencia: "Bomba de pulpa",
    conexiones: CONEXIONES_WARMAN
  };

  const MAT = {};

  function material(color, metalness = 0.35, opacity = 1) {
    return new THREE.MeshStandardMaterial({
      color,
      metalness,
      roughness: 0.5,
      transparent: opacity < 1,
      opacity,
      side: THREE.DoubleSide
    });
  }

  MAT.carcasa = material(0x005889);
  MAT.tapa = material(0x087CB2);
  MAT.acero = material(0xAEB8C2, 0.7);
  MAT.soporte = material(0x526575);
  MAT.motor = material(0x64788A);
  MAT.base = material(0x34495E);
  MAT.pernos = material(0xBBC4CC, 0.65);
  MAT.correa = material(0x20252A, 0.05);
  MAT.polea = material(0x646B72, 0.6);
  MAT.guarda = material(0xA5AFB8, 0.2, 0.28);
  MAT.termosifon = material(0xC62828, 0.45);
  MAT.tubos = material(0x9BA9B3, 0.5);

  /* =======================================================
     FUNCIONES GEOMÉTRICAS
     ======================================================= */

  function cilindro(
    nombre, radio, largo, x, y, z, mat, eje = "x"
  ) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(
        radio, radio, largo, 40
      ),
      mat
    );

    mesh.name = nombre;

    if (eje === "x") {
      mesh.rotation.z = Math.PI / 2;
    }

    if (eje === "z") {
      mesh.rotation.x = Math.PI / 2;
    }

    mesh.position.set(x, y, z);
    bomba.add(mesh);

    return mesh;
  }

  function caja(
    nombre, ancho, alto, fondo, x, y, z, mat
  ) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(ancho, alto, fondo),
      mat
    );

    mesh.name = nombre;
    mesh.position.set(x, y, z);
    bomba.add(mesh);

    return mesh;
  }

  function anillo(
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
    bomba.add(mesh);

    return mesh;
  }

  function tubo(nombre, puntos, radio, mat) {

    const grupo = new THREE.Group();
    grupo.name = nombre;

    for (let i = 0; i < puntos.length - 1; i++) {

      const a = new THREE.Vector3(...puntos[i]);
      const b = new THREE.Vector3(...puntos[i + 1]);

      const dir = new THREE.Vector3()
        .subVectors(b, a);

      const largo = dir.length();

      if (largo < 0.001) continue;

      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(
          radio, radio, largo, 12
        ),
        mat
      );

      mesh.position.copy(a)
        .add(b)
        .multiplyScalar(0.5);

      mesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dir.normalize()
      );

      grupo.add(mesh);
    }

    bomba.add(grupo);
    return grupo;
  }

  /* =======================================================
     1. BASE
     ======================================================= */

  caja(
    "BASE_PRINCIPAL",
    9.5, 0.35, 4.3,
    0, 0.25, 0,
    MAT.base
  );

  [-1.65, 1.65].forEach((z, i) => {
    caja(
      `PERFIL_BASE_${i}`,
      9.5, 0.5, 0.4,
      0, 0.45, z,
      MAT.base
    );
  });

  /* =======================================================
     2. CARCASA DE BOMBA
     ======================================================= */

  cilindro(
    "CARCASA_VOLUTA",
    1.8, 1.45,
    -2.45, 2.7, 0,
    MAT.carcasa
  );

  cilindro(
    "TAPA_FRONTAL",
    1.65, 0.2,
    -3.26, 2.7, 0,
    MAT.tapa
  );

  anillo(
    "JUNTA_CARCASA",
    1.70, 0.10,
    -3.18, 2.7, 0,
    MAT.acero
  );

  // Pernos de carcasa
  for (let i = 0; i < 12; i++) {

    const a = i * Math.PI * 2 / 12;

    cilindro(
      `PERNO_CARCASA_${i + 1}`,
      0.11,
      0.26,
      -3.4,
      2.7 + Math.cos(a) * 1.45,
      Math.sin(a) * 1.45,
      MAT.pernos
    );
  }

  /* =======================================================
     3. SUCCIÓN HORIZONTAL AXIAL
     ======================================================= */

  cilindro(
    "CUELLO_SUCCION",
    0.78, 1.0,
    -3.85, 2.7, 0,
    MAT.carcasa
  );

  cilindro(
    "BRIDA_SUCCION",
    1.05, 0.22,
    -4.34, 2.7, 0,
    MAT.tapa
  );

  anillo(
    "BOCA_SUCCION",
    0.72, 0.09,
    -4.45, 2.7, 0,
    MAT.acero
  );

/* =======================================================
   4. DESCARGA TANGENCIAL DESDE LA VOLUTA
   ======================================================= */

// Cuello de salida tangencial desde la periferia
const cuello = new THREE.Group();
cuello.name = "DESCARGA_TANGENCIAL";

const materialDescarga = MAT.carcasa;

// Tramo inclinado desde la periferia de la carcasa
const puntoInicio = new THREE.Vector3(-2.90, 4.05, 0);
const puntoFinal = new THREE.Vector3(-3.35, 5.20, 0);

const direccion = new THREE.Vector3()
  .subVectors(puntoFinal, puntoInicio);

const tramo = new THREE.Mesh(
  new THREE.CylinderGeometry(
    0.68,
    0.68,
    direccion.length(),
    32
  ),
  materialDescarga
);

tramo.position.copy(puntoInicio)
  .add(puntoFinal)
  .multiplyScalar(0.5);

tramo.quaternion.setFromUnitVectors(
  new THREE.Vector3(0, 1, 0),
  direccion.normalize()
);

cuello.add(tramo);
bomba.add(cuello);

// Tramo vertical de descarga
cilindro(
  "CUELLO_DESCARGA_VERTICAL",
  0.68,
  0.75,
  -3.35,
  5.48,
  0,
  MAT.carcasa,
  "y"
);

// Brida superior
cilindro(
  "BRIDA_DESCARGA_SUPERIOR",
  0.98,
  0.22,
  -3.35,
  5.88,
  0,
  MAT.tapa,
  "y"
);

// Punto de conexión de la tubería
bomba.userData.conexionDescarga = {
  x: -3.35,
  y: 5.99,
  z: 0
};

  /* =======================================================
     5. EJE Y SOPORTE DE RODAMIENTOS
     ======================================================= */

  cilindro(
    "EJE_PRINCIPAL",
    0.24, 3.6,
    0.0, 2.7, 0,
    MAT.acero
  );

  cilindro(
    "CAJA_RODAMIENTOS",
    0.68, 1.55,
    0.15, 2.7, 0,
    MAT.soporte
  );

  caja(
    "SOPORTE_RODAMIENTOS",
    1.45, 1.45, 1.2,
    0.15, 1.45, 0,
    MAT.soporte
  );

  /* =======================================================
     6. CAJA DE SELLADO
     ======================================================= */

  cilindro(
    "CAJA_DE_SELLADO",
    0.94, 0.90,
    -0.95, 2.7, 0,
    MAT.tapa
  );

  cilindro(
    "BRIDA_SELLO_MECANICO",
    0.82, 0.18,
    -0.42, 2.7, 0,
    MAT.acero
  );

  /* =======================================================
     7. MOTOR ELÉCTRICO ELEVADO
     ======================================================= */

  const motor = {
    x: 1.45,
    y: 6.35,
    z: 0,
    radio: 0.95,
    largo: 1.9
  };

  // Estructura de soporte del motor
  [-0.7, 0.7].forEach((z, i) => {

    caja(
      `COLUMNA_MOTOR_${i}`,
      0.45, 3.8, 0.45,
      motor.x, 3.35, z,
      MAT.soporte
    );

  });

  caja(
    "PLATAFORMA_MOTOR",
    3.0, 0.35, 2.8,
    motor.x, 5.15, 0,
    MAT.base
  );

  cilindro(
    "MOTOR_ELECTRICO",
    motor.radio,
    motor.largo,
    motor.x,
    motor.y,
    motor.z,
    MAT.motor
  );

  // Aletas de refrigeración
  for (let i = 0; i < 11; i++) {

    anillo(
      `ALETA_MOTOR_${i}`,
      motor.radio,
      0.045,
      motor.x - 0.85 + i * 0.17,
      motor.y,
      0,
      MAT.soporte
    );
  }

  caja(
    "CAJA_BORNES_MOTOR",
    0.75, 0.40, 0.75,
    motor.x, 7.48, 0,
    MAT.motor
  );

  /* =======================================================
     8. TRANSMISIÓN POR POLEAS Y CORREAS
     ======================================================= */

  const xPoleas = 2.65;

  const radioPoleas = {
    bomba: 0.72,
    motor: 0.55
  };

  // Polea de bomba
  cilindro(
    "POLEA_BOMBA",
    radioPoleas.bomba,
    0.55,
    xPoleas, 2.7, 0,
    MAT.polea
  );

  // Polea de motor
  cilindro(
    "POLEA_MOTOR",
    radioPoleas.motor,
    0.55,
    xPoleas, motor.y, 0,
    MAT.polea
  );

  // Canales de poleas
  [-0.16, 0, 0.16].forEach((dx, i) => {

    anillo(
      `CANAL_POLEA_BOMBA_${i}`,
      radioPoleas.bomba,
      0.06,
      xPoleas + dx,
      2.7, 0,
      MAT.correa
    );

    anillo(
      `CANAL_POLEA_MOTOR_${i}`,
      radioPoleas.motor,
      0.06,
      xPoleas + dx,
      motor.y, 0,
      MAT.correa
    );

    // Tramos rectos visibles de correa
    [-1, 1].forEach((lado, j) => {
      tubo(
        `CORREA_${i}_${j}`,
        [
          [
            xPoleas + dx,
            2.7,
            lado * radioPoleas.bomba
          ],
          [
            xPoleas + dx,
            motor.y,
            lado * radioPoleas.motor
          ]
        ],
        0.045,
        MAT.correa
      );
    });
  });

  // Guarda semitransparente de transmisión
  caja(
    "GUARDA_CORREAS",
    0.85, 5.4, 2.15,
    xPoleas, 4.45, 0,
    MAT.guarda
  );

  /* =======================================================
     9. TERMOSIFÓN INDIVIDUAL
     ======================================================= */

  const TS = {
    x: -0.5,
    y: 5.1,
    z: -3.5
  };

  cilindro(
    "TERMOSIFON_DEPOSITO",
    0.43, 3.3,
    TS.x, TS.y, TS.z,
    MAT.termosifon,
    "y"
  );

  // =======================================================
// CONEXIÓN LATERAL DE AGUA AL TERMOSIFÓN
// =======================================================

cilindro(
  "TERMOSIFON_ENTRADA_AGUA",
  0.17,
  0.45,
  TS.x,
  5.7,
  TS.z - 0.43,
  MAT.acero,
  "z"
);

  cilindro(
    "TERMOSIFON_TAPA_SUPERIOR",
    0.49, 0.16,
    TS.x, 6.82, TS.z,
    MAT.acero,
    "y"
  );

// =======================================================
// CONEXIÓN SUPERIOR DE AGUA AL TERMOSIFÓN
// =======================================================

cilindro(
  "TERMOSIFON_ENTRADA_AGUA_SUPERIOR",
  0.15,
  0.55,
  TS.x,
  7.15,
  TS.z,
  MAT.acero,
  "y"
);

  cilindro(
    "TERMOSIFON_TAPA_INFERIOR",
    0.49, 0.16,
    TS.x, 3.38, TS.z,
    MAT.acero,
    "y"
  );

  // Soporte
  caja(
    "TERMOSIFON_SOPORTE",
    0.2, 2.4, 0.2,
    TS.x, 2.1, TS.z,
    MAT.soporte
  );

  // Instrumentación superior
  cilindro(
    "TERMOSIFON_MANOMETRO",
    0.29, 0.14,
    TS.x, 7.3, TS.z,
    MAT.acero,
    "z"
  );

  // Conexiones referenciales al sello
  tubo(
    "TERMOSIFON_LINEA_SUPERIOR",
    [
      [TS.x, 6.3, TS.z],
      [TS.x, 6.3, -2.0],
      [-0.95, 3.35, -2.0],
      [-0.95, 3.35, -0.75]
    ],
    0.07,
    MAT.tubos
  );

  tubo(
    "TERMOSIFON_LINEA_INFERIOR",
    [
      [TS.x, 3.9, TS.z],
      [TS.x, 3.9, -2.0],
      [-0.95, 2.25, -2.0],
      [-0.95, 2.25, -0.75]
    ],
    0.07,
    MAT.tubos
  );

  /* =======================================================
     10. IDENTIFICACIÓN
     ======================================================= */

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;

  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#082F63";
  ctx.fillRect(0, 0, 512, 128);

  ctx.font = "bold 42px Arial";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(datos.id, 256, 64);

  const etiqueta = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(canvas),
      depthTest: false
    })
  );

  etiqueta.name = "ETIQUETA";
  etiqueta.position.set(0, 9.0, 0);
  etiqueta.scale.set(5, 1.25, 1);

  bomba.add(etiqueta);

  /* =======================================================
     11. POSICIÓN
     ======================================================= */

  bomba.position.set(
    datos.x,
    datos.y,
    datos.z
  );

  // Mantener orientación UF original
  bomba.rotation.y = 0;

  return bomba;
}