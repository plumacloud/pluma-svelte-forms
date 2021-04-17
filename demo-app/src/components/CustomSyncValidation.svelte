<script>
	import {controller, NativeValidationErrors, ValidationStates} from 'pluma-svelte-forms';
	import {writable} from 'svelte/store';
	import {checkPassword} from '../utils.js';

	const {VALID, INVALID, PENDING} = ValidationStates;

	let submittedValues, passwordError, passwordValidationState;

	const displayedErrors = writable(null);
	const controllerState = writable(null);

	const formControllerSettings = {
		async onSubmit (values) {
			submittedValues = values;
		},
		validClass: 'is-valid',
		invalidClass: 'is-invalid',
		displayedErrors,
		controllerState,
		fields: {
			password: {
				validators: [checkPassword],
				displayErrorsOnChange: true
			}
		}
	}

	$: {
		passwordError = $displayedErrors?.password;
		passwordValidationState = $controllerState?.fields.password.validationState;
	}

</script>

<div class="wrap">
	<h1 class="mb-4">Custom sync validation</h1>

	<form use:controller={formControllerSettings} class="mb-5" autocomplete="off">
		<div class="mb-3">
			<label for="exampleInputPassword1" class="form-label">Password</label>
			<input type="password" name="password" class="form-control" id="exampleInputPassword1" required minlength="12">

			{#if passwordValidationState === VALID}
				<div class="valid-feedback">Looking good!</div>
			{:else if !passwordError}
				<div class="form-text">Long password with at least a number and an uppercase letter</div>
			{:else if passwordError == NativeValidationErrors.VALUE_MISSING}
				<div class="invalid-feedback">Please write a password</div>
			{:else if passwordError == NativeValidationErrors.TOO_SHORT}
				<div class="invalid-feedback">Your password must be at least 12 characters long</div>
			{:else}
				<div class="invalid-feedback">{passwordError}</div>
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
</style>