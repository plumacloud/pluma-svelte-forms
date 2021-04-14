<script>
	import {link, active} from 'pluma-svelte-router';
</script>

<div class="mb-4">
	<a href="/" use:link use:active>Basic form</a>
	<a href="/with-errors" use:link use:active>Form with errors</a>
</div>