const ctXML = "[Content_Types].xml";
function collectContentTypes(overrides, defaults, zip) {
	const partNames = {};
	for (let i = 0, len = overrides.length; i < len; i++) {
		const override = overrides[i];
		const contentType = override.getAttribute("ContentType");
		const partName = override.getAttribute("PartName").substr(1);
		partNames[partName] = contentType;
	}
	for (let i = 0, len = defaults.length; i < len; i++) {
		const def = defaults[i];
		const contentType = def.getAttribute("ContentType");
		const extension = def.getAttribute("Extension");
		// eslint-disable-next-line no-loop-func
		zip.file(/./).map(({ name }) => {
			if (
				name.slice(name.length - extension.length - 1) === ".xml" &&
				!partNames[name] &&
				name !== ctXML
			) {
				partNames[name] = contentType;
			}
		});
	}
	return partNames;
}

module.exports = collectContentTypes;
