-- DropIndex
DROP INDEX IF EXISTS "accounts_auth0_sub_key";

-- AlterTable
ALTER TABLE "accounts" DROP COLUMN "auth0_sub";
