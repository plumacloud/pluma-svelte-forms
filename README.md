# PLUMA Svelte Forms

This is a client-side form library for Svelte. It's super early in developement so expect bugs, changes, and dragons.

Demo app: https://pluma-svelte-forms.netlify.app/

## Main features
* <a href="https://bundlephobia.com/result?p=pluma-svelte-forms" target="_blank" rel="noopener">Less than 2kB gzip</a>.
* No dependencies (other than Svelte).
* The DOM is the ultimate source of truth for values. You have total freedom to modify the DOM for complex forms. This library will figure it out.
* You can use in-browser native validation for the most common use cases (eg: required fields).
* Validation is sync (custom or native)
* You can add per-field external validation decoupled from the library. This allows you to implement cancealable async validators.
* Control when errors are displayed to tailor the user experience

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

## Validation

Validation happens on every event (`input`, `blur`, etc). The `controllerState` is always updated with the current state of the complete form. Check the demo app to get an idea of what this means.

### Valid and invalid CSS classes

Once a field is considered to be valid or invalid, its input will be marked with a CSS class. By default these are `valid` and `invalid` but you can configure custom CSS class names (eg: `is-valid` and `is-invalid` if you're using Bootstrap).

You can completely deactivate this behavior by using `null` for the `validClass` or `invalidClass` configuration parameters.

### Displaying errors

Other than the CSS classes mentioned before, this library will not display any errors for you.

You can pass a Svelte writable on the initial configuration which will be updated with the currently displayed errors.

### When are errors displayed?

Although the library knows the state of the complete form at all times, errors are not always displayed. There's nothing more annoying than a form nagging you about an incorrect email address when you haven't finished writing it.

This is the default behavior:

* Errors are always displayed when submitting the form.
* Errors are never displayed when interacting with the form.
* If a field is displaying an error, it will be hidden once the user changes the field's value.
* `blur` and `focus` events will not hide an error.

See the settings below on customizing the default behavior.

When using the external validation on a field, the library will ignore all the error displaying logic and you will have total control on when to display an error.

## `controller` action settings

Required:
* `onSubmit` a callback function that will be triggered when all validation has passed and the form is submitted.

Optional:
* `fields` an object with field configurations
* `validClass` custom CSS class that will be applied to valid input elements. The default is `valid`. If set to `null` no class will be applied.
* `invalidClass` custom CSS class that will be applied to invalid input elements. The default is `invalid`. If set to `null` no class will be applied.
* `useNativeErrorTooltips` use the browser's error tooltips. Defaults to `false`.
* `displayedErrors` a [Svelte writable](https://svelte.dev/docs#svelte_store) that will be updated with displayed errors
* `controllerState` a [Svelte writable](https://svelte.dev/docs#svelte_store) that will be updated with the controller state
* `displayErrorsOnBlur` display field errors on `blur` events. The default is `false`.
* `displayErrorsOnChange` display field errors on `change` and `input` events. The default is `false`.
* `hideErrorsOnChange` hide field errors on `change` and `input` events. The default is `false`.

### Field configurations
All optional:
* `validators` an array with sync functions that will be used to validate the value of the field after the native validators have passed.
* `externalValidator` a sync function that will be used for all validation. When using this option, no validation will be performed by the library itself.
* `displayErrorsOnChange` show field errors on `input` and `change` events. The default is `false`.