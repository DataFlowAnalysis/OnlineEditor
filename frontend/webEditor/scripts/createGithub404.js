import {copyFileSync} from 'fs';
import {dirname, join, resolve} from 'path';
import {fileURLToPath} from 'url';

const distDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');
copyFileSync(
	join(distDirectory, 'index.html'),
	join(distDirectory, '404.html')
);
