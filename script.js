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
const botonRanking = document.getElementById("boton-ranking");
const ranking = document.getElementById("ranking");
const rankingCartas = document.getElementById("ranking-cartas");

const espiralesCombinadas = new Map();
combinaciones.forEach(combo => {
  combo.ids.forEach(id => espiralesCombinadas.set(id, combo));
});

const yaRenderizadas = new Set();
let rankingCargado = false;

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

function renderBotonesEspirales(espirales) {
  return espirales.map(id => {
    const combo = espiralesCombinadas.get(id);

    if (combo) {
      return `
        <button class="boton-espiral-ranking espiral-doble" onclick="abrirEspiralDesdeRanking('${combo.label}')">
          ${combo.label}
        </button>
      `;
    }

    return `
      <button class="boton-espiral-ranking" onclick="abrirEspiralDesdeRanking('${id}')">
        ${id}
      </button>
    `;
  }).join("");
}

function abrirEspiralDesdeRanking(idOLabel) {
  const botones = document.querySelectorAll("#maquina button");

  botones.forEach(btn => {
    if (btn.innerText === idOLabel) {
      btn.click();
      btn.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
}

function parsePrecio(precio) {
  return Number(precio.replace("€", "").replace(",", "."));
}

function agruparCartasPorValor(json) {
  const mapa = new Map();

  Object.entries(json).forEach(([espiralId, datosEspiral]) => {
    if (!datosEspiral.cartas) return;

    datosEspiral.cartas.forEach(carta => {
      const clave = `${carta.nombre}|${carta.precio}|${carta.imagen}`;

      if (!mapa.has(clave)) {
        mapa.set(clave, {
          ...carta,
          valorNumerico: parsePrecio(carta.precio),
          espirales: [espiralId]
        });
      } else {
        mapa.get(clave).espirales.push(espiralId);
      }
    });
  });

  return Array.from(mapa.values());
}

async function mostrarRanking(top = 10) {
  try {
    const json = await cargarDatos();
    const cartasUnicas = agruparCartasPorValor(json);

    cartasUnicas.sort((a, b) => b.valorNumerico - a.valorNumerico);

    const topCartas = cartasUnicas.slice(0, top);

    let html = "";

    topCartas.forEach((carta, index) => {
      html += `
        <div class="ranking-carta">
          <div class="ranking-posicion">#${index + 1}</div>
          <img src="${carta.imagen}" alt="${carta.nombre}" loading="lazy">
          <div class="ranking-info">
            <h3>${carta.nombre}</h3>
            <p class="ranking-precio">${carta.precio}</p>
            <div class="ranking-espirales">
  <span>Puede salir en:</span>
  <div class="ranking-espirales-botones">
    ${renderBotonesEspirales(carta.espirales)}
  </div>
</div>
          </div>
        </div>
      `;
    });

    rankingCartas.innerHTML = html;
  } catch (error) {
    console.error(error);
    rankingCartas.innerHTML = "<p>Error al cargar el ranking</p>";
  }
}

async function mostrarEspiral(id) {
  try {
    const json = await cargarDatos();
    const espiral = json[id];

    if (!espiral) {
      resultado.innerHTML = "<p>Aún no hay datos para este carril. Estamos trabajando en ello.</p>";
      return;
    }

    let html = `<h2>${id} ${espiral.coleccion || ""}</h2>`;

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

if (botonRanking && ranking && rankingCartas) {
  botonRanking.addEventListener("click", async () => {
    if (ranking.style.display === "none" || ranking.style.display === "") {
      ranking.style.display = "block";
      botonRanking.textContent = "Ocultar ranking";

      if (!rankingCargado) {
        await mostrarRanking(10);
        rankingCargado = true;
      }
    } else {
      ranking.style.display = "none";
      botonRanking.textContent = "Ver ranking de 10 cartas más valiosas que pueden salir en la máquina";
    }
  });
}