import {writable, get} from 'svelte/store';
import {InputTypes, NativeValidationErrors} from './enums/index.js';

export default class FormController {
	constructor (config) {

		this.controllerState = null;
		this.displayedErrorNames = [];

		// Bind handlers
		this.onSubmit = this.onSubmit.bind(this);
		this.onChange = this.onChange.bind(this);
		// this.onInput = this.onChange;
		this.onBlur = this.onBlur.bind(this);
		this.onFocus = this.onFocus.bind(this);

		// Settings
		this.settings = {};
		this.settings.fields = config.fields ? config.fields : {};
		this.settings.onSubmit = config.onSubmit;
		this.settings.useNativeErrorTooltips = getValueOrDefault(config.useNativeErrorTooltips, false);
		this.settings.validClass = getValueOrDefault(config.validClass, 'valid');
		this.settings.invalidClass = getValueOrDefault(config.invalidClass, 'invalid');
		this.settings.displayErrorsOnBlur = getValueOrDefault(config.displayErrorsOnBlur, false);
		this.settings.hideErrorsOnFocus = getValueOrDefault(config.hideErrorsOnFocus, false);
		this.settings.hideErrorsOnInput = getValueOrDefault(config.hideErrorsOnInput, true);

		this.form = config.form;
		this.form.addEventListener('submit', this.onSubmit);
		// Disable native error tooltips
		if (!this.settings.useNativeErrorTooltips) this.form.setAttribute('novalidate', true);

		// stores
		this.stores = {};
		this.stores.displayedErrors = config.displayedErrors;
		this.stores.controllerState = config.controllerState;

		// init inputs
		const inputs = getFormInputElements(this.form);
		inputs.forEach((input) => this.addListenersToInput(input));

		this.updateFormState();
	}

	addListenersToInput (input) {
		input.addEventListener('input', this.onChange);
		input.addEventListener('change', this.onChange);
		input.addEventListener('blur', this.onBlur);
		input.addEventListener('focus', this.onFocus);
	}

	removeListenersFromInput (input) {
		input.removeEventListener('input', this.onChange);
		input.removeEventListener('change', this.onChangee);
		input.removeEventListener('blur', this.onBlur);
		input.removeEventListener('focus', this.onFocus);
	}

	destroy () {
		this.form.removeEventListener('submit', this.onSubmit);
		const inputs = getFormInputElements(this.form);
		inputs.forEach((input) => this.removeListenersFromInput(input));
	}

	updateFormState () {
		const state = getFormState(this.form);
		this.controllerState = state;
		if (this.stores.controllerState) this.stores.controllerState.set(this.controllerState);
	}

	updateAllDisplayedErrors () {
		let errors = null;

		Object.keys(this.controllerState.fields).forEach((name) => {

			const input = getInputByName(this.form, name);
			const displayError = this.displayedErrorNames.indexOf(name) !== -1;
			const field = this.controllerState.fields[name];

			input.classList.remove(this.settings.invalidClass, this.settings.validClass);

			if (field.valid) {
				if (this.settings.validClass) input.classList.add(this.settings.validClass);
				return;
			}

			if (!displayError) {
				return;
			}

			// if the field is invalid and we must display the error
			if (!errors) errors = {};
			errors[name] = field.error;
			if (this.settings.invalidClass) input.classList.add(this.settings.invalidClass);
		});

		if (this.stores.displayedErrors) this.stores.displayedErrors.set(errors);
	}

	// ------------------------------------------------
	// Event handlers
	// ------------------------------------------------

	async onSubmit (event) {
		event.preventDefault();
		event.stopPropagation();

		if (this.controllerState.formIsValid) {
			const values = getValuesFromState(this.controllerState);
			await this.settings.onSubmit(values);
		} else {
			this.displayedErrorNames = Object.keys(this.controllerState.fields);
			this.updateAllDisplayedErrors();
		}
	}

	// onInput (event) {
	// 	this.updateFormState();

	// 	const field = this.controllerState.fields[event.target.name];

	// 	if (!field.valid && this.settings.hideErrorsOnInput) {
	// 		this.displayedErrorNames = this.displayedErrorNames.filter(name => name !== field.name);
	// 	} else {
	// 		if (this.displayedErrorNames.indexOf(field.name) === -1) this.displayedErrorNames.push(field.name);
	// 	}

	// 	this.updateAllDisplayedErrors();
	// }

	onChange (event) {
		this.updateFormState();

		if (this.settings.hideErrorsOnInput) {
			this.displayedErrorNames = this.displayedErrorNames.filter(name => name !== event.target.name);
		}

		this.updateAllDisplayedErrors();
	}

	onBlur (event) {
		this.updateFormState();

		if (this.settings.displayErrorsOnBlur) {
			const name = event.target.name;
			if (this.displayedErrorNames.indexOf(name) === -1) this.displayedErrorNames.push(name);
		}

		this.updateAllDisplayedErrors();
	}

	onFocus (event) {
		this.updateFormState();

		if (this.settings.hideErrorsOnFocus) {
			this.displayedErrorNames = this.displayedErrorNames.filter(name => name !== event.target.name);
		}

		this.updateAllDisplayedErrors();
	}
}

// ------------------------------------------------
//
// UTILS
//
// ------------------------------------------------

function getValuesFromState (state) {
	const values = {};

	Object.keys(state.fields).map((name) => {
		values[name] = state.fields[name].value;
	});

	return values;
}

function getFormInputElements (form) {
	const htmlCollection = form.elements;
	const inputs = [];

	for (var i = 0; i < htmlCollection.length; i++) {
		inputs.push(htmlCollection[i]);
	}

	return inputs;
}

function getInputByName (form, name) {
	return form.querySelectorAll(`input[name="${name}"]`)[0];
}

function getErrorFromValidity (validity) {
	if (validity.valueMissing) return NativeValidationErrors.VALUE_MISSING;
	if (validity.typeMismatch) return NativeValidationErrors.TYPE_MISMATCH;
	if (validity.badInput) return NativeValidationErrors.BAD_INPUT;
	if (validity.patternMismatch) return NativeValidationErrors.PATTERN_MISMATCH;
	if (validity.rangeOverflow) return NativeValidationErrors.RANGE_OVERFLOW;
	if (validity.rangeUnderflow) return NativeValidationErrors.RANGE_UNDERFLOW;
	if (validity.stepMismatch) return NativeValidationErrors.STEP_MISMATCH;
	if (validity.tooLong) return NativeValidationErrors.TOO_LONG;
	if (validity.tooShort) return NativeValidationErrors.TOO_SHORT;

	throw 'Unknown native validation error';
}

function getValueOrDefault (value, defaultValue) {
	if (typeof value !== 'undefined') return value;
	else return defaultValue;
}

function getFormState (form) {
	const state = {
		formIsValid : true,
		fields: {}
	};

	const inputs = getFormInputElements(form);

	inputs.forEach((input) => {
		const inputState = getInputState(input);

		if (inputState) {
			if (!inputState.valid) state.formIsValid = false;
			state.fields[inputState.name] = inputState;
		}
	});

	return state;
}

function getInputState (input) {
	let {name, type, value, checked} = input;

	// console.log({name, type, value, checked});

	switch (type) {
		// Ignore
		case InputTypes.SUBMIT:
			return null;
			break;
		case InputTypes.CHECKBOX:
			value = checked;
			break;
	}

	const valid = input.validity.valid;

	const state = {name, value, type, valid};

	if (!valid) {
		state.error = getErrorFromValidity(input.validity);
	}

	return state;
}