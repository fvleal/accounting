-- AlterTable
ALTER TABLE "accounts" ADD COLUMN "auth0_sub" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "accounts_auth0_sub_key" ON "accounts"("auth0_sub");
