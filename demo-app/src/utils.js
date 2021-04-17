import {NativeValidationErrors} from 'pluma-svelte-forms';

const regexNumbers = /[0-9]/;
const regexUppercase = /[A-Z]/;

export function checkPassword (value) {
	const testNumbers = regexNumbers.test(value);
	const testUppercase = regexUppercase.test(value);

	if (testNumbers && testUppercase) return true;
	if (!testUppercase && !testNumbers) return 'Please include at least a number and an uppercase letter';
	if (testNumbers && !testUppercase) return 'Please include at least an uppercase letter';
	if (!testNumbers && testUppercase) return 'Please include at least a number';
}