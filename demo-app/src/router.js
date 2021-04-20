import BasicForm from './components/BasicForm.svelte';
import FormWithErrors from './components/FormWithErrors.svelte';
import CustomSyncValidation from './components/CustomSyncValidation.svelte';
import AsyncValidation from './components/AsyncValidation.svelte';
import DynamicForm from './components/DynamicForm.svelte';
import DynamicFormWithCustomValidation from './components/DynamicFormWithCustomValidation.svelte';

export default {
	routes: [
		{ path: '/', component: BasicForm },
		{ path: '/with-errors', component: FormWithErrors },
		{ path: '/custom-sync-validation', component: CustomSyncValidation },
		{ path: '/async-validation', component: AsyncValidation },
		{ path: '/dynamic-form', component: DynamicForm },
		{ path: '/dynamic-form-validation', component: DynamicFormWithCustomValidation }
	]
};