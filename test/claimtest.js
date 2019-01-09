const assert = require('assert');

const ClaimChecker = require('../dist/claim').default;

describe('Testing ClaimChecker', () => {
    let checker = ClaimChecker();
    checker.decode = () => Promise.resolve({
        iss: 'issuer',
        sub: 'me',
        scope: [ 'huvs', 'nivs' ]
    });

    it('Should check if token contains a claim', async () => {
        let has_iss = await checker.hasClaim(null, 'iss');
        let has_hup = await checker.hasClaim(null, 'hup');

        assert.equal(has_iss, true, 'iss not defined in token');
        assert.equal(has_hup, false, 'hup defined in token');
    })

    it('Should retrieve the issuer of the token', async () => {
        let iss = await checker.getClaim(null, 'iss');

        assert.equal(iss, 'issuer');
    });

    it('Should check if token claim has a value', async () => {
        let check_subject_you = await checker.checkClaim(null, 'sub', 'you');
        let check_subject_me = await checker.checkClaim(null, 'sub', 'me');

        assert.equal(check_subject_you, false, "subject shouldn't be you");
        assert.equal(check_subject_me, true, "subject should be me");
    });

    it('Should check if scope array contains some items', async () => {
        let check_scope_huvs = await checker.checkClaim(null, 'scope', 'huvs');
        let check_scope_hevs = await checker.checkClaim(null, 'scope', 'hevs');

        assert.equal(check_scope_huvs, true, "scope should contain huvs");
        assert.equal(check_scope_hevs, false, "scope shouldn't contain hevs");
    });

    it('Should pass because token issuer is issuer', async () => {
        await checker.requireClaim(null, 'iss', 'issuer');
        assert.ok(true);
    });

    it('Should throw an error because token issuer is not authserver', async () => {
        try {
            await checker.requireClaim(null, 'iss', 'authserver');
        } catch(err) {
            assert.equal(err.message, 'Claim iss value is not authserver');
        }
    });

    it('Should do a simple claim check using requireClaims', async () => {
        await checker.requireClaims(null, { claim: 'iss', value: 'issuer' });
        assert.ok(true);
    });

    it('Should do a simple claim check using requireClaims and throw', async () => {
        try {
            await checker.requireClaims(null, { claim: 'iss', value: 'authserver' });
        } catch(err) {
            assert.equal(err.message, 'Unauthorized');
        }
    });

    it('Should do a simple AND claim check using requireClaims', async () => {
    	let rules = await checker.requireClaims(null, [ { claim: 'iss', value: 'issuer' }, { claim: 'sub', value: 'me' } ]);
    	assert.ok(true);
    });

    it('Should do a complex AND and OR check using requireClaims', async () => {
     	let rules = await checker.requireClaims(null, [
     	    [ { claim: 'iss', value: 'issuer' }, { claim: 'sub', value: 'me' } ], // (iss == issuer AND sub == me)
     	    [ { claim: 'sub', value: 'you' } ] // OR (sub == you)
     	]);

     	assert.ok(true);
    });

    it('Should do a complex AND and OR check that will fail using requireClaims', async () => {
        try {
            await checker.requireClaims(null, [
                [ { claim: 'iss', value: 'issuer' }, { claim: 'sub', value: 'you' } ], // (iss == issuer AND sub == you)
                [ { claim: 'iss', value: 'issuer' }, { claim: 'sub', value: 'him' } ] // OR (sub == him)
            ]);
        } catch(err) {
            assert.equal(err.message, 'Unauthorized')
        }
    });
});
