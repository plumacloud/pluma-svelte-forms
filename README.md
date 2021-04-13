# PLUMA Svelte Forms

This is a client-side form library for Svelte. It's super early in developement so expect bugs, changes, and dragons.

## Getting started
```svelte
<script>
  import {controller} from 'pluma-svelte-forms';
  import {writable} from 'svelte/store';

  const displayedErrors = writable(null);
  const controllerState = writable(null);

  const settings = {
    async onSubmit (values) {
      console.log(values)
    },
    displayedErrors,
    controllerState
  }

</script>

<form use:controller={settings}>
  <input type="email" name="email" required>
  <input type="password" name="password" required>
  <button type="submit">Submit</button>
</form>

```

## `controller` action settings

* `onSubmit` a callback function that will be triggered when all validation has passed and the form is submitted.
* `validClass` custom CSS class that will be applied to valid input elements. The default is `valid`.
* `invalidClass` custom CSS class that will be applied to invalid input elements. The default is `invalid`.
* `useNativeErrorTooltips` use the browser's error tooltips. Defaults to `false`.
* `displayedErrors` a [Svelte writable](https://svelte.dev/docs#svelte_store) that will be updated with displayed errors
* `controllerState` a [Svelte writable](https://svelte.dev/docs#svelte_store) that will be updated with the controller state