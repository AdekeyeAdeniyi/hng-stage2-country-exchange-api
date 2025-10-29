const validateCountry = (req, res, next) => {
  const { name, population, currency_code } = req.body;
  const errors = {};

  if (!name || name.trim() === "") {
    errors.name = "is required";
  }

  if (population === undefined || population === null || typeof population !== "number") {
    errors.population = "is required and must be a number";
  }

  // Note: currency_code is technically optional based on refresh behavior
  // but if provided, it should be valid
  if (currency_code !== undefined && currency_code !== null && typeof currency_code !== "string") {
    errors.currency_code = "must be a string";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors,
    });
  }

  next();
};

module.exports = { validateCountry };
