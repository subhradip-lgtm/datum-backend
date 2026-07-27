-- Splits the flat "Vendor" free-text category into a proper, curated
-- taxonomy (Consultant / Contractor / Supplier), managed centrally rather
-- than left to free text. Only the platform owner can add new categories
-- (see isPlatformAdmin below) — this keeps the taxonomy consistent across
-- every organisation on the platform, not just AUR's own.

CREATE TYPE "DirectoryCategoryType" AS ENUM ('CONSULTANT', 'CONTRACTOR', 'SUPPLIER');

CREATE TABLE "DirectoryCategory" (
    "id" TEXT NOT NULL,
    "type" "DirectoryCategoryType" NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DirectoryCategory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DirectoryCategory_type_name_key" ON "DirectoryCategory"("type", "name");

-- Starter taxonomy, curated from how AUR actually described these relationships
INSERT INTO "DirectoryCategory" ("id","type","name","createdAt") VALUES
  (gen_random_uuid()::text,'CONSULTANT','Structural Consultant',now()),
  (gen_random_uuid()::text,'CONSULTANT','Electrical Consultant',now()),
  (gen_random_uuid()::text,'CONSULTANT','HVAC / Mechanical Consultant',now()),
  (gen_random_uuid()::text,'CONSULTANT','Plumbing & Fire Consultant',now()),
  (gen_random_uuid()::text,'CONSULTANT','Lighting Consultant',now()),
  (gen_random_uuid()::text,'CONSULTANT','Landscape Consultant',now()),
  (gen_random_uuid()::text,'CONSULTANT','Interior Design Consultant',now()),
  (gen_random_uuid()::text,'CONSULTANT','Facade Consultant',now()),
  (gen_random_uuid()::text,'CONSULTANT','Fire & Life Safety Consultant',now()),
  (gen_random_uuid()::text,'CONSULTANT','Geotechnical / Soil Consultant',now()),
  (gen_random_uuid()::text,'CONTRACTOR','Civil / General Contractor',now()),
  (gen_random_uuid()::text,'CONTRACTOR','MEP Contractor',now()),
  (gen_random_uuid()::text,'CONTRACTOR','Finishing Contractor',now()),
  (gen_random_uuid()::text,'CONTRACTOR','Facade Contractor',now()),
  (gen_random_uuid()::text,'CONTRACTOR','Specialist Contractor',now()),
  (gen_random_uuid()::text,'SUPPLIER','Structural Materials Supplier',now()),
  (gen_random_uuid()::text,'SUPPLIER','Facade Materials Supplier',now()),
  (gen_random_uuid()::text,'SUPPLIER','Finishing Materials Supplier',now()),
  (gen_random_uuid()::text,'SUPPLIER','MEP Equipment Supplier',now()),
  (gen_random_uuid()::text,'SUPPLIER','Furniture & Fixtures Supplier',now());

-- Backfill: any existing free-text category that isn't an exact match gets
-- its own new category row created rather than silently dropped or forced
-- into the wrong bucket. Defaults to CONSULTANT type as a safe guess —
-- worth a manual review afterwards, but nothing is lost.
ALTER TABLE "Vendor" ADD COLUMN "categoryId" TEXT;

INSERT INTO "DirectoryCategory" ("id","type","name","createdAt")
SELECT gen_random_uuid()::text, 'CONSULTANT', v."category", now()
FROM (SELECT DISTINCT "category" FROM "Vendor") v
WHERE NOT EXISTS (SELECT 1 FROM "DirectoryCategory" dc WHERE dc."name" = v."category");

UPDATE "Vendor" v SET "categoryId" = dc."id" FROM "DirectoryCategory" dc WHERE dc."name" = v."category";

ALTER TABLE "Vendor" ALTER COLUMN "categoryId" SET NOT NULL;
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "DirectoryCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Vendor" DROP COLUMN "category";

-- Platform-admin flag: controls who may add new directory categories.
ALTER TABLE "User" ADD COLUMN "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false;

-- Retroactively marks whoever is CURRENTLY the earliest-registered user as
-- platform admin. This matters because your account already existed before
-- this column did — a plain "first user to register" rule in application
-- code would never apply to you, since you already registered. Running
-- this as part of the migration means it self-heals on an existing
-- database exactly the same way it would on a brand new one.
UPDATE "User" SET "isPlatformAdmin" = true
WHERE "id" = (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1);
