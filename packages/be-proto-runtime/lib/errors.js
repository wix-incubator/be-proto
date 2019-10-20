class UnableToConnect extends Error {
  constructor(uri, cause) {
    super(`Unable to connect ${uri}. Cause: ${cause}`);
    Error.captureStackTrace(this, UnableToConnect);
  }
}

module.exports = {
  UnableToConnect
};
