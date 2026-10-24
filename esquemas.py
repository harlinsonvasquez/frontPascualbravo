"""Esquemas y validaciones centralizadas para los registros CRUD."""
import re


ESQUEMAS = {
    "estudiantes": {
        "nombre": "texto",
        "correo": "correo",
        "edad": "edad",
    },
    "cursos": {
        "nombre": "texto",
        "docente": "texto",
        "creditos": "creditos",
    },
    "matriculas": {
        "id_estudiante": "texto",
        "id_curso": "texto",
        "periodo": "texto",
        "nota": "nota",
    },
}


def validar_campo(campo, valor):
    """Valida un valor y devuelve su tipo normalizado para Firebase."""
    tipo = campo
    if campo not in {"texto", "correo", "edad", "creditos", "nota"}:
        raise ValueError(f"Campo no reconocido: {campo}")
    if tipo == "texto":
        if not isinstance(valor, str) or not valor.strip():
            raise ValueError("Este campo es obligatorio.")
        return valor.strip()
    if tipo == "correo":
        if not isinstance(valor, str) or not re.fullmatch(
            r"[^\s@]+@[^\s@]+\.[^\s@]+", valor.strip()
        ):
            raise ValueError("Ingresa un correo válido (ejemplo: nombre@dominio.com).")
        return valor.strip()
    if tipo in {"edad", "creditos"}:
        try:
            numero = int(valor)
        except (TypeError, ValueError) as exc:
            raise ValueError("Ingresa un número entero válido.") from exc
        minimo, maximo = (1, 120) if tipo == "edad" else (1, 10)
        if str(valor).strip() not in {str(numero), f"+{numero}"}:
            raise ValueError("Ingresa un número entero válido.")
        if not minimo <= numero <= maximo:
            raise ValueError(f"El valor debe estar entre {minimo} y {maximo}.")
        return numero
    if tipo == "nota":
        try:
            numero = float(valor)
        except (TypeError, ValueError) as exc:
            raise ValueError("Ingresa una nota numérica válida.") from exc
        if not 0 <= numero <= 5:
            raise ValueError("La nota debe estar entre 0.0 y 5.0.")
        return numero


def validar_registro(coleccion, datos):
    """Comprueba campos requeridos y valida los tipos del registro completo."""
    if coleccion not in ESQUEMAS:
        raise ValueError("Colección no reconocida.")
    esquema = ESQUEMAS[coleccion]
    faltantes = set(esquema) - set(datos)
    if faltantes:
        raise ValueError(f"Faltan campos obligatorios: {', '.join(sorted(faltantes))}.")
    return {campo: validar_campo(tipo, datos[campo]) for campo, tipo in esquema.items()}
