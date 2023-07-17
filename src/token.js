import stampit from '@stamp/it';
// import rsa2jwk from 'rsa-pem-to-jwk';
import rsa2jwk from 'pem2jwk';
import jwt from 'jsonwebtoken';
import JWKS from 'jwks-rsa';
import jwk2pem from 'jwk-to-pem';
import { fstat, readFile } from 'fs';

export const TokenEmitter = stampit.init(function TE(_, { stamp }) {
  const {keys, alg, jwks_url, ...options} = stamp.compose.configuration;

  // this.keys = keys.map(({kid, data}) => rsa2jwk(data, {use: 'sig', alg, kid}, 'public'));
  this.keys = keys
    .map(({kid, data}) => ({ kid, ...rsa2jwk(data) }))
    .map(({ kid, kty, n, e }) => ({ kid, kty, n, e }));

	this.createToken = (claim, kid) => new Promise((resolve, reject) => {
	// console.log('[TokenEmitter] Creating token with kid', kid, 'and claim', claim);
		const key = keys.find(key => key.kid == kid);
		jwt.sign(claim, key.data, { algorithm: alg, keyid: kid, ...options }, (err, token) => err ? reject(err) : resolve(token));
	});
});

export const TokenVerifier = stampit.init(function TV(_, { stamp }) {
    let { jwks_url, ...options } = stamp.compose.configuration;

    const keyfetcher = JWKS({ jwksUri: jwks_url });

    const keyset = this.keys;
    let retrieve_key = (header, done) => {
        let key = keyset.find(k => k.kid == header.kid);

        if (!key) // fetch assincronously
            keyfetcher.getSigningKey(header.kid, (err, fkey) => {
		if (err) {
		    // console.log(`[RK] Error: ${err.message}`);
		    done(new Error(`Invalid key ${header.kid}`));
		} else {
		    key = fkey.publicKey || fkey.rsaPublicKey;
                    if (typeof key == 'string')
                        done(null, key);
		    else
		        done(null, jwk2pem(key));			
		}
	    });
        else 
            done(null, jwk2pem(key));
    };

    this.verifyToken = token => new Promise(async (resolve, reject) => {
	let parts = token.split('.');

	if (parts.length != 3) {
	    reject(new Error('Invalid token'));
	    return;
	};
	

	let header = null;
	try {
	    let json = new Buffer(parts[0], 'base64').toString();
	    header = JSON.parse(json);
	} catch(err) {
	    reject(new Error(`Invalid token format: ${err.message}`));
	    return;
	}

	if (!header.alg || header.alg != options.alg) {
	    reject(new Error(`Invalid token format: wrong algorithm`));
	    return;
	}

	if (!header.kid) {
	    reject (new Error(`Invalid token: no kid`));
	    return;
	}

        jwt.verify(token, retrieve_key, options, (err, decoded) => err ? reject(err) : resolve(decoded));
    });
});

export const TokenRenewer = stampit.init(function TR(_, { stamp }) {
    this.renewToken = (token) => this.verifyToken(token).then(decoded => {
	let kid = JSON.parse(new Buffer(token.split('.')[0], 'base64').toString()).kid;
	let ttl = decoded.exp - decoded.iat;
	let threshold = parseInt(ttl * .27);
	let remaining = decoded.exp - parseInt(Date.now() / 1000);

	// console.log('Renew?', remaining > threshold ? 'no' : 'yes');
	let claim = Object.assign({}, decoded);

	delete claim.iss;
	delete claim.exp;
	delete claim.iat;
	
	return remaining > threshold ? token : this.createToken(claim, kid);
    });
});
