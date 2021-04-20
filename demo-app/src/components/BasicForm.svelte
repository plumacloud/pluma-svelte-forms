<script>
	import {controller} from 'pluma-svelte-forms';
	import {writable} from 'svelte/store';

	let submittedValues;

	const controllerState = writable(null);


	const settings = {
		async onSubmit (values) {
			submittedValues = values;
		},
		validClass: 'is-valid',
		invalidClass: 'is-invalid',
		controllerState
	}

</script>

<div class="wrap">
	<h1 class="mb-4">Basic form</h1>

	<form use:controller={settings} class="mb-5" autocomplete="off">
		<div class="mb-3">
			<label for="input-email" class="form-label">Email address</label>
			<input type="email" name="email" class="form-control" id="input-email" required>
		</div>
		<div class="mb-3">
			<label for="input-password" class="form-label">Password</label>
			<input type="password" name="password" class="form-control" id="input-password" required>
		</div>
		<div class="mb-3 form-check">
			<input type="checkbox" name="accept" class="form-check-input" id="accept" required>
			<label class="form-check-label" for="accept">I accept the terms and conditions</label>
		</div>
		<button type="submit" class="btn btn-primary">Submit</button>
	</form>

	{#if submittedValues}
		<h3>Submitted values</h3>
		<pre>
			{JSON.stringify(submittedValues, null, 2)}
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