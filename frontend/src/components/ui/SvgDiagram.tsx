interface Props {
  svg: string;
}

/** Sanitize SVG: remove scripts, event handlers, and dangerous elements */
function sanitizeSvg(raw: string): string {
  let s = raw;
  // Remove script tags
  s = s.replace(/<script[\s\S]*?<\/script>/gi, '');
  // Remove event handlers (onclick, onload, etc.)
  s = s.replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '');
  // Remove foreignObject, iframe, embed, object
  s = s.replace(/<(foreignObject|iframe|embed|object)[\s\S]*?<\/\1>/gi, '');
  // Remove style tags (prevent CSS injection)
  s = s.replace(/<style[\s\S]*?<\/style>/gi, '');
  // Extract only the <svg>...</svg> portion
  const match = s.match(/<svg[\s\S]*<\/svg>/i);
  return match ? match[0] : '';
}

export default function SvgDiagram({ svg }: Props) {
  const clean = sanitizeSvg(svg);
  if (!clean) return null;

  return (
    <div
      className="my-3 flex justify-center bg-white border border-gray-200 rounded-lg p-3 overflow-hidden"
      dangerouslySetInnerHTML={{ __html: clean }}
      style={{ maxWidth: '100%' }}
    />
  );
}
