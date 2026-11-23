export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function photoUrl(photo, media) {
  if (!media.enabled) return '';
  if (photo.url) return /^https:\/\//.test(photo.url) ? photo.url : '';
  const prefix = (media.prefix ?? 'geologia/v1').replace(/^\/+|\/+$/g, '');
  const key = [prefix, photo.id].filter(Boolean).join('/').split('/').map(encodeURIComponent).join('/');
  if (media.provider === 'cloudinary' && /^[\w-]+$/.test(media.cloudName || '')) {
    return `https://res.cloudinary.com/${media.cloudName}/image/upload/c_limit,w_1400,f_auto,q_auto/${key}`;
  }
  if (media.provider === 'r2' && /^https:\/\//.test(media.baseUrl || '')) {
    return `${media.baseUrl.replace(/\/+$/, '')}/${key}.webp`;
  }
  return '';
}

export function availableRocks(rocks, mode, group, resolve) {
  return rocks.filter(r => !group || r.group === group).map(rock => ({
    ...rock,
    photos: rock.photos.filter(photo => (mode !== 'exam' || photo.exam) && resolve(photo))
  })).filter(rock => rock.photos.length);
}

export function examQuestions(rocks, random = Math.random) {
  const eligible = rocks.map(rock => ({...rock, photos: rock.photos.filter(p => p.exam)})).filter(r => r.photos.length);
  if (new Set(eligible.map(r => r.id)).size !== eligible.length) throw new Error('El catálogo repite identificadores de roca.');
  if (eligible.length < 5) throw new Error('Se necesitan cinco tipos de roca con fotografías de examen.');
  return shuffle(eligible, random).slice(0, 5).map(rock => ({rock, photo: shuffle(rock.photos, random)[0], answer: null}));
}

export function learningQuestion(rocks, previous = null, random = Math.random) {
  if (!rocks.length) throw new Error('No hay fotografías disponibles.');
  const pool = rocks.length > 1 ? rocks.filter(r => r.id !== previous?.rock.id) : rocks;
  const rock = shuffle(pool, random)[0];
  const alternatives = rock.photos.filter(p => p.id !== previous?.photo.id);
  return {rock, photo: shuffle(alternatives.length ? alternatives : rock.photos, random)[0], answer: null};
}

export function isCorrect(question) {
  return !!question.answer && question.answer.group === question.rock.group && question.answer.rock === question.rock.id;
}

export function grade(questions) {
  const correct = questions.filter(isCorrect).length;
  return {correct, total: questions.length, score: questions.length ? 10 * correct / questions.length : 0};
}
