import stampit from '@stamp/it';
import { readFile } from 'fs';

const KeyReader = stampit.statics({
    read: (keys = []) => {
		if (keys.length === 0)
			return Promise.reject(new Error('No keys passed to KeyReader'))

		const files = keys.map(filename => new Promise((resolve, reject) => {
			readFile(filename, (err, buff) => {
				if (err)
					reject(err);
				else {
                    const kid = filename.split('/').pop().split('.').shift();
                    const data = buff.toString();
                    resolve({ kid, data });
				}
			})
		}));

        return Promise.all(files);
    }
});

export default KeyReader;