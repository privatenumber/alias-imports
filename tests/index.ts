import { describe } from 'manten';

describe('alias-imports', ({ runTestSuite }) => {
	runTestSuite(import('./specs/commonjs.spec.js'));
	runTestSuite(import('./specs/module.spec.js'));
});
