ALTER TABLE "Vendor" DROP CONSTRAINT "Vendor_projectId_fkey";
ALTER TABLE "Vendor" DROP COLUMN "projectId";

ALTER TABLE "Vendor" ADD COLUMN "organisationId" TEXT NOT NULL;
ALTER TABLE "Vendor" ADD COLUMN "sponsored" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_organisationId_name_key" UNIQUE ("organisationId", "name");

CREATE TABLE "ProjectVendor" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "roleOnProject" TEXT,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectVendor_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProjectVendor_projectId_vendorId_key" ON "ProjectVendor"("projectId", "vendorId");
ALTER TABLE "ProjectVendor" ADD CONSTRAINT "ProjectVendor_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProjectVendor" ADD CONSTRAINT "ProjectVendor_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "VendorNote" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "rating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VendorNote_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "VendorNote" ADD CONSTRAINT "VendorNote_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VendorNote" ADD CONSTRAINT "VendorNote_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
