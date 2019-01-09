const assert = require('assert');

const TokenRenewer = require('../dist/renewer').default;

describe('Testing TokenRenewer', () => {
    it('Should sign a new token with no expiration and try to renew it', async () => {
        let renewer_options = { 
            alg: 'RS256',
            issuer: 'auth-server',
            keys: [ './test/keys/keya.pem', './test/keys/keyb.pem' ],
            jwks_url: 'http://localhost:8080'
        };

        let renewer = await TokenRenewer.create(renewer_options);

        let token = await renewer.sign({sub: 'me'}, 'keyb');
        let new_token = await renewer.renew(token);

        assert.equal(token, new_token);
    });

    it('Should sign a new token with expiration and try to renew it', async () => {
        let renewer_options = { 
            alg: 'RS256',
            issuer: 'auth-server',
            keys: [ './test/keys/keya.pem', './test/keys/keyb.pem' ],
            jwks_url: 'http://localhost:8080',
            expiresIn: 10
        };

        let renewer = await TokenRenewer.create(renewer_options);
        let token = await renewer.sign({sub: 'me'}, 'keyb');
        let new_token = await renewer.renew(token);

        assert.equal(token, new_token);
    });

    /*
    it('Should sign a new token with expiration and small threshold and try to renew it', async () => {
        let renewer_options = { 
            alg: 'RS256',
            issuer: 'auth-server',
            keys: [ './test/keys/keya.pem', './test/keys/keyb.pem' ],
            jwks_url: 'http://localhost:8080',
            expiresIn: 10,
            threshold: 15
        };

        let renewer = await TokenRenewer.create(renewer_options);
        let token = await renewer.sign({sub: 'me'}, 'keyb');
        let new_token = await renewer.renew(token);
        // console.log(token);
        // console.log(new_token);

        assert.notEqual(token, new_token);
    });
    */
});
