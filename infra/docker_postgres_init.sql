DROP TABLE IF EXISTS "public"."Auth";
DROP TABLE IF EXISTS "public"."Shop";
DROP TABLE IF EXISTS "public"."Organization";

CREATE TABLE "public"."Organization" (
  "id" uuid PRIMARY KEY NOT NULL,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "password" VARCHAR(255)  NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "public"."Auth" (
  "id" uuid UNIQUE NOT NULL,
  "oid" uuid NOT NULL,
  "ip" VARCHAR(45),
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  PRIMARY KEY("id","oid"),
  CONSTRAINT "fk_organization.organization_id.auth_id" FOREIGN KEY ("oid") REFERENCES "public"."Organization" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE "public"."Shop" (
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
  PRIMARY KEY("id","oid"),
  CONSTRAINT "fk_shop.user_id.shop_uid" FOREIGN KEY ("oid") REFERENCES "public"."Organization" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);