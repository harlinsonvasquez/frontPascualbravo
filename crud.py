"""Operaciones CRUD y carga inicial opcional para Firebase."""
from conexion import referencia
from esquemas import ESQUEMAS, validar_campo, validar_registro


class ErrorCRUD(Exception):
    """Error esperado de una operación de datos."""


def crear(coleccion, datos):
    datos = validar_registro(coleccion, datos)
    if coleccion == "matriculas":
        _verificar_referencias(datos)
    registro = referencia(coleccion).push()
    registro.set(datos)
    return registro.key


def listar(coleccion):
    datos = referencia(coleccion).get()
    if not datos:
        return {}
    if not isinstance(datos, dict):
        raise ErrorCRUD(f"El nodo '{coleccion}' no contiene registros válidos.")
    return datos


def buscar(coleccion, identificador):
    if not identificador or not identificador.strip():
        raise ValueError("El ID es obligatorio.")
    datos = referencia(coleccion).child(identificador.strip()).get()
    return datos


def actualizar(coleccion, identificador, cambios):
    actual = buscar(coleccion, identificador)
    if actual is None:
        return False
    if not isinstance(actual, dict):
        raise ErrorCRUD("El registro encontrado tiene un formato inválido.")
    esquema = ESQUEMAS[coleccion]
    cambios_validos = {}
    for campo, valor in cambios.items():
        if campo not in esquema:
            raise ValueError(f"Campo no permitido: {campo}")
        cambios_validos[campo] = validar_campo(esquema[campo], valor)
    if coleccion == "matriculas":
        datos_finales = {**actual, **cambios_validos}
        _verificar_referencias(datos_finales)
    referencia(coleccion).child(identificador).update(cambios_validos)
    return True


def eliminar(coleccion, identificador, confirmar):
    if not confirmar:
        return False
    actual = buscar(coleccion, identificador)
    if actual is None:
        return False
    if coleccion in {"estudiantes", "cursos"}:
        campo = "id_estudiante" if coleccion == "estudiantes" else "id_curso"
        matriculas = listar("matriculas")
        asociadas = [
            registro_id
            for registro_id, registro in matriculas.items()
            if isinstance(registro, dict) and registro.get(campo) == identificador
        ]
        if asociadas:
            raise ErrorCRUD(
                f"No se puede eliminar: existen {len(asociadas)} matrícula(s) asociada(s)."
            )
    referencia(coleccion).child(identificador).delete()
    return True


def _verificar_referencias(datos):
    for campo, coleccion in (("id_estudiante", "estudiantes"), ("id_curso", "cursos")):
        identificador = datos.get(campo)
        if not identificador or buscar(coleccion, identificador) is None:
            raise ValueError(f"El {campo} '{identificador}' no existe en {coleccion}.")


def cargar_datos_iniciales():
    """Agrega ejemplos solo a nodos vacíos; nunca sobrescribe ni duplica."""
    estudiantes_ref = referencia("estudiantes")
    cursos_ref = referencia("cursos")
    matriculas_ref = referencia("matriculas")
    actuales_estudiantes = estudiantes_ref.get() or {}
    actuales_cursos = cursos_ref.get() or {}
    actuales_matriculas = matriculas_ref.get() or {}
    ids_estudiantes = {"demo_estudiante_1", "demo_estudiante_2"}
    ids_cursos = {"demo_curso_1", "demo_curso_2"}
    ejemplos_estudiantes = {
        "demo_estudiante_1": {"nombre": "Ana Pérez", "correo": "ana@example.com", "edad": 20},
        "demo_estudiante_2": {"nombre": "Luis Gómez", "correo": "luis@example.com", "edad": 22},
    }
    ejemplos_cursos = {
        "demo_curso_1": {"nombre": "Programación", "docente": "María Ruiz", "creditos": 3},
        "demo_curso_2": {"nombre": "Bases de datos", "docente": "Carlos Díaz", "creditos": 4},
    }
    faltantes_estudiantes = {
        key: value for key, value in ejemplos_estudiantes.items()
        if not actuales_estudiantes.get(key)
    }
    faltantes_cursos = {
        key: value for key, value in ejemplos_cursos.items()
        if not actuales_cursos.get(key)
    }
    if not actuales_estudiantes:
        faltantes_estudiantes = ejemplos_estudiantes
    if not actuales_cursos:
        faltantes_cursos = ejemplos_cursos
    estudiantes_ref.update(faltantes_estudiantes)
    cursos_ref.update(faltantes_cursos)
    if not actuales_matriculas and ids_estudiantes.issubset(
        set(actuales_estudiantes) | set(faltantes_estudiantes)
    ) and ids_cursos.issubset(set(actuales_cursos) | set(faltantes_cursos)):
        matriculas_ref.child("demo_matricula_1").set({
            "id_estudiante": "demo_estudiante_1",
            "id_curso": "demo_curso_1",
            "periodo": "2026-2",
            "nota": 4.5,
        })
    return len(faltantes_estudiantes) + len(faltantes_cursos)
