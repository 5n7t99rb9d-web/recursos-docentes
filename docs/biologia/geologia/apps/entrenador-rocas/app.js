import {availableRocks, examQuestions, learningQuestion, isCorrect, grade, photoUrl} from './core.mjs';

const $ = id => document.getElementById(id);
const elements = ['setup','session','results'];
let catalog, media, mode = 'learn', questions = [], index = 0, pool = [], active = false;
let imageReady = false, loadSequence = 0, localFiles = new Map(), objectUrls = new Map();
const imageCache = new Map();
const previousPhotos = new Set();

function show(id) { elements.forEach(name => $(name).hidden = name !== id); }
function option(value, label) { const o = document.createElement('option'); o.value = value; o.textContent = label; return o; }
function paragraph(text, className = '') { const p = document.createElement('p'); p.textContent = text; p.className = className; return p; }
function resolve(photo) {
  if (localFiles.has(photo.path)) {
    if (!objectUrls.has(photo.path)) objectUrls.set(photo.path, URL.createObjectURL(localFiles.get(photo.path)));
    return objectUrls.get(photo.path);
  }
  return photoUrl(photo, media);
}
function available() { return availableRocks(catalog.rocks, mode, $('practice-group').value, resolve); }
function updateAvailability() {
  pool = available();
  const photos = pool.reduce((n,r) => n + r.photos.length, 0);
  $('availability').textContent = photos ? `${pool.length} tipos · ${photos} fotografías disponibles${mode === 'exam' ? ' para examen' : ''}.` : 'Las fotografías públicas aún no están conectadas. Puedes probar con la carpeta de imágenes del ordenador.';
  $('start').disabled = mode === 'exam' ? pool.length < 5 : !pool.length;
  $('start').textContent = mode === 'exam' ? 'Comenzar examen de 5 rocas →' : 'Comenzar práctica →';
  if (mode === 'exam' && photos && pool.length < 5) $('availability').textContent += ' El examen necesita al menos cinco tipos distintos.';
}
function setMode(value) {
  mode = value;
  for (const [id,m] of [['learn-mode','learn'],['exam-mode','exam']]) {
    $(id).classList.toggle('selected', mode === m); $(id).setAttribute('aria-pressed', String(mode === m));
  }
  updateAvailability();
}
function fillAnswers(group = '', answer = '') {
  $('answer-rock').replaceChildren(option('', group ? 'Selecciona una roca' : 'Selecciona primero un grupo'));
  // All photographed types remain selectable; the question's group is never exposed.
  catalog.rocks.filter(r => r.group === group).sort((a,b) => a.name.localeCompare(b.name,'es')).forEach(r => $('answer-rock').append(option(r.id,r.name)));
  $('answer-rock').disabled = !group; $('answer-rock').value = answer;
}
function updateSubmit() { $('submit').disabled = !imageReady || !$('answer-rock').value || !!(mode === 'learn' && questions[index]?.answer); }
function updateProgress() {
  if (mode === 'exam') {
    $('progress-text').textContent = `Muestra ${index + 1} de 5`;
    $('progress').max = 5; $('progress').value = questions.filter(q => q.answer).length;
    $('session-score').textContent = 'Corrección al finalizar';
  } else {
    const done = questions.filter(q => q.answer); const result = grade(done);
    $('progress-text').textContent = `Muestra ${index + 1}`;
    $('progress').max = Math.max(1,questions.length); $('progress').value = done.length;
    $('session-score').textContent = `${result.correct} ${result.correct === 1 ? 'acierto' : 'aciertos'} / ${result.total} ${result.total === 1 ? 'respuesta' : 'respuestas'}`;
  }
}
function renderQuestion() {
  const q = questions[index]; imageReady = false;
  $('session-title').textContent = '¿Qué muestra observas?'; $('mode-label').textContent = mode === 'exam' ? 'MODO EXAMEN' : 'MODO APRENDIZAJE';
  $('feedback').hidden = true; $('feedback').replaceChildren();
  $('answer-form').hidden = false; $('answer-group').disabled = false;
  $('answer-group').value = q.answer?.group || ''; fillAnswers(q.answer?.group || '',q.answer?.rock || '');
  $('submit').textContent = mode === 'learn' ? 'Comprobar respuesta' : index === 4 ? 'Finalizar y corregir examen' : 'Guardar y continuar →';
  $('previous').hidden = mode !== 'exam' || index === 0; $('next').hidden = true;
  if (mode === 'learn' && q.answer) feedback(q);
  updateProgress(); updateSubmit(); loadPhoto(q);
}
async function loadPhoto(q, retry = false) {
  const sequence = ++loadSequence; imageReady = false; $('sample').hidden = true; $('zoom').disabled = true;
  $('image-state').hidden = false; $('image-state').textContent = 'Cargando fotografía…'; $('retry').hidden = true; updateSubmit();
  const url = resolve(q.photo);
  if (retry) imageCache.delete(url);
  if (!imageCache.has(url)) imageCache.set(url,new Promise((resolveImage,reject) => {
    const img = new Image(); const timer = setTimeout(() => reject(new Error('Tiempo de espera agotado')),20000);
    img.onload = () => { clearTimeout(timer); resolveImage(url); }; img.onerror = () => { clearTimeout(timer); reject(new Error('Fotografía no disponible')); }; img.src = url;
  }));
  try {
    await imageCache.get(url);
    if (sequence !== loadSequence || !active) return;
    $('sample').src = url; $('sample').hidden = false; $('image-state').hidden = true;
    $('zoom').disabled = false; imageReady = true; updateSubmit();
  } catch {
    imageCache.delete(url);
    if (sequence !== loadSequence || !active) return;
    $('image-state').textContent = 'No se ha podido cargar la fotografía. Reintenta antes de responder.'; $('retry').hidden = false;
  }
}
function feedback(q) {
  const box = $('feedback'); box.replaceChildren(); box.hidden = false; box.className = isCorrect(q) ? '' : 'wrong';
  const heading = document.createElement('h3'); heading.textContent = isCorrect(q) ? 'Correcto' : 'Revisa esta muestra'; box.append(heading);
  const strong = document.createElement('strong'); strong.textContent = q.rock.name; box.append(strong,paragraph(q.rock.explanation));
  if (q.rock.limit) box.append(paragraph(q.rock.limit,'muted'));
  if (!q.photo.exam) box.append(paragraph('Nombre de la serie de la colección. Esta vista se reserva para aprendizaje porque la fotografía no permite exigir una identificación inequívoca.','muted'));
  $('answer-group').disabled = true; $('answer-rock').disabled = true; $('submit').disabled = true;
  $('next').hidden = false;
}
function finish() {
  active = false; ++loadSequence; show('results');
  const result = grade(questions); $('grade').textContent = `${result.score.toLocaleString('es',{maximumFractionDigits:1})} / 10`;
  $('result-description').textContent = `${result.correct} de ${result.total} tipos identificados. Cada respuesta correcta vale 2 puntos; los errores no restan.`;
  $('review').replaceChildren();
  questions.forEach((q,i) => {
    const article = document.createElement('article'); article.className = 'review-item';
    const image = document.createElement('img'); image.src = resolve(q.photo); image.alt = q.rock.name; image.loading = 'lazy';
    image.onerror = () => { image.alt = 'Fotografía no disponible para la revisión'; };
    const text = document.createElement('div'); const tag = document.createElement('span'); tag.className = `tag${isCorrect(q) ? '' : ' wrong'}`; tag.textContent = isCorrect(q) ? 'Correcta' : 'Para repasar';
    const title = document.createElement('h3'); title.textContent = `${i+1}. ${q.rock.name}`;
    const selected = catalog.rocks.find(r => r.id === q.answer?.rock);
    text.append(tag,title,paragraph(`Tu respuesta: ${selected?.name || 'Sin respuesta'}`),paragraph(q.rock.explanation));
    if (q.rock.limit) text.append(paragraph(q.rock.limit,'muted'));
    article.append(image,text); $('review').append(article);
  });
  $('results-title').focus();
}
function home() {
  active = false; ++loadSequence; questions = []; index = 0; show('setup'); updateAvailability(); $('start').focus();
}
async function initialize() {
  try {
    const read = async file => { const response = await fetch(file); if (!response.ok) throw new Error(file); return response.json(); };
    [catalog,media] = await Promise.all([read('./catalog.json'),read('./media.json')]);
    if (!Array.isArray(catalog.rocks) || !Array.isArray(catalog.groups)) throw new Error('Catálogo inválido');
    catalog.groups.forEach(g => { $('practice-group').append(option(g.id,g.name)); $('answer-group').append(option(g.id,g.name)); });
    $('learn-mode').onclick = () => setMode('learn'); $('exam-mode').onclick = () => setMode('exam');
    $('practice-group').onchange = updateAvailability;
    $('answer-group').onchange = () => { fillAnswers($('answer-group').value); updateSubmit(); };
    $('answer-rock').onchange = updateSubmit;
    $('local-files').onchange = event => {
      objectUrls.forEach(url => URL.revokeObjectURL(url)); objectUrls.clear(); localFiles.clear(); imageCache.clear();
      const known = new Set(catalog.rocks.flatMap(r => r.photos.map(p => p.path)));
      for (const file of event.target.files) {
        const segments = (file.webkitRelativePath || file.name).replace(/\\/g,'/').split('/');
        const key = segments.slice(-2).join('/');
        if (known.has(key)) localFiles.set(key,file);
      }
      $('local-status').textContent = localFiles.size ? `${localFiles.size} fotografías del catálogo conectadas. Permanecen en tu ordenador.` : 'No se han encontrado las fotografías. Selecciona la carpeta imagenes que contiene practica_02 a practica_05.';
      updateAvailability();
    };
    $('start').onclick = () => {
      pool = available(); previousPhotos.clear();
      questions = mode === 'exam' ? examQuestions(pool) : [learningQuestion(pool)]; index = 0; active = true;
      show('session'); renderQuestion(); $('session-title').focus();
    };
    $('answer-form').onsubmit = event => {
      event.preventDefault(); if (!imageReady || !$('answer-rock').value || (mode === 'learn' && questions[index].answer)) return;
      questions[index].answer = {group:$('answer-group').value,rock:$('answer-rock').value};
      if (mode === 'learn') { feedback(questions[index]); updateProgress(); }
      else if (index === 4) finish(); else { index++; renderQuestion(); $('session-title').focus(); }
    };
    $('next').onclick = () => {
      previousPhotos.add(questions[index].photo.id);
      // Prefer unused views of the chosen type until its available views are exhausted.
      const fresh = pool.map(r => ({...r,photos:r.photos.filter(p => !previousPhotos.has(p.id))})).filter(r => r.photos.length);
      questions.push(learningQuestion(fresh.length ? fresh : pool,questions[index])); index++; renderQuestion(); $('session-title').focus();
    };
    $('previous').onclick = () => { if (index > 0) { index--; renderQuestion(); $('session-title').focus(); } };
    $('retry').onclick = () => loadPhoto(questions[index],true);
    $('exit').onclick = home; $('restart').onclick = home;
    $('zoom').onclick = () => { if (imageReady) { $('large-sample').src = $('sample').src; $('lightbox').showModal(); } };
    $('close-zoom').onclick = () => $('lightbox').close();
    updateAvailability();
  } catch {
    $('fatal').hidden = false; $('fatal').textContent = 'No se ha podido cargar el catálogo. Abre la aplicación desde la web o mediante un servidor local y vuelve a cargar la página.';
    $('availability').textContent = 'Catálogo no disponible.';
  }
}
initialize();
