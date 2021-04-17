import {writable, get} from 'svelte/store';
import {InputTypes, NativeValidationErrors, ValidationStates} from './enums/index.js';

const {VALID, INVALID, PENDING} = ValidationStates;

export default class FormController {
	constructor (config) {

		if (!config.onSubmit) throw 'You need to add an onSubmit callback';

		this.controllerState = {
			validationState: PENDING,
			fields: {}
		};

		this.displayedErrors = {};

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
		this.settings.displayErrorsOnChange = getValueOrDefault(config.displayErrorsOnChange, false);
		this.settings.keepErrorsOnBlur = getValueOrDefault(config.keepErrorsOnBlur, true);
		this.settings.hideErrorsOnChange = getValueOrDefault(config.hideErrorsOnChange, true);

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
		inputs.forEach((input) => {
			this.addListenersToInput(input);
			const fieldState = this.getInputState(input);
			this.updateFieldState(fieldState);
		});

		// Init state for all fields
		// Object.keys(this.controllerState.fields).forEach((name) => {
		// 	const field = this.controllerState.fields[name];
		// 	const fieldSettings = this.settings.fields[name] || {};

		// 	if (field.validationState === INVALID) field.displayError = true;
		// 	if (fieldSettings.externalValidator) this.triggerExternalValidationForField(name, event);
		// });

		this.updateControllerState();
		this.updateStores();
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

	updateDisplayedErrors () {
		let displayedErrors = null;

		Object.keys(this.controllerState.fields).forEach((name) => {

			const input = getInputByName(this.form, name);
			const field = this.controllerState.fields[name];

			const displayError = field.displayError;

			input.classList.remove(this.settings.invalidClass, this.settings.validClass);

			// VALID will always have priority over PENDING and INVALID
			// because we don't want to remove the visual cue of a valid input
			if (field.validationState === VALID) {
				if (this.settings.validClass) input.classList.add(this.settings.validClass);
				return;
			}

			if (!displayError || field.validationState === PENDING) {
				return;
			}

			if (field.validationState === INVALID) {
				if (!displayedErrors) displayedErrors = {};
				displayedErrors[name] = field.error;
				if (this.settings.invalidClass) input.classList.add(this.settings.invalidClass);
			}
		});

		this.displayedErrors = displayedErrors;
	}

	updateStores () {
		if (this.stores.controllerState) this.stores.controllerState.set(this.controllerState);
		if (this.stores.displayedErrors) this.stores.displayedErrors.set(this.displayedErrors);
	}

	// ------------------------------------------------
	//
	// STATE
	//
	// ------------------------------------------------

	updateControllerState () {
		const controllerState = this.controllerState;

		controllerState.validationState = VALID;

		Object.keys(controllerState.fields).forEach((fieldName) => {
			const field = controllerState.fields[fieldName];

			// We're giving a PENDING state priority over INVALID
			if (controllerState.validationState === PENDING) return;
			if (!field.validationState || field.validationState === PENDING) controllerState.validationState = PENDING;
			if (field.validationState === INVALID) controllerState.validationState = INVALID;
		});

		this.controllerState = controllerState;
	}

	updateFieldState (fieldState) {
		this.controllerState.fields[fieldState.name] = fieldState;
	}

	getInputState (input) {
		let {name, type, value, checked} = input;

		switch (type) {
			case InputTypes.CHECKBOX:
				value = checked;
				break;
		}

		const inputState = {name, value, type, displayError: false};
		const fieldSettings = this.settings.fields[name];

		// If there's an external validator we ignore all validation
		if (fieldSettings && fieldSettings.externalValidator) {
			return inputState;
		}

		// Native validation
		if (!input.validity.valid) {
			const errorCode = getErrorFromValidity(input.validity);
			inputState.validationState = INVALID;
			inputState.error = fieldSettings && fieldSettings.nativeErrorMessages && fieldSettings.nativeErrorMessages[errorCode] ? fieldSettings.nativeErrorMessages[errorCode] : errorCode;
			return inputState;
		}

		// Custom sync validators
		if (fieldSettings && fieldSettings.validators) {
			for (const validator of fieldSettings.validators) {

				if (validator.then) {
					throw `Custom sync validators can't return a promise`;
				}

				const result = validator(value);

				if (result !== true) {
					inputState.validationState = INVALID;
					inputState.error = result;
					return inputState;
				}
			}
		}

		inputState.validationState = VALID;
		return inputState;
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

			if (field.validationState === INVALID) field.displayError = true;
			if (fieldSettings.externalValidator) this.triggerExternalValidationForField(name, event);
		});

		this.updateControllerState();
		this.updateDisplayedErrors();
		this.updateStores();

		if (this.controllerState.validationState === VALID) {
			const values = getValuesFromState(this.controllerState);
			await this.settings.onSubmit(values);
		}
	}

	onChange (event) {
		const inputName = event.target.name;
		const fieldSettings = this.settings.fields[inputName];
		const fieldState = this.getInputState(event.target);
		const isInvalid = fieldState.validationState === INVALID;
		const hasExternalValidator = typeof fieldSettings.externalValidator !== 'undefined';

		if (!hasExternalValidator && isInvalid) {
			const displayErrorOnChange = this.settings.displayErrorsOnChange || (fieldSettings && fieldSettings.displayErrorsOnChange);
			const isDisplayingError = this.controllerState.fields[inputName].displayError;
			const hideErrorsOnChange = this.settings.hideErrorsOnChange;

			if (displayErrorOnChange || (isDisplayingError && hideErrorsOnChange === false)) fieldState.displayError = true;
		}

		this.updateFieldState(fieldState);
		this.updateDisplayedErrors();
		this.updateStores();

		if (hasExternalValidator) {
			this.triggerExternalValidationForField(inputName, event);
		}
	}

	onBlur (event) {
		const inputName = event.target.name;
		const fieldState = this.getInputState(event.target);
		const fieldSettings = this.settings.fields[inputName] || {};
		const isInvalid = fieldState.validationState === INVALID;
		const hasExternalValidator = typeof fieldSettings.externalValidator !== 'undefined';

		if (!hasExternalValidator && isInvalid) {
			const isDisplayingError = this.controllerState.fields[inputName].displayError;

			if ((this.settings.keepErrorsOnBlur && isDisplayingError) || this.settings.displayErrorsOnBlur) {
				fieldState.displayError = true;
			}
		}

		this.updateFieldState(fieldState);
		this.updateDisplayedErrors();
		this.updateStores();

		if (hasExternalValidator) {
			this.triggerExternalValidationForField(inputName, event);
		}
	}

	onFocus (event) {
		const inputName = event.target.name;
		const fieldState = this.getInputState(event.target);
		const fieldSettings = this.settings.fields[inputName];
		const isInvalid = fieldState.validationState === INVALID;
		const hasExternalValidator = typeof fieldSettings.externalValidator !== 'undefined';


		if (!hasExternalValidator && isInvalid) {
			const isDisplayingError = this.controllerState.fields[inputName].displayError;
			const hasValue = fieldState.type !== InputTypes.CHECKBOX && fieldState.value !== '';
			if (isDisplayingError) fieldState.displayError = true;
		}

		this.updateFieldState(fieldState);
		this.updateDisplayedErrors();
		this.updateStores();

		if (hasExternalValidator) {
			this.triggerExternalValidationForField(inputName, event);
		}
	}

	// ------------------------------------------------
	//
	// EXTERNAL VALIDATION
	//
	// ------------------------------------------------

	// We need the name because the submit event does not pertain to any input

	triggerExternalValidationForField (name, event) {
		const fieldState = this.controllerState.fields[name];
		const fieldSettings = this.settings.fields[name];

		const update = (updateState) => {
			fieldState.validationState = updateState.validationState;
			fieldState.error = updateState.error || null;
			fieldState.displayError = updateState.displayError;

			this.updateFieldState(fieldState);
			this.updateDisplayedErrors();
			this.updateStores();
		}

		fieldSettings.externalValidator(event, update);
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