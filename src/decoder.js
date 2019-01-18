import stampit from '@stamp/it';
import jwt from 'jsonwebtoken';
import KeyFetcher from './keyfetcher';

const TokenDecoder = stampit.init(function TV({ keys = [], jwks_url, ...options } = {}) {
    // console.log('Decoder constructor', options)
    const retrieve_key = KeyFetcher({ keys, jwks_url, ...options });

    const validate_token = token => {
        const parts = token.split('.');
        if (parts.length != 3)
            throw new Error('Invalid token');
    }

    const token_header = token => {
        try {
            let [ header ] = token.split('.');
            return JSON.parse(Buffer.from(header, 'base64').toString());
        } catch (err) {
            throw new Error('Invalid token');
        }
    }

    const validate_header = header => {
        if (!header.alg || header.alg != options.alg) throw new Error('Invalid token: wrong algorithm')
        if (!header.kid) throw new Error('Invalid token: no kid');
    };

    this.decode = token => new Promise(async (resolve, reject) => {
        try {
            validate_token(token);
            const header = token_header(token);
            validate_header(header);
            jwt.verify(token, retrieve_key, options, (err, decoded) => err ? reject(err) : resolve(decoded));
        } catch (err) {
            reject(err);
        }
    });
});

export default TokenDecoder.compose(ClaimChecker)
