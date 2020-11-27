DROP TABLE IF EXISTS "public"."Auth";
DROP TABLE IF EXISTS "public"."Merchant";
DROP TABLE IF EXISTS "public"."User";

CREATE TABLE "public"."User" (
  "id" uuid PRIMARY KEY NOT NULL,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "password" VARCHAR(255)  NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "public"."Auth" (
  "uid" uuid NOT NULL,
  "id" uuid UNIQUE NOT NULL,
  "ip" VARCHAR(45),
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  PRIMARY KEY("uid","id"),
  CONSTRAINT "fk_auth.user_id.auth_uid" FOREIGN KEY ("uid") REFERENCES "public"."User" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE "public"."Merchant" (
  "uid" uuid NOT NULL,
  "id" uuid UNIQUE NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" VARCHAR(255),
  "siret" VARCHAR(14)  NOT NULL,
  "address_line" VARCHAR(255) NOT NULL,
  "address_line2" VARCHAR(255),
  "city" VARCHAR(255) NOT NULL,
  "state" VARCHAR(255) NOT NULL,
  "zip" VARCHAR(255) NOT NULL,
  "country" VARCHAR(255) NOT NULL,
  PRIMARY KEY("uid","id"),
  CONSTRAINT "fk_merchant.user_id.merchant_uid" FOREIGN KEY ("uid") REFERENCES "public"."User" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);