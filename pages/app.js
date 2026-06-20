
const cmbGeneracion = document.getElementById("cmbGeneracion");
const pokemonContainer = document.getElementById("pokemonContainer");
const modalNombre = document.getElementById("modalNombre");
const modalImagen = document.getElementById("modalImagen");
const modalId = document.getElementById("modalId");
const modalAltura = document.getElementById("modalAltura");
const modalPeso = document.getElementById("modalPeso");
const modalTipos = document.getElementById("modalTipos");
const modalHabilidades = document.getElementById("modalHabilidades");
const modalMovimientos = document.getElementById("modalMovimientos");
const pokemonModal = document.getElementById("pokemonModal");
const bootstrapModal = new bootstrap.Modal(pokemonModal);

function padNumber(value) {
    return String(value).padStart(3, "0");
}
//funcuion para limpiar las listas del modal antes de cargar nueva informacion, asi evitamos que se acumulen los datos de diferentes pokemones
function limpiarListas() {
    modalTipos.innerHTML = "";
    modalHabilidades.innerHTML = "";
    modalMovimientos.innerHTML = "";
}

function muestraErrorModal(mensaje) {
    modalTipos.innerHTML = `<li>${mensaje}</li>`;
    modalHabilidades.innerHTML = `<li>${mensaje}</li>`;
    modalMovimientos.innerHTML = `<li>${mensaje}</li>`;
}

function creaLista(elemento, items) {
    elemento.innerHTML = items
        .map((texto) => `<li class="text-capitalize">${texto}</li>`)
        .join("");
}

async function cargarGeneracion(offset, limit) {
    pokemonContainer.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-3">Cargando Pokémons...</p>
        </div>`;

    try {
        const respuesta = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`);
        if (!respuesta.ok) {
            throw new Error(`Error al cargar lista (${respuesta.status})`);
        }

        const datos = await respuesta.json();
        pokemonContainer.innerHTML = "";

        datos.results.forEach((pokemon, index) => {
            const pokemonId = offset + index + 1;
            const tarjeta = document.createElement("div");
            tarjeta.className = "col-6 col-md-4 col-lg-3";
            tarjeta.innerHTML = `
                <div class="card pokemon-card h-100 shadow-sm" data-name="${pokemon.name}" data-id="${pokemonId}">
                    <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png"
                         class="card-img-top" alt="${pokemon.name}">
                    <div class="card-body text-center">
                        <h5 class="card-title text-capitalize mb-1">${pokemon.name}</h5>
                        <p class="card-text text-secondary mb-0">#${padNumber(pokemonId)}</p>
                    </div>
                </div>`;

            tarjeta.querySelector(".pokemon-card").addEventListener("click", () => {
                mostrarDetalle(pokemon.name, pokemonId);
            });
            pokemonContainer.appendChild(tarjeta);
        });
    } catch (error) {
        pokemonContainer.innerHTML = `
            <div class="col-12 text-center py-5 text-danger">
                <p>No fue posible cargar la Pokédex.</p>
                <p>${error.message}</p>
            </div>`;
    }
}

async function mostrarDetalle(nombre, id) {
    modalNombre.textContent = nombre.toUpperCase();
    modalId.textContent = `#${padNumber(id)}`;
    modalImagen.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
    modalImagen.alt = nombre;
    modalAltura.textContent = "...";
    modalPeso.textContent = "...";
    limpiarListas();

    try {
        const respuesta = await fetch(`https://pokeapi.co/api/v2/pokemon/${nombre}`);
        if (!respuesta.ok) {
            throw new Error(`Error al cargar los datos (${respuesta.status})`);
        }

        const datos = await respuesta.json();
        modalAltura.textContent = `${datos.height / 10} m`;
        modalPeso.textContent = `${datos.weight / 10} kg`;

        creaLista(
            modalTipos,
            datos.types.map((item) => item.type.name)
        );

        creaLista(
            modalHabilidades,
            datos.abilities.map(
                (item) =>
                    `${item.ability.name}${item.is_hidden ? " (oculta)" : ""}`
            )
        );

        const movimientos = datos.moves.slice(0, 12).map((item) => item.move.name);
        creaLista(
            modalMovimientos,
            movimientos.length > 0 ? movimientos : ["No hay movimientos disponibles"]
        );
    } catch (error) {
        muestraErrorModal("No se pudieron cargar los datos del Pokémon.");
    }

    bootstrapModal.show();
}

cmbGeneracion.addEventListener("change", () => {
    const [offset, limit] = cmbGeneracion.value.split(",").map(Number);
    cargarGeneracion(offset, limit);
});

cargarGeneracion(0, 151);
