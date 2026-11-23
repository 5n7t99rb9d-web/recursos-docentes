import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {availableRocks,examQuestions,learningQuestion,grade,photoUrl} from '../docs/biologia/geologia/apps/entrenador-rocas/core.mjs';

const catalog = JSON.parse(readFileSync(new URL('../docs/biologia/geologia/apps/entrenador-rocas/catalog.json',import.meta.url)));
const all = availableRocks(catalog.rocks,'exam','',() => 'blob:test');
test('Cada examen contiene cinco tipos diferentes y vistas aptas',() => {
  for(let i=0;i<200;i++) {
    const qs = examQuestions(all);
    assert.equal(qs.length,5); assert.equal(new Set(qs.map(q=>q.rock.id)).size,5);
    assert.ok(qs.every(q=>q.photo.exam && q.answer===null));
  }
});
test('El examen no empieza con menos de cinco tipos ni tipos duplicados',() => {
  assert.throws(()=>examQuestions(all.slice(0,4)),/cinco/);
  assert.throws(()=>examQuestions([...all,all[0]]),/repite/);
});
test('Disponibilidad exige vista de examen, imagen conectada y filtro de grupo',() => {
  assert.equal(availableRocks(catalog.rocks,'exam','',()=> '').length,0);
  const rs=availableRocks(catalog.rocks,'exam','metamorficas',()=> 'blob:test');
  assert.equal(rs.length,4); assert.ok(rs.every(r=>r.group==='metamorficas' && r.photos.every(p=>p.exam)));
});
test('Aprendizaje evita repetir el tipo inmediato y funciona con una única vista',() => {
  const q=learningQuestion(all); const next=learningQuestion(all,q);
  assert.notEqual(next.rock.id,q.rock.id);
  assert.ok(learningQuestion([{...q.rock,photos:[q.photo]}],q).photo);
});
test('La nota puntúa tipo y grupo conjuntamente y cuenta blancos como errores',() => {
  const qs=examQuestions(all);
  qs[0].answer={group:qs[0].rock.group,rock:qs[0].rock.id};
  qs[1].answer={group:'otro',rock:qs[1].rock.id};
  assert.deepEqual(grade(qs),{correct:1,total:5,score:2});
  assert.deepEqual(grade([]),{correct:0,total:0,score:0});
});
test('No hay URLs activas hasta elegir proveedor; los dos adaptadores usan nombres neutros',() => {
  const p=all[0].photos[0]; assert.equal(photoUrl(p,{enabled:false}), '');
  assert.match(photoUrl(p,{enabled:true,provider:'r2',baseUrl:'https://media.example.org'}),/^https:\/\/media\.example\.org\/geologia\/v1\/p\d-\d+\.webp$/);
  assert.match(photoUrl(p,{enabled:true,provider:'cloudinary',cloudName:'example'}),/c_limit,w_1400,f_auto,q_auto/);
  assert.equal(photoUrl({...p,url:'javascript:alert(1)'},{enabled:true}), '');
});
test('Catálogo consistente: IDs, grupos, rutas y descripciones',() => {
  assert.equal(new Set(catalog.rocks.map(r=>r.id)).size,catalog.rocks.length);
  const ids=new Set();
  for(const r of catalog.rocks) {
    assert.ok(r.name && r.explanation); assert.ok(catalog.groups.some(g=>g.id===r.group));
    for(const p of r.photos) { assert.ok(!ids.has(p.id)); ids.add(p.id); assert.match(p.path,/^practica_0[2-5]\/IMG_\d+\.jpg$/); assert.equal(p.url,''); }
  }
  assert.equal(ids.size,152);
});
test('Carpeta organizativa de Cloudinary independiente del ID público',() => {
  const p={id:'p2-8962',url:''};
  assert.equal(photoUrl(p,{enabled:true,provider:'cloudinary',cloudName:'oodx73ll',prefix:''}),'https://res.cloudinary.com/oodx73ll/image/upload/c_limit,w_1400,f_auto,q_auto/p2-8962');
});
