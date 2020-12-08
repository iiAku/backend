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
  "name" VARCHAR(255),
  "organizationId" uuid NOT NULL,
  FOREIGN KEY ("organizationId") REFERENCES "public"."Organization" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  PRIMARY KEY("id","organizationId")
);

-- Unlinked menu data belongs to Organizations
CREATE TABLE "public"."MenuCategory" (
  "id" uuid UNIQUE NOT NULL,
  "orgnanizationId" uuid NOT NULL,
  "name" VARCHAR(45),
  PRIMARY KEY("id","orgnanizationId"),
  FOREIGN KEY ("orgnanizationId") REFERENCES "public"."Organization" ("id") ON UPDATE CASCADE ON DELETE CASCADE
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
-- m to n links
-- Category to Product
CREATE TABLE "_MenuCategoryToMenuProduct" (
    "categoryId" uuid NOT NULL,
    "productId" uuid NOT NULL,
    FOREIGN KEY ("categoryId")  REFERENCES "public"."MenuCategory"(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY ("productId") REFERENCES "public"."MenuProduct"(id) ON UPDATE CASCADE ON DELETE CASCADE,
    PRIMARY KEY("categoryId","productId")
);
-- Product to Options
CREATE TABLE "_MenuProductOptionToMenuProduct" (
    "optionId" uuid NOT NULL,
    "productId" uuid NOT NULL,
    FOREIGN KEY ("optionId")  REFERENCES "public"."MenuProductOption"(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY ("productId") REFERENCES "public"."MenuProduct"(id) ON UPDATE CASCADE ON DELETE CASCADE,
    PRIMARY KEY("optionId","productId")
);
-- Menu to Category
CREATE TABLE "_MenuToCategory" (
    "menuId" uuid NOT NULL,
    "categoryId" uuid NOT NULL,
    FOREIGN KEY ("menuId")  REFERENCES "public"."Menu"(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY ("categoryId") REFERENCES "public"."MenuCategory"(id) ON UPDATE CASCADE ON DELETE CASCADE,
    PRIMARY KEY("menuId","categoryId")
);

-- Menu to Options price
CREATE TABLE "_MenuToMenuProductOption" (
    "menuId" uuid NOT NULL,
    "optionId" uuid NOT NULL,
    "price" SMALLINT NOT NULL,
    FOREIGN KEY ("menuId")  REFERENCES "public"."Menu"(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY ("optionId") REFERENCES "public"."MenuProductOption"(id) ON UPDATE CASCADE ON DELETE CASCADE,
    PRIMARY KEY("menuId","optionId")
);

-- Menu to Product price
CREATE TABLE "_MenuToMenuProduct" (
    "menuId" uuid NOT NULL,
    "productId" uuid NOT NULL,
    "price" SMALLINT NOT NULL,
    FOREIGN KEY ("menuId")  REFERENCES "public"."Menu"(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY ("productId") REFERENCES "public"."MenuProduct"(id) ON UPDATE CASCADE ON DELETE CASCADE,
    PRIMARY KEY("menuId","productId")
);


INSERT INTO public."Organization" (id,email,"password","createdAt") VALUES 
('52992fb6-4ab9-4885-86bd-69b2e492783b','bob@bob.com','$2b$10$moHHY7lAhTOGX.btwCPetOuZN3OEY7PBHFSiJGHedqUnnIBLRwHA.','2020-12-01 18:08:45.174')
;

INSERT INTO public."MenuProduct" (id,"organizationId","name",description) VALUES 
('d1110c45-61e4-4f6d-8e78-cba234fd49a2','52992fb6-4ab9-4885-86bd-69b2e492783b','Coca',NULL)
,('dd55f45c-ff18-4ed1-b4e6-f5618174043e','52992fb6-4ab9-4885-86bd-69b2e492783b','Fanta',NULL)
;
INSERT INTO public."MenuCategory" (id,"orgnanizationId","name") VALUES 
('007e7f4b-c520-4ef2-927b-cb75bce51bfc','52992fb6-4ab9-4885-86bd-69b2e492783b','Boissons')
,('8eea553e-2dc8-416f-afcf-e30ed2e1d274','52992fb6-4ab9-4885-86bd-69b2e492783b','Tapas')
;

INSERT INTO public."_MenuCategoryToMenuProduct" ("categoryId","productId") VALUES 
('007e7f4b-c520-4ef2-927b-cb75bce51bfc','d1110c45-61e4-4f6d-8e78-cba234fd49a2')
,('007e7f4b-c520-4ef2-927b-cb75bce51bfc','dd55f45c-ff18-4ed1-b4e6-f5618174043e')
;

INSERT INTO public."MenuProductOption" (id,"organizationId",description) VALUES 
('1ecbed1e-ffb3-4ff9-b8d7-fbb9abcf9e8c','52992fb6-4ab9-4885-86bd-69b2e492783b','1L')
,('1ecbed1e-ffb3-4ff9-b8d7-fbb9abcf9e8b','52992fb6-4ab9-4885-86bd-69b2e492783b','2L')
;

INSERT INTO public."Menu" (id,"organizationId") VALUES 
('04ca3cc0-6699-49aa-8d58-4e937c616f00','52992fb6-4ab9-4885-86bd-69b2e492783b')
;

INSERT INTO public."_MenuToCategory" ("menuId","categoryId") VALUES 
('04ca3cc0-6699-49aa-8d58-4e937c616f00','007e7f4b-c520-4ef2-927b-cb75bce51bfc')
,('04ca3cc0-6699-49aa-8d58-4e937c616f00','8eea553e-2dc8-416f-afcf-e30ed2e1d274')
;

-- CREATE TABLE "public"."Menu" (
--   "id" uuid UNIQUE NOT NULL,
--   "oid" uuid NOT NULL,
--   "sid" uuid NOT NULL,
--   "mcid" uuid NOT NULL,
--   "title" VARCHAR(45),
--   PRIMARY KEY("id","oid","sid"),
--   CONSTRAINT "fk_menu.oid_organization.id" FOREIGN KEY ("oid") REFERENCES "public"."Organization" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
--   CONSTRAINT "fk_menu.sid_shop.id" FOREIGN KEY ("sid") REFERENCES "public"."Shop" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
--   CONSTRAINT "fk_menu.mcid_menu_category.id" FOREIGN KEY ("mcid") REFERENCES "public"."MenuCategory" ("id") ON UPDATE CASCADE ON DELETE CASCADE
-- );

-- CREATE TABLE "public"."MenuProduct" (
--   "id" uuid UNIQUE NOT NULL,
--   "oid" uuid NOT NULL,
--   "category" uuid NOT NULL,
--   "name" VARCHAR(45) NOT NULL,
--   "description" VARCHAR(255),
--   "price" SMALLINT,
--   PRIMARY KEY("id","oid","name"),
--   CONSTRAINT "fk_menu_product.oid_organization.id" FOREIGN KEY ("oid") REFERENCES "public"."Organization" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
--   CONSTRAINT "fk_menu_product.category.menu_category.id" FOREIGN KEY ("category") REFERENCES "public"."MenuCategory" ("id") ON UPDATE CASCADE ON DELETE CASCADE
-- );

-- CREATE TABLE "public"."MenuProductOption" (
--   "id" uuid UNIQUE NOT NULL,
--   "oid" uuid NOT NULL,
--   "product" uuid NOT NULL,
--   "description" VARCHAR(255) NOT NULL,
--   "price" SMALLINT,
--   PRIMARY KEY("id","oid"),
--   CONSTRAINT "fk_menu_product_option.oid_organization.id" FOREIGN KEY ("oid") REFERENCES "public"."Organization" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
--   CONSTRAINT "fk_menu_product_option.product.menu_product.id" FOREIGN KEY ("product") REFERENCES "public"."MenuProduct" ("id") ON UPDATE CASCADE ON DELETE CASCADE
-- );