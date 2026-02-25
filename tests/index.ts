import { describe } from 'manten';

describe('alias-imports', ({ runTestSuite }) => {
	runTestSuite(import('./specs/commonjs.spec.ts'));
	runTestSuite(import('./specs/module.spec.ts'));
});
