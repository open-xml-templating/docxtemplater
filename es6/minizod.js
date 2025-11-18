class MiniZod {
	static createSchema(validateFn) {
		const schema = {
			validate: validateFn,
			optional() {
				return MiniZod.createSchema((value) =>
					value === undefined
						? { success: true, value }
						: validateFn(value)
				);
			},
			nullable() {
				return MiniZod.createSchema((value) =>
					value == null ? { success: true, value } : validateFn(value)
				);
			},
		};
		return schema;
	}

	static string() {
		return MiniZod.createSchema((value) => {
			if (typeof value !== "string") {
				return {
					success: false,
					error: `Expected string, received ${typeof value}`,
				};
			}
			return { success: true, value };
		});
	}

	static date() {
		return MiniZod.createSchema((value) => {
			if (!(value instanceof Date)) {
				return {
					success: false,
					error: `Expected date, received ${typeof value}`,
				};
			}
			return { success: true, value };
		});
	}

	static boolean() {
		return MiniZod.createSchema((value) => {
			if (typeof value !== "boolean") {
				return {
					success: false,
					error: `Expected boolean, received ${typeof value}`,
				};
			}
			return { success: true, value };
		});
	}

	static number() {
		return MiniZod.createSchema((value) => {
			if (typeof value !== "number") {
				return {
					success: false,
					error: `Expected number, received ${typeof value}`,
				};
			}
			return { success: true, value };
		});
	}

	static function() {
		return MiniZod.createSchema((value) => {
			if (typeof value !== "function") {
				return {
					success: false,
					error: `Expected function, received ${typeof value}`,
				};
			}
			return { success: true, value };
		});
	}

	static array(itemSchema) {
		return MiniZod.createSchema((value) => {
			if (!Array.isArray(value)) {
				return {
					success: false,
					error: `Expected array, received ${typeof value}`,
				};
			}
			for (let i = 0; i < value.length; i++) {
				const result = itemSchema.validate(value[i]);
				if (!result.success) {
					return {
						success: false,
						error: `${result.error} at index ${i}`,
					};
				}
			}
			return { success: true, value };
		});
	}

	static any() {
		return MiniZod.createSchema((value) => ({ success: true, value }));
	}

	static isRegex() {
		return MiniZod.createSchema((value) => {
			if (!(value instanceof RegExp)) {
				return {
					success: false,
					error: `Expected RegExp, received ${typeof value}`,
				};
			}
			return { success: true, value };
		});
	}

	static union(schemas) {
		return MiniZod.createSchema((value) => {
			for (const s of schemas) {
				const result = s.validate(value);
				if (result.success) {
					return result;
				}
			}
			return {
				success: false,
				error: `Value ${value} does not match any schema in union`,
			};
		});
	}

	static object(shape) {
		const schema = MiniZod.createSchema((value) => {
			if (value == null) {
				return {
					success: false,
					error: `Expected object, received ${value}`,
				};
			}
			if (typeof value !== "object") {
				return {
					success: false,
					error: `Expected object, received ${typeof value}`,
				};
			}
			for (const [key, validator] of Object.entries(shape)) {
				const result = validator.validate(value[key]);
				if (!result.success) {
					return {
						success: false,
						error: `${result.error} at ${key}`,
					};
				}
			}
			return { success: true, value };
		});
		schema.strict = () =>
			MiniZod.createSchema((value) => {
				const baseResult = schema.validate(value);
				if (!baseResult.success) {
					return baseResult;
				}
				const extraKeys = Object.keys(value).filter(
					(key) => !(key in shape)
				);
				if (extraKeys.length > 0) {
					return {
						success: false,
						error: `Unexpected properties: ${extraKeys.join(", ")}`,
					};
				}
				return baseResult;
			});
		return schema;
	}

	static record(valueSchema) {
		return MiniZod.createSchema((value) => {
			if (value === null) {
				return {
					success: false,
					error: "Expected object, received null",
				};
			}
			if (typeof value !== "object") {
				return {
					success: false,
					error: `Expected object, received ${typeof value}`,
				};
			}
			for (const key of Object.keys(value)) {
				if (typeof key !== "string") {
					return {
						success: false,
						error: `Expected string key, received ${typeof key} at ${key}`,
					};
				}
				const result = valueSchema.validate(value[key]);
				if (!result.success) {
					return {
						success: false,
						error: `${result.error} at key ${key}`,
					};
				}
			}
			return { success: true, value };
		});
	}
}

module.exports = MiniZod;
