const { Readable } = require('stream');

const ALLOWED = new Set([
  '1UyJAEq3OX-__4hygSjp78-B_WvjRCzPg',
  '1RuZxDWHTU9H6KpsnYu3LMWwKsFJ9Tkfu',
  '1uTPlIxsao7FeKrk79i0U8DMkBzSdgxoh',
  '1c2DP5nnDb5o-6kfY2HYV29mGCxDmUSZw',
  '1qbx4lsGewy78vzI76YqHZXrFUpx_suaw',
  '1tIDEmW4I9lbbITRvcBoqGAXhA_X3HJhH',
  '1zcK9W1llUe3m5ToV9DNahWcNStaYM6iN',
  '1p1icRZcCaoCL3AHnJgFDTScOLEeFv33Q',
  '1kIV2-wQTFUcU8oa2juIa7jJXiX2NjyJL',
  '10GsfXfOqirMWLMWSejxfrIaGwy4tMzl6',
  '1a41YUue1T8cPBSpk77P0pArfn9Jl0IRR',
  '1396OYjzxBMdnbK73jMGWXtDrlIdpDnss',
  '1EuK1075KN296ahQ_Vn_eiML704plYVmr'
]);

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end();
  }

  const id = typeof req.query?.id === 'string' ? req.query.id : '';
  if (!ALLOWED.has(id)) return res.status(404).end();

  const headers = {};
  if (req.headers.range) headers.Range = req.headers.range;

  const url = 'https://drive.usercontent.google.com/download?id=' +
    encodeURIComponent(id) + '&export=download&confirm=t';

  const upstream = await fetch(url, {
    headers,
    redirect: 'follow'
  });

  if (!(upstream.ok || upstream.status === 206)) {
    return res.status(upstream.status || 502).end();
  }

  res.status(upstream.status);
  res.setHeader('Content-Type', 'video/quicktime');
  res.setHeader('Content-Disposition', 'inline');
  res.setHeader('Accept-Ranges', upstream.headers.get('accept-ranges') || 'bytes');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');

  for (const h of ['content-range', 'content-length', 'etag', 'last-modified']) {
    const v = upstream.headers.get(h);
    if (v) res.setHeader(h, v);
  }

  if (req.method === 'HEAD' || !upstream.body) return res.end();

  Readable.fromWeb(upstream.body).pipe(res);
};
