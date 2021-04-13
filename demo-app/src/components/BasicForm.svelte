<script>
	import {controller} from 'pluma-svelte-forms';
	import {writable} from 'svelte/store';

	let submittedValues;

	const displayedErrors = writable(null);
	const controllerState = writable(null);

	const settings = {
		async onSubmit (values) {
			submittedValues = values;
		},
		validClass: 'is-valid',
		invalidClass: 'is-invalid',
		displayedErrors,
		controllerState
	}

</script>

<div class="wrap">
	<h1 class="mb-4">Basic form</h1>

	<form use:controller={settings} class="mb-5">
		<div class="mb-3">
			<label for="exampleInputEmail1" class="form-label">Email address</label>
			<input type="email" name="email" class="form-control" id="exampleInputEmail1" aria-describedby="emailHelp" required>
		</div>
		<div class="mb-3">
			<label for="exampleInputPassword1" class="form-label">Password</label>
			<input type="password" name="password" class="form-control" id="exampleInputPassword1" required>
		</div>
		<div class="mb-3 form-check">
			<input type="checkbox" name="accept-terms" class="form-check-input" id="keep-me-logged" required>
			<label class="form-check-label" for="keep-me-logged">I accept the terms and conditions</label>
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