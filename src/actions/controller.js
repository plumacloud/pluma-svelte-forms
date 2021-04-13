import FormController from '../FormController.js';

export default function (form, settings) {

	settings.form = form;

	const formValidation = new FormController(settings);

	return {
		destroy() {
			formValidation.destroy();
		}
	};
}