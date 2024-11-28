function checkAsyncValidation(validator) {
  return new Promise((resolve, reject) => {
    function passes() {
      resolve();
    }

    function fails() {
      const errObj = validator.errors.all();
      for (const errProp in errObj) {
        reject(errObj[errProp]);
      }
    }

    validator.checkAsync(passes, fails);
  });
}

module.exports = checkAsyncValidation;
