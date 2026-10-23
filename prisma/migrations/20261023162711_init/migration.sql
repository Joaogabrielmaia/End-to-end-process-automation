-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('EXCEPTION', 'REGISTERED');

-- CreateEnum
CREATE TYPE "ExceptionStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ExceptionCode" AS ENUM ('CUSTOMER_NOT_FOUND', 'EMPTY_ORDER', 'UNKNOWN_SKU', 'INVALID_QUANTITY', 'OUT_OF_STOCK', 'CREDIT_LIMIT_EXCEEDED', 'HIGH_VALUE_APPROVAL', 'INVALID_DEADLINE', 'LOW_CONFIDENCE', 'PROCESSING_FAILED');

-- CreateEnum
CREATE TYPE "Actor" AS ENUM ('AUTOMATION', 'USER');

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "creditLimit" DECIMAL(12,2) NOT NULL,
    "creditUsed" DECIMAL(12,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[],
    "unit" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("sku")
);

-- CreateTable
CREATE TABLE "InboundMessage" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "attachmentName" TEXT,
    "attachmentBase64" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "MessageStatus" NOT NULL DEFAULT 'RECEIVED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "duplicateCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "InboundMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "messageId" TEXT NOT NULL,
    "customerId" TEXT,
    "status" "OrderStatus" NOT NULL,
    "deadline" DATE,
    "deadlineAssumed" BOOLEAN NOT NULL DEFAULT false,
    "total" DECIMAL(12,2) NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "provider" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "registeredAt" TIMESTAMP(3),
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "draft" JSONB NOT NULL,
    "approvals" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "sku" TEXT,
    "description" TEXT NOT NULL,
    "quantity" INTEGER,
    "unitPrice" DECIMAL(10,2),
    "lineTotal" DECIMAL(12,2),

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExceptionCase" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "ExceptionStatus" NOT NULL DEFAULT 'OPEN',
    "primary" "ExceptionCode" NOT NULL,
    "issues" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,

    CONSTRAINT "ExceptionCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor" "Actor" NOT NULL,
    "actorName" TEXT,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "orderId" TEXT,
    "inboundMessageId" TEXT,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channel" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "orderId" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_cnpj_key" ON "Customer"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "InboundMessage_messageId_key" ON "InboundMessage"("messageId");

-- CreateIndex
CREATE INDEX "InboundMessage_contentHash_createdAt_idx" ON "InboundMessage"("contentHash", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_number_key" ON "Order"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Order_messageId_key" ON "Order"("messageId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "ExceptionCase_orderId_key" ON "ExceptionCase"("orderId");

-- CreateIndex
CREATE INDEX "ExceptionCase_status_createdAt_idx" ON "ExceptionCase"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_orderId_at_idx" ON "AuditEvent"("orderId", "at");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "InboundMessage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExceptionCase" ADD CONSTRAINT "ExceptionCase_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_inboundMessageId_fkey" FOREIGN KEY ("inboundMessageId") REFERENCES "InboundMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
