// Fix JWT type issues
declare module 'jsonwebtoken' {
  export interface SignOptions {
    expiresIn?: string | number;
  }
  
  export interface VerifyOptions {
    algorithms?: string[];
  }
  
  export function sign(
    payload: string | Buffer | object,
    secretOrPrivateKey: string | Buffer,
    options?: SignOptions
  ): string;
  
  export function verify(
    token: string,
    secretOrPublicKey: string | Buffer,
    options?: VerifyOptions
  ): any;
}