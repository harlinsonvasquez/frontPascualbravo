"""Conexión reutilizable a Firebase Realtime Database."""
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, db


BASE_DIR = Path(__file__).resolve().parent
CREDENCIALES = BASE_DIR / "firebase_key.json"
URL_DATABASE = "https://base-datos-8eff6-default-rtdb.firebaseio.com/"


def inicializar_firebase():
    """Inicializa el SDK una sola vez y retorna la aplicación activa."""
    if not CREDENCIALES.is_file():
        raise FileNotFoundError(
            f"No se encontró el archivo local de credenciales: {CREDENCIALES.name}"
        )
    try:
        try:
            return firebase_admin.get_app()
        except ValueError:
            credencial = credentials.Certificate(str(CREDENCIALES))
            return firebase_admin.initialize_app(
                credencial, {"databaseURL": URL_DATABASE}
            )
    except Exception as exc:
        raise ConnectionError(
            "No fue posible inicializar Firebase. Revisa las credenciales y la URL."
        ) from exc


def referencia(nodo):
    """Devuelve una referencia validada a uno de los nodos de la actividad."""
    if nodo not in {"estudiantes", "cursos", "matriculas"}:
        raise ValueError(f"Nodo no permitido: {nodo}")
    inicializar_firebase()
    try:
        return db.reference(nodo)
    except Exception as exc:
        raise ConnectionError(f"No se pudo acceder al nodo '{nodo}'.") from exc
