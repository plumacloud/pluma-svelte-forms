import BasicForm from './components/BasicForm.svelte';
import FormWithErrors from './components/FormWithErrors.svelte';

export default {
	routes: [
		{ path: '/', component: BasicForm },
		{ path: '/with-errors', component: FormWithErrors }
	]
};