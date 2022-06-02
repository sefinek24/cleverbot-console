const { get, post } = require('superagent');
const md5 = require('md5');

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36';

let cookies;
let cbsid;
let xai;
let lastResponse;
let lastCookieUpdate = 0;

module.exports = async (stimulus, context = [], language) => {
	const _context = context.slice();

	if (cookies == null || Date.now() - lastCookieUpdate >= 86400000) {
		const date = new Date();
		const req = await get(`https://www.cleverbot.com/extras/conversation-social-min.js?${date.getFullYear()}${date.getMonth().toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`).set('User-Agent', userAgent);
		cookies = req.header['set-cookie'];
		lastCookieUpdate = Date.now();
	}

	let payload = `stimulus=${escape(stimulus).includes('%u') ? escape(escape(stimulus).replace(/%u/g, '|')) : escape(stimulus)}&`;

	const reverseContext = _context.reverse();
	for (let i = 0; i < _context.length; i++) {
		payload += `vText${i + 2}=${escape(reverseContext[i]).includes('%u') ? escape(escape(reverseContext[i]).replace(/%u/g, '|')) : escape(reverseContext[i])}&`;
	}

	payload += `${language ? `cb_settings_language=${language}&` : ''}cb_settings_scripting=no&islearning=1&icognoid=wsf&icognocheck=`;
	payload += md5(payload.substring(7, 33));

	for (let i = 0; i < 15; i++) {
		try {
			const req = await post(`https://www.cleverbot.com/webservicemin?uc=UseOfficialCleverbotAPI${cbsid ? `&out=${encodeURIComponent(lastResponse)}&in=${encodeURIComponent(stimulus)}&bot=c&cbsid=${cbsid}&xai=${xai}&ns=2&al=&dl=&flag=&user=&mode=1&alt=0&reac=&emo=&sou=website&xed=&` : ''}`)
			.timeout({
				response: 10000,
				deadline: 60000,
			})
			.set('Cookie', `${cookies[0].split(';')[0]}; _cbsid=-1`)
			.set('User-Agent', userAgent)
			.type('text/plain')
			.send(payload);

			cbsid = req.text.split('\r')[1];
			xai = `${cbsid.substring(0, 3)},${req.text.split('\r')[2]}`;
			lastResponse = req.text.split('\r')[0];
			return lastResponse;
		} catch (err) {
			if (err.status === 503) await new Promise(resolve => setTimeout(resolve, 1000)); else throw err;
		}
	}

	throw 'Failed to get a response after 15 tries';
};

// Source: https://github.com/IntriguingTiles/cleverbot-free/blob/master/index.js