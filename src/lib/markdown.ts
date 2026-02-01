function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatInline(input: string): string {
  let text = input;
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return text;
}

export function renderMarkdown(markdown: string): string {
  if (!markdown) return '';

  const lines = escapeHtml(markdown).split(/\r?\n/);
  let html = '';
  let inList = false;

  const closeList = () => {
    if (inList) {
      html += '</ul>';
      inList = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      closeList();
      continue;
    }

    const listMatch = /^[-*]\s+(.+)$/.exec(trimmed);
    if (listMatch) {
      if (!inList) {
        html += '<ul class="markdown-list">';
        inList = true;
      }
      html += `<li>${formatInline(listMatch[1])}</li>`;
      continue;
    }

    closeList();

    if (trimmed.startsWith('### ')) {
      html += `<h3>${formatInline(trimmed.slice(4))}</h3>`;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      html += `<h2>${formatInline(trimmed.slice(3))}</h2>`;
      continue;
    }
    if (trimmed.startsWith('# ')) {
      html += `<h1>${formatInline(trimmed.slice(2))}</h1>`;
      continue;
    }

    html += `<p>${formatInline(trimmed)}</p>`;
  }

  closeList();
  return html;
}
