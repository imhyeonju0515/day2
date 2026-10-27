// Vercel 서버리스 함수: 브라우저 대신 Pixabay를 호출해서 API 키가 노출되지 않게 합니다.
// 키는 Vercel 환경변수 PIXABAY_API_KEY 에서 읽습니다.
module.exports = async (req, res) => {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'PIXABAY_API_KEY 환경변수가 설정되지 않았습니다.' });
  }

  const q = String(req.query.q || '').trim();
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  if (!q) {
    return res.status(400).json({ error: '검색어(q)가 필요합니다.' });
  }

  const params = new URLSearchParams({
    key,
    q,
    page,
    per_page: 10,
    image_type: 'photo',
    safesearch: 'true',
  });

  try {
    const upstream = await fetch('https://pixabay.com/api/?' + params);
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: 'Pixabay 요청 실패 (' + upstream.status + ')' });
    }
    const data = await upstream.json();
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({
      totalHits: data.totalHits,
      hits: data.hits.map(h => ({
        id: h.id,
        tags: h.tags,
        user: h.user,
        webformatURL: h.webformatURL,
        pageURL: h.pageURL,
      })),
    });
  } catch (err) {
    return res.status(502).json({ error: '서버 오류: ' + err.message });
  }
};
