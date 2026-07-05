/* Google Apps Script conectado a la Google Sheet donde se guardan los registros del piloto */
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxJNMMKkaWySG7RbGBwa45rKT4kL8DvVsnBHgNJXLXloNroSEx2iNhH9qqjAz3qotqTsg/exec';

/* Contadores demo de "Mide los resultados".
   Se guardan en este navegador (localStorage), no son un conteo global entre visitantes. */
let visitas = Number(localStorage.getItem('c6_vis') || 0) + 1;
localStorage.setItem('c6_vis', visitas);
let registros = Number(localStorage.getItem('c6_reg') || 0);
let feedback  = Number(localStorage.getItem('c6_fb')  || 0);

function animar(id, valor){
  let el = document.getElementById(id), n = 0;
  let paso = Math.max(1, Math.ceil(valor/30));
  let t = setInterval(()=>{ n += paso; if(n>=valor){n=valor;clearInterval(t);} el.textContent = n; }, 30);
}
animar('cVis', visitas);
animar('cReg', registros);
animar('cFb',  feedback);

/* Formulario Hero: envía nombre y correo a la Google Sheet vía Apps Script */
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

    registros++; localStorage.setItem('c6_reg', registros);
    animar('cReg', registros);
    form.style.display = 'none';
    document.getElementById('okMsg').style.display = 'block';
  } catch (error_) {
    alert('No pudimos enviar tu registro. Intenta de nuevo en unos minutos.');
    boton.disabled = false;
    boton.textContent = 'Quiero la demostración gratis';
  }
});

/* Feedback (👍/👎) */
function darFeedback(e, tipo){
  e.preventDefault();
  document.querySelectorAll('.fb-btn').forEach(b => b.disabled = true);
  feedback++; localStorage.setItem('c6_fb', feedback);
  animar('cFb', feedback);
  document.getElementById('fbGracias').style.display = 'block';
}

/* Copiar enlace */
function copiarLink(e){
  e.preventDefault();
  navigator.clipboard.writeText(globalThis.location.href).then(()=>{
    e.target.textContent = '¡Enlace copiado!';
    setTimeout(()=>{ e.target.textContent = 'Copiar enlace'; }, 2000);
  });
}
