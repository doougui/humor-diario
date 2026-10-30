-- CreateTable
CREATE TABLE "feedbacks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "role" "Role" NOT NULL,
    "sus_answers" INTEGER[],
    "sus_score" DOUBLE PRECISION NOT NULL,
    "usefulness" INTEGER NOT NULL,
    "self_awareness" INTEGER NOT NULL,
    "entries_count" INTEGER NOT NULL,
    "liked" TEXT,
    "improve" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feedbacks_user_id_key" ON "feedbacks"("user_id");

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
