import * as api from '@nestjs/common';
import * as clt from 'class-transformer';
import * as clv from 'class-validator';
import * as rxo from 'rxjs/operators';
import express from 'express';

export class ResponseValidatorInterceptor<T> implements api.NestInterceptor {
  private readonly _cls: api.Type<T>;
  private readonly _options?: clt.ClassTransformOptions;

  constructor(cls: api.Type<T>, options?: clt.ClassTransformOptions) {
    this._cls = cls;
    this._options = options;
  }

  intercept(context: api.ExecutionContext, next: api.CallHandler) {
    return next.handle().pipe(rxo.map(async (value: T) => {
      const validationErrors = await (value instanceof this._cls
        ? clv.validate(value)
        : clv.validate(clt.plainToClass(this._cls, value, this._options)));
      if (validationErrors.length) {
        const errors = flatten(validationErrors);
        const message = 'Validation failed';
        const response = context.switchToHttp().getResponse<express.Response>();
        const statusCode = 500;
        response.status(statusCode);
        return {statusCode, message, errors, value};
      } else {
        return value;
      }
    }));
  }
}

function flatten(errors: Array<clv.ValidationError>, previousProperty?: string) {
  const result: Array<{constraints: Record<string, string>, property: string}> = [];
  errors.forEach(error => map(error, result, previousProperty));
  return result;
}

function map(error: clv.ValidationError, result: Array<{constraints: Record<string, string>, property: string}>, previousProperty?: string) {
  const property = previousProperty ? `${previousProperty}.${error.property}` : error.property;
  if (error.constraints) result.push(({property, constraints: error.constraints}))
  if (error.children) result.push(...flatten(error.children, property));
}
