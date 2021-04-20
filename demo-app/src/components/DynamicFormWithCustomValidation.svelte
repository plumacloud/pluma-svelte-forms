<script>
	import {controller, NativeValidationErrors, ValidationStates} from 'pluma-svelte-forms';
	import {writable} from 'svelte/store';
	import {checkPassword} from '../utils.js';

	const {VALID, INVALID, PENDING} = ValidationStates;

	let submittedValues, passwordError, passwordValidationState;

	const controllerState = writable(null);
	const displayedErrors = writable(null);

	const products = [
		{
			id: '1233',
			name: 'GAMING LAPTOP'
		},
		{
			id: '4645',
			name: 'SMARTPHONE'
		},
		{
			id: '34553',
			name: 'TABLET'
		}
	];

	const regexLowercase = /[a-z]/;

	function isAllCaps (value) {
		const testLowercase = regexLowercase.test(value);

		if (testLowercase) return 'Only use uppercase letters';
		return true;
	}

	const formControllerSettings = {
		async onSubmit (values) {
			submittedValues = values;
		},
		validClass: 'is-valid',
		invalidClass: 'is-invalid',
		controllerState,
		displayedErrors,
		fields: {
			product: {
				validators: [isAllCaps],
				displayErrorsOnChange: true
			}
		}
	}

</script>

<div class="wrap">
	<h1 class="mb-4">Dynamic form with custom validation</h1>

	<form use:controller={formControllerSettings} class="mb-5" autocomplete="off">
		{#each products as product}
			<div class="mb-3">
				<label for={'input-product-' + product.id} class="form-label">Name</label>
				<input type="text" name={'product|' + product.id} class="form-control" id={'input-product-' + product.id} value={product.name} required>
				{#if $displayedErrors?.[product.id]}
					<div class="invalid-feedback">{$displayedErrors[product.id]}</div>
				{/if}
			</div>
		{/each}
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