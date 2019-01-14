export const TokenSigner  = require('./signer').default;
export const TokenDecoder = require('./decoder').default;
export const TokenRenewer = require('./renewer').default;

export default {
    createSigner: options => TokenSigner.create(options),
    createDecoder: options => TokenDecoder.compose(ClaimChecker)(options),
    create: options => TokenRenewer.create(options)
}
