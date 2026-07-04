const CONFIG = {
  // URL de tu Google Apps Script Web App (termina en /exec). Maneja tanto el
  // registro del formulario como los contadores (visitas, registros, feedback).
  appsScriptEndpoint: 'https://script.google.com/macros/s/AKfycbxJNMMKkaWySG7RbGBwa45rKT4kL8DvVsnBHgNJXLXloNroSEx2iNhH9qqjAz3qotqTsg/exec'
};

function copiarLink(e) {
  e.preventDefault();
  navigator.clipboard.writeText(window.location.href).then(() => {
    e.target.textContent = '¡Enlace copiado!';
    setTimeout(() => { e.target.textContent = 'Copiar enlace'; }, 2000);
  }).catch(() => {
    alert('No se pudo copiar automáticamente. Copia el enlace manualmente: ' + window.location.href);
  });
}

function animarContador(el, valorFinal) {
  if (!el || typeof valorFinal !== 'number') return;
  const valorInicial = Number(el.textContent) || 0;
  const duracion = 600;
  const inicio = performance.now();
  function paso(ahora) {
    const progreso = Math.min((ahora - inicio) / duracion, 1);
    el.textContent = Math.round(valorInicial + (valorFinal - valorInicial) * progreso);
    if (progreso < 1) requestAnimationFrame(paso);
  }
  requestAnimationFrame(paso);
}

async function contarVisita() {
  try {
    const res = await fetch(`${CONFIG.appsScriptEndpoint}?accion=contador&clave=visitas`);
    const data = await res.json();
    animarContador(document.getElementById('cVis'), data.valor);
  } catch (error_) {
    // Si el contador falla, la página sigue funcionando con normalidad
  }
}

async function cargarContadoresIniciales() {
  try {
    const res = await fetch(`${CONFIG.appsScriptEndpoint}?accion=obtener`);
    const data = await res.json();
    animarContador(document.getElementById('cReg'), data.contadores.registros || 0);
    animarContador(document.getElementById('cFb'), data.contadores.feedback || 0);
  } catch (error_) {
    // Igual, fallo silencioso: no es crítico para el resto de la página
  }
}

async function manejarRegistro(e) {
  e.preventDefault();
  const form = e.target;
  const boton = form.querySelector('button[type="submit"]');
  const datos = { nombre: form.nombre.value, email: form.email.value };

  boton.disabled = true;
  boton.textContent = 'Enviando...';

  try {
    const formData = new FormData();
    formData.append('nombre', datos.nombre);
    formData.append('email', datos.email);

    // Se envía como FormData (no JSON) para evitar el preflight CORS que
    // Google Apps Script no maneja bien.
    const res = await fetch(CONFIG.appsScriptEndpoint, {
      method: 'POST',
      body: formData
    });
    const resultado = await res.json();

    if (!res.ok || resultado.result !== 'success') throw new Error('Apps Script respondió con error');

    form.style.display = 'none';
    document.getElementById('okMsg').style.display = 'block';
    animarContador(document.getElementById('cReg'), resultado.registros);
  } catch (err) {
    alert('No pudimos enviar tu registro. Intenta de nuevo en unos minutos.');
    boton.disabled = false;
    boton.textContent = 'Quiero la demostración gratis';
  }
}

async function darFeedback(e, tipo) {
  e.preventDefault();
  document.querySelectorAll('.fb-btn').forEach(b => b.disabled = true);
  try {
    const res = await fetch(`${CONFIG.appsScriptEndpoint}?accion=contador&clave=feedback`);
    const data = await res.json();
    animarContador(document.getElementById('cFb'), data.valor);
  } catch (error_) {
    // Fallo silencioso, no bloquea la experiencia del usuario
  } finally {
    const gracias = document.getElementById('fbGracias');
    if (gracias) gracias.style.display = 'block';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formRegistro');
  if (form) form.addEventListener('submit', manejarRegistro);
  contarVisita();
  cargarContadoresIniciales();

  const anio = document.getElementById('anio');
  if (anio) anio.textContent = new Date().getFullYear();
});
