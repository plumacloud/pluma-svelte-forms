<script>
	import {controller, NativeValidationErrors, ValidationStates} from 'pluma-svelte-forms';
	import {writable} from 'svelte/store';
	import Cancelable from 'p-cancelable';

	const {VALID, INVALID, PENDING} = ValidationStates;

	let submittedValues, passwordError, passwordIsValid;

	const displayedErrors = writable(null);
	const controllerState = writable(null);
	let usernameError, usernameValidationState, isValidating;

	let cancelable, cancelable_2;

	function checkUsernameIsAvailable () {
		let timeout;

		return new Cancelable((resolve, reject, onCancel) => {
			timeout = setTimeout(() => {
				// Determine if a username is available randomly
				const usernameIsAvailable = Math.round(Math.random()) === 0;
				resolve(usernameIsAvailable);
			}, 1500);

			onCancel(() => {
				clearTimeout(timeout);
			});
		});
	}

	async function checkUsername (fieldState, eventType, update) {

		if (eventType === 'blur' || eventType === 'focus' || eventType === 'change') return;
		if (eventType === 'submit' && fieldState.validationState === VALID) return;

		if (cancelable) cancelable.cancel();
		isValidating = false;

		const value = fieldState.value;

		if (!value) {
			update({
				validationState: INVALID,
				error: 'Please write a username',
				displayError: true
			});
			return;
		}

		if (value.length < 4) {
			update({
				validationState: INVALID,
				error: 'Please write a longer username',
				displayError: true
			});
			return;
		}

		update({validationState: PENDING});
		isValidating = true;

		cancelable = checkUsernameIsAvailable();

		try {
			const usernameIsAvailable = await cancelable;

			isValidating = false;


			if (usernameIsAvailable) {
				update({validationState: VALID});
			} else {
				update({
					validationState: INVALID,
					error: 'Username is not available',
					displayError: true
				});
			}
		} catch (error) {
			if (error.isCanceled) return;
			throw error;
		}
	}

	const formControllerSettings = {
		async onSubmit (values) {
			submittedValues = values;
		},
		validClass: 'is-valid',
		invalidClass: 'is-invalid',
		displayedErrors,
		controllerState,
		hideErrorsOnInput: true,
		fields: {
			username: {
				externalValidator: checkUsername
			}
		}
	}

	$: usernameError = $displayedErrors?.username || null;
	$: usernameValidationState = $controllerState?.fields.username.validationState;

</script>

<div class="wrap">
	<h1 class="mb-4">Async validation</h1>

	<form use:controller={formControllerSettings} class="mb-5" autocomplete="off">
		<div class="mb-3">
			<label for="input-username" class="form-label">Username</label>
			<input type="text" name="username" class="form-control" id="input-username">
			{#if usernameValidationState === VALID}
				<div class="valid-feedback">Username is available!</div>
			{:else if usernameValidationState === INVALID}
				<div class="invalid-feedback">{usernameError}</div>
			{:else if isValidating}
				<div class="form-text" id="checking-spinner">
					<div class="spinner-border spinner-border-sm" role="status"></div>
					Checking if username is available...
				</div>
			{/if}
		</div>
		<button type="submit" class="btn btn-primary">Submit</button>
	</form>

	{#if submittedValues}
		<h3>Submitted values</h3>
		<pre>
			{JSON.stringify(submittedValues, null, 2)}
		</pre>
	{/if}

	{#if $displayedErrors}
		<h3>Displayed errors</h3>
		<pre>
			{JSON.stringify($displayedErrors, null, 2)}
		</pre>
	{/if}

	{#if $controllerState}
		<h3>Controller state</h3>
		<pre>
			{JSON.stringify($controllerState, null, 2)}
		</pre>
	{/if}
</div>

<style>
	.wrap {
		max-width: 30rem;
		margin: 0 auto;
	}

	#checking-spinner {
		display: flex;
		align-items: center;
	}

	#checking-spinner .spinner-border {
		margin-right: .5rem;
	}
</style>