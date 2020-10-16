CREATE TABLE "public"."User" (
  "id" uuid PRIMARY KEY NOT NULL,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "password" VARCHAR(255)  NOT NULL,
  "createdAt" timestamp(6) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."Auth" (
  "id" uuid NOT NULL,
  "token" uuid UNIQUE NOT NULL,
  "userAgent" VARCHAR(255),
  "createdAt" timestamp(6) with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp(6) with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY("id","token"),
  CONSTRAINT "fk_auth.id_user.id" FOREIGN KEY ("id") REFERENCES "public"."User" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);