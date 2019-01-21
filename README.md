easy-jwt
========

A simple abstraction for generating and validating RSA signed JWTs with multiple keys

Usage
-----

Frist of all, you need to generate some private keys to sign the tokens:

```bash

$ openssl genrsa -f4 -out keys/keya.pem 4096
$ openssl genrsa -f4 -out keys/keyb.pem 4096
$ openssl genrsa -f4 -out keys/keyc.pem 4096
```

Then, you only have to create a the token engine like this:

```javascript

import easy_jwt from 'easy-jwt';

const options = {
    alg: 'RS256',
    keys: [ 'keya.pem', 'keyb.pem', 'keyc.pem' ],
    issuer: 'https://example.org/auth',
    expiresIn: '1h'
}

easy_jwt.create(options)
    .then(jwt => token: jwt.sign({sub: 'me', scope: [ 'scope1', 'scope2' ]}, 'keya').then(token => {jwt, token}))
    .then({ jwt, token} => {
        jwt.decode(token).then(claims =>{
            console.log('Token': token);
            console.log('Claims': claims)
        })
    })
```

My implementation is based on [auth0/node-jsonwebtoken](https://github.com/auth0/node-jsonwebtoken), so you can check their documentation to see which other options you may use.

When you use easy-jwt `create` funcion, you will get an object that will be able to `sign`, `decode` and `renew` tokens.

Of couse, as we are using assimetric encryption, this doesn't make much sense, so you can also do something like this:

**auth-server.js**

```javascript
import express from 'express';
import body_parser from 'body-parser';
import easy_jwt from 'easy-jwt';

const options = {
    alg: 'RS256',
    keys: [ 'keya.pem', 'keyb.pem', 'keyc.pem' ],
    issuer: 'https://example.org/auth',
    expiresIn: '1h'
}

const app = express();

easy_jwt.createSigner(options).then(jwt => {
    app.get('/jwks.json', (req, res) => res.json({ keys: jwt.keys }));

    app.post('/login', body_parser.json(), (req, res) => {
        // validate the user
        ...
        
        // sign a token for the user
        jwt.sign({ sub: req.body.username }, 'keyb').then(token => res.json({ status: 'success', data: { token } }));
    })

    app.listen(3000, () => console.log('Server is ready'));
});
```
You can test your authentication server with this command:

```bash
$ curl -H 'Content-Type: application/json' http://localhost:3000/login -d '{"username": "your_username"}'
```

and you will see as the output, something like this:

```json
{
    "status":"success",
    "data": {
        "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleWIifQ.eyJpYXQiOjE1NDcwNTcxNDV9.Y0uQkd-hBUi_faz9wIRoZ5T4ryAguJeEFCNplbs9WddnQ7kflYacAizzf-fTKTN_AQdiXfXJcc3RijlObxKL3DctC_k4UQCDXAJrD7CDGqEMguZgSTV7QPauQlKFZC2pC4N5gX5D40UwEZY0rmGhxnkdAxVxXcMhY0qtc1OkT8ihW1Dom-XKReHE5e0iSuYKiFiiuSN2ZoXL12aH4E-rFVJ1h9pS6rUKYFTM_LrNWdTVUNuBgm-3pbFGDug8WmAGbDvktpROZB_CdQouCAtEXZS5bgV1eQtKYMnKxRIxcJLZAg9FeZHlcV4z9OyfU4115nCx7FyxPM_1vEWD2TQ5hw"
    }
}
```

The public keys that will be used to validate the token are available at `http://localhost:3000/jwks.json`. You should take a look at that too. ;)

And your api server should look like this:

**api-server.js**

```javascript
import express from 'express';
import body_parser from 'body-parser';
import easy_jwt from 'easy-jwt';

const data = {
    tasks: [
        {
            id: 1,
            name: 'Task 1',
            completed: 'false'
        },
        {
            id: 2,
            name: 'Task 2',
            completed: 'true'
        },
        {
            id: 3,
            name: 'Task 3',
            completed: 'false'
        }
    ]
}

const app = express();

// The decoder doesn't need to load keys from the filesystem.
// It will load and cache them on demand when receiving requests.
// This way, it's creation is not assynchronous
const jwt = easy_jwt.createDecoder(options);

const app = express();

// simple middleware to check for claims in the token
const check_access = claims => (req, res, next) => {
    if (req.headers.authorization) {
        let token = req.headers.authorization.split(' ')[1];

        // requireClaims check if the claims are present in the token. If not it rejects the promise
        jwt
            .requireClaims(token, claims)
            .then(() => {
                // if we get here, the token contains the claims
                // that we asked jwt to check for, so we can return our data
                res.json(data.tasks);
            })
            .catch(err => {
                // if the promise was rejected, we print the error in the console 
                // and return a 401 Unauthorized response
                console.log(err);
                res.status(401).json({status: 'error', message: 'Unauthorized'});
            })
    } else
        res.status(401).json({status: 'error', message: 'Unauthorized'});
}

app.get('/tasks', check_access({ claim: 'sub', value: 'my_username' }), (req, res) => {
    res.json(data.tasks);
})

app.listen(3001, () => console.log('API server ready'));
```

The `requireClaims` funcion accepts a claim object like in the example above, or arrays of
objects if you need complex conditions of claim checks.

For instance: 

```json
[ { "claim": "sub", "value": "your_username" }, { "claim": "issuer", "value": "https://example.org/auth" } ]
```

will check if the token has the `sub` claim with a value of `your_username` **AND** the claim `iss` with a value of `https://example.org/auth`.

You can also do OR checks like this:

```json
[
    [ { "claim": "sub", "value": "your_username" } ],
    [ { "claim": "sub", "value": "my_username" } ]
]
```

which will return true for `sub` with value `your_username` **OR** `sub` with value `my_username`.

And that's it for now.

Bug reports and pull requests are more than welcome!

Thanks!
