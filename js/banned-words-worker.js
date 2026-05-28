/* eslint-disable no-restricted-globals */
let dfaTree = null;

function buildDFATree(words) {
  const root = {};
  for (const word of words) {
    let node = root;
    for (const char of word) {
      if (!node[char]) node[char] = {};
      node = node[char];
    }
    node.isEnd = true;
    node.word = word;
  }
  return root;
}

function checkTextWithDFA(text, tree) {
  if (!text || !tree) return { valid: true };
  const lowerText = text.toLowerCase();
  for (let i = 0; i < lowerText.length; i++) {
    let node = tree;
    let j = i;
    while (j < lowerText.length && node[lowerText[j]]) {
      node = node[lowerText[j]];
      if (node.isEnd) return { valid: false, word: node.word };
      j++;
    }
  }
  return { valid: true };
}

function removeBannedWords(text) {
  if (!text || !dfaTree) return text || '';
  const lowerText = text.toLowerCase();
  let result = text;
  const replacements = [];
  for (let i = 0; i < lowerText.length; i++) {
    let node = dfaTree;
    let j = i;
    let lastMatchEnd = -1;
    while (j < lowerText.length && node[lowerText[j]]) {
      node = node[lowerText[j]];
      if (node.isEnd) lastMatchEnd = j;
      j++;
    }
    if (lastMatchEnd >= 0) {
      replacements.push({ start: i, end: lastMatchEnd + 1 });
      i = lastMatchEnd;
    }
  }
  for (let k = replacements.length - 1; k >= 0; k--) {
    const r = replacements[k];
    result = result.substring(0, r.start) + result.substring(r.end);
  }
  return result.trim();
}

function removeUrls(text) {
  if (!text) return text;
  return text
    .replace(/https?:\/\/[^\s]+/gi, '')
    .replace(/www\.[^\s]+/gi, '')
    .replace(/[a-z0-9]+\.(com|cn|net|org|io|cc|co|me|tv|info|xyz|top|vip|club|site|online|shop|app)[^\s]*/gi, '')
    .trim();
}

function cleanText(text, preserveNewlines) {
  if (!text) return text;
  let cleaned = removeUrls(text);
  cleaned = removeBannedWords(cleaned);
  return cleaned;
}

function sanitizeInputData(data) {
  const result = { ...data };
  let hasFiltered = false;
  if (result.name) {
    const cleanedName = cleanText(result.name);
    if (cleanedName !== result.name) {
      hasFiltered = true;
      result.name = cleanedName || '资源';
    }
  }
  if (result.remark) {
    const cleanedRemark = cleanText(result.remark);
    if (cleanedRemark !== result.remark) {
      hasFiltered = true;
      result.remark = cleanedRemark;
    }
  }
  if (result.adText) {
    const cleanedAd = cleanText(result.adText, true);
    if (cleanedAd !== result.adText) {
      hasFiltered = true;
      result.adText = cleanedAd;
    }
  }
  result.hasFiltered = hasFiltered;
  return result;
}

self.onmessage = (event) => {
  const msg = event.data || {};
  switch (msg.type) {
    case 'init':
      dfaTree = buildDFATree(msg.words || []);
      self.postMessage({ type: 'ready', count: (msg.words || []).length });
      break;
    case 'check':
      self.postMessage({
        type: 'checkResult',
        id: msg.id,
        result: checkTextWithDFA(msg.text, dfaTree)
      });
      break;
    case 'sanitizeBatch':
      self.postMessage({
        type: 'sanitizeBatchResult',
        id: msg.id,
        results: (msg.items || []).map(sanitizeInputData)
      });
      break;
    default:
      break;
  }
};
