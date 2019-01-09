import stampit from '@stamp/it';

import TokenSigner from './signer';
import TokenDecoder from './decoder';
import KeyReader from './keyreader';

const Renewer = stampit.init(function ({ threshold } = {}) {
    this.renew = (token) => this.decode(token).then(decoded => {
        // console.log('Renew', token, decoded)
        // If token doesn't expire, it doesn't need to be renewed
        if (!decoded.hasOwnProperty('exp')) return Promise.resolve(token);

        // Calculate a renew threshold if one is not passed
        const ttl = decoded.exp - decoded.iat;
        if (!threshold) threshold = parseInt(ttl * .27);

        const kid = JSON.parse(new Buffer(token.split('.')[0], 'base64').toString()).kid;
        const remaining = decoded.exp - parseInt(Date.now() / 1000);

        // Create a copy of the decoded object
        let claim = Object.assign({}, decoded);

        // Remove data added by the sign function
        delete claim.iss;
        delete claim.exp;
        delete claim.iat;

        // If threshold was hit, return a new token. If not, returns the current one
        return remaining > threshold ? Promise.resolve(token) : this.sign(claim, kid);
    });
});

const TokenRenewer = stampit.compose(TokenSigner, TokenDecoder, Renewer).statics({
    create: ({ keys, ...options }) => KeyReader.read(keys).then(keys => {
        return TokenRenewer({ keys, ...options })
    })
});
export default TokenRenewer;
