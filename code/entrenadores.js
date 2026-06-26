const DB_NAME = 'PokedexDB';
const DB_VERSION = 2;
const STORE_ENTRENADORES = 'entrenadores';
const STORE_EQUIPOS = 'equipos';

function abrirBaseDatos() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = function (event) {
            const db = event.target.result;

            if (!db.objectStoreNames.contains(STORE_ENTRENADORES)) {
                const store = db.createObjectStore(STORE_ENTRENADORES, { keyPath: 'id', autoIncrement: true });
                store.createIndex('nombre', 'nombre', { unique: false });
                store.createIndex('sexo', 'sexo', { unique: false });
                store.createIndex('residencia', 'residencia', { unique: false });
            }

            if (!db.objectStoreNames.contains(STORE_EQUIPOS)) {
                const store = db.createObjectStore(STORE_EQUIPOS, { keyPath: 'id', autoIncrement: true });
                store.createIndex('nombre', 'nombre', { unique: false });
                store.createIndex('entrenadorId', 'entrenadorId', { unique: false });
            }
        };

        request.onsuccess = function (event) {
            resolve(event.target.result);
        };

        request.onerror = function () {
            reject(new Error('No se pudo abrir la base de datos.'));
        };
    });
}

async function agregarEntrenador(entrenador) {
    if (!entrenador || !entrenador.nombre || !entrenador.sexo || !entrenador.residencia || !entrenador.foto) {
        throw new Error('Todos los campos son obligatorios.');
    }

    const db = await abrirBaseDatos();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_ENTRENADORES, 'readwrite');
        const store = transaction.objectStore(STORE_ENTRENADORES);
        const request = store.add(entrenador);

        request.onsuccess = function () {
            resolve();
        };

        request.onerror = function () {
            reject(new Error('No se pudo guardar el entrenador.'));
        };
    });
}

async function obtenerEntrenadores() {
    const db = await abrirBaseDatos();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_ENTRENADORES, 'readonly');
        const store = transaction.objectStore(STORE_ENTRENADORES);
        const request = store.getAll();

        request.onsuccess = function (event) {
            resolve(event.target.result || []);
        };

        request.onerror = function () {
            reject(new Error('No se pudieron obtener los entrenadores.'));
        };
    });
}

async function eliminarEntrenador(id) {
    const db = await abrirBaseDatos();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_ENTRENADORES, 'readwrite');
        const store = transaction.objectStore(STORE_ENTRENADORES);
        const request = store.delete(id);

        request.onsuccess = function () {
            resolve();
        };

        request.onerror = function () {
            reject(new Error('No se pudo eliminar el entrenador.'));
        };
    });
}

function mostrarVistaFormulario(mostrar) {
    const vistaLista = document.getElementById("vistaLista");
    const vistaFormulario = document.getElementById("vistaFormulario");
    if (!vistaLista || !vistaFormulario) return;

    vistaLista.style.display = mostrar ? "none" : "block";
    vistaFormulario.style.display = mostrar ? "block" : "none";
}

// ── Vista: lista de entrenadores ──────────────────────────────────
const paginaEntrenadores = document.getElementById("entrenadoresContainer");
if (paginaEntrenadores) {
    const modal = new bootstrap.Modal(document.getElementById("detalleModal"));
    let entrenadorActual = null;

    function cargarEntrenadores() {
        obtenerEntrenadores().then((lista) => {
            paginaEntrenadores.innerHTML = "";

            if (lista.length === 0) {
                paginaEntrenadores.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <div class="fw-bold fs-5">Aún no hay entrenadores registrados.</div>
                        <p class="text-muted">Pulsa "Nuevo entrenador" para crear el primer perfil.</p>
                    </div>`;
                return;
            }

            lista.forEach((entrenador) => {
                const col = document.createElement("div");
                col.className = "col-6 col-md-4 col-lg-3 mb-4";

                col.innerHTML = `
                    <div class="equipo-card h-100">
                        <img class="equipo-img" src="${entrenador.foto}" alt="${entrenador.nombre}"
                             onerror="this.src='https://via.placeholder.com/300x160?text=Sin+foto'">
                        <div class="card-body">
                            <h5 class="card-title">${entrenador.nombre}</h5>
                            <p class="entrenador-badge mb-1">${entrenador.sexo}</p>
                            <p class="entrenador-badge">${entrenador.residencia}</p>
                        </div>
                    </div>`;

                col.querySelector(".equipo-card").addEventListener("click", () => mostrarDetalle(entrenador));
                paginaEntrenadores.appendChild(col);
            });
        }).catch(() => {
            paginaEntrenadores.innerHTML = `
                <div class="col-12 text-center text-danger py-5">
                    <p>No fue posible cargar los entrenadores.</p>
                </div>`;
        });
    }

    function mostrarDetalle(entrenador) {
        entrenadorActual = entrenador;
        document.getElementById("detNombre").textContent = entrenador.nombre;
        document.getElementById("detSexo").textContent = entrenador.sexo;
        document.getElementById("detResidencia").textContent = entrenador.residencia;

        const imgEl = document.getElementById("detFoto");
        if (entrenador.foto) {
            imgEl.src = entrenador.foto;
            imgEl.style.display = "block";
        } else {
            imgEl.style.display = "none";
        }

        modal.show();
    }

    const btnEliminarModal = document.getElementById("btnEliminarEntrenador");
    if (btnEliminarModal) {
        btnEliminarModal.addEventListener("click", async () => {
            if (!entrenadorActual) return;
            if (!confirm(`¿Estás seguro de que deseas eliminar a "${entrenadorActual.nombre}"?`)) return;

            try {
                await eliminarEntrenador(entrenadorActual.id);
                modal.hide();
                entrenadorActual = null;
                cargarEntrenadores();
            } catch (error) {
                alert("No fue posible eliminar el entrenador. " + (error.message || ""));
            }
        });
    }

    const btnMostrarFormulario = document.getElementById("btnMostrarFormulario");
    const btnCancelar = document.getElementById("btnCancelar");
    if (btnMostrarFormulario) {
        btnMostrarFormulario.addEventListener("click", () => mostrarVistaFormulario(true));
    }
    if (btnCancelar) {
        btnCancelar.addEventListener("click", (event) => {
            event.preventDefault();
            mostrarVistaFormulario(false);
        });
    }

    cargarEntrenadores();
}

// ── Vista: agregar entrenador ────────────────────────────────────
const btnGuardar = document.getElementById("btnGuardar");
if (btnGuardar) {
    btnGuardar.addEventListener("click", async () => {
        const nombre = document.getElementById("nombreEntrenador").value.trim();
        const sexo = document.getElementById("sexoEntrenador").value;
        const residencia = document.getElementById("residenciaEntrenador").value.trim();
        const foto = document.getElementById("fotoEntrenador").value.trim();
        const formAlert = document.getElementById("alertaExito");

        if (!nombre || !sexo || !residencia || !foto) {
            alert("Por favor completa todos los campos.");
            return;
        }

        const nuevoEntrenador = { nombre, sexo, residencia, foto };

        try {
            await agregarEntrenador(nuevoEntrenador);
            formAlert.style.display = "block";
            document.getElementById("nombreEntrenador").value = "";
            document.getElementById("sexoEntrenador").value = "";
            document.getElementById("residenciaEntrenador").value = "";
            document.getElementById("fotoEntrenador").value = "";
            setTimeout(() => { formAlert.style.display = "none"; }, 3000);
            mostrarVistaFormulario(false);

            const paginaEntrenadores = document.getElementById("entrenadoresContainer");
            if (paginaEntrenadores) {
                location.reload();
            }
        } catch (error) {
            alert("No fue posible guardar el entrenador. " + (error.message || ""));
        }
    });
}