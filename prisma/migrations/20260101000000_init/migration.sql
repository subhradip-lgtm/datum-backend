-- CreateEnum
CREATE TYPE "ProjectRole" AS ENUM ('CHAIRMAN_DIRECTOR', 'PROJECT_DIRECTOR', 'ARCHITECT_CONSULTANT', 'QS_COST_MANAGER', 'PROCUREMENT_MANAGER', 'SITE_ENGINEER', 'VENDOR_SUPPLIER', 'FACILITY_MANAGER');
CREATE TYPE "BoqStatus" AS ENUM ('CONFIRMED', 'PENDING_INPUT', 'RATE_ONLY');
CREATE TYPE "ProcurementStage" AS ENUM ('RFQ_TENDERING', 'QUOTATION_COMPARISON', 'PO_AWARDED', 'DELIVERED');
CREATE TYPE "FileKind" AS ENUM ('DRAWING', 'BOQ_WORKBOOK', 'SPEC', 'PHOTO', 'OTHER');
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED');

CREATE TABLE "User" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "email" TEXT NOT NULL, "passwordHash" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "User_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Organisation" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id"));

CREATE TABLE "Project" ("id" TEXT NOT NULL, "organisationId" TEXT NOT NULL, "refCode" TEXT NOT NULL, "name" TEXT NOT NULL, "client" TEXT NOT NULL, "location" TEXT, "stage" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Project_pkey" PRIMARY KEY ("id"));

CREATE TABLE "ProjectMember" ("id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "userId" TEXT NOT NULL, "role" "ProjectRole" NOT NULL, CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "ProjectMember_projectId_userId_key" ON "ProjectMember"("projectId", "userId");

CREATE TABLE "BoqItem" ("id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "dsrRef" TEXT NOT NULL, "discipline" TEXT NOT NULL, "description" TEXT NOT NULL, "unit" TEXT NOT NULL, "qty" DOUBLE PRECISION NOT NULL DEFAULT 0, "rate" DOUBLE PRECISION NOT NULL DEFAULT 0, "status" "BoqStatus" NOT NULL DEFAULT 'PENDING_INPUT', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "BoqItem_pkey" PRIMARY KEY ("id"));

CREATE TABLE "Vendor" ("id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "name" TEXT NOT NULL, "category" TEXT NOT NULL, "contact" TEXT, "email" TEXT, "phone" TEXT, "status" TEXT NOT NULL DEFAULT 'Under Review', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id"));

CREATE TABLE "QuantityEntry" ("id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "element" TEXT NOT NULL, "location" TEXT NOT NULL, "no" DOUBLE PRECISION NOT NULL DEFAULT 1, "l" DOUBLE PRECISION, "b" DOUBLE PRECISION, "h" DOUBLE PRECISION, "unit" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "QuantityEntry_pkey" PRIMARY KEY ("id"));

CREATE TABLE "ProcurementItem" ("id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "item" TEXT NOT NULL, "vendor" TEXT NOT NULL, "stage" "ProcurementStage" NOT NULL DEFAULT 'RFQ_TENDERING', "value" DOUBLE PRECISION NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "ProcurementItem_pkey" PRIMARY KEY ("id"));

CREATE TABLE "ProjectFile" ("id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "uploadedBy" TEXT NOT NULL, "kind" "FileKind" NOT NULL, "originalName" TEXT NOT NULL, "storageKey" TEXT NOT NULL, "mimeType" TEXT NOT NULL, "sizeBytes" INTEGER NOT NULL, "previewPageCount" INTEGER, "previewStorageDir" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ProjectFile_pkey" PRIMARY KEY ("id"));

CREATE TABLE "Subscription" ("id" TEXT NOT NULL, "organisationId" TEXT NOT NULL, "plan" TEXT NOT NULL, "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL', "razorpayCustomerId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "Subscription_organisationId_key" ON "Subscription"("organisationId");

CREATE TABLE "Payment" ("id" TEXT NOT NULL, "subscriptionId" TEXT NOT NULL, "razorpayOrderId" TEXT NOT NULL, "razorpayPaymentId" TEXT, "amountPaise" INTEGER NOT NULL, "currency" TEXT NOT NULL DEFAULT 'INR', "status" TEXT NOT NULL DEFAULT 'created', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Payment_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "Payment_razorpayOrderId_key" ON "Payment"("razorpayOrderId");

ALTER TABLE "Project" ADD CONSTRAINT "Project_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BoqItem" ADD CONSTRAINT "BoqItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QuantityEntry" ADD CONSTRAINT "QuantityEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProcurementItem" ADD CONSTRAINT "ProcurementItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProjectFile" ADD CONSTRAINT "ProjectFile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProjectFile" ADD CONSTRAINT "ProjectFile_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
