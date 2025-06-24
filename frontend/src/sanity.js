import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

const client = createClient({
  projectId: "6frgs9wx",
  dataset: "production",
  apiVersion: "2025-06-12",
  token: "skUmwurjL95gLed6EVsTne8PcJHVlmu0gIFRorelGjtrsebT6NQI2YHFKMWmOCX8emJTBloCQCqBD2PGV47HS82ni610ENSOGMIDMVKeR24fuKuZAQdHtM01hXrKecUvtyRUYl4c6smpcvVsMvlFQlDYMVE0KGOyF4Tbr1djOqjL47retYMX", // <--- COLE SUA NOVA CHAVE AQUI
  useCdn: false,
  ignoreBrowserTokenWarning: true,
});

const builder = imageUrlBuilder(client);

export const urlFor = (source) => builder.image(source);

export default client;