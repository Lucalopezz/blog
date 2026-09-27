import type { CollectionEntry } from 'astro:content';
export { noteUrl } from './vault-files.mjs';
export type Note = CollectionEntry<'notes'>;

export function noteTitle(note: Note): string {
  return note.data.title?.trim() || note.body?.match(/^\s*#\s+(.+?)(?:\s+#+)?\s*(?:\n|$)/)?.[1] || note.id.split('/').at(-1)!.replace(/-/g, ' ');
}
export function noteFolder(note: Note): string {
  return note.id.includes('/') ? note.id.slice(0, note.id.lastIndexOf('/')) : 'Notas';
}
export interface NoteTree {
  name: string;
  path: string;
  folders: NoteTree[];
  notes: Note[];
}
export function buildNoteTree(notes: Note[]): NoteTree {
  const root: NoteTree = { name: 'Notas', path: '', folders: [], notes: [] };
  for (const note of notes) {
    let branch = root;
    for (const name of note.id.split('/').slice(0, -1)) {
      let folder = branch.folders.find(folder => folder.name === name);
      if (!folder) {
        folder = { name, path: [branch.path, name].filter(Boolean).join('/'), folders: [], notes: [] };
        branch.folders.push(folder);
      }
      branch = folder;
    }
    branch.notes.push(note);
  }
  function sort(branch: NoteTree) {
    branch.folders.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { numeric: true }));
    branch.notes.sort((a, b) => noteTitle(a).localeCompare(noteTitle(b), 'pt-BR', { numeric: true }));
    branch.folders.forEach(sort);
  }
  sort(root);
  return root;
}
