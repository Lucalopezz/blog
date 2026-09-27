import type { GetStaticPaths, APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { listVaultFiles, isAttachment, notesRoot } from '../../lib/vault-files.mjs';

export const getStaticPaths = (() => listVaultFiles().filter(isAttachment).map(file => ({
  params: { path: file }, props: { file },
}))) satisfies GetStaticPaths;

// Executed at build time: these become ordinary static files in dist/attachments/.
export const GET: APIRoute = async ({ props }) => {
  const bytes = await readFile(path.join(notesRoot, props.file));
  const types: Record<string, string> = {
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
    '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif', '.pdf': 'application/pdf',
    '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.mp4': 'video/mp4', '.webm': 'video/webm',
  };
  return new Response(new Uint8Array(bytes), { headers: { 'Content-Type': types[path.extname(props.file).toLowerCase()] || 'application/octet-stream' } });
};
