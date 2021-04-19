import {writable, get} from 'svelte/store';
import {InputTypes, NativeValidationErrors, ValidationStates, FormStates} from './enums/index.js';

const {VALID, INVALID, PENDING} = ValidationStates;

export default class FormController {
	constructor (config) {

		if (!config.onSubmit) throw 'You need to add an onSubmit callback';

		this.controllerState = {
			validationState: FormStates.PENDING,
			fields: {}
		};

		this.displayedErrors = {};

		// Bind handlers
		this.onSubmit = this.onSubmit.bind(this);
		this.onInput = this.onInput.bind(this);
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
		this.settings.displayErrorsOnChange = getValueOrDefault(config.displayErrorsOnChange, false);
		this.settings.hideErrorsOnChange = getValueOrDefault(config.hideErrorsOnChange, true);

		this.form = config.form;
		this.form.addEventListener('submit', this.onSubmit);
		// Disable native error tooltips
		if (!this.settings.useNativeErrorTooltips) this.form.setAttribute('novalidate', true);

		// stores
		this.stores = {};
		this.stores.displayedErrors = config.displayedErrors;
		this.stores.controllerState = config.controllerState;

		// init inputs and field state
		const inputs = getFormInputElements(this.form);

		inputs.forEach((input) => {
			this.addListenersToInput(input);
			const name = input.name;
			const fieldSettings = this.settings.fields[name] || {};
			const fieldState = this.getFieldStateFromInput(input);
			this.updateFieldState(name, fieldState);
		});

		this.updateControllerState();
		this.updateStores();
	}

	addListenersToInput (input) {
		input.addEventListener('input', this.onInput);
		// input.addEventListener('change', this.onInput);
		input.addEventListener('blur', this.onBlur);
		input.addEventListener('focus', this.onFocus);
	}

	removeListenersFromInput (input) {
		input.removeEventListener('input', this.onInput);
		// input.removeEventListener('change', this.onInput);
		input.removeEventListener('blur', this.onBlur);
		input.removeEventListener('focus', this.onFocus);
	}

	destroy () {
		this.form.removeEventListener('submit', this.onSubmit);
		const inputs = getFormInputElements(this.form);
		inputs.forEach((input) => this.removeListenersFromInput(input));
	}

	updateDisplayedErrors () {
		let displayedErrors = {};

		Object.keys(this.controllerState.fields).forEach((name) => {

			const field = this.controllerState.fields[name];

			if (field.displayError && field.validationState === INVALID) {
				if (!displayedErrors) displayedErrors = {};
				displayedErrors[name] = field.error;
			}
		});

		this.displayedErrors = displayedErrors;
	}

	updateStores () {
		if (this.stores.controllerState) this.stores.controllerState.set(this.controllerState);
		if (this.stores.displayedErrors) this.stores.displayedErrors.set(this.displayedErrors);
	}

	triggerOnSubmit () {
		this.controllerState.validationState = FormStates.SUBMITTED;
		const values = getValuesFromState(this.controllerState);
		this.settings.onSubmit(values);
		this.updateStores();
	}

	// ------------------------------------------------
	//
	// STATE
	//
	// ------------------------------------------------

	updateControllerState () {
		const controllerState = this.controllerState;

		const previousState = controllerState.validationState;
		let nextState = FormStates.VALID;

		Object.keys(controllerState.fields).forEach((fieldName) => {
			const field = controllerState.fields[fieldName];

			// We're giving a PENDING state priority over INVALID
			if (nextState === FormStates.PENDING) return;
			if (!field.validationState || field.validationState === ValidationStates.PENDING) nextState = FormStates.PENDING;
			if (field.validationState === ValidationStates.INVALID) nextState = FormStates.INVALID;
		});

		if (previousState === FormStates.SUBMITTED_PENDING && nextState === FormStates.PENDING) {
			controllerState.validationState = FormStates.SUBMITTED_PENDING;
		} else {
			controllerState.validationState = nextState;
		}

		this.controllerState = controllerState;
	}

	updateFieldState (name, updateState) {
		const previousState = this.controllerState.fields[name] || {};
		const newState = Object.assign(previousState, updateState);
		this.controllerState.fields[name] = newState;
	}

	getFieldStateFromInput (input) {
		const inputState = getInputState(input);
		const {name, value, type, nativeError} = inputState;
		const fieldState = {name, value, type};
		const fieldSettings = this.settings.fields[name] || {};

		if (fieldSettings.externalValidator) {
			fieldState.validationState = PENDING;
			return fieldState;
		}

		if (nativeError) {
			fieldState.validationState = INVALID;
			fieldState.error = nativeError;
			return fieldState;
		}

		if (fieldSettings.validators) {
			const error = validateValueWithValidators(value, fieldSettings.validators);

			if (error !== true) {
				fieldState.validationState = INVALID;
				fieldState.error = error;
				return fieldState;
			}
		}

		fieldState.validationState = VALID;
		return fieldState;
	}

	// ------------------------------------------------
	//
	// EVENT HANDLERS
	//
	// ------------------------------------------------

	async onSubmit (event) {
		event.preventDefault();
		event.stopPropagation();

		// Show errors of all invalid fields and trigger external validation
		Object.keys(this.controllerState.fields).forEach((name) => {
			const field = this.controllerState.fields[name];
			const fieldSettings = this.settings.fields[name] || {};
			const input = getInputByName(this.form, name);

			if (field.validationState === INVALID) field.displayError = true;

			if (fieldSettings.externalValidator) this.triggerExternalValidationForField(name, event);
		});

		this.updateControllerState();
		this.updateDisplayedErrors();
		this.updateCSSClassesForAllInputs();
		this.updateStores();

		if (this.controllerState.validationState === FormStates.PENDING) {
			this.controllerState.validationState = FormStates.SUBMITTED_PENDING;
		}

		if (this.controllerState.validationState === FormStates.VALID) this.triggerOnSubmit();
	}

	onInput (event) {
		const name = event.target.name;
		const fieldSettings = this.settings.fields[name] || {};
		const fieldState = this.getFieldStateFromInput(event.target);

		const isInvalid = fieldState.validationState === INVALID;
		const hasExternalValidator = typeof fieldSettings.externalValidator !== 'undefined';

		if (!hasExternalValidator && isInvalid) {
			const displayErrorOnChange = this.settings.displayErrorsOnChange || fieldSettings.displayErrorsOnChange;
			const isDisplayingError = this.controllerState.fields[name].displayError;
			const hideErrorsOnChange = this.settings.hideErrorsOnChange;

			if (displayErrorOnChange || (isDisplayingError && hideErrorsOnChange === false)) fieldState.displayError = true;
		}

		this.updateFieldState(name, fieldState);
		this.updateControllerState();
		this.updateDisplayedErrors();
		this.updateInputCSSClasses(event.target);
		this.updateStores();

		if (hasExternalValidator) {
			this.triggerExternalValidationForField(name, event);
		}
	}

	onBlur (event) {
		const name = event.target.name;
		const fieldState = getInputState(event.target);
		const fieldSettings = this.settings.fields[name] || {};
		const isInvalid = fieldState.validationState === INVALID;
		const hasExternalValidator = typeof fieldSettings.externalValidator !== 'undefined';

		if (!hasExternalValidator && isInvalid) {
			const isDisplayingError = this.controllerState.fields[name].displayError;

			if (!isDisplayingError && this.settings.displayErrorsOnBlur) {
				fieldState.displayError = true;

				this.updateFieldState(name, fieldState);
				this.updateControllerState();
				this.updateDisplayedErrors();
				this.updateCSSClassesForAllInputs();
				this.updateStores();
			}
		}


		if (hasExternalValidator) {
			this.triggerExternalValidationForField(name, event);
		}
	}

	onFocus (event) {
		const inputName = event.target.name;
		const fieldSettings = this.settings.fields[inputName] || {};
		const hasExternalValidator = typeof fieldSettings.externalValidator !== 'undefined';

		if (hasExternalValidator) {
			this.triggerExternalValidationForField(inputName, event);
		}
	}

	// ------------------------------------------------
	//
	// VALIDATION
	//
	// ------------------------------------------------

	// We need the name in case of a submit event which is not related to any input

	triggerExternalValidationForField (name, event) {
		const fieldState = this.controllerState.fields[name];
		const fieldSettings = this.settings.fields[name];

		const update = (updateState) => {
			fieldState.validationState = updateState.validationState;
			fieldState.error = updateState.error || null;
			fieldState.displayError = updateState.displayError;

			const previousState = this.controllerState.validationState;

			this.updateFieldState(name, fieldState);
			this.updateControllerState();
			this.updateDisplayedErrors();
			this.updateCSSClassesForAllInputs();
			this.updateStores();

			if (this.controllerState.validationState === FormStates.VALID && previousState === FormStates.SUBMITTED_PENDING) {
				this.triggerOnSubmit();
			}
		}

		fieldSettings.externalValidator(fieldState, event.type, update);
	}

	updateInputCSSClasses (input) {
		input.classList.remove(this.settings.validClass, this.settings.invalidClass);

		const field = this.controllerState.fields[input.name];
		const displayError = this.displayedErrors[input.name];

		if (field.validationState === VALID) {
			if (this.settings.validClass) input.classList.add(this.settings.validClass);
		}

		if (displayError && field.validationState === INVALID) {
			if (this.settings.invalidClass) input.classList.add(this.settings.invalidClass);
		}
	}

	updateCSSClassesForAllInputs () {
		const inputs = getFormInputElements(this.form);
		inputs.forEach((input) => this.updateInputCSSClasses(input));
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
		if (htmlCollection[i].type === InputTypes.SUBMIT) continue;
		inputs.push(htmlCollection[i]);
	}

	return inputs;
}

function getInputByName (form, name) {
	return form.querySelectorAll(`input[name="${name}"]`)[0];
}

function getInputState (input) {
	let {name, type, value, checked} = input;

	switch (type) {
		case InputTypes.CHECKBOX:
			value = checked;
			break;
	}

	const inputState = {name, value, type};

	if (!input.validity.valid) {
		inputState.nativeError = getErrorFromValidity(input.validity);
	}

	return inputState;
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

function validateValueWithValidators (value, validators) {
	for (const validator of validators) {

		if (validator.then) {
			throw `Custom sync validators can't return a promise`;
		}

		return validator(value);
	}
}