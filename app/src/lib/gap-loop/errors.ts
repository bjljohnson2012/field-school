export class GapAccessError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string) {
    super(code);
    this.name = "GapAccessError";
    this.status = status;
    this.code = code;
  }
}

export class GapFieldsError extends Error {
  status = 400;
  code: string;
  constructor(code: string) {
    super(code);
    this.name = "GapFieldsError";
    this.code = code;
  }
}
