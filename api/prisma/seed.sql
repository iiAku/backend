CREATE TABLE "public"."User" (
  "id" uuid PRIMARY KEY NOT NULL,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "password" VARCHAR(255)  NOT NULL,
  "createdAt" timestamp(6) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."Auth" (
  "id" uuid PRIMARY KEY NOT NULL,
  "token" VARCHAR(255) UNIQUE NOT NULL
);