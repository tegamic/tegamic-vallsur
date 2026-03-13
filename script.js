const espirales = [
  "A11","A12","A13","A14","A15","A16",
  "A21","A22","A23","A24","A25","A26",
  "A31","A32","A33","A34","A35","A36",
  "A41","A42","A43","A44","A45","A46",
  "A51","A52","A53","A54","A55","A56",
  "A61","A62","A63","A64","A65","A66"
];

const combinaciones = [
  {
    ids: ["A65", "A66"],
    label: "A66"
  }
];

const maquina = document.getElementById("maquina");
const resultado = document.getElementById("resultado");

const espiralesCombinadas = new Map();
combinaciones.forEach(combo => {
  combo.ids.forEach(id => espiralesCombinadas.set(id, combo));
});

const yaRenderizadas = new Set();

function seleccionarBoton(boton) {
  document.querySelectorAll("#maquina button").forEach(btn => {
    btn.classList.remove("activo");
  });
  boton.classList.add("activo");
}

espirales.forEach(id => {
  if (yaRenderizadas.has(id)) return;

  const combo = espiralesCombinadas.get(id);
  const btn = document.createElement("button");

  if (combo) {
    combo.ids.forEach(x => yaRenderizadas.add(x));
    btn.innerText = combo.label;
    btn.classList.add("espiral-doble");
    btn.onclick = () => {
      seleccionarBoton(btn);
      mostrarEspiralCombinada(combo);
    };
  } else {
    yaRenderizadas.add(id);
    btn.innerText = id;
    btn.onclick = () => {
      seleccionarBoton(btn);
      mostrarEspiral(id);
    };
  }

  maquina.appendChild(btn);
});

async function cargarDatos() {
  const response = await fetch("data/espirales.json");

  if (!response.ok) {
    throw new Error(`Error cargando JSON: ${response.status}`);
  }

  return await response.json();
}

function renderCarta(carta) {
  return `
    <div class="carta">
      <img src="${carta.imagen}" alt="${carta.nombre}" loading="lazy">
      <p>${carta.nombre}</p>
      <b>${carta.precio}</b>
    </div>
  `;
}

async function mostrarEspiral(id) {
  try {
    const json = await cargarDatos();
    const espiral = json[id];

    if (!espiral) {
      resultado.innerHTML = "<p>Aún no hay datos para este carril. Estamos trabajando en ello.</p>";
      return;
    }

    let html = `<h2>${id} ${espiral.coleccion}</h2>`;

    espiral.cartas.forEach(carta => {
      html += renderCarta(carta);
    });

    resultado.innerHTML = html;
  } catch (error) {
    console.error(error);
    resultado.innerHTML = "<p>Error al cargar los datos</p>";
  }
}

async function mostrarEspiralCombinada(combo) {
  try {
    const json = await cargarDatos();

    let html = `<h2>${combo.label}</h2>`;
    let hayDatos = false;

    combo.ids.forEach(id => {
      const espiral = json[id];
      if (!espiral) return;

      hayDatos = true;

      espiral.cartas.forEach(carta => {
        html += renderCarta(carta);
      });
    });

    if (!hayDatos) {
      resultado.innerHTML = "<p>Aún no hay datos para este carril. Estamos trabajando en ello.</p>";
      return;
    }

    resultado.innerHTML = html;
  } catch (error) {
    console.error(error);
    resultado.innerHTML = "<p>Error al cargar los datos</p>";
  }
}