const axios = require('axios');
const md5 = require('md5');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const COOKIE_EXPIRATION_TIME = 86400000;
const MAX_RETRY_ATTEMPTS = 15;

let cookies;
let cbsId;
let xai;
let lastResponse;
let lastCookieUpdate = 0;

module.exports = async (stimulus, context = [], language) => {
	const _context = context.slice();

	if (cookies == null || Date.now() - lastCookieUpdate >= COOKIE_EXPIRATION_TIME) {
		const date = new Date();
		const cookieResponse = await axios.get(
			`https://www.cleverbot.com/extras/conversation-social-min.js?${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`, {
				headers: {
					'User-Agent': USER_AGENT,
				},
			},
		);
		cookies = cookieResponse.headers['set-cookie'];
		lastCookieUpdate = Date.now();
	}

	let payload = `stimulus=${encodeURIComponent(stimulus)}&`;

	const reverseContext = _context.reverse();
	for (let i = 0; i < _context.length; i++) {
		payload += `vText${i + 2}=${encodeURIComponent(reverseContext[i])}&`;
	}

	payload += `${language ? `cb_settings_language=${language}&` : ''}cb_settings_scripting=no&islearning=1&icognoid=wsf&icognocheck=`;
	payload += md5(payload.substring(7, 33));

	for (let i = 0; i < MAX_RETRY_ATTEMPTS; i++) {
		try {
			const response = await axios.post(
				`https://www.cleverbot.com/webservicemin?uc=UseOfficialCleverbotAPI${cbsId ? `&out=${encodeURIComponent(
					lastResponse,
				)}&in=${encodeURIComponent(stimulus)}&bot=c&cbsid=${cbsId}&xai=${xai}&ns=2&al=&dl=&flag=&user=&mode=1&alt=0&reac=&emo=&sou=website&xed=&` : ''}`,
				payload,
				{
					timeout: 60000,
					headers: {
						'Cookie': `${cookies[0].split(';')[0]}; _cbsid=-1`,
						'User-Agent': USER_AGENT,
						'Content-Type': 'text/plain',
					},
				},
			);

			const responseLines = response.data.split('\r');
			cbsId = responseLines[1];
			xai = `${cbsId.substring(0, 3)},${responseLines[2]}`;
			lastResponse = responseLines[0];
			return lastResponse;
		} catch (err) {
			if (err.response && err.response.status === 503) {
				// If Cleverbot service is unavailable, retry after a delay.
				await new Promise(resolve => setTimeout(resolve, 1000));
			} else {
				// Handle other errors or rethrow them.
				throw err;
			}
		}
	}

	throw 'Failed to get a response after 15 tries';
};