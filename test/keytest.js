const assert = require('assert');

const KeyReader = require('../dist/keyreader').default;
const KeyFetcher = require('../dist/keyfetcher').default;

describe('Testing KeyFetcher', () => {
    const jwks_url = 'http://localhost:8080';

    let keys = [];

    const expected_keya = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1r2q3vOPwMgKrDSiA8Jm
Lgn9WfiqR9KIy/ftt6kOEvKbmWVEn+PMY3dLWH6AyjE3mJDhRlC2AC7A1Trbhet6
rxiTKzvxGd4HLunT8WhbIfAnTickoIfh+5pMpfCsPCsW4RTfwF1T3oaVOPANA+iT
eU+VwyqyDugAdBWrW4rgHRK3sdFWjV/Q/hqRcHLCUNoZ9FqF7sfb8ctpFwrbpG2Y
zBDG55g16he2xFD5bmNjzWavvxnj3y4cTp9ehvj+Ywnqi0xcxnkw3yH74c0PVFTp
oo7lLcebilsjS4Jh35FLRYfF8cxk4q0ZVjiaaSlG8et8bIuFhOYnHj5e+cSNU/il
3wIDAQAB
-----END PUBLIC KEY-----
`;

    before(() => KeyReader.read(['./test/keys/keya.pem', './test/keys/keyb.pem']).then(data => keys = data));

    it('Should throw an error because jwks_uri was not informed', () => {
        try {
            const fetcher = KeyFetcher();
        } catch (err) {
            assert.equal(err.message, 'jwks_url must be passed to KeyFetcher')
        }
    });

    it('Should throw an error because alg was not informed', () => {
        try {
            const fetcher = KeyFetcher({ keys });
        } catch (err) {
            assert.equal(err.message, 'alg must be passed to KeyFetcher')
        }
    });

    it('Should return a KeyFetcher function and fetch a key locally', () => {
        const fetcher = KeyFetcher({ keys, jwks_url, alg: 'RS256' });
        assert.equal(typeof fetcher, 'function');
        fetcher({ kid: 'keya' }, (err, key) => {
            if (err) assert.fail('KeyA not fetched locally');
            else assert.equal(key, expected_keya);
        })
    })

    it('Should try to fetch a remote key from jwks_uri', () => {
        const fetcher = KeyFetcher({ keys, jwks_url, alg: 'RS256' });
        assert.equal(typeof fetcher, 'function');
        fetcher({ kid: 'keyc' }, (err, key) => {
            assert.equal(err.message, 'connect ECONNREFUSED 127.0.0.1:8080');
        })
    })

    it('Should pass no keys to KeyReader', () => {
        KeyReader.read().catch(err => assert.equal(err.message, 'No keys passed to KeyReader'))
    })

    it('Should pass an invalid file to KeyReader', () => {
        KeyReader.read(['./test/keys/keyc.pem']).catch(err => assert.equal(err.code, 'ENOENT'))
    })
    
});
