import { NextFunction, Request, Response } from 'express';

class GetTopDonation {
  private req: Request;
  private res: Response;
  private next: NextFunction;

  constructor(req: Request, res: Response, next: NextFunction) {
    this.req = req;
    this.res = res;
    this.next = next;
  }

  public init = () => {};
}

export default GetTopDonation;
