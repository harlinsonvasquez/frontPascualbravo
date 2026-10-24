"""Interfaz de consola para administrar estudiantes, cursos y matrículas."""
import json

import crud
from conexion import inicializar_firebase
from esquemas import ESQUEMAS


ETIQUETAS = {
    "estudiantes": "Estudiantes",
    "cursos": "Cursos",
    "matriculas": "Matrículas",
}


def pedir_datos(coleccion, actual=None):
    datos = {}
    for campo in ESQUEMAS[coleccion]:
        valor_actual = (actual or {}).get(campo)
        texto_actual = f" [{valor_actual}]" if valor_actual is not None else ""
        entrada = input(f"{campo}{texto_actual}: ").strip()
        if actual is not None and not entrada:
            continue
        datos[campo] = entrada
    return datos


def menu_coleccion(coleccion):
    while True:
        print(f"\n--- {ETIQUETAS[coleccion]} ---")
        print("1. Crear\n2. Listar\n3. Buscar por ID\n4. Actualizar\n5. Eliminar\n0. Volver")
        opcion = input("Opción: ").strip()
        try:
            if opcion == "0":
                return
            if opcion == "1":
                identificador = crud.crear(coleccion, pedir_datos(coleccion))
                print(f"Registro creado. ID: {identificador}")
            elif opcion == "2":
                registros = crud.listar(coleccion)
                if not registros:
                    print("No hay registros.")
                for identificador, registro in registros.items():
                    print(f"ID: {identificador} | {json.dumps(registro, ensure_ascii=False)}")
            elif opcion in {"3", "4", "5"}:
                identificador = input("ID del registro: ").strip()
                registro = crud.buscar(coleccion, identificador)
                if registro is None:
                    print("No existe un registro con ese ID.")
                    continue
                if opcion == "3":
                    print(json.dumps(registro, ensure_ascii=False, indent=2))
                elif opcion == "4":
                    cambios = pedir_datos(coleccion, registro)
                    if not cambios:
                        print("No se hicieron cambios.")
                    elif crud.actualizar(coleccion, identificador, cambios):
                        print("Registro actualizado.")
                else:
                    confirmacion = input(f"¿Eliminar {identificador}? Escribe SI para confirmar: ")
                    if confirmacion != "SI":
                        print("Operación cancelada.")
                    elif crud.eliminar(coleccion, identificador, True):
                        print("Registro eliminado.")
            else:
                print("Opción inválida. Elige una opción del menú.")
        except (ValueError, crud.ErrorCRUD) as exc:
            print(f"No se pudo completar la operación: {exc}")
        except Exception as exc:
            print(f"Error al comunicarse con Firebase: {exc}")


def main():
    try:
        inicializar_firebase()
    except Exception as exc:
        print(f"No se pudo iniciar la aplicación: {exc}")
        return
    while True:
        print("\n=== CRUD Firebase ===\n1. Estudiantes\n2. Cursos\n3. Matrículas\n4. Cargar datos de ejemplo\n0. Salir")
        opcion = input("Opción: ").strip()
        coleccion = {"1": "estudiantes", "2": "cursos", "3": "matriculas"}.get(opcion)
        if coleccion:
            menu_coleccion(coleccion)
        elif opcion == "4":
            try:
                cantidad = crud.cargar_datos_iniciales()
                print(f"Carga terminada. Se agregaron {cantidad} registros sin sobrescribir datos existentes.")
            except Exception as exc:
                print(f"No se pudieron cargar los ejemplos: {exc}")
        elif opcion == "0":
            print("Hasta luego.")
            return
        else:
            print("Opción inválida. Elige una opción del menú.")


if __name__ == "__main__":
    main()
