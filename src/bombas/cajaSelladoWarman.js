import * as THREE from "three";

/* =========================================================
   CAJA DE SELLADO WARMAN
   MODELO PARAMÉTRICO 3D

   Eje longitudinal = X
   Unidades = metros

   Dimensiones provisionales.
   ========================================================= */

export function crearCajaSelladoWarman() {

  const grupo = new THREE.Group();
  grupo.name = "CAJA_DE_SELLADO_WARMAN";

  /* =======================================================
     DIMENSIONES
     ======================================================= */

  const D = {
    largoCaja: 0.90,

    diametroExterior: 2.10,
    diametroInterior: 1.25,

    diametroBrida: 1.90,
    espesorBrida: 0.20,

    diametroPasoEje: 0.50,

    diametroConexion: 0.32,
    largoConexion: 0.75
  };

  /* =======================================================
     MATERIALES
     ======================================================= */

  const materialCaja = new THREE.MeshStandardMaterial({
    color: 0x087CB2,
    metalness: 0.35,
    roughness: 0.5,
    side: THREE.DoubleSide
  });

  const materialBrida = new THREE.MeshStandardMaterial({
    color: 0xC4CCD2,
    metalness: 0.7,
    roughness: 0.35,
    side: THREE.DoubleSide
  });

  /* =======================================================
     CUERPO HUECO POR REVOLUCIÓN
     ======================================================= */

  const largo = D.largoCaja;
  const re = D.diametroExterior / 2;
  const ri = D.diametroInterior / 2;

  // Perfil radial / axial
  const perfil = [
    new THREE.Vector2(ri, -largo / 2),
    new THREE.Vector2(re, -largo / 2),
    new THREE.Vector2(re,  largo / 2),
    new THREE.Vector2(ri,  largo / 2),
    new THREE.Vector2(ri, -largo / 2)
  ];

  const cuerpo = new THREE.Mesh(
    new THREE.LatheGeometry(perfil, 64),
    materialCaja
  );

  // LatheGeometry gira originalmente sobre Y.
  // Lo orientamos sobre X.
  cuerpo.rotation.z = -Math.PI / 2;

  cuerpo.name = "CUERPO_HUECO";
  grupo.add(cuerpo);

  /* =======================================================
     BRIDA POSTERIOR CON AGUJERO CENTRAL
     ======================================================= */

  const perfilBrida = [
    new THREE.Vector2(D.diametroPasoEje / 2, 0),
    new THREE.Vector2(D.diametroBrida / 2, 0),
    new THREE.Vector2(
      D.diametroBrida / 2,
      D.espesorBrida
    ),
    new THREE.Vector2(
      D.diametroPasoEje / 2,
      D.espesorBrida
    )
  ];

  const brida = new THREE.Mesh(
    new THREE.LatheGeometry(perfilBrida, 64),
    materialBrida
  );

  brida.rotation.z = -Math.PI / 2;

  // Extremo posterior de la caja
  brida.position.x = largo / 2;

  brida.name = "BRIDA_POSTERIOR";
  grupo.add(brida);

  /* =======================================================
     CONEXIÓN SUPERIOR
     ======================================================= */

  const conexion = new THREE.Mesh(
    new THREE.CylinderGeometry(
      D.diametroConexion / 2,
      D.diametroConexion / 2,
      D.largoConexion,
      24
    ),
    materialBrida
  );

  conexion.name = "CONEXION_SUPERIOR";

  conexion.position.set(
    0,
    re + D.largoConexion / 2,
    0
  );

  grupo.add(conexion);

  /* =======================================================
     INFORMACIÓN DEL COMPONENTE
     ======================================================= */

  grupo.userData = {
    tipo: "Caja de sellado",
    fabricanteReferencia: "Warman",
    dimensiones: D
  };

  return grupo;
}