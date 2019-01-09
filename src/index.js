import TokenSigner from './signer';
import TokenDecoder from './decoder';
import TokenRenewer from './renewer';
import ClaimChecker from './claim';

module.exports = {
    TokenSigner,
    TokenDecoder,
    TokenRenewer,
    default: {
        createSigner: options => TokenSigner.create(options),
        createDecoder: options => TokenDecoder.compose(ClaimChecker)(options),
        create: options => TokenRenewer.create(options)
    }
}
