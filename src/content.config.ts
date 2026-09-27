import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { noteId } from './lib/vault-files.mjs';

const optionalDate = z.preprocess(value => value === null || value === '' ? undefined : value, z.coerce.date().optional());
const notes = defineCollection({
  loader: glob({
    pattern: ['**/*.{md,MD}', '!**/.*/**'],
    base: './src/content/notes',
    generateId: ({ entry }) => noteId(entry),
  }),
  schema: z.object({
    title: z.string().nullish(),
    description: z.string().nullish(),
    date: optionalDate,
    updatedDate: optionalDate,
    category: z.string().nullish(),
    tags: z.preprocess(value => typeof value === 'string' ? value.split(/[,\s]+/).filter(Boolean) : value ?? [], z.array(z.string())),
  }),
});

export const collections = { notes };
