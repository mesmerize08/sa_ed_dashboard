import { z } from "zod";

// SA Health's JSON endpoints represent every value as a string (or null),
// including numbers, and always append one all-null "padding" row at the
// end of the array. These schemas validate only the raw shape; mappers.ts
// does the numeric coercion and padding-row filtering.

export const EtlCntrlRowSchema = z.object({
  ID: z.string().nullable(),
  CURR_DTM: z.string().nullable(),
});
export const EtlCntrlResponseSchema = z.array(EtlCntrlRowSchema);

export const Ed001RowSchema = z.object({
  DTM: z.string().nullable(),
  HOSP_SHORT: z.string().nullable(),
  EA: z.string().nullable(),
  WTBS: z.string().nullable(),
  COM_TREAT: z.string().nullable(),
  CAP: z.string().nullable(),
  AVG_WAIT: z.string().nullable(),
});
export const Ed001ResponseSchema = z.array(Ed001RowSchema);

export const Ed006RowSchema = z.object({
  HOSP_SHORT: z.string().nullable(),
  CAT: z.string().nullable(),
  WTS: z.string().nullable(),
  WOT: z.string().nullable(),
  ALERT: z.string().nullable(),
  OTH: z.string().nullable(),
  TOT: z.string().nullable(),
});
export const Ed006ResponseSchema = z.array(Ed006RowSchema);
