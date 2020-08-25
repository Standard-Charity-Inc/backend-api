import { NextFunction, Request, Response } from 'express';

interface IResponse {
  ok: boolean;
  payload: { [key: string]: any } | null;
  error: IError | null;
}

interface IError {
  message: string;
}

class StandardRoute {
  private req: Request;
  private res: Response;
  private next: NextFunction;

  constructor(req: Request, res: Response, next: NextFunction) {
    this.req = req;
    this.res = res;
    this.next = next;
  }

  public sendResponse = (
    ok: boolean,
    status: number,
    payload?: { [key: string]: any } | null,
    error?: IError | null
  ): Response => {
    return this.res
      .json({
        ok,
        payload: payload || null,
        error: error || null,
      } as IResponse)
      .status(status);
  };
}

export default StandardRoute;
