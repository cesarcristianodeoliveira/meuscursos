import { createClient } from '@sanity/client';
import { createImageUrlBuilder } from "@sanity/image-url";

export const client = createClient({
  projectId: 'ibfwgom5',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-02-20',
});

const builder = createImageUrlBuilder(client)

export function urlFor(source) {
  return builder.image(source);
}