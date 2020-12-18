DROP TABLE IF EXISTS "public"."MenuProductOption";
DROP TABLE IF EXISTS "public"."MenuProduct";
DROP TABLE IF EXISTS "public"."MenuCategory";
DROP TABLE IF EXISTS "public"."Menu";
DROP TABLE IF EXISTS "public"."Shop";
DROP TABLE IF EXISTS "public"."Auth";
DROP TABLE IF EXISTS "public"."Organization";

-- Top Level User
CREATE TABLE "public"."Organization" (
  "id" uuid PRIMARY KEY NOT NULL,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "password" VARCHAR(255)  NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);
-- Auth an Organization
CREATE TABLE "public"."Auth" (
  "id" uuid UNIQUE NOT NULL,
  "organizationId" uuid NOT NULL,
  "ip" VARCHAR(45),
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  PRIMARY KEY("id","organizationId"),
  FOREIGN KEY ("organizationId") REFERENCES "public"."Organization" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);
-- Shop from an Organization
CREATE TABLE "public"."Shop" (
  "id" uuid UNIQUE NOT NULL,
  "organizationId" uuid NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" VARCHAR(255),
  "siret" VARCHAR(14)  NOT NULL,
  "address_line" VARCHAR(255) NOT NULL,
  "address_line2" VARCHAR(255),
  "city" VARCHAR(255) NOT NULL,
  "state" VARCHAR(255) NOT NULL,
  "zip" VARCHAR(255) NOT NULL,
  "country" VARCHAR(255) NOT NULL,
  PRIMARY KEY("id","organizationId"),
  FOREIGN KEY ("organizationId") REFERENCES "public"."Organization" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);
-- Menu from an Organization
CREATE TABLE "public"."Menu" (
  "id" uuid UNIQUE NOT NULL,
  "organizationId" uuid NOT NULL,
  "name" VARCHAR(255),
  FOREIGN KEY ("organizationId") REFERENCES "public"."Organization" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  PRIMARY KEY("id","organizationId")
);

-- Unlinked menu data belongs to Organizations
CREATE TABLE "public"."MenuCategory" (
  "id" uuid UNIQUE NOT NULL,
  "organizationId" uuid NOT NULL,
  "name" VARCHAR(45),
  PRIMARY KEY("id","organizationId"),
  FOREIGN KEY ("organizationId") REFERENCES "public"."Organization" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE "public"."MenuProduct" (
  "id" uuid UNIQUE NOT NULL,
  "organizationId" uuid NOT NULL,
  "name" VARCHAR(45) NOT NULL,
  "description" VARCHAR(255),
  PRIMARY KEY("id","organizationId"),
  FOREIGN KEY ("organizationId") REFERENCES "public"."Organization" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE "public"."MenuProductOption" (
  "id" uuid UNIQUE NOT NULL,
  "organizationId" uuid NOT NULL,
  "description" VARCHAR(255),
  PRIMARY KEY("id","organizationId"),
  FOREIGN KEY ("organizationId") REFERENCES "public"."Organization" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE "public"."menus" (
  "id" uuid NOT NULL UNIQUE,
  "menuId" uuid NOT NULL,
  "shopId" uuid NOT NULL,
  PRIMARY KEY("menuId","shopId"),
  FOREIGN KEY ("menuId") REFERENCES "public"."Menu" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY ("shopId") REFERENCES "public"."Shop" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE "public"."categories" (
  "id" uuid NOT NULL UNIQUE,
  "menuId" uuid NOT NULL,
  "categoryId" uuid NOT NULL,
  PRIMARY KEY("menuId","categoryId"),
  FOREIGN KEY ("menuId") REFERENCES "public"."Menu" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY ("categoryId") REFERENCES "public"."MenuCategory" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE "public"."products" (
  "id" uuid NOT NULL UNIQUE,
  "productId" uuid NOT NULL,
  "categoriesId" uuid NOT NULL,
  "price" SMALLINT NOT NULL,
  PRIMARY KEY("productId","categoriesId"),
  FOREIGN KEY ("productId") REFERENCES "public"."MenuProduct" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY ("categoriesId") REFERENCES "public"."categories" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE "public"."options" (
  "id" uuid NOT NULL UNIQUE,
  "productId" uuid NOT NULL,
  "optionId" uuid NOT NULL,
  "price" SMALLINT NOT NULL,
  PRIMARY KEY("productId","optionId"),
  FOREIGN KEY ("productId") REFERENCES "public"."products" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY ("optionId") REFERENCES "public"."MenuProductOption" ("id") ON UPDATE CASCADE ON DELETE CASCADE
);


INSERT INTO public."Organization" (id,email,"password","createdAt") VALUES 
('e9d0f049-8c95-4489-b224-0390fc7df207','bob@bob.com','$2b$10$iq.xZjVzAUSd5C2YPBh4gO6AHOdwukAOvLG//d5UAaIv1xgFiKzRO','2020-12-15 20:28:39.886')
;

INSERT INTO public."Auth" (id,"organizationId",ip,"createdAt","updatedAt") VALUES 
('8bd87d76-4358-45d8-a803-7be6e91540e1','e9d0f049-8c95-4489-b224-0390fc7df207','127.0.0.1','2020-12-15 20:29:05.024','2020-12-15 20:29:05.024')
;

INSERT INTO public."MenuCategory" (id,"organizationId","name") VALUES 
('ae8ce485-31d5-47be-b1f2-e57ebd132092','e9d0f049-8c95-4489-b224-0390fc7df207','Boissons')
,('219c601b-ff38-4108-86e3-4ff0f7a82734','e9d0f049-8c95-4489-b224-0390fc7df207','Tapas')
;

INSERT INTO public."MenuProduct" (id,"organizationId","name",description) VALUES 
('07f7b05b-aec2-4848-a715-46883bde8c72','e9d0f049-8c95-4489-b224-0390fc7df207','Coca','Boison au cola')
,('65f52058-3576-4211-9c12-f18c655456d3','e9d0f049-8c95-4489-b224-0390fc7df207','Fanta','Boison à l''orange')
;

INSERT INTO public."Menu" (id,"organizationId","name") VALUES 
('78daa9fa-551a-40f3-a060-807315f551eb','e9d0f049-8c95-4489-b224-0390fc7df207','L''utime carte des boissons happy hour')
;

INSERT INTO public."MenuProductOption" (id,"organizationId",description) VALUES 
('1673d0cd-04dc-44b3-94a3-6894e0ce2358','e9d0f049-8c95-4489-b224-0390fc7df207','1L')
,('1673d0cd-04dc-44b3-94a3-6894e0ce2359','e9d0f049-8c95-4489-b224-0390fc7df207','1/2L')
;