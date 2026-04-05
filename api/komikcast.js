export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({ 
    tokenExists: !!process.env.KOMIKCAST_TOKEN,
    tokenPreview: process.env.KOMIKCAST_TOKEN?.slice(0, 10) + '...'
  });
}