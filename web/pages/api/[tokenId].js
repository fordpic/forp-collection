// API endpoint to serve metadata for Forps to Opensea (ie, makes them viewable on the site)
export default function handler(req, res) {
	// Snag tokenId from query params
	const tokenId = req.query.tokenId;

	const image_url =
		'https://raw.githubusercontent.com/fordpic/forp-collection/main/web/public/forp/';

	// Response must be in below format for Opensea
	res.status(200).json({
		name: `Forps #${tokenId}`,
		description: 'Forps is a unique collection of my (Ford) face, animated',
		image: `${image_url}${tokenId}.jpg`,
	});
}
