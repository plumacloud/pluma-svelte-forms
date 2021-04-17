<script>
	import {controller} from 'pluma-svelte-forms';
	import {writable} from 'svelte/store';

	let submittedValues, emailIsValid, passwordIsValid, showEmailError, showPasswordError, showAcceptError;

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

	$: {
		emailIsValid = $controllerState?.fields?.email.valid || false;
		passwordIsValid = $controllerState?.fields?.password.valid || false;
		showEmailError = $displayedErrors?.email || false;
		showPasswordError = $displayedErrors?.password || false;
		showAcceptError = $displayedErrors?.accept || false;
	}

</script>

<div class="wrap">
	<h1 class="mb-4">Form with errors</h1>

	<form use:controller={settings} class="mb-5" autocomplete="off">
		<div class="mb-3">
			<label for="exampleInputEmail1" class="form-label">Email address</label>
			<input type="email" name="email" class="form-control" id="exampleInputEmail1" aria-describedby="emailHelp" required>
			{#if emailIsValid}
				<div class="valid-feedback">Looks good!</div>
			{:else if showEmailError}
				<div class="invalid-feedback">Please use a valid email address</div>
			{/if}
		</div>
		<div class="mb-3">
			<label for="exampleInputPassword1" class="form-label">Password</label>
			<input type="password" name="password" class="form-control" id="exampleInputPassword1" required>
			{#if passwordIsValid}
				<div class="valid-feedback">Looks good!</div>
			{:else if showPasswordError}
				<div class="invalid-feedback">Please write a password</div>
			{/if}
		</div>
		<div class="mb-3 form-check">
			<input type="checkbox" name="accept" class="form-check-input" id="accept" required>
			<label class="form-check-label" for="accept">I accept the terms and conditions</label>
			{#if showAcceptError}
				<div class="invalid-feedback">You must agree before submitting.</div>
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