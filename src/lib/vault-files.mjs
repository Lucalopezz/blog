import { readdirSync } from 'node:fs';
import path from 'node:path';

export const notesRoot = path.resolve('src/content/notes');
export const isNote = (file) => /\.md$/i.test(file);
export const isImage = (file) => /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(file);
export const isAttachment = (file) => /\.(png|jpe?g|gif|webp|avif|svg|pdf|mp3|wav|ogg|mp4|webm)$/i.test(file);
export const noteId = (file) => file.replace(/\.md$/i, '');
export const encodePath = (file) => file.split('/').map(encodeURIComponent).join('/');
export const noteUrl = (id) => `/notes/${encodePath(id)}/`;

// Ignore vault settings, trash, and symlinks. Only publish notes and supported attachments.
export function listVaultFiles(root = notesRoot, prefix = '') {
  return readdirSync(path.join(root, prefix), { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith('.')) return [];
    const file = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) return listVaultFiles(root, file);
    return entry.isFile() && (isNote(file) || isAttachment(file)) ? [file] : [];
  }).sort();
}

export function headingId(heading) {
  return heading.toLowerCase().replace(/[^\p{L}\p{N}\p{M}_\-\s]/gu, '').replace(/\s/g, '-');
}

// Resolve relative paths first, then vault paths, then an unambiguous short name.
export function resolveVaultLink(target, currentFile, files, wiki = false) {
  if (/^(?:[a-z][\w+.-]*:|\/\/)/i.test(target)) return null;
  let decoded;
  try { decoded = decodeURIComponent(target); } catch { decoded = target; }
  const hash = decoded.indexOf('#');
  const destination = (hash < 0 ? decoded : decoded.slice(0, hash)).trim();
  const heading = hash < 0 ? '' : decoded.slice(hash + 1);
  if (!destination) return { url: `#${wiki ? headingId(heading) : encodeURI(heading)}`, file: currentFile };
  if (!wiki && destination.startsWith('/')) return null;
  const candidates = [
    path.posix.normalize(path.posix.join(path.posix.dirname(currentFile), destination)),
    path.posix.normalize(destination.replace(/^\//, '')),
  ];
  const matches = (candidate) => files.filter(file => file === candidate || (isNote(file) && noteId(file) === candidate));
  let found;
  for (const candidate of candidates) {
    const exact = matches(candidate);
    if (exact.length === 1) { found = exact[0]; break; }
    if (exact.length > 1) throw new Error(`Link ambíguo: "${target}" em ${currentFile}. Use o caminho completo.`);
  }
  if (!found) {
    const short = files.filter(file => file.endsWith(`/${destination}`) || (isNote(file) && noteId(file).endsWith(`/${destination}`)));
    if (short.length > 1) throw new Error(`Link ambíguo: "${target}" em ${currentFile}. Use o caminho completo.`);
    found = short[0];
  }
  if (!found) return null;
  const fragment = heading ? `#${wiki ? headingId(heading) : encodeURI(heading)}` : '';
  return { file: found, url: (isNote(found) ? noteUrl(noteId(found)) : `/attachments/${encodePath(found)}`) + fragment };
}
