import stampit from '@stamp/it';
import jwt from 'jsonwebtoken';
import rsa2jwk from 'rsa-pem-to-jwk';

import KeyReader from './keyreader';

// jwks_url and threshold is extracted to prevent it being passed to jwt.sign because of the TokenRenewer implementation
const TokenSigner = stampit.init(function TE({ keys, alg, jwks_url, threshold, ...options }) {
	this.keys = keys.map(({ kid, data }) => rsa2jwk(data, { use: 'sig', alg, kid }, 'public'));

	this.sign = (claim, kid) => new Promise((resolve, reject) => {
		const key = keys.find(key => key.kid == kid);
		jwt.sign(claim, key.data, { algorithm: alg, keyid: kid, ...options }, (err, token) => err ? reject(err) : resolve(token));
	});
}).statics({
	create: ( { alg = 'RS512', keys = [], ...options } = {} ) => KeyReader.read(keys).then(keys => TokenSigner({ alg, keys, ...options }))
});

export default TokenSigner;