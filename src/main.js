import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { crearPlantaIndustrial } from "./plantaIndustrial.js";
import { activarSeleccionEquipos } from "./seleccion.js";
import { crearBotonesVisualizacion } from "./botones.js";

// =========================================================
// ESCENA
// =========================================================

const escena = new THREE.Scene();
escena.background = new THREE.Color(0xF5F7FA);

// =========================================================
// CÁMARA
// =========================================================

const camara = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);

camara.position.set(250, 190, 260);

// =========================================================
// RENDERIZADOR
// =========================================================

const renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.setSize(
  window.innerWidth,
  window.innerHeight
);

renderer.setPixelRatio(
  Math.min(window.devicePixelRatio, 2)
);

document.body.style.margin = "0";
document.body.appendChild(renderer.domElement);

// =========================================================
// ILUMINACIÓN
// =========================================================

escena.add(
  new THREE.AmbientLight(0xffffff, 1.5)
);

const luz = new THREE.DirectionalLight(
  0xffffff,
  2.5
);

luz.position.set(100, 200, 100);
escena.add(luz);

// =========================================================
// PLANTA INDUSTRIAL
// =========================================================

const planta = crearPlantaIndustrial();
escena.add(planta);

// =========================================================
// BOTONES DE VISUALIZACIÓN
// =========================================================

crearBotonesVisualizacion(planta);

// =========================================================
// ACTIVAR FICHAS DE EQUIPOS
// =========================================================

const seleccion = activarSeleccionEquipos({
  escena,
  camara,
  renderer,
  planta
});

// =========================================================
// CONTROLES DE CÁMARA
// =========================================================

const controles = new OrbitControls(
  camara,
  renderer.domElement
);

controles.target.set(72, 0, 35);

controles.enableDamping = true;
controles.dampingFactor = 0.05;

controles.minDistance = 15;
controles.maxDistance = 800;

// =========================================================
// EJES XYZ
// =========================================================

const ejes = new THREE.AxesHelper(35);
escena.add(ejes);

// =========================================================
// CUADRÍCULA
// =========================================================

const cuadricula = new THREE.GridHelper(
  260,
  26,
  0x8795A3,
  0xCCD4DB
);

cuadricula.position.set(72, -0.45, 35);
escena.add(cuadricula);

// =========================================================
// AJUSTE DE VENTANA
// =========================================================

window.addEventListener("resize", () => {

  camara.aspect =
    window.innerWidth / window.innerHeight;

  camara.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );
});

// =========================================================
// ANIMACIÓN
// =========================================================

function animar() {
  requestAnimationFrame(animar);

  controles.update();
  actualizarEtiquetas();
  seleccion.actualizar();

  renderer.render(escena, camara);
}

/* =========================================================
   VISIBILIDAD AUTOMÁTICA DE ETIQUETAS
   ========================================================= */

function actualizarEtiquetas() {

  planta.traverse(objeto => {

    if (!objeto.isSprite) return;

    const posicion = new THREE.Vector3();

    objeto.getWorldPosition(posicion);

    const distancia = camara.position.distanceTo(posicion);

    // Ocultar etiquetas cuando la cámara está lejos
    objeto.visible = distancia < 55;

  });

}

animar();