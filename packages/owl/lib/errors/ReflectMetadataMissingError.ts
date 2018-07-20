export class ReflectMetadataMissingError extends Error {
  constructor() {
    super(
      "Install reflect-metadata and enable exprimental decorator features!"
    );

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
