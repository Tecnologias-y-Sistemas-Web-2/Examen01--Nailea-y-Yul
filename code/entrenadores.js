const DB_NAME = 'PokedexDB';
const DB_VERSION = 1;
const DB_STORE = 'entrenadores';

function abrirBaseDatos() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = function (event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(DB_STORE)) {
                const store = db.createObjectStore(DB_STORE, { keyPath: 'id', autoIncrement: true });
                store.createIndex('nombre', 'nombre', { unique: false });
                store.createIndex('sexo', 'sexo', { unique: false });
                store.createIndex('residencia', 'residencia', { unique: false });
            }
        };

        request.onsuccess = function (event) {
            resolve(event.target.result);
        };

        request.onerror = function (event) {
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
        const transaction = db.transaction(DB_STORE, 'readwrite');
        const store = transaction.objectStore(DB_STORE);
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
        const transaction = db.transaction(DB_STORE, 'readonly');
        const store = transaction.objectStore(DB_STORE);
        const request = store.getAll();

        request.onsuccess = function (event) {
            resolve(event.target.result || []);
        };

        request.onerror = function () {
            reject(new Error('No se pudieron obtener los entrenadores.'));
        };
    });
}
