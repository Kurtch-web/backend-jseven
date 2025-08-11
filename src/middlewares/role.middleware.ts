// @ts-ignore
export interface AuthenticatedRequest extends Request {
  user?: { [key: string]: any; _id: string; role: string };
}
