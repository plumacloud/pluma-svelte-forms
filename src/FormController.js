import {writable, get} from 'svelte/store';

const InputTypes = {
	'SUBMIT': 'submit',
	'CHECKBOX': 'checkbox'
}

export default class FormController {
	constructor (config) {

		this.controllerState = null;

		// Bind handlers
		this.onSubmit = this.onSubmit.bind(this);
		this.onInvalid = this.onInvalid.bind(this);
		this.onInput = this.onInput.bind(this);
		this.onChange = this.onChange.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onFocus = this.onFocus.bind(this);

		// Settings
		this.settings = {};
		this.settings.fields = config.fields ? config.fields : {};
		this.settings.onSubmit = config.onSubmit;
		this.settings.useNativeErrorTooltips = typeof config.useNativeErrorTooltips !== 'undefined' ? config.useNativeErrorTooltips : false;
		this.settings.validClass = typeof config.validClass === 'string' ? config.validClass : 'valid';
		this.settings.invalidClass = typeof config.invalidClass === 'string' ? config.invalidClass : 'invalid';

		this.form = config.form;
		this.form.addEventListener('submit', this.onSubmit);
		// Disable native error tooltips
		if (!this.settings.useNativeErrorTooltips) this.form.setAttribute('novalidate', true);

		// stores
		this.stores = {};
		this.stores.errors = config.displayedErrors;
		this.stores.controllerState = config.controllerState;

		// init inputs
		const inputs = this.getInputElements();
		inputs.forEach((input) => this.addListenersToInput(input));

		this.updateFormState();
	}

	addListenersToInput (input) {
		input.addEventListener('invalid', this.onInvalid);
		input.addEventListener('input', this.onInput);
		input.addEventListener('blur', this.onBlur);
		input.addEventListener('focus', this.onFocus);
	}

	removeListenersFromInput (input) {
		input.removeEventListener('invalid', this.onInvalid);
		input.removeEventListener('input', this.onInput);
		input.removeEventListener('blur', this.onBlur);
		input.removeEventListener('focus', this.onFocus);
	}

	destroy () {
		form.removeEventListener('submit', this.onSubmit);

		const inputs = this.getInputElements();
		inputs.forEach((input) => this.removeListenersFromInput(input));
	}

	// ------------------------------------------------
	// State
	// ------------------------------------------------

	updateFormState () {
		// console.time('updateFormState');
		const state = this.getFormState();
		this.controllerState = state;
		// console.timeEnd('updateFormState');
		if (this.stores.controllerState) this.stores.controllerState.set(this.controllerState);
	}

	updateFieldState (input) {
		const state = this.getInputState(input);

		this.controllerState.fields[state.name] = {
			value: state.value,
			type: state.type,
			valid: state.valid
		};

		this.updateFormIsValid()

		if (this.stores.controllerState) this.stores.controllerState.set(this.controllerState);
	}

	updateFormIsValid () {

	}

	getFormState () {
		const state = {
			formIsValid : true,
			fields: {}
		};

		const inputs = this.getInputElements();

		inputs.forEach((input) => {
			const inputState = this.getInputState(input);

			if (inputState) {

				if (!inputState.valid) state.formIsValid = false;

				state.fields[inputState.name] = {
					value: inputState.value,
					type: inputState.type,
					valid: inputState.valid
				}
			}
		});

		return state;
	}

	getInputState (input) {
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

		return {name, value, type, valid};
	}

	// ------------------------------------------------
	// Event handlers
	// ------------------------------------------------

	async onSubmit (event) {
		event.preventDefault();
		event.stopPropagation();

		if (this.controllerState.formIsValid) {
			const values = this.getValuesFromState();
			await this.settings.onSubmit(values);
		}
	}

	onInvalid (event) {
		event.target.classList.add(this.settings.invalidClass);
	}

	onInput (event) {
		const input = event.target;

		input.classList.remove(this.settings.invalidClass);
		if (input.validity.valid) input.classList.add(this.settings.validClass);

		this.updateFormState();
	}

	onChange (event) {
		const input = event.target;

		input.classList.remove(this.settings.invalidClass);
		if (input.validity.valid) input.classList.add(this.settings.validClass);

		this.updateFormState();
	}

	onBlur (event) {}

	onFocus (event) {}

	// ------------------------------------------------
	// Validation
	// ------------------------------------------------

	// async checkFieldCustomValidators (input) {
	// 	const name = input.getAttribute("name");

	// 	// if the field doesn't have any config or any validator consider it valid
	// 	if (!this.settings.fields[name] || !this.settings.fields[name].validators) return true;

	// 	const validators = this.settings.fields[name].validators;

	// 	for (var i = 0; i < validators.length; i++) {
	// 		if (validators[i].then) await validators[i];
	// 	}
	// }


	// ------------------------------------------------
	// Utils
	// ------------------------------------------------

	getValuesFromState () {
		const values = {};

		Object.keys(this.controllerState.fields).map((name) => {
			values[name] = this.controllerState.fields[name].value;
		});

		return values;
	}

	getInputElements () {
		const htmlCollection = this.form.elements;
		const inputs = [];

		for (var i = 0; i < htmlCollection.length; i++) {
			inputs.push(htmlCollection[i]);
		}

		return inputs;

		// return this.form.querySelectorAll('input, select, textarea');
	}
}