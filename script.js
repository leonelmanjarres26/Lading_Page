/* Google Apps Script conectado a la Google Sheet: guarda los registros del piloto
   y lleva los contadores globales (visitas, registros, feedback) compartidos entre todos los visitantes. */
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxiVOWLDuzHnzL_yrcyaUBlQivP6YiljGxq6g5VN9FxTPUqxnpxQdO3R7WFmHIzHmhjzg/exec';

function animar(id, valor){
  let el = document.getElementById(id), n = 0;
  let paso = Math.max(1, Math.ceil(valor/30));
  let t = setInterval(()=>{ n += paso; if(n>=valor){n=valor;clearInterval(t);} el.textContent = n; }, 30);
}

/* Copiar enlace */
function copiarLink(e){
  e.preventDefault();
  navigator.clipboard.writeText(globalThis.location.href).then(()=>{
    e.target.textContent = '¡Enlace copiado!';
    setTimeout(()=>{ e.target.textContent = 'Copiar enlace'; }, 2000);
  });
}

/* Feedback (👍/👎): también es un contador global vía Apps Script */
async function darFeedback(e, tipo){
  e.preventDefault();
  document.querySelectorAll('.fb-btn').forEach(b => b.disabled = true);
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?accion=contador&clave=feedback`);
    const data = await res.json();
    animar('cFb', data.valor);
  } catch (error_) {
    console.warn('No se pudo actualizar el contador de feedback:', error_);
  } finally {
    document.getElementById('fbGracias').style.display = 'block';
  }
}

/* Este archivo es un módulo ES (para poder usar await de nivel superior más abajo), así que
   sus funciones no son globales por defecto. Se exponen aquí, ANTES de cualquier await, porque
   el HTML las invoca con onclick="" y podrían dispararse mientras el módulo sigue cargando. */
globalThis.copiarLink = copiarLink;
globalThis.darFeedback = darFeedback;

/* Formulario Hero: envía nombre y correo a la Google Sheet vía Apps Script.
   Se registra antes de los await de abajo para que el envío nunca dependa de que
   esas llamadas hayan terminado. */
document.getElementById('formRegistro').addEventListener('submit', async function(e){
  e.preventDefault();
  const form = e.target;
  const boton = form.querySelector('button[type="submit"]');

  const formData = new FormData();
  formData.append('nombre', form.nombre.value);
  formData.append('email', form.email.value);

  boton.disabled = true;
  boton.textContent = 'Enviando...';

  try {
    const res = await fetch(APPS_SCRIPT_URL, { method: 'POST', body: formData });
    const resultado = await res.json();
    if (!res.ok || resultado.result !== 'success') throw new Error('Apps Script respondió con error');

    animar('cReg', resultado.registros);
    form.style.display = 'none';
    document.getElementById('okMsg').style.display = 'block';
  } catch (error_) {
    console.error('Fallo el envío del registro:', error_);
    alert('No pudimos enviar tu registro. Intenta de nuevo en unos minutos.');
    boton.disabled = false;
    boton.textContent = 'Quiero la demostración gratis';
  }
});

/* Formulario de Preguntas frecuentes para docentes: envía las 3 respuestas a la misma
   Google Sheet vía Apps Script. Requiere que el Apps Script guarde los campos p1, p2 y p3
   (por ejemplo en una hoja/columnas nuevas) cuando reciba accion=preguntas. */
document.getElementById('formPreguntas').addEventListener('submit', async function(e){
  e.preventDefault();
  const form = e.target;
  const boton = form.querySelector('button[type="submit"]');

  const formData = new FormData();
  formData.append('accion', 'preguntas');
  formData.append('p1', form.p1.value);
  formData.append('p2', form.p2.value);
  formData.append('p3', form.p3.value);

  boton.disabled = true;
  boton.textContent = 'Enviando...';

  try {
    const res = await fetch(APPS_SCRIPT_URL, { method: 'POST', body: formData });
    const resultado = await res.json();
    if (!res.ok || resultado.result !== 'success') throw new Error('Apps Script respondió con error');

    form.style.display = 'none';
    document.getElementById('okMsgPreguntas').style.display = 'block';
  } catch (error_) {
    console.error('Fallo el envío de las respuestas:', error_);
    alert('No pudimos enviar tus respuestas. Intenta de nuevo en unos minutos.');
    boton.disabled = false;
    boton.textContent = 'Enviar respuestas';
  }
});

/* Cuenta esta visita en el contador global y muestra el total actualizado */
try {
  const resVisitas = await fetch(`${APPS_SCRIPT_URL}?accion=contador&clave=visitas`);
  const dataVisitas = await resVisitas.json();
  animar('cVis', dataVisitas.valor);
} catch (error_) {
  console.warn('No se pudo actualizar el contador de visitas:', error_);
}

/* Muestra los contadores actuales de registros y feedback (sin incrementarlos) */
try {
  const resContadores = await fetch(`${APPS_SCRIPT_URL}?accion=obtener`);
  const dataContadores = await resContadores.json();
  animar('cReg', dataContadores.contadores.registros || 0);
  animar('cFb', dataContadores.contadores.feedback || 0);
} catch (error_) {
  console.warn('No se pudieron cargar los contadores:', error_);
}
