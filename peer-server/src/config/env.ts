import { z } from "zod";

const envSchema = z.object({
  PORT: z
    .string()
    .default("9000")
    .transform((value) => {
      const parsed = Number(value);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error("PORT must be a positive integer");
      }
      return parsed;
    }),
  HOST: z.string().min(1).default("0.0.0.0"),
  PEERJS_PATH: z
    .string()
    .min(1)
    .regex(/^\//, "PATH must start with a slash (e.g. /peerjs)")
    .default("/peerjs"),
  LOG_LEVEL: z
    .enum(["error", "warn", "info", "http", "verbose", "debug", "silly"])
    .default("info"),
});

export type EnvConfig = z.infer<typeof envSchema>;

export const createEnvConfig = (env: NodeJS.ProcessEnv): EnvConfig => {
  const result = envSchema.safeParse({
    PORT: env.PORT,
    HOST: env.HOST,
    PEERJS_PATH: env.PEERJS_PATH,
    LOG_LEVEL: env.LOG_LEVEL,
  });

  if (!result.success) {
    const issues = result.error.issues.map((issue) => issue.message).join(", ");
    throw new Error(`Invalid environment configuration: ${issues}`);
  }

  return result.data;
};
