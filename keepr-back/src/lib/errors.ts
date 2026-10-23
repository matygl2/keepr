import { z } from 'zod';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string[]>
  ) {
    super(message);
  }
}

/** Valida `data` con zod y lanza un 400 con el detalle por campo si falla. */
export function parse<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const { fieldErrors } = z.flattenError(result.error);
    throw new HttpError(400, 'Invalid data.', fieldErrors as Record<string, string[]>);
  }
  return result.data;
}
