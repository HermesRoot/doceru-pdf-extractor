let extractedLink = null; // Armazena o link extraído
let extractedTitle = null; // Armazena o título extraído

document.getElementById('extract').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) {
      document.getElementById('result').textContent = 'Nenhuma aba ativa encontrada.';
      return;
    }

    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: extractPdfUrlAndTitle
    }, (results) => {
      if (chrome.runtime.lastError) {
        document.getElementById('result').textContent = 'Erro: ' + chrome.runtime.lastError.message;
      } else if (results && results[0] && results[0].result) {
        const { link, title } = results[0].result;
        const resultElement = document.getElementById('result');

        if (link === 'Link não encontrado') {
          resultElement.textContent = link;
        } else {
          extractedLink = link;
          extractedTitle = title ? title : 'documento';
          resultElement.textContent = link;
          document.getElementById('copy').style.display = 'block';
          document.getElementById('download').style.display = 'block';
        }
      } else {
        document.getElementById('result').textContent = 'Nenhum resultado retornado.';
      }
    });
  });
});

document.getElementById('copy').addEventListener('click', () => {
  if (extractedLink && extractedLink !== 'Link não encontrado') {
    navigator.clipboard.writeText(extractedLink).then(() => {
      document.getElementById('result').textContent = 'Link copiado para a área de transferência!';
    }).catch((err) => {
      document.getElementById('result').textContent = 'Erro ao copiar: ' + err;
    });
  }
});

document.getElementById('download').addEventListener('click', () => {
  if (extractedLink && extractedLink !== 'Link não encontrado') {
    // Regex ajustado para permitir acentos e caracteres comuns em português
    let filename = extractedTitle.replace(/[<>:\"/\\|?*]+/g, ''); // Remove apenas caracteres inválidos em nomes de arquivos
    if (!filename.toLowerCase().endsWith('.pdf')) {
      filename += '.pdf';
    }

    chrome.downloads.download({
      url: extractedLink,
      filename: filename
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        document.getElementById('result').textContent = 'Erro ao baixar: ' + chrome.runtime.lastError.message;
      } else {
        document.getElementById('result').textContent = `Iniciando download como "${filename}"...`;
        chrome.downloads.onChanged.addListener(function downloadCompleteListener(delta) {
          if (delta.id === downloadId && delta.state && delta.state.current === 'complete') {
            document.getElementById('result').textContent = `Download concluído: "${filename}"!`;
            chrome.downloads.onChanged.removeListener(downloadCompleteListener);
          }
        });
      }
    });
  } else {
    document.getElementById('result').textContent = 'Nenhum link válido para baixar.';
  }
});

function extractPdfUrlAndTitle() {
  const linkElement = document.querySelector('[data-pdf-url]');
  let titleElement = document.querySelector('h1');
  const link = linkElement ? linkElement.getAttribute('data-pdf-url') : 'Link não encontrado';

  let title = titleElement ? titleElement.textContent.trim() : null;
  if (!title) {
    title = document.title ? document.title.replace(' - Baixar pdf de Doceru.com', '').trim() : null;
  }

  return { link, title };
}