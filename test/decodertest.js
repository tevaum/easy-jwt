const assert = require('assert');

const TokenDecoder = require('../dist/decoder').default;
const KeyReader = require('../dist/keyreader').default;

describe('Testing TokenDecoder', () => {
    const jwks_url = 'http://localhost:8080';

    let keys = [];

    before(() => KeyReader.read([ './test/keys/keya.pem' ]))

    const empty = Buffer.from(JSON.stringify({})).toString('base64');
    const alg = Buffer.from(JSON.stringify({alg: 'RS256'})).toString('base64');
    const invkid = Buffer.from(JSON.stringify({alg: 'RS256', typ: 'jwt', kid: 'keyc'})).toString('base64');
    const valid_token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleWEifQ.eyJzdWIiOiJtZSIsInNjb3BlIjpbImh1dnMiLCJuaXZzIl0sImlhdCI6MTU0NzAzNjIzOH0.l4lYhHwML78PVISZnTSTMMZwPDzD6CjyyRRb-tOwqlI6KgcrBeUi1vF1k15P74Zb-ypLzko94XfdNFD_etgLIofqvpuZD83OoA4ac_JZ3V588Pdkn0LczeJ5HmhrC9lRpuwV6rKNEdKMlBKG1575wlx3SoeVWG4dpX6JgzYepY0mkDxFIPFxhC8hfGIABJZ-lws_EI5RqEgzkh8M4_vifUv7T-IgxVQGRScYiPmfVdFDG3QjbnIbjszFzZTuu8qQdUioKvKO4eabqGVFMnaxfc7z3DpUraMJZ_k2sSSKj44OAOlfJs1RkBGa4rOKEdudWYzkWw2fyb0IomZdPMpCng';
    const empty_token = `${empty}.${empty}.${empty}`;
    const nokid_token = `${alg}.${empty}.${empty}`;
    const invalid_token_1 = 'uepa';
    const invalid_token_2 = 'asdf.fdas.asdf';
    const invalid_token_3 = `${invkid}.${empty}.${empty}`;

    const decoder = TokenDecoder({ keys, jwks_url, alg: 'RS256' });
    it('Should throw an error because jwks_uri was not informed', () => {
        try {
            const verifier = TokenDecoder();
        } catch(err) {
            assert.equal(err.message, 'jwks_url must be passed to KeyFetcher')
        }
    });

    it('Should throw an error because alg was not informed', () => {
        try {
            const verifier = TokenDecoder({ jwks_url });
        } catch(err) {
            assert.equal(err.message, 'alg must be passed to KeyFetcher')
        }
    });

    it('Should throw an Invalid token error', () => decoder.decode(invalid_token_1).catch(err => assert.equal(err.message, 'Invalid token')));

    it('Should throw an Invalid token error', () => decoder.decode(invalid_token_2).catch(err => assert.equal(err.message, 'Invalid token')));

    it('Should throw an error because signature is invalid', () => decoder.decode(invalid_token_3).catch(err => {
        assert.equal(err.name, 'JsonWebTokenError');
        assert.equal(err.message, 'invalid token');
    }));

    it('Should throw an Invalid token: wrong algorithm', () => decoder.decode(empty_token).catch(err => assert.equal(err.message, 'Invalid token: wrong algorithm')));

    it('Should throw an Invalid token: no kid', () => decoder.decode(nokid_token).catch(err => assert.equal(err.message, 'Invalid token: no kid')));
})
