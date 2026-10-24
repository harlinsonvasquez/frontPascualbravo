import { database } from "./config.js";
import {
  get, onValue, push, ref, remove, set, update
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const fields = {
  estudiantes: [
    { key: "nombre", label: "Nombre completo", type: "text", placeholder: "Ej. Valentina Rojas", required: true },
    { key: "correo", label: "Correo electrónico", type: "email", placeholder: "nombre@correo.com", required: true },
    { key: "edad", label: "Edad", type: "number", min: 1, max: 120, step: 1, placeholder: "18", required: true }
  ],
  cursos: [
    { key: "nombre", label: "Nombre del curso", type: "text", placeholder: "Ej. Programación", required: true },
    { key: "docente", label: "Docente", type: "text", placeholder: "Nombre del docente", required: true },
    { key: "creditos", label: "Créditos", type: "number", min: 1, max: 10, step: 1, placeholder: "3", required: true }
  ],
  matriculas: [
    { key: "id_estudiante", label: "Estudiante", type: "select", source: "estudiantes", required: true },
    { key: "id_curso", label: "Curso", type: "select", source: "cursos", required: true },
    { key: "periodo", label: "Periodo académico", type: "text", placeholder: "2026-2", required: true },
    { key: "nota", label: "Nota final", type: "number", min: 0, max: 5, step: 0.1, placeholder: "4.5", required: true }
  ]
};

const labels = { estudiantes: "Estudiantes", cursos: "Cursos", matriculas: "Matrículas" };
const descriptions = {
  estudiantes: "Administra la información y los datos de contacto de tus estudiantes.",
  cursos: "Organiza la oferta académica, sus docentes y créditos.",
  matriculas: "Consulta las inscripciones, periodos académicos y notas."
};
const headings = {
  estudiantes: ["ESTUDIANTE", "CORREO", "EDAD", "ID", "ACCIONES"],
  cursos: ["CURSO", "DOCENTE", "CRÉDITOS", "ID", "ACCIONES"],
  matriculas: ["ESTUDIANTE", "CURSO", "PERIODO", "NOTA", "ID", "ACCIONES"]
};
const state = { collection: "estudiantes", records: {}, all: {}, editingId: null, toastTimer: null };
const $ = (selector) => document.querySelector(selector);
const dialog = $("#record-dialog");

function showToast(message, kind = "success") {
  const toast = $("#toast");
  toast.textContent = message;
  toast.className = `toast visible ${kind}`;
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.className = "toast", 3600);
}

function showNotice(message, kind = "error") {
  const notice = $("#notice");
  notice.hidden = !message;
  notice.className = `notice ${kind}`;
  notice.textContent = message;
}

function readableError(error) {
  if (error?.code === "PERMISSION_DENIED" || error?.code === "permission-denied") {
    return "Firebase rechazó el acceso. Revisa las reglas de Realtime Database para esta aplicación.";
  }
  if (error?.code === "NETWORK_ERROR" || !navigator.onLine) return "No hay conexión. Comprueba tu internet e inténtalo de nuevo.";
  return error?.message || "Ocurrió un error al comunicarse con Firebase.";
}

function displayName(collection, id) {
  const row = state.all[collection]?.[id];
  if (!row) return "Registro no encontrado";
  return row.nombre || `${row.nombre || ""} ${row.apellido || ""}`.trim() || id;
}

function setConnected(connected) {
  $("#connection-dot").classList.toggle("offline", !connected);
  $("#connection-label").textContent = connected ? "Conectado" : "Sin conexión";
}

function startListeners() {
  for (const collection of Object.keys(labels)) {
    onValue(ref(database, collection), (snapshot) => {
      state.all[collection] = snapshot.val() || {};
      $(`#count-${collection}`).textContent = Object.keys(state.all[collection]).length;
      $(`#total-${collection}`).textContent = Object.keys(state.all[collection]).length;
      setConnected(true);
      renderTable();
    }, (error) => {
      setConnected(false);
      showNotice(readableError(error));
    });
  }
}

function setCollection(collection) {
  state.collection = collection;
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.collection === collection);
  });
  $("#breadcrumb-current").textContent = labels[collection];
  $("#page-title").textContent = labels[collection];
  $("#page-description").textContent = descriptions[collection];
  $("#table-title").textContent = collection === "estudiantes" ? "Directorio de estudiantes" : `Listado de ${labels[collection].toLowerCase()}`;
  $("#create-button").innerHTML = `<span>＋</span> Nuevo ${collection === "matriculas" ? "matrícula" : collection === "cursos" ? "curso" : "estudiante"}`;
  $("#search-input").value = "";
  renderTable();
}

function makeCell(text, className = "") {
  const cell = document.createElement("td");
  cell.textContent = text ?? "—";
  if (className) cell.className = className;
  return cell;
}

function renderTable() {
  const collection = state.collection;
  const head = $("#table-head");
  const body = $("#table-body");
  head.replaceChildren(); body.replaceChildren();
  const headerRow = document.createElement("tr");
  headings[collection].forEach((heading) => {
    const th = document.createElement("th"); th.textContent = heading; headerRow.append(th);
  });
  head.append(headerRow);

  const query = $("#search-input").value.trim().toLocaleLowerCase();
  const entries = Object.entries(state.all[collection] || {}).filter(([id, record]) => {
    const haystack = `${id} ${JSON.stringify(record || {})}`.toLocaleLowerCase();
    return haystack.includes(query);
  });
  state.records = Object.fromEntries(entries);
  $("#record-count").textContent = `${entries.length} ${entries.length === 1 ? "registro" : "registros"} encontrados`;
  $("#footer-count").textContent = `Mostrando ${entries.length} de ${Object.keys(state.all[collection] || {}).length} registros`;

  for (const [id, recordValue] of entries) {
    const record = recordValue || {};
    const tr = document.createElement("tr");
    if (collection === "estudiantes") {
      const identity = document.createElement("td");
      identity.innerHTML = `<span class="person-avatar">${escapeHtml(initials(record.nombre))}</span><span class="primary-cell">${escapeHtml(record.nombre || "Sin nombre")}</span>`;
      tr.append(identity, makeCell(record.correo), makeCell(record.edad ? `${record.edad} años` : "—"), makeCell(id, "id-cell"));
    } else if (collection === "cursos") {
      const course = document.createElement("td");
      course.innerHTML = `<span class="course-dot"></span><span class="primary-cell">${escapeHtml(record.nombre || "Sin nombre")}</span>`;
      tr.append(course, makeCell(record.docente), makeCell(record.creditos ? `${record.creditos} créditos` : "—"), makeCell(id, "id-cell"));
    } else {
      tr.append(makeCell(displayName("estudiantes", record.id_estudiante), "primary-cell"), makeCell(displayName("cursos", record.id_curso)), makeCell(record.periodo), makeCell(record.nota === undefined ? "—" : Number(record.nota).toFixed(1), "grade-cell"), makeCell(id, "id-cell"));
    }
    const actions = document.createElement("td"); actions.className = "actions-cell";
    const edit = document.createElement("button"); edit.className = "action-button edit-action"; edit.type = "button"; edit.textContent = "Editar"; edit.addEventListener("click", () => openForm(id));
    const removeButton = document.createElement("button"); removeButton.className = "action-button delete-action"; removeButton.type = "button"; removeButton.textContent = "Eliminar"; removeButton.addEventListener("click", () => deleteRecord(id));
    actions.append(edit, removeButton); tr.append(actions); body.append(tr);
  }
  if (!entries.length) {
    const tr = document.createElement("tr"); const td = document.createElement("td");
    td.colSpan = headings[collection].length;
    td.innerHTML = `<div class="empty-state"><span class="empty-icon">⌕</span><strong>${query ? "No encontramos coincidencias" : "Aún no hay registros"}</strong><small>${query ? "Prueba con otro nombre o identificador." : "Crea un registro nuevo o carga los datos de ejemplo."}</small></div>`;
    tr.append(td); body.append(tr);
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase() || "?";
}

function createInput(field, current = "") {
  const wrapper = document.createElement("label"); wrapper.className = "field-label";
  const caption = document.createElement("span"); caption.textContent = field.label; wrapper.append(caption);
  let input;
  if (field.type === "select") {
    input = document.createElement("select");
    const placeholder = new Option("Selecciona una opción", ""); placeholder.disabled = true; placeholder.selected = !current; input.append(placeholder);
    Object.entries(state.all[field.source] || {}).forEach(([id, record]) => {
      const option = new Option(`${record?.nombre || "Sin nombre"} · ${id}`, id); input.append(option);
    });
    if (current) input.value = current;
    if (!Object.keys(state.all[field.source] || {}).length) {
      input.disabled = true;
      const hint = document.createElement("small"); hint.className = "field-hint"; hint.textContent = `Primero crea al menos un registro en ${labels[field.source].toLowerCase()}.`; wrapper.append(input, hint);
    } else wrapper.append(input);
  } else {
    input = document.createElement("input"); input.type = field.type; input.placeholder = field.placeholder || "";
    if (field.min !== undefined) input.min = field.min;
    if (field.max !== undefined) input.max = field.max;
    if (field.step !== undefined) input.step = field.step;
    input.value = current ?? "";
    input.required = !state.editingId;
    wrapper.append(input);
    if (field.key === "edad") {
      const hint = document.createElement("small"); hint.className = "field-hint"; hint.textContent = "Edad permitida: de 1 a 120 años."; wrapper.append(hint);
    }
    if (field.key === "nota") {
      const hint = document.createElement("small"); hint.className = "field-hint"; hint.textContent = "Calificación entre 0.0 y 5.0."; wrapper.append(hint);
    }
  }
  input.name = field.key; input.dataset.field = field.key;
  return wrapper;
}

function openForm(id = null) {
  state.editingId = id;
  const collection = state.collection;
  const current = id ? state.all[collection][id] : {};
  $("#dialog-kicker").textContent = id ? `EDITAR REGISTRO · ${id}` : "NUEVO REGISTRO";
  $("#dialog-title").textContent = id ? `Editar ${labels[collection].slice(0, -1).toLowerCase()}` : `Crear ${collection === "matriculas" ? "matrícula" : collection === "cursos" ? "curso" : "estudiante"}`;
  $("#dialog-description").textContent = id ? "Deja en blanco los campos que quieras conservar sin cambios." : "Completa los campos para guardar este registro en Firebase.";
  $("#submit-button").innerHTML = id ? "Guardar cambios <span>→</span>" : "Guardar registro <span>→</span>";
  const container = $("#form-fields"); container.replaceChildren();
  fields[collection].forEach((field) => container.append(createInput(field, current?.[field.key] ?? "")));
  dialog.showModal();
  container.querySelector("input, select")?.focus();
}

function validate(field, raw) {
  const value = raw.trim();
  if (!value) throw new Error(`${field.label} es obligatorio.`);
  if (["edad", "creditos"].includes(field.key)) {
    if (!/^\d+$/.test(value)) throw new Error(`${field.label} debe ser un número entero.`);
    const number = Number(value);
    if (number < field.min || number > field.max) throw new Error(`${field.label} debe estar entre ${field.min} y ${field.max}.`);
    return number;
  }
  if (field.key === "nota") {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0 || number > 5) throw new Error("La nota debe estar entre 0.0 y 5.0.");
    return number;
  }
  if (field.key === "correo" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error("Escribe un correo electrónico válido.");
  return value;
}

async function saveRecord(event) {
  event.preventDefault();
  const collection = state.collection;
  const form = new FormData(event.currentTarget);
  const changes = {};
  try {
    for (const field of fields[collection]) {
      const raw = String(form.get(field.key) || "");
      if (state.editingId && !raw.trim()) continue;
      changes[field.key] = validate(field, raw);
    }
    if (state.editingId && Object.keys(changes).length === 0) {
      dialog.close(); showToast("No se realizaron cambios.", "info"); return;
    }
    if (collection === "matriculas") await assertReferencesExist(changes, state.editingId);
    if (state.editingId) {
      await update(ref(database, `${collection}/${state.editingId}`), changes);
      dialog.close(); showToast("Registro actualizado correctamente.");
    } else {
      const newRef = push(ref(database, collection));
      await set(newRef, changes);
      dialog.close(); showToast(`Registro creado. ID: ${newRef.key}`);
    }
  } catch (error) {
    showToast(readableError(error), "error");
  }
}

async function assertReferencesExist(changes, editingId) {
  const current = editingId ? state.all.matriculas[editingId] || {} : {};
  const finalValues = { ...current, ...changes };
  for (const [field, collection] of [["id_estudiante", "estudiantes"], ["id_curso", "cursos"]]) {
    const snapshot = await get(ref(database, `${collection}/${finalValues[field] || ""}`));
    if (!snapshot.exists()) throw new Error(`El ${field.replace("_", " ")} seleccionado ya no existe.`);
  }
}

async function deleteRecord(id) {
  const collection = state.collection;
  const record = state.all[collection][id] || {};
  const summary = collection === "matriculas" ? `${record.periodo || "matrícula"} · ${id}` : `${record.nombre || "registro"} · ${id}`;
  if (!window.confirm(`¿Eliminar “${summary}”? Esta acción no se puede deshacer.`)) return;
  try {
    if (collection !== "matriculas") {
      const field = collection === "estudiantes" ? "id_estudiante" : "id_curso";
      const snapshot = await get(ref(database, "matriculas"));
      const matriculas = snapshot.val() || {};
      const related = Object.values(matriculas).some((item) => item?.[field] === id);
      if (related) {
        showToast(`No se puede eliminar: este registro tiene matrículas asociadas.`, "error"); return;
      }
    }
    await remove(ref(database, `${collection}/${id}`));
    showToast("Registro eliminado correctamente.");
  } catch (error) {
    showToast(readableError(error), "error");
  }
}

async function seedExamples() {
  if (!window.confirm("Se agregarán ejemplos sin sobrescribir registros existentes. ¿Continuar?")) return;
  const students = {
    demo_estudiante_1: { nombre: "Ana Pérez", correo: "ana@example.com", edad: 20 },
    demo_estudiante_2: { nombre: "Luis Gómez", correo: "luis@example.com", edad: 22 }
  };
  const courses = {
    demo_curso_1: { nombre: "Programación", docente: "María Ruiz", creditos: 3 },
    demo_curso_2: { nombre: "Bases de datos", docente: "Carlos Díaz", creditos: 4 }
  };
  try {
    const [studentSnapshot, courseSnapshot, enrollmentSnapshot] = await Promise.all([
      get(ref(database, "estudiantes")), get(ref(database, "cursos")), get(ref(database, "matriculas"))
    ]);
    const currentStudents = studentSnapshot.val() || {};
    const currentCourses = courseSnapshot.val() || {};
    const currentEnrollments = enrollmentSnapshot.val() || {};
    const changes = [];
    Object.entries(students).forEach(([id, value]) => { if (!currentStudents[id]) changes.push(set(ref(database, `estudiantes/${id}`), value)); });
    Object.entries(courses).forEach(([id, value]) => { if (!currentCourses[id]) changes.push(set(ref(database, `cursos/${id}`), value)); });
    if (!Object.keys(currentEnrollments).length) changes.push(set(ref(database, "matriculas/demo_matricula_1"), {
      id_estudiante: "demo_estudiante_1", id_curso: "demo_curso_1", periodo: "2026-2", nota: 4.5
    }));
    await Promise.all(changes);
    showToast(changes.length ? "Datos de ejemplo agregados sin duplicar registros." : "Los datos de ejemplo ya existen; no hubo cambios.", "info");
  } catch (error) {
    showToast(readableError(error), "error");
  }
}

document.querySelectorAll(".nav-item").forEach((button) => button.addEventListener("click", () => setCollection(button.dataset.collection)));
$("#create-button").addEventListener("click", () => openForm());
$("#record-form").addEventListener("submit", saveRecord);
$("#close-dialog").addEventListener("click", () => dialog.close());
$("#cancel-dialog").addEventListener("click", () => dialog.close());
$("#search-input").addEventListener("input", renderTable);
$("#refresh-button").addEventListener("click", () => { renderTable(); showToast("Lista actualizada.", "info"); });
$("#seed-button").addEventListener("click", seedExamples);
document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
    event.preventDefault(); $("#search-input").focus();
  }
});
startListeners();
