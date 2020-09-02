import { NextFunction, Request, Response } from 'express';

export interface IResponse {
  ok: boolean;
  payload: { [key: string]: any } | null;
  error: IError | null;
}

export interface IError {
  message: string;
}

class StandardRoute {
  public req: Request;
  public res: Response;
  public next: NextFunction;

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
