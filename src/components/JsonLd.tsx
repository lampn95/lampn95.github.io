// Server component — emits JSON-LD via a plain <script> tag. Search engines pick
// this up while users see nothing extra in the rendered page.

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
