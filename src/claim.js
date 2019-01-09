import stampit from '@stamp/it';

export default stampit.init(function ClaimChecker() {
    this.hasClaim = (token, claim) => this.decode(token).then(claims => Object.prototype.hasOwnProperty.call(claims, claim));

    this.getClaim = (token, claim) => this.decode(token).then(claims => claims[claim]);

    this.checkClaim = (token, claim, value) => this.getClaim(token, claim).then(claim_value => claim_value instanceof Array
										? claim_value.indexOf(value) > -1
										: claim_value === value);

    this.requireClaim = (token, claim, value) => this.checkClaim(token, claim, value).then(claim_value => {
	if(claim_value === false)
	    throw new Error(`Claim ${claim} value is not ${value}`)
    });

    this.requireClaims = (token, checks) => {
        if (!(checks instanceof Array))
            checks = [ [ checks ] ];
		else if (checks instanceof Array && checks.every(value => !(value instanceof Array)))
            checks = [ checks ];

		let uepa = checks.map(check => {
			// Returns a promise for each array inside checks
			let check_promise = Promise.all(check.map(claim => this.checkClaim(token, claim.claim, claim.value)))
			return check_promise.then(check_result => check_result.reduce((val, curr) => val && curr, true));
		});

		return Promise.all(uepa).then(results => {
			// console.log('Result', results);
			const result = results.reduce((val, curr) => val || curr, false);
			if (!result) throw new Error('Unauthorized')
		});
    }
});
