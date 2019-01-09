import stampit from '@stamp/it';
import JWKS from 'jwks-rsa';
import jwk2pem from 'jwk-to-pem';
import rsa2jwk from 'rsa-pem-to-jwk';

const KeyFetcher = stampit.init(function ({ keys = [], jwks_url, alg } = {}) {
    if (keys.length == 0 && !jwks_url) throw new Error('jwks_url must be passed to KeyFetcher');
    if (!alg) throw new Error('alg must be passed to KeyFetcher');

    const pkeys = keys.map(({ kid, data }) => rsa2jwk(data, { use: 'sig', alg, kid }, 'public'));

    const RemoteKeyFetcher = jwks_url ? JWKS({ jwksUri: jwks_url }) : null;

    const FormatKey = key => typeof key == 'string' ? key : jwk2pem(key);

    const FetchLocalKey = ({ kid }) => pkeys.find(key => key.kid == kid);

    const FetchRemoteKey = ({ kid }) => new Promise((resolve, reject) => RemoteKeyFetcher.getSigningKey(kid, (err, key) => err ? reject(err) : resolve(key.publicKey || key.rsaPublicKey)));

    return (header, done) => {
        let key = FetchLocalKey(header);
        if (key) return done(null, FormatKey(key));
    
        if (RemoteKeyFetcher)
            FetchRemoteKey(header).then(key => done(null, FormatKey(key))).catch(err => done(err));
        else
            done(new Error('Unable to find key locally and no remote info was supplied'));
    }
});

export default KeyFetcher;
