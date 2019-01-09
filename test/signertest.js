const assert = require('assert');

const TokenSigner = require('../dist/signer').default;

describe('Testing TokenSigner', () => {
    let signer = null;
    let signer_options = { alg: 'RS256', keys: [ './test/keys/keya.pem', './test/keys/keyb.pem' ] };

    before(() => TokenSigner.create(signer_options).then(Signer => signer = Signer));

    it('Should throw an error because no keys were informed', () => {
        TokenSigner.create().catch(err => assert.equal(err.message, 'No keys passed to KeyReader'));
    });

    it('Should throw an error because an invalid key was informed', () => {
        TokenSigner.create({ keys: [ './test/keys/keyc.pem' ] }).catch(err => assert.equal(err.code, 'ENOENT'));
    });

    it('Should sign a token with Key A', () => {
        signer.sign({ sub: 'me', scope: [ 'huvs', 'nivs' ] }, 'keya').then(token => {
            const parts = token.split('.');
            const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
            const claims = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            assert.deepStrictEqual(header, { alg: signer_options.alg, typ: 'JWT', kid: 'keya' });
            assert.equal(claims.sub, 'me');
            assert.deepStrictEqual(claims.scope, [ 'huvs', 'nivs' ]);
        });
    });
});
